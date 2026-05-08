chrome.runtime.onMessage.addListener((msg, _, sendResponse) => {
  if (msg.type === 'HIGHLIGHT_STEP') {
    clearHighlights();
    const highlighted = injectHighlightsForStep(msg.step);
    showStepBadge(msg.stepIndex, msg.totalSteps);
    sendResponse({ ok: true, highlighted });
  }
  if (msg.type === 'CLEAR_HIGHLIGHTS') {
    clearHighlights();
    removeStepBadge();
    sendResponse({ ok: true });
  }
  return true;
});

// Overlay anchored to <html> (not <body>) to escape CSS transforms on body/Angular/React trees.
function getOverlay() {
  let overlay = document.getElementById('ai-guide-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'ai-guide-overlay';
    overlay.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:100%',
      'height:100%',
      'pointer-events:none',
      'z-index:2147483646',
      'overflow:visible',
      'transform:none',        // reset — won't help if ancestor has one, but
      'will-change:unset',     // prevents this element from creating a new stacking context
    ].join('!important;') + '!important';
    document.documentElement.appendChild(overlay);
  }
  return overlay;
}

function injectHighlightsForStep(step) {
  if (!step || !step.targets || step.targets.length === 0) return 0;

  if (!document.getElementById('ai-guide-style')) {
    const style = document.createElement('style');
    style.id = 'ai-guide-style';
    style.textContent = `
      #ai-guide-overlay * { box-sizing: border-box !important; }
      .ai-guide-highlight {
        position: absolute !important;
        pointer-events: none !important;
        border: 3px solid #ff4757 !important;
        border-radius: 6px !important;
        box-shadow: 0 0 0 3px rgba(255,71,87,0.25), 0 0 20px rgba(255,71,87,0.4) !important;
        animation: ai-guide-pulse 1.5s ease-in-out infinite !important;
        background: rgba(255,71,87,0.05) !important;
      }
      .ai-guide-label {
        position: absolute !important;
        background: #ff4757 !important;
        color: white !important;
        font-family: 'Space Grotesk', -apple-system, sans-serif !important;
        font-size: 12px !important;
        font-weight: 600 !important;
        padding: 4px 10px !important;
        border-radius: 20px !important;
        pointer-events: none !important;
        white-space: nowrap !important;
        box-shadow: 0 2px 12px rgba(255,71,87,0.5) !important;
        letter-spacing: 0.02em !important;
      }
      .ai-guide-label .step-num {
        display: inline-block !important;
        background: rgba(255,255,255,0.3) !important;
        border-radius: 50% !important;
        width: 16px !important; height: 16px !important; line-height: 16px !important;
        text-align: center !important; font-size: 10px !important; margin-right: 5px !important;
      }
      @keyframes ai-guide-pulse {
        0%, 100% { box-shadow: 0 0 0 3px rgba(255,71,87,0.25), 0 0 20px rgba(255,71,87,0.4); }
        50% { box-shadow: 0 0 0 6px rgba(255,71,87,0.1), 0 0 30px rgba(255,71,87,0.6); }
      }
    `;
    document.head.appendChild(style);
  }

  const overlay = getOverlay();
  let highlighted = 0;
  const pairs = [];

  step.targets.forEach((target, idx) => {
    let el = findElement(target);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const highlight = document.createElement('div');
    highlight.className = 'ai-guide-highlight';
    setPos(highlight, rect.top - 4, rect.left - 4, rect.width + 8, rect.height + 8);
    overlay.appendChild(highlight);

    const label = document.createElement('div');
    label.className = 'ai-guide-label';
    const stepNum = document.createElement('span');
    stepNum.className = 'step-num';
    stepNum.textContent = idx + 1;
    label.appendChild(stepNum);
    label.appendChild(document.createTextNode(target.description));
    const lt = rect.top - 32 > 10 ? rect.top - 32 : rect.top + rect.height + 8;
    setPos(label, lt, Math.max(0, rect.left));
    overlay.appendChild(label);

    pairs.push({ el, highlight, label });
    highlighted++;
  });

  if (pairs.length > 0) {
    const styleEl = document.getElementById('ai-guide-style');
    styleEl._reposition = () => {
      pairs.forEach(({ el, highlight, label }) => {
        const r = el.getBoundingClientRect();
        setPos(highlight, r.top - 4, r.left - 4, r.width + 8, r.height + 8);
        const lt = r.top - 32 > 10 ? r.top - 32 : r.top + r.height + 8;
        setPos(label, lt, Math.max(0, r.left));
      });
    };
    window.addEventListener('scroll', styleEl._reposition, { passive: true, capture: true });
    window.addEventListener('resize', styleEl._reposition, { passive: true });
  }

  return highlighted;
}

function setPos(el, top, left, width, height) {
  el.style.top = `${top}px`;
  el.style.left = `${left}px`;
  if (width !== undefined) el.style.width = `${width}px`;
  if (height !== undefined) el.style.height = `${height}px`;
}

// Selector first; fall back to text_content with exact-match preferred over contains.
function findElement(target) {
  if (target.selector) {
    try {
      const el = document.querySelector(target.selector);
      if (el) return el;
    } catch (e) { }
  }

  if (!target.text_content) return null;

  const query = 'button, a, input[type="text"], input[type="search"], input[type="email"], input[type="password"], textarea, [role="button"], [role="link"], [role="menuitem"], [role="option"], [role="searchbox"], [role="textbox"], input[type="submit"], input[type="button"]';
  const candidates = document.querySelectorAll(query);
  let bestExact = null;
  let bestContains = null;

  for (const c of candidates) {
    const text = (c.textContent || c.getAttribute('aria-label') || '').trim();
    const rect = c.getBoundingClientRect();
    if (!rect.width || !rect.height) continue;

    if (text === target.text_content) {
      if (!bestExact || rect.width < bestExact.getBoundingClientRect().width) bestExact = c;
    } else if (text.includes(target.text_content)) {
      if (!bestContains || rect.width < bestContains.getBoundingClientRect().width) bestContains = c;
    }
  }

  return bestExact || bestContains || null;
}

function clearHighlights() {
  document.getElementById('ai-guide-overlay')?.remove();
  const s = document.getElementById('ai-guide-style');
  if (s?._reposition) {
    window.removeEventListener('scroll', s._reposition, true);
    window.removeEventListener('resize', s._reposition);
    s._reposition = null;
  }
  s?.remove();
}

function showStepBadge(stepIndex, totalSteps) {
  removeStepBadge();
  const badge = document.createElement('div');
  badge.id = 'ai-guide-step-badge';
  badge.textContent = `AI Guide — Bước ${stepIndex + 1} / ${totalSteps}`;
  Object.assign(badge.style, {
    position: 'fixed',
    bottom: '16px',
    right: '16px',
    zIndex: '2147483647',
    background: '#161920',
    color: '#e8eaf0',
    border: '1px solid #ff4757',
    borderRadius: '20px',
    padding: '6px 14px',
    fontSize: '12px',
    fontFamily: "'Space Grotesk', -apple-system, sans-serif",
    fontWeight: '600',
    boxShadow: '0 2px 16px rgba(255,71,87,0.3)',
    pointerEvents: 'none',
    letterSpacing: '0.02em'
  });
  document.documentElement.appendChild(badge);
}

function removeStepBadge() {
  document.getElementById('ai-guide-step-badge')?.remove();
}
