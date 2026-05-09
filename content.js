if (window.__aiGuideInited) {
  // Guard: already injected — skip re-registration to avoid duplicate listeners
} else {
window.__aiGuideInited = true;

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
  if (msg.type === 'START_REGION_SELECT') {
    console.log('[content.js] START_REGION_SELECT received');
    startRegionSelect();
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

// --- Region selector ---
let regionSelectActive = false;
let regionOverlay = null;
let regionFloatingPanel = null;

function startRegionSelect() {
  console.log('[content.js] startRegionSelect called, already active:', regionSelectActive);
  if (regionSelectActive) return;
  regionSelectActive = true;

  regionOverlay = document.createElement('div');
  regionOverlay.id = 'ai-region-overlay';
  regionOverlay.style.cssText = 'position:fixed!important;top:0!important;left:0!important;width:100%!important;height:100%!important;z-index:2147483635!important;cursor:crosshair!important;background:rgba(0,0,0,0.35)!important;user-select:none!important';
  document.documentElement.appendChild(regionOverlay);

  let startX = 0, startY = 0, isDragging = false;
  let selRect = null, confirmPanel = null;

  function removeConfirmPanel() { confirmPanel?.remove(); confirmPanel = null; }

  function onMouseDown(e) {
    if (e.button !== 0) return;
    e.preventDefault(); e.stopPropagation();
    removeConfirmPanel();
    selRect?.remove();
    isDragging = true;
    startX = e.clientX; startY = e.clientY;
    selRect = document.createElement('div');
    selRect.style.cssText = 'position:fixed!important;border:2px solid #ff4757!important;box-sizing:border-box!important;pointer-events:none!important;z-index:2147483636!important';
    document.documentElement.appendChild(selRect);
  }

  function onMouseMove(e) {
    if (!isDragging || !selRect) return;
    const x = Math.min(e.clientX, startX);
    const y = Math.min(e.clientY, startY);
    const w = Math.abs(e.clientX - startX);
    const h = Math.abs(e.clientY - startY);
    selRect.style.left = x + 'px'; selRect.style.top = y + 'px';
    selRect.style.width = w + 'px'; selRect.style.height = h + 'px';
    selRect.style.boxShadow = '0 0 0 9999px rgba(0,0,0,0.55)';
  }

  function onMouseUp(e) {
    if (!isDragging) return;
    isDragging = false;
    const x = Math.min(e.clientX, startX);
    const y = Math.min(e.clientY, startY);
    const w = Math.abs(e.clientX - startX);
    const h = Math.abs(e.clientY - startY);
    if (w < 10 || h < 10) { selRect?.remove(); selRect = null; return; }

    confirmPanel = document.createElement('div');
    const cpLeft = Math.min(x + w + 8, window.innerWidth - 180);
    const cpTop = Math.min(Math.max(y, 8), window.innerHeight - 90);
    confirmPanel.style.cssText = `position:fixed!important;left:${cpLeft}px!important;top:${cpTop}px!important;z-index:2147483645!important;background:#161920;border:1px solid #ff4757;border-radius:8px;padding:10px 12px;display:flex;flex-direction:column;gap:8px;font-family:-apple-system,sans-serif;font-size:12px;color:#e8eaf0;box-shadow:0 4px 24px rgba(0,0,0,0.7);min-width:160px`;

    const sizeLabel = document.createElement('div');
    sizeLabel.style.cssText = 'font-size:11px;color:#6b7080';
    sizeLabel.textContent = `${Math.round(w)} × ${Math.round(h)} px`;

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:6px';

    const addBtn = document.createElement('button');
    addBtn.textContent = 'Thêm';
    addBtn.style.cssText = 'flex:1;padding:6px;background:#ff4757;border:none;border-radius:5px;color:white;font-size:12px;font-weight:600;cursor:pointer;font-family:-apple-system,sans-serif';

    const skipBtn = document.createElement('button');
    skipBtn.textContent = 'Bỏ qua';
    skipBtn.style.cssText = 'flex:1;padding:6px;background:transparent;border:1px solid #2a2d38;border-radius:5px;color:#6b7080;font-size:12px;cursor:pointer;font-family:-apple-system,sans-serif';

    addBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      removeConfirmPanel();
      selRect?.remove(); selRect = null;
      chrome.runtime.sendMessage({
        type: 'CAPTURE_REGION',
        rect: { x, y, width: w, height: h },
        devicePixelRatio: window.devicePixelRatio || 1
      }, (resp) => {
        if (resp?.error === 'max5') { showRegionNotice('Đã đạt tối đa 5 vùng'); return; }
        if (resp?.error) { showRegionNotice('Lỗi: ' + resp.error); return; }
        addThumbnailToPanel(resp.dataUrl, resp.count);
      });
    });

    skipBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      removeConfirmPanel();
      selRect?.remove(); selRect = null;
    });

    btnRow.appendChild(addBtn); btnRow.appendChild(skipBtn);
    confirmPanel.appendChild(sizeLabel); confirmPanel.appendChild(btnRow);
    document.documentElement.appendChild(confirmPanel);
  }

  function onKeyDown(e) {
    if (e.key !== 'Escape') return;
    removeConfirmPanel();
    selRect?.remove(); selRect = null;
    endRegionSelect();
  }

  regionOverlay.addEventListener('mousedown', onMouseDown);
  document.addEventListener('mousemove', onMouseMove, true);
  document.addEventListener('mouseup', onMouseUp, true);
  document.addEventListener('keydown', onKeyDown, true);

  regionOverlay._teardown = () => {
    regionOverlay.removeEventListener('mousedown', onMouseDown);
    document.removeEventListener('mousemove', onMouseMove, true);
    document.removeEventListener('mouseup', onMouseUp, true);
    document.removeEventListener('keydown', onKeyDown, true);
  };
}

function endRegionSelect() {
  regionSelectActive = false;
  regionOverlay?._teardown?.();
  regionOverlay?.remove();
  regionOverlay = null;
}

function showRegionNotice(text) {
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed!important;bottom:80px!important;right:16px!important;z-index:2147483647!important;background:#ff4757;color:white;font-family:-apple-system,sans-serif;font-size:12px;padding:8px 14px;border-radius:8px;box-shadow:0 2px 12px rgba(0,0,0,0.5)';
  el.textContent = text;
  document.documentElement.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

function addThumbnailToPanel(dataUrl, count) {
  if (!regionFloatingPanel) createFloatingPanel();
  const thumbsContainer = regionFloatingPanel.querySelector('#ai-region-thumbs');

  const item = document.createElement('div');
  item.style.cssText = 'position:relative;display:inline-block';

  const img = document.createElement('img');
  img.src = dataUrl;
  img.style.cssText = 'width:60px;height:45px;object-fit:cover;border-radius:4px;border:1px solid #2a2d38;display:block';

  item.appendChild(img);
  thumbsContainer.appendChild(item);
  updateFloatingPanelCount(count);
}

function createFloatingPanel() {
  regionFloatingPanel = document.createElement('div');
  regionFloatingPanel.id = 'ai-region-panel';
  regionFloatingPanel.style.cssText = 'position:fixed!important;bottom:16px!important;right:16px!important;z-index:2147483644!important;background:#161920!important;border:1px solid #2a2d38!important;border-radius:10px!important;padding:12px!important;min-width:200px!important;max-width:260px!important;font-family:-apple-system,sans-serif!important;box-shadow:0 4px 24px rgba(0,0,0,0.7)!important';

  const header = document.createElement('div');
  header.style.cssText = 'font-size:11px;color:#6b7080;margin-bottom:8px;font-weight:600';
  header.textContent = 'Vùng đã chọn';

  const thumbs = document.createElement('div');
  thumbs.id = 'ai-region-thumbs';
  thumbs.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;min-height:45px';

  const countBadge = document.createElement('div');
  countBadge.id = 'ai-region-count';
  countBadge.style.cssText = 'font-size:10px;color:#6b7080;margin-bottom:8px';

  const btnRow = document.createElement('div');
  btnRow.style.cssText = 'display:flex;gap:6px';

  const addMoreBtn = document.createElement('button');
  addMoreBtn.textContent = 'Thêm vùng khác';
  addMoreBtn.style.cssText = 'flex:1;padding:6px;background:transparent;border:1px solid #2a2d38;border-radius:5px;color:#e8eaf0;font-size:11px;cursor:pointer;font-family:-apple-system,sans-serif';
  addMoreBtn.addEventListener('click', () => { if (!regionSelectActive) startRegionSelect(); });

  const doneBtn = document.createElement('button');
  doneBtn.id = 'ai-region-done';
  doneBtn.textContent = 'Xong (0/5)';
  doneBtn.style.cssText = 'flex:1;padding:6px;background:#ff4757;border:none;border-radius:5px;color:white;font-size:11px;font-weight:600;cursor:pointer;font-family:-apple-system,sans-serif';
  doneBtn.addEventListener('click', () => {
    endRegionSelect();
    chrome.runtime.sendMessage({ type: 'REGION_SELECT_DONE' });
    regionFloatingPanel?.remove();
    regionFloatingPanel = null;
  });

  btnRow.appendChild(addMoreBtn); btnRow.appendChild(doneBtn);
  regionFloatingPanel.appendChild(header);
  regionFloatingPanel.appendChild(thumbs);
  regionFloatingPanel.appendChild(countBadge);
  regionFloatingPanel.appendChild(btnRow);
  document.documentElement.appendChild(regionFloatingPanel);
}

function updateFloatingPanelCount(count) {
  if (!regionFloatingPanel) return;
  const countEl = regionFloatingPanel.querySelector('#ai-region-count');
  const doneBtn = regionFloatingPanel.querySelector('#ai-region-done');
  if (countEl) countEl.textContent = `${count}/5 vùng`;
  if (doneBtn) doneBtn.textContent = `Xong (${count}/5)`;
}

} // end __aiGuideInited guard
