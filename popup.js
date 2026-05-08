const PROVIDERS = {
  openai: {
    url: 'https://api.openai.com/v1/chat/completions',
    models: ['gpt-4o', 'gpt-4o-mini'],
    defaultModel: 'gpt-4o',
    buildHeaders: (key) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    }),
    buildBody: (model, screenshot, prompt) => JSON.stringify({
      model,
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'text',
            text: buildSystemPrompt(prompt)
          },
          {
            type: 'image_url',
            image_url: { url: screenshot, detail: 'high' }
          }
        ]
      }]
    }),
    parseResponse: (data) => data.choices?.[0]?.message?.content
  },

  deepseek: {
    url: 'https://api.deepseek.com/chat/completions',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    defaultModel: 'deepseek-chat',
    usesDOM: () => true,
    buildHeaders: (key) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    }),
    buildBody: (model, input, prompt) => JSON.stringify({
      model, max_tokens: 4096,
      messages: [
        { role: 'system', content: 'Bạn là AI assistant giúp user điều hướng trên web. Trả lời theo đúng JSON format được yêu cầu.' },
        { role: 'user', content: buildSystemPromptText(prompt, input) }
      ]
    }),
    parseResponse: (data) => data.choices?.[0]?.message?.content
  },

  qwen: {
    url: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions',
    models: ['qwen-vl-max', 'qwen-vl-plus', 'qwen2.5-vl-72b-instruct', 'qwen2.5-vl-7b-instruct'],
    defaultModel: 'qwen-vl-max',
    buildHeaders: (key) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    }),
    buildBody: (model, screenshot, prompt) => JSON.stringify({
      model, max_tokens: 4096,
      messages: [{ role: 'user', content: [
        { type: 'image_url', image_url: { url: screenshot } },
        { type: 'text', text: buildSystemPrompt(prompt) }
      ]}]
    }),
    parseResponse: (data) => data.choices?.[0]?.message?.content
  },

  claude: {
    url: 'https://api.anthropic.com/v1/messages',
    models: ['claude-opus-4-7', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001'],
    defaultModel: 'claude-sonnet-4-6',
    buildHeaders: (key) => ({
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    }),
    buildBody: (model, screenshot, prompt) => JSON.stringify({
      model,
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/png',
              data: screenshot.replace('data:image/png;base64,', '')
            }
          },
          {
            type: 'text',
            text: buildSystemPrompt(prompt)
          }
        ]
      }]
    }),
    parseResponse: (data) => data.content?.[0]?.text
  }
};

function redactPII(text) {
  return text
    // email
    .replace(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, '[EMAIL]')
    // 16-digit credit card
    .replace(/\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b/g, '[CARD]')
    // VN mobile
    .replace(/(\+84|0)(3[2-9]|5[25689]|7[06-9]|8[0-9]|9[0-9])\d{7}/g, '[PHONE-VN]')
    // VN national ID (CCCD 12-digit, CMND 9-digit)
    .replace(/\b\d{12}\b/g, '[CCCD]')
    .replace(/\b\d{9}\b/g, '[CMND]')
    // JP mobile (070/080/090)
    .replace(/0[789]0[\s\-]?\d{4}[\s\-]?\d{4}/g, '[PHONE-JP]')
    // JP landline
    .replace(/0\d{1,4}[\s\-]\d{1,4}[\s\-]\d{4}/g, '[PHONE-JP]')
    // JP IP phone (050)
    .replace(/050[\s\-]?\d{4}[\s\-]?\d{4}/g, '[PHONE-JP]')
    // JP postal code
    .replace(/〒?\d{3}[\s\-]\d{4}/g, '[POSTAL-JP]')
    // JP My Number — 12-digit after 番号/ナンバー keyword; $1 preserves the keyword
    .replace(/(番号|ナンバー|マイナンバー)[^\d]*\d{4}[\s\-]?\d{4}[\s\-]?\d{4}/g, '$1 [MY-NUMBER-JP]')
    // JP address containing prefecture (都道府県) + city (市区町村) markers
    .replace(/\S*[都道府県]\S*[市区町村]\S*/g, '[ADDRESS-JP]');
}

function buildSystemPrompt(userPrompt) {
  return `Bạn là AI assistant giúp điều hướng UI. Nhìn vào screenshot màn hình và trả lời câu hỏi của user.

User hỏi: "${userPrompt}"

Hãy chia task thành các bước, mỗi bước trên một trang web. Trả về JSON theo format SAU ĐÂY (không thêm text ngoài JSON):

{
  "explanation": "Tóm tắt kế hoạch tổng thể bằng tiếng Việt",
  "steps": [
    {
      "step_index": 0,
      "description": "Mô tả bước này bằng tiếng Việt",
      "url_pattern": "chuỗi con của URL trang này (đủ cụ thể, dùng path — không chỉ domain)",
      "targets": [
        {
          "description": "Tên nút/hành động ngắn gọn (VD: 'Tạo instance', 'Ô tìm kiếm'). Chỉ 1-4 từ. KHÔNG giải thích, KHÔNG nói 'thay thế', KHÔNG chứa selector/class/id",
          "selector": "CSS selector CỤ THỂ nhất: ưu tiên [aria-label='...'], [data-*='...'], #id. TRÁNH class chung như .mdc-button, .btn",
          "text_content": "Text hiển thị trên nút/element đó (chính xác như trên màn hình)",
          "position_hint": "Mô tả vị trí: top-left, center, menu trái, header phải...",
          "priority": 1
        }
      ]
    }
  ]
}

Quy tắc quan trọng:
- step_index 0: url_pattern là chuỗi con của URL TRANG HIỆN TẠI, targets là element cần click trên trang này
- step_index N (N>0): url_pattern là chuỗi con của URL trang SAU KHI click bước N-1
- url_pattern phải đủ cụ thể để phân biệt trang này với trang khác cùng domain (dùng path, query param). KHÔNG dùng "/" hay "//" vì sẽ match mọi trang
- Nếu không đoán được URL tiếp theo: để url_pattern là ""
- Nếu không xác định được selector chính xác: để selector là "" và dùng text_content + position_hint`;
}

function buildSystemPromptText(userPrompt, domText) {
  return `Bạn là AI assistant giúp điều hướng UI. Đây là nội dung DOM (text) của trang hiện tại:

${domText.substring(0, 6000)}

User hỏi: "${userPrompt}"

Hãy chia task thành các bước, mỗi bước trên một trang web. Trả về JSON theo format sau (không thêm text ngoài JSON):

{
  "explanation": "Tóm tắt kế hoạch tổng thể bằng tiếng Việt",
  "steps": [
    {
      "step_index": 0,
      "description": "Mô tả bước này bằng tiếng Việt",
      "url_pattern": "chuỗi con của URL trang này (đủ cụ thể, dùng path)",
      "targets": [
        {
          "description": "Tên nút/hành động ngắn gọn (VD: 'Tạo instance', 'Ô tìm kiếm'). Chỉ 1-4 từ. KHÔNG giải thích, KHÔNG nói 'thay thế', KHÔNG chứa selector/class/id",
          "selector": "CSS selector chính xác dựa vào DOM",
          "text_content": "Text hiển thị trên nút/element đó (chính xác)",
          "position_hint": "Mô tả vị trí",
          "priority": 1
        }
      ]
    }
  ]
}

Quy tắc: step_index 0 là trang hiện tại, step_index N>0 là trang sau khi click bước N-1. url_pattern phải đủ cụ thể (path, không chỉ domain), KHÔNG dùng "/" vì match mọi trang. Nếu không đoán được URL tiếp theo: để url_pattern là "".`;
}

const scanBtn = document.getElementById('scanBtn');
const clearBtn = document.getElementById('clearBtn');
const resultBox = document.getElementById('resultBox');
const apiKeyInput = document.getElementById('apiKey');
const promptInput = document.getElementById('prompt');
const modelSelect = document.getElementById('modelSelect');
const statusDot = document.getElementById('statusDot');
const toggleKey = document.getElementById('toggleKey');
const btnIcon = document.getElementById('btnIcon');
const btnText = document.getElementById('btnText');

let currentProvider = 'openai';

chrome.storage.local.get(null, (data) => {
  if (data.provider) {
    currentProvider = data.provider;
    document.querySelectorAll('.tab').forEach(t => {
      t.classList.toggle('active', t.dataset.provider === data.provider);
    });
    updateModelOptions(data.provider);
  }
  const savedKey = data[`apiKey_${currentProvider}`] || data.apiKey || '';
  if (savedKey) {
    apiKeyInput.value = savedKey;
    statusDot.className = 'status-dot active';
  }
  if (data[`model_${currentProvider}`]) modelSelect.value = data[`model_${currentProvider}`];
  if (data.lastPrompt) promptInput.value = data.lastPrompt;
  updateScreenshotNote(currentProvider);
});

chrome.tabs.query({ active: true, currentWindow: true }, async ([tab]) => {
  if (!tab) return;
  activeTabId = tab.id;
  const key = 'guide_plan_' + tab.id;
  const stored = await chrome.storage.session.get(key);
  const plan = stored[key];
  if (plan && plan.status === 'active') {
    showGuidedFlowUI(plan);
  }
});

const screenshotNote = document.getElementById('screenshotNote');
function providerUsesDOM(providerKey, model) {
  const p = PROVIDERS[providerKey];
  return typeof p?.usesDOM === 'function' ? p.usesDOM(model) : false;
}

function updateScreenshotNote(providerKey) {
  screenshotNote.style.display = providerUsesDOM(providerKey, modelSelect.value) ? 'none' : 'block';
}

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentProvider = tab.dataset.provider;
    updateModelOptions(currentProvider);
    chrome.storage.local.get([`apiKey_${currentProvider}`, `model_${currentProvider}`], (data) => {
      apiKeyInput.value = data[`apiKey_${currentProvider}`] || '';
      statusDot.className = 'status-dot ' + (apiKeyInput.value ? 'active' : '');
      if (data[`model_${currentProvider}`]) modelSelect.value = data[`model_${currentProvider}`];
      updateScreenshotNote(currentProvider);
    });
    chrome.storage.local.set({ provider: currentProvider });
  });
});

function updateModelOptions(provider) {
  const p = PROVIDERS[provider];
  if (!p) return;
  modelSelect.innerHTML = p.models.map(m =>
    `<option value="${m}">${m}</option>`
  ).join('');
  modelSelect.value = p.defaultModel;
}

apiKeyInput.addEventListener('input', () => {
  const key = apiKeyInput.value.trim();
  chrome.storage.local.set({ [`apiKey_${currentProvider}`]: key });
  statusDot.className = 'status-dot ' + (key ? 'active' : '');
});

toggleKey.addEventListener('click', () => {
  apiKeyInput.type = apiKeyInput.type === 'password' ? 'text' : 'password';
});

document.querySelectorAll('.qp').forEach(btn => {
  btn.addEventListener('click', () => {
    promptInput.value = btn.dataset.q;
  });
});

modelSelect.addEventListener('change', () => {
  chrome.storage.local.set({ [`model_${currentProvider}`]: modelSelect.value });
  updateScreenshotNote(currentProvider);
});

scanBtn.addEventListener('click', async () => {
  const apiKey = apiKeyInput.value.trim();
  const prompt = promptInput.value.trim();

  if (!apiKey) {
    showResult('⚠️ Chưa nhập API Key!', true);
    return;
  }
  if (!prompt) {
    showResult('⚠️ Chưa nhập câu hỏi/task!', true);
    return;
  }

  chrome.storage.local.set({ lastPrompt: prompt });

  setLoading(true);
  showResult('');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const provider = PROVIDERS[currentProvider];
    let aiInput;

    const model = modelSelect.value;
    if (providerUsesDOM(currentProvider, model)) {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: extractDOMText
      });
      aiInput = redactPII(results[0]?.result || '');
    } else {
      const screenshot = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
      aiInput = screenshot;
    }

    const response = await fetch(provider.url, {
      method: 'POST',
      headers: provider.buildHeaders(apiKey),
      body: provider.buildBody(model, aiInput, prompt)
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const rawText = provider.parseResponse(data);

    if (!rawText) throw new Error('AI không trả về kết quả');

    const parsed = parseAIResponse(rawText);
    const steps = normalizeSteps(parsed);

    const plan = {
      tabId: tab.id,
      explanation: parsed.explanation || '',
      userPrompt: promptInput.value.trim(),
      steps,
      currentStep: 0,
      status: 'active'
    };
    await chrome.storage.session.set({ ['guide_plan_' + tab.id]: plan });

    try {
      await chrome.tabs.sendMessage(tab.id, {
        type: 'HIGHLIGHT_STEP',
        step: steps[0],
        stepIndex: 0,
        totalSteps: steps.length
      });
    } catch {
      // content script not ready (fresh page load) — scripting fallback
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: injectHighlights,
        args: [{ targets: steps[0]?.targets || [] }]
      });
    }

    showGuidedFlowUI(plan);

  } catch (err) {
    console.error(err);
    showResult('❌ Lỗi: ' + err.message, true);
  } finally {
    setLoading(false);
  }
});

clearBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  await cancelGuidedFlow(tab.id);
});

function setLoading(loading) {
  scanBtn.disabled = loading;
  statusDot.className = 'status-dot ' + (loading ? 'loading' : 'active');
  if (loading) {
    btnIcon.textContent = '⏳';
    btnText.textContent = 'Đang phân tích...';
  } else {
    btnIcon.textContent = '📸';
    btnText.textContent = 'Scan & Phân tích';
  }
}

function showResult(text, isError = false) {
  if (!text) { resultBox.classList.remove('show'); return; }
  resultBox.innerText = text;
  resultBox.className = 'result-box show' + (isError ? ' error' : '');
}

const guidedFlowPanel = document.getElementById('guidedFlowPanel');
const stepProgressEl = document.getElementById('stepProgress');
const stepDescEl = document.getElementById('stepDesc');
const cancelFlowBtn = document.getElementById('cancelFlowBtn');
const scanSection = document.getElementById('scanSection');

function showGuidedFlowUI(plan) {
  if (!plan) return;
  const step = plan.steps[plan.currentStep];
  stepProgressEl.textContent = `Bước ${plan.currentStep + 1} / ${plan.steps.length}`;
  stepDescEl.textContent = step?.description || plan.explanation || '';
  guidedFlowPanel.style.display = 'block';
  const divider = document.getElementById('guidedDivider');
  if (divider) divider.style.display = 'block';
  if (scanSection) scanSection.style.opacity = '0.4';

  const rescanWarning = document.getElementById('rescanWarning');
  if (rescanWarning) rescanWarning.style.display = plan.rescanNeeded ? 'flex' : 'none';

  let display = `💡 ${plan.explanation}`;
  if (plan.steps.length > 1) {
    display += `\n\n📋 Kế hoạch:\n` + plan.steps.map((s, i) =>
      `${i === plan.currentStep ? '▶' : ' '} Bước ${i + 1}: ${s.description}`
    ).join('\n');
  }
  showResult(display);
}

function hideGuidedFlowUI() {
  if (guidedFlowPanel) guidedFlowPanel.style.display = 'none';
  const divider = document.getElementById('guidedDivider');
  if (divider) divider.style.display = 'none';
  if (scanSection) scanSection.style.opacity = '1';
}

async function cancelGuidedFlow(tabId) {
  const key = 'guide_plan_' + tabId;
  const stored = await chrome.storage.session.get(key);
  const plan = stored[key];
  if (plan) {
    plan.status = 'cancelled';
    await chrome.storage.session.set({ [key]: plan });
  }
  try {
    await chrome.tabs.sendMessage(tabId, { type: 'CLEAR_HIGHLIGHTS' });
  } catch {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        document.querySelectorAll('.ai-guide-highlight, .ai-guide-label, #ai-guide-step-badge').forEach(el => el.remove());
        const s = document.getElementById('ai-guide-style');
        if (s?._reposition) {
          window.removeEventListener('scroll', s._reposition, true);
          window.removeEventListener('resize', s._reposition);
        }
        s?.remove();
      }
    });
  }
  hideGuidedFlowUI();
  showResult('');
}

if (cancelFlowBtn) {
  cancelFlowBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await cancelGuidedFlow(tab.id);
  });
}

const rescanBtn = document.getElementById('rescanBtn');
if (rescanBtn) {
  rescanBtn.addEventListener('click', rescanCurrentStep);
}

async function rescanCurrentStep() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const key = 'guide_plan_' + tab.id;
  const stored = await chrome.storage.session.get(key);
  const plan = stored[key];
  if (!plan) return;

  const stepIndex = plan.currentStep;
  const step = plan.steps[stepIndex];
  const provider = PROVIDERS[currentProvider];
  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) { showResult('❌ Cần nhập API key để re-scan', true); return; }

  setLoading(true);
  try {
    const model = modelSelect.value;
    const focusedPrompt = `Tôi đang thực hiện: "${plan.userPrompt || step.description}". Tôi đang ở bước ${stepIndex + 1}: "${step.description}". Trên trang hiện tại, element nào tôi cần click? Chỉ trả về JSON: {"targets": [{"description": "Tên ngắn gọn cho người dùng (tiếng Việt)", "selector": "CSS selector chính xác", "text_content": "text trên element", "priority": 1}]}`;

    let body;
    if (providerUsesDOM(currentProvider, model)) {
      const [{ result: domText }] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: extractDOMText });
      body = provider.buildBody(model, domText, focusedPrompt);
    } else {
      const screenshot = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
      body = provider.buildBody(model, screenshot, focusedPrompt);
    }

    const response = await fetch(provider.url, { method: 'POST', headers: provider.buildHeaders(apiKey), body });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `HTTP ${response.status}`);
    }
    const data = await response.json();
    const rawText = provider.parseResponse(data);
    const parsed = parseAIResponse(rawText);
    const newTargets = parsed.targets?.length > 0 ? parsed.targets : (parsed.steps?.[0]?.targets || []);

    if (newTargets.length === 0) {
      showResult('⚠️ Re-scan không tìm được element. Thử mô tả rõ hơn hoặc đổi provider.', true);
      return;
    }

    plan.steps[stepIndex].targets = newTargets;
    plan.rescanNeeded = false;
    await chrome.storage.session.set({ [key]: plan });
    try { chrome.action.setBadgeText({ text: '', tabId: tab.id }); } catch {}

    await chrome.tabs.sendMessage(tab.id, {
      type: 'HIGHLIGHT_STEP',
      step: plan.steps[stepIndex],
      stepIndex,
      totalSteps: plan.steps.length
    });
    showGuidedFlowUI(plan);
  } catch (err) {
    showResult('❌ Lỗi re-scan: ' + err.message, true);
  } finally {
    setLoading(false);
  }
}

function normalizeSteps(parsed) {
  if (Array.isArray(parsed.steps) && parsed.steps.length > 0 && typeof parsed.steps[0] === 'object') {
    return parsed.steps.map((s, i) => ({
      step_index: i,
      description: s.description || `Bước ${i + 1}`,
      url_pattern: s.url_pattern || '',
      targets: Array.isArray(s.targets) ? s.targets : []
    }));
  }
  // legacy flat format — wrap into single step
  return [{
    step_index: 0,
    description: parsed.explanation || 'Bước 1',
    url_pattern: '',
    targets: Array.isArray(parsed.targets) ? parsed.targets : []
  }];
}

function parseAIResponse(text) {
  const safe = text.slice(0, 32768);
  let jsonStr = safe;
  const fenceMatch = safe.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    jsonStr = fenceMatch[1];
  } else {
    const start = safe.indexOf('{');
    const end = safe.lastIndexOf('}');
    if (start !== -1 && end > start) jsonStr = safe.slice(start, end + 1);
  }
  try {
    return JSON.parse(jsonStr.trim());
  } catch {
    const looksLikeJson = jsonStr.trim().startsWith('{');
    return {
      explanation: looksLikeJson ? '⚠️ AI trả về response bị cắt ngắn. Thử lại hoặc đặt câu hỏi ngắn hơn.' : text,
      targets: [],
      steps: []
    };
  }
}

// injected into page context (not extension context)
function extractDOMText() {
  const selector = 'button, a, input, select, [role="button"], nav, h1, h2, h3, [aria-label]';
  const texts = [];
  for (const el of document.querySelectorAll(selector)) {
    const text = (el.textContent || el.getAttribute('aria-label') || el.getAttribute('title') || '').trim();
    if (!text || text.length >= 200) continue;
    const tag = el.tagName.toLowerCase();
    const id = el.id ? `#${el.id}` : '';
    const cls = el.className && typeof el.className === 'string'
      ? '.' + el.className.split(' ').filter(Boolean).slice(0, 2).join('.')
      : '';
    texts.push(`[${tag}${id}${cls}] "${text}"`);
    if (texts.length >= 200) break;
  }
  return texts.join('\n');
}

function injectHighlights(parsed) {
  document.querySelectorAll('.ai-guide-highlight, .ai-guide-label, #ai-guide-overlay').forEach(el => el.remove());
  const _existingStyle = document.getElementById('ai-guide-style');
  if (_existingStyle?._reposition) {
    window.removeEventListener('scroll', _existingStyle._reposition, true);
    window.removeEventListener('resize', _existingStyle._reposition);
    _existingStyle._reposition = null;
  }

  if (!parsed.targets || parsed.targets.length === 0) return;

  if (!document.getElementById('ai-guide-style')) {
    const style = document.createElement('style');
    style.id = 'ai-guide-style';
    style.textContent = `
      .ai-guide-highlight {
        position: fixed !important;
        pointer-events: none !important;
        z-index: 999999 !important;
        border: 3px solid #ff4757 !important;
        border-radius: 6px !important;
        box-shadow: 0 0 0 3px rgba(255,71,87,0.25), 0 0 20px rgba(255,71,87,0.4) !important;
        animation: ai-guide-pulse 1.5s ease-in-out infinite !important;
        background: rgba(255,71,87,0.05) !important;
        transition: all 0.3s !important;
      }
      .ai-guide-label {
        position: fixed !important;
        z-index: 9999999 !important;
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
        display: inline-block;
        background: rgba(255,255,255,0.3);
        border-radius: 50%;
        width: 16px;
        height: 16px;
        line-height: 16px;
        text-align: center;
        font-size: 10px;
        margin-right: 5px;
      }
      @keyframes ai-guide-pulse {
        0%, 100% { box-shadow: 0 0 0 3px rgba(255,71,87,0.25), 0 0 20px rgba(255,71,87,0.4); }
        50% { box-shadow: 0 0 0 6px rgba(255,71,87,0.1), 0 0 30px rgba(255,71,87,0.6); }
      }
    `;
    document.head.appendChild(style);
  }

  let highlighted = 0;
  const pairs = [];

  parsed.targets.forEach((target, idx) => {
    let el = null;

    if (target.selector) {
      try { el = document.querySelector(target.selector); } catch (e) { }
    }

    if (!el && target.text_content) {
      const allClickable = document.querySelectorAll('button, a, [role="button"], input[type="submit"], input[type="button"], li, td, th, span, div');
      for (const candidate of allClickable) {
        const text = (candidate.textContent || '').trim();
        if (text === target.text_content || text.includes(target.text_content)) {
          if (!el || candidate.getBoundingClientRect().width < el.getBoundingClientRect().width) {
            el = candidate;
          }
        }
      }
    }

    if (!el) return;

    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const highlight = document.createElement('div');
    highlight.className = 'ai-guide-highlight';
    highlight.style.top = `${rect.top - 4}px`;
    highlight.style.left = `${rect.left - 4}px`;
    highlight.style.width = `${rect.width + 8}px`;
    highlight.style.height = `${rect.height + 8}px`;
    document.body.appendChild(highlight);

    const label = document.createElement('div');
    label.className = 'ai-guide-label';
    const stepNum = document.createElement('span');
    stepNum.className = 'step-num';
    stepNum.textContent = idx + 1;
    label.appendChild(stepNum);
    label.appendChild(document.createTextNode(target.description));
    const labelTop = rect.top - 32 > 10 ? rect.top - 32 : rect.top + rect.height + 8;
    label.style.top = `${labelTop}px`;
    label.style.left = `${Math.max(0, rect.left)}px`;
    document.body.appendChild(label);

    pairs.push({ el, highlight, label });
    highlighted++;
  });

  if (pairs.length > 0) {
    const styleEl = document.getElementById('ai-guide-style');
    styleEl._reposition = () => {
      pairs.forEach(({ el, highlight, label }) => {
        const r = el.getBoundingClientRect();
        highlight.style.top = `${r.top - 4}px`;
        highlight.style.left = `${r.left - 4}px`;
        highlight.style.width = `${r.width + 8}px`;
        highlight.style.height = `${r.height + 8}px`;
        const lt = r.top - 32 > 10 ? r.top - 32 : r.top + r.height + 8;
        label.style.top = `${lt}px`;
        label.style.left = `${Math.max(0, r.left)}px`;
      });
    };
    window.addEventListener('scroll', styleEl._reposition, { passive: true, capture: true });
    window.addEventListener('resize', styleEl._reposition, { passive: true });
  }

  return highlighted;
}
