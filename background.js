chrome.runtime.onInstalled.addListener(() => {
  console.log('[AI Screen Guide] Extension installed');
});

// SPA navigation: changeInfo.url fires but changeInfo.status is absent.
// Full page load: changeInfo.status === 'complete'.
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  const isFullLoad = changeInfo.status === 'complete';
  const isSpaNav = !!changeInfo.url && !changeInfo.status;

  if (!isFullLoad && !isSpaNav) return;
  if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) return;

  const key = 'guide_plan_' + tabId;
  const stored = await chrome.storage.session.get(key);
  const plan = stored[key];
  if (!plan || plan.status !== 'active') return;

  const { steps, currentStep } = plan;
  const url = tab.url;

  // SPA: DOM persists across nav, so clear manually. Full load: DOM destroyed naturally.
  if (isSpaNav) {
    try {
      await chrome.tabs.sendMessage(tabId, { type: 'CLEAR_HIGHLIGHTS' });
    } catch {
      try {
        await chrome.scripting.executeScript({
          target: { tabId },
          func: () => {
            document.getElementById('ai-guide-overlay')?.remove();
            document.getElementById('ai-guide-step-badge')?.remove();
            const s = document.getElementById('ai-guide-style');
            if (s?._reposition) {
              window.removeEventListener('scroll', s._reposition, true);
              window.removeEventListener('resize', s._reposition);
            }
            s?.remove();
          }
        });
      } catch { /* page may not allow scripting */ }
    }
  }

  // Search forward first (advance takes priority); fall back to currentStep for reloads.
  // url_pattern must be >= 3 chars — rejects "/" which would match every URL.
  const isSpecific = (p) => p && p.length >= 3;
  let matched = -1;

  for (let i = currentStep + 1; i < steps.length; i++) {
    const pattern = steps[i].url_pattern;
    if (isSpecific(pattern) && url.includes(pattern)) {
      matched = i;
      break;
    }
  }

  if (matched === -1) {
    const currentPattern = steps[currentStep]?.url_pattern;
    if (isSpecific(currentPattern) && url.includes(currentPattern)) {
      matched = currentStep; // page reload — re-highlight same step
    }
  }

  if (matched === -1) return;

  if (matched !== plan.currentStep) {
    plan.currentStep = matched;
    await chrome.storage.session.set({ [key]: plan });
  }

  const sendHighlight = async () => {
    const msg = {
      type: 'HIGHLIGHT_STEP',
      step: steps[matched],
      stepIndex: matched,
      totalSteps: steps.length
    };
    let highlighted = 0;
    try {
      const resp = await chrome.tabs.sendMessage(tabId, msg);
      highlighted = resp?.highlighted ?? 1;
    } catch {
      try {
        await chrome.scripting.executeScript({
          target: { tabId },
          func: injectHighlightsInPage,
          args: [steps[matched], matched, steps.length]
        });
        highlighted = 1; // fallback path — exact count unknowable
      } catch (e) {
        console.warn('[AI Screen Guide] Could not inject highlights:', e.message);
      }
    }

    if (highlighted === 0) {
      plan.rescanNeeded = true;
      await chrome.storage.session.set({ [key]: plan });
      try {
        chrome.action.setBadgeText({ text: '!', tabId });
        chrome.action.setBadgeBackgroundColor({ color: '#ffa502', tabId });
      } catch { /* badge API may not be available */ }
    }
  };

  if (isSpaNav) {
    // wait for framework to finish rendering
    setTimeout(sendHighlight, 800);
  } else {
    await sendHighlight();
  }
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  await chrome.storage.session.remove('guide_plan_' + tabId);
});

// Standalone fallback — no closure over bg scope, mirrors injectHighlightsForStep in content.js.
function injectHighlightsInPage(step, stepIndex, totalSteps) {
  document.getElementById('ai-guide-overlay')?.remove();
  const existing = document.getElementById('ai-guide-style');
  if (existing?._reposition) {
    window.removeEventListener('scroll', existing._reposition, true);
    window.removeEventListener('resize', existing._reposition);
    existing._reposition = null;
  }
  existing?.remove();

  if (!step || !step.targets || step.targets.length === 0) return;

  const overlay = document.createElement('div');
  overlay.id = 'ai-guide-overlay';
  overlay.style.cssText = 'position:fixed!important;top:0!important;left:0!important;width:100%!important;height:100%!important;pointer-events:none!important;z-index:2147483646!important;overflow:visible!important';
  document.documentElement.appendChild(overlay);

  const style = document.createElement('style');
  style.id = 'ai-guide-style';
  style.textContent = `
    .ai-guide-highlight {
      position: absolute !important; pointer-events: none !important;
      border: 3px solid #ff4757 !important; border-radius: 6px !important;
      box-shadow: 0 0 0 3px rgba(255,71,87,0.25), 0 0 20px rgba(255,71,87,0.4) !important;
      animation: ai-guide-pulse 1.5s ease-in-out infinite !important;
      background: rgba(255,71,87,0.05) !important;
    }
    .ai-guide-label {
      position: absolute !important; background: #ff4757 !important;
      color: white !important; font-family: -apple-system, sans-serif !important;
      font-size: 12px !important; font-weight: 600 !important; padding: 4px 10px !important;
      border-radius: 20px !important; pointer-events: none !important; white-space: nowrap !important;
      box-shadow: 0 2px 12px rgba(255,71,87,0.5) !important;
    }
    @keyframes ai-guide-pulse {
      0%, 100% { box-shadow: 0 0 0 3px rgba(255,71,87,0.25), 0 0 20px rgba(255,71,87,0.4); }
      50% { box-shadow: 0 0 0 6px rgba(255,71,87,0.1), 0 0 30px rgba(255,71,87,0.6); }
    }
  `;
  document.head.appendChild(style);

  function findEl(target) {
    if (target.selector) {
      try { const e = document.querySelector(target.selector); if (e) return e; } catch {}
    }
    if (!target.text_content) return null;
    const q = 'button, a, input[type="text"], input[type="search"], input[type="email"], input[type="password"], textarea, [role="button"], [role="link"], [role="menuitem"], [role="option"], [role="searchbox"], [role="textbox"], input[type="submit"], input[type="button"]';
    let bestExact = null, bestContains = null;
    for (const c of document.querySelectorAll(q)) {
      const t = (c.textContent || c.getAttribute('aria-label') || '').trim();
      const r = c.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      if (t === target.text_content) {
        if (!bestExact || r.width < bestExact.getBoundingClientRect().width) bestExact = c;
      } else if (t.includes(target.text_content)) {
        if (!bestContains || r.width < bestContains.getBoundingClientRect().width) bestContains = c;
      }
    }
    return bestExact || bestContains || null;
  }

  function sp(el, top, left, w, h) {
    el.style.top = top + 'px'; el.style.left = left + 'px';
    if (w !== undefined) { el.style.width = w + 'px'; el.style.height = h + 'px'; }
  }

  const pairs = [];
  step.targets.forEach((target, idx) => {
    const el = findEl(target);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const h = document.createElement('div');
    h.className = 'ai-guide-highlight';
    sp(h, rect.top - 4, rect.left - 4, rect.width + 8, rect.height + 8);
    overlay.appendChild(h);

    const lbl = document.createElement('div');
    lbl.className = 'ai-guide-label';
    lbl.textContent = `${idx + 1} ${target.description}`;
    const lt = rect.top - 32 > 10 ? rect.top - 32 : rect.top + rect.height + 8;
    sp(lbl, lt, Math.max(0, rect.left));
    overlay.appendChild(lbl);
    pairs.push({ el, h, lbl });
  });

  if (pairs.length > 0) {
    const styleEl = document.getElementById('ai-guide-style');
    styleEl._reposition = () => {
      pairs.forEach(({ el, h, lbl }) => {
        const r = el.getBoundingClientRect();
        sp(h, r.top - 4, r.left - 4, r.width + 8, r.height + 8);
        const lt = r.top - 32 > 10 ? r.top - 32 : r.top + r.height + 8;
        sp(lbl, lt, Math.max(0, r.left));
      });
    };
    window.addEventListener('scroll', styleEl._reposition, { passive: true, capture: true });
    window.addEventListener('resize', styleEl._reposition, { passive: true });
  }

  document.getElementById('ai-guide-step-badge')?.remove();
  const badge = document.createElement('div');
  badge.id = 'ai-guide-step-badge';
  badge.textContent = `AI Guide — Bước ${stepIndex + 1} / ${totalSteps}`;
  badge.style.cssText = 'position:fixed!important;bottom:16px!important;right:16px!important;z-index:2147483647!important;background:#161920;color:#e8eaf0;border:1px solid #ff4757;border-radius:20px;padding:6px 14px;font-size:12px;font-weight:600;box-shadow:0 2px 16px rgba(255,71,87,0.3);pointer-events:none';
  document.documentElement.appendChild(badge);
}
