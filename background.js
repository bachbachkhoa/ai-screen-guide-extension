chrome.runtime.onInstalled.addListener(() => {
  console.log('[AI Screen Guide] Extension installed');
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'CAPTURE_REGION') {
    const tabId = sender.tab?.id;
    if (!tabId) { sendResponse({ error: 'no tab' }); return true; }
    (async () => {
      try {
        const dataUrl = await chrome.tabs.captureVisibleTab(sender.tab.windowId, { format: 'png' });
        const cropped = await cropImage(dataUrl, msg.rect, msg.devicePixelRatio || 1);
        const key = 'cropAttachments_' + tabId;
        const stored = await chrome.storage.session.get(key);
        const arr = stored[key] || [];
        if (arr.length >= 5) { sendResponse({ error: 'max5' }); return; }
        arr.push(cropped);
        await chrome.storage.session.set({ [key]: arr });
        sendResponse({ dataUrl: cropped, count: arr.length });
      } catch (e) {
        sendResponse({ error: e.message });
      }
    })();
    return true;
  }

  if (msg.type === 'REGION_SELECT_DONE') {
    const tabId = sender.tab?.id;
    if (tabId) {
      try {
        chrome.action.setBadgeText({ text: '🖼', tabId });
        chrome.action.setBadgeBackgroundColor({ color: '#2ed573', tabId });
      } catch {}
    }
    sendResponse({ ok: true });
    return true;
  }
});

async function cropImage(dataUrl, rect, dpr) {
  const resp = await fetch(dataUrl);
  const blob = await resp.blob();
  const bitmap = await createImageBitmap(blob);
  const w = Math.round(rect.width * dpr);
  const h = Math.round(rect.height * dpr);
  const canvas = new OffscreenCanvas(w, h);
  canvas.getContext('2d').drawImage(bitmap,
    Math.round(rect.x * dpr), Math.round(rect.y * dpr), w, h,
    0, 0, w, h
  );
  const resultBlob = await canvas.convertToBlob({ type: 'image/png' });
  const buf = await resultBlob.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return 'data:image/png;base64,' + btoa(binary);
}


chrome.tabs.onRemoved.addListener(async (tabId) => {
  await chrome.storage.session.remove('cropAttachments_' + tabId);
});
