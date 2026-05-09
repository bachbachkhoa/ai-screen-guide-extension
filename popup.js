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
        { role: 'system', content: STRINGS[currentLang].deepseekSystem },
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
              media_type: screenshot.startsWith('data:image/png') ? 'image/png' : 'image/jpeg',
              data: screenshot.replace(/^data:image\/\w+;base64,/, '')
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

const STRINGS = {
  vi: {
    deepseekSystem: 'Bạn là AI assistant giúp user điều hướng trên web. Trả lời theo đúng JSON format được yêu cầu.',
    consentSubtitle: 'Trước khi sử dụng, hãy đọc thông tin sau',
    consentP1: 'Extension này giúp bạn điều hướng web bằng AI. Để hoạt động, extension cần gửi dữ liệu lên AI provider bạn chọn:',
    consentBullet1: '<strong>Screenshot</strong> toàn trang hoặc <strong>vùng màn hình</strong> bạn chọn (OpenAI, Claude, Qwen)',
    consentBullet2: '<strong>Text DOM</strong> của trang (DeepSeek)',
    consentBullet3: '<strong>Câu hỏi/Task</strong> bạn nhập',
    consentP2: 'Dữ liệu đi thẳng từ trình duyệt đến AI provider. Extension <strong>không có server riêng</strong> và không lưu dữ liệu của bạn.',
    consentWarning: '⚠️ Đừng để thông tin nhạy cảm (mật khẩu, số thẻ, CCCD) hiển thị trên màn hình khi Scan.',
    consentAgree: 'Tôi hiểu và đồng ý',
    consentPrivacy: 'Xem Chính sách quyền riêng tư đầy đủ',
    labelProvider: 'AI Provider', labelApiKey: 'API Key', labelModel: 'Model',
    labelPrompt: 'Câu hỏi',
    placeholderKey: 'sk-...  (lưu local, không gửi đi đâu)',
    placeholderPrompt: 'Tôi muốn tạo một VM mới trên Google Cloud. Tôi nên bấm vào đâu? (không nhập thông tin cá nhân)',
    btnAddRegion: '🖼 Thêm vùng màn hình',
    btnScan: 'Scan & Phân tích', btnClear: 'Xóa highlight',
    btnDeleteAll: 'Xóa tất cả dữ liệu', linkPrivacy: 'Chính sách quyền riêng tư',
    quickPromptLabel: '❓ Bước tiếp theo',
    quickPromptText: 'Bước tiếp theo tôi cần làm gì trên trang này?',
    screenshotNote: '📸 Screenshot màn hình sẽ gửi lên AI provider. Đảm bảo không có thông tin nhạy cảm đang hiển thị.',
    deepseekNote: '⚠️ DeepSeek đọc nội dung text trên trang (DOM). Không dùng trên trang có chứa thông tin nhạy cảm (mật khẩu, số thẻ, dữ liệu cá nhân).',
    feedbackAllDeleted: '✓ Đã xóa tất cả',
    errNoKey: '⚠️ Chưa nhập API Key!', errNoPrompt: '⚠️ Chưa nhập câu hỏi/task!',
    errMaxRegions: '⚠️ Đã đạt tối đa 5 vùng ảnh',
    errAINoResult: 'AI không trả về kết quả',
    errTruncated: '⚠️ AI trả về response bị cắt ngắn. Thử lại hoặc đặt câu hỏi ngắn hơn.',
    scanning: 'Đang phân tích...', highlightDone: '✅ Highlight xong',
    errPrefix: '❌ Lỗi: ', modelCheaper: 'gpt-4o-mini (rẻ hơn)',
  },
  en: {
    deepseekSystem: 'You are an AI assistant helping users navigate the web. Reply in the exact JSON format requested.',
    consentSubtitle: 'Before you start, please read the following',
    consentP1: 'This extension helps you navigate the web using AI. To function, it needs to send data to the AI provider you choose:',
    consentBullet1: '<strong>Full-page screenshot</strong> or the <strong>screen regions</strong> you select (OpenAI, Claude, Qwen)',
    consentBullet2: '<strong>DOM text</strong> of the page (DeepSeek)',
    consentBullet3: 'The <strong>question/task</strong> you type',
    consentP2: 'Data goes directly from your browser to the AI provider. The extension has <strong>no server</strong> and does not store your data.',
    consentWarning: '⚠️ Do not let sensitive information (passwords, card numbers, ID) appear on screen when scanning.',
    consentAgree: 'I understand and agree',
    consentPrivacy: 'View full Privacy Policy',
    labelProvider: 'AI Provider', labelApiKey: 'API Key', labelModel: 'Model',
    labelPrompt: 'Question',
    placeholderKey: 'sk-...  (stored locally, never sent elsewhere)',
    placeholderPrompt: 'I want to create a new VM on Google Cloud. What should I click? (do not enter personal info)',
    btnAddRegion: '🖼 Add screen region',
    btnScan: 'Scan & Analyze', btnClear: 'Clear highlights',
    btnDeleteAll: 'Delete all data', linkPrivacy: 'Privacy Policy',
    quickPromptLabel: '❓ Next step',
    quickPromptText: 'What do I need to do next on this page?',
    screenshotNote: '📸 A screenshot will be sent to the AI provider. Make sure no sensitive information is visible.',
    deepseekNote: '⚠️ DeepSeek reads the text content of the page (DOM). Do not use on pages containing sensitive information (passwords, card numbers, personal data).',
    feedbackAllDeleted: '✓ All data deleted',
    errNoKey: '⚠️ API Key is required!', errNoPrompt: '⚠️ Please enter a question/task!',
    errMaxRegions: '⚠️ Maximum 5 regions reached',
    errAINoResult: 'AI returned no result',
    errTruncated: '⚠️ AI response was truncated. Try again or use a shorter prompt.',
    scanning: 'Analyzing...', highlightDone: '✅ Highlights applied',
    errPrefix: '❌ Error: ', modelCheaper: 'gpt-4o-mini (cheaper)',
  }
};

let currentLang = 'vi';

function redactPII(text) {
  return text
    // email
    .replace(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, '[EMAIL]')
    // 16-digit credit card (must come before shorter digit patterns)
    .replace(/\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b/g, '[CARD]')
    // VN mobile
    .replace(/(\+84|0)(3[2-9]|5[25689]|7[06-9]|8[0-9]|9[0-9])\d{7}/g, '[PHONE-VN]')
    // VN CCCD (12-digit) — exclude if preceded by # . / to avoid order IDs and paths
    .replace(/(?<![\#\.\/\-])\b\d{12}\b(?![\d\#\.\/])/g, '[CCCD]')
    // VN CMND (9-digit) — same exclusion; intentionally broad to err on side of privacy
    .replace(/(?<![\#\.\/\-])\b\d{9}\b(?![\d\#\.\/])/g, '[CMND]')
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
    // JP address — bounded middle segment to prevent O(n²) backtracking on long non-matching strings
    .replace(/\S{0,20}[都道府県]\S{0,30}[市区町村]\S{0,20}/g, '[ADDRESS-JP]');
}

function buildSystemPrompt(userPrompt) {
  if (currentLang === 'en') {
    return `You are an AI assistant helping navigate UI. Look at the screenshot and answer the user's question.

User question: "${userPrompt}"

Return JSON in EXACTLY this format (no text outside JSON):

{
  "explanation": "Brief overall plan in English (1-2 sentences)",
  "steps": [
    "Step 1: describe the action needed",
    "Step 2: describe the next page/action",
    "..."
  ],
  "targets": [
    {
      "description": "Short button/action name (e.g. 'Create instance', 'Search box'). 1-4 words max. NO explanation.",
      "text_content": "Exact text shown on the button/element on screen",
      "position_hint": "Describe position: top-left, center, left menu, right header..."
    }
  ]
}

Rules:
- steps: list all steps from start to end of the task (text only for user to read, no URLs needed)
- targets: ONLY elements VISIBLE IN THIS SCREENSHOT that the user must click RIGHT NOW (step 1 only). Do NOT include buttons from future pages or steps. Use [] if nothing to click on this page.`;
  }
  return `Bạn là AI assistant giúp điều hướng UI. Nhìn vào screenshot màn hình và trả lời câu hỏi của user.

User hỏi: "${userPrompt}"

Trả về JSON theo format SAU ĐÂY (không thêm text ngoài JSON):

{
  "explanation": "Tóm tắt kế hoạch tổng thể bằng tiếng Việt (1-2 câu)",
  "steps": [
    "Bước 1: mô tả hành động cần làm (tiếng Việt)",
    "Bước 2: mô tả trang/hành động tiếp theo",
    "..."
  ],
  "targets": [
    {
      "description": "Tên nút/hành động ngắn gọn (VD: 'Tạo instance', 'Ô tìm kiếm'). Chỉ 1-4 từ. KHÔNG giải thích, KHÔNG nói 'thay thế'",
      "text_content": "Text hiển thị trên nút/element đó (chính xác như trên màn hình)",
      "position_hint": "Mô tả vị trí: top-left, center, menu trái, header phải..."
    }
  ]
}

Quy tắc:
- steps: liệt kê toàn bộ các bước từ đầu đến cuối task (chỉ text để user đọc, không cần URL)
- targets: CHỈ các element ĐANG HIỂN THỊ TRÊN SCREENSHOT NÀY mà user cần click NGAY BÂY (chỉ bước 1). KHÔNG đưa vào button của trang tiếp theo hay các bước sau. Để [] nếu không có gì cần click trên trang này.`;
}

function buildSystemPromptText(userPrompt, domText) {
  if (currentLang === 'en') {
    return `You are an AI assistant helping navigate UI. Here is the DOM text content of the current page:

${domText.substring(0, 6000)}

User question: "${userPrompt}"

Return JSON in EXACTLY this format (no text outside JSON):

{
  "explanation": "Brief overall plan in English (1-2 sentences)",
  "steps": [
    "Step 1: describe the action needed",
    "Step 2: describe the next page/action",
    "..."
  ],
  "targets": [
    {
      "description": "Short button/action name (e.g. 'Create instance', 'Search box'). 1-4 words max. NO explanation.",
      "selector": "Exact CSS selector from the DOM: prefer [aria-label='...'], [data-*='...'], #id. AVOID generic classes like .btn",
      "text_content": "Exact text shown on the button/element",
      "position_hint": "Describe position: top-left, center, left menu, right header..."
    }
  ]
}

Rules:
- steps: list all steps from start to end of the task (text only for user to read, no URLs needed)
- targets: ONLY elements on the CURRENT page that the user must click RIGHT NOW (step 1 only). Do NOT include buttons from future pages or steps. Use [] if nothing to click on this page.`;
  }
  return `Bạn là AI assistant giúp điều hướng UI. Đây là nội dung DOM (text) của trang hiện tại:

${domText.substring(0, 6000)}

User hỏi: "${userPrompt}"

Trả về JSON theo format sau (không thêm text ngoài JSON):

{
  "explanation": "Tóm tắt kế hoạch tổng thể bằng tiếng Việt (1-2 câu)",
  "steps": [
    "Bước 1: mô tả hành động cần làm (tiếng Việt)",
    "Bước 2: mô tả trang/hành động tiếp theo",
    "..."
  ],
  "targets": [
    {
      "description": "Tên nút/hành động ngắn gọn (VD: 'Tạo instance', 'Ô tìm kiếm'). Chỉ 1-4 từ. KHÔNG giải thích, KHÔNG nói 'thay thế'",
      "selector": "CSS selector chính xác dựa vào DOM: ưu tiên [aria-label='...'], [data-*='...'], #id. TRÁNH class chung như .btn",
      "text_content": "Text hiển thị trên nút/element đó (chính xác)",
      "position_hint": "Mô tả vị trí"
    }
  ]
}

Quy tắc:
- steps: liệt kê toàn bộ các bước từ đầu đến cuối task (chỉ text để user đọc, không cần URL)
- targets: CHỈ các element ĐANG HIỂN THỊ TRÊN TRANG NÀY mà user cần click NGAY BÂY (chỉ bước 1). KHÔNG đưa vào button của trang tiếp theo hay các bước sau. Để [] nếu không có gì cần click trên trang này.`;
}

let activeTabId = null;

// --- First-run consent ---
(function initConsent() {
  chrome.storage.local.get('consentGiven', ({ consentGiven }) => {
    if (consentGiven) return;
    const overlay = document.getElementById('consentOverlay');
    if (overlay) overlay.style.display = 'flex';
  });
})();

document.getElementById('consentAgreeBtn')?.addEventListener('click', () => {
  chrome.storage.local.set({ consentGiven: true });
  const overlay = document.getElementById('consentOverlay');
  if (overlay) overlay.style.display = 'none';
});

document.getElementById('consentPrivacyBtn')?.addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('privacy.html') });
});

document.getElementById('privacyLink')?.addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('privacy.html') });
});

document.querySelectorAll('[data-lang]').forEach(btn => {
  btn.addEventListener('click', () => {
    const lang = btn.dataset.lang;
    chrome.storage.local.set({ language: lang });
    applyLanguage(lang);
  });
});


// --- Delete all stored data ---
document.getElementById('deleteAllBtn')?.addEventListener('click', () => {
  chrome.storage.local.clear(() => {
    chrome.storage.local.set({ consentGiven: true, language: currentLang });
    apiKeyInput.value = '';
    promptInput.value = '';
    statusDot.className = 'status-dot';
    showTempFeedback('deleteAllBtn', STRINGS[currentLang].feedbackAllDeleted);
  });
});

function showTempFeedback(btnId, text) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  const orig = btn.textContent;
  btn.textContent = text;
  btn.style.color = '#2ed573';
  setTimeout(() => { btn.textContent = orig; btn.style.color = ''; }, 2000);
}

function applyLanguage(lang) {
  currentLang = lang;
  const S = STRINGS[lang];
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (S[key] !== undefined) el.textContent = S[key];
  });
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.dataset.i18nHtml;
    if (S[key] !== undefined) el.innerHTML = S[key];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    if (S[key] !== undefined) el.placeholder = S[key];
  });
  const qBtn = document.querySelector('.qp');
  if (qBtn) qBtn.dataset.q = S.quickPromptText;
  const miniOpt = modelSelect?.querySelector('option[value="gpt-4o-mini"]');
  if (miniOpt) miniOpt.textContent = S.modelCheaper;
  document.querySelectorAll('[data-lang]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
}

// --- Attachment rendering ---
function renderAttachments(cropItems) {
  const section = document.getElementById('attachmentSection');
  if (!section) return;
  section.innerHTML = '';
  if (cropItems.length === 0) {
    section.style.display = 'none';
    return;
  }
  section.style.display = 'flex';

  cropItems.forEach((dataUrl, i) => {
    const item = document.createElement('div');
    item.className = 'attach-img-item';
    const img = document.createElement('img');
    img.src = dataUrl;
    img.className = 'attach-thumb';
    const del = document.createElement('button');
    del.className = 'attach-del';
    del.textContent = '✕';
    del.title = 'Xóa ảnh';
    del.addEventListener('click', async () => {
      const key = 'cropAttachments_' + activeTabId;
      const s = await chrome.storage.session.get(key);
      const arr = (s[key] || []);
      arr.splice(i, 1);
      await chrome.storage.session.set({ [key]: arr });
      await reloadAndRenderAttachments();
    });
    item.appendChild(img);
    item.appendChild(del);
    section.appendChild(item);
  });
}

async function reloadAndRenderAttachments() {
  if (!activeTabId) return;
  const cropKey = 'cropAttachments_' + activeTabId;
  const stored = await chrome.storage.session.get(cropKey);
  renderAttachments(stored[cropKey] || []);
}

async function stitchImages(dataUrls) {
  const imgs = await Promise.all(dataUrls.map(url => new Promise(res => {
    const i = new Image();
    i.onload = () => res(i);
    i.src = url;
  })));
  const maxW = Math.max(...imgs.map(i => i.naturalWidth));
  const totalH = imgs.reduce((sum, i) => sum + i.naturalHeight, 0);
  const canvas = document.createElement('canvas');
  canvas.width = maxW;
  canvas.height = totalH;
  const ctx = canvas.getContext('2d');
  let y = 0;
  imgs.forEach(i => { ctx.drawImage(i, 0, y); y += i.naturalHeight; });
  return canvas.toDataURL('image/jpeg', 0.85);
}

// Add region button
document.getElementById('addRegionBtn')?.addEventListener('click', async () => {
  console.log('[addRegionBtn] click fired');
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  console.log('[addRegionBtn] tab:', tab?.id, tab?.url);
  if (!tab) return;
  const key = 'cropAttachments_' + tab.id;
  const stored = await chrome.storage.session.get(key);
  const count = (stored[key] || []).length;
  console.log('[addRegionBtn] current crop count:', count);
  if (count >= 5) {
    showResult(STRINGS[currentLang].errMaxRegions, true);
    return;
  }
  console.log('[addRegionBtn] sending START_REGION_SELECT to tab', tab.id);
  chrome.tabs.sendMessage(tab.id, { type: 'START_REGION_SELECT' }, (resp) => {
    if (chrome.runtime.lastError) {
      console.log('[addRegionBtn] content script not ready, injecting...', chrome.runtime.lastError.message);
      chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] }, () => {
        chrome.scripting.insertCSS({ target: { tabId: tab.id }, files: ['overlay.css'] }, () => {
          chrome.tabs.sendMessage(tab.id, { type: 'START_REGION_SELECT' }, () => window.close());
        });
      });
      return;
    }
    console.log('[addRegionBtn] sendMessage ok, resp:', resp);
    window.close();
  });
});

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
  applyLanguage(data.language || 'vi');
});

chrome.tabs.query({ active: true, currentWindow: true }, async ([tab]) => {
  if (!tab) return;
  activeTabId = tab.id;
  const cropKey = 'cropAttachments_' + tab.id;
  const stored = await chrome.storage.session.get(cropKey);
  renderAttachments(stored[cropKey] || []);
});

const screenshotNote = document.getElementById('screenshotNote');
const deepseekNote = document.getElementById('deepseekNote');
function providerUsesDOM(providerKey, model) {
  const p = PROVIDERS[providerKey];
  return typeof p?.usesDOM === 'function' ? p.usesDOM(model) : false;
}

function updateScreenshotNote(providerKey) {
  const usesDOM = providerUsesDOM(providerKey, modelSelect.value);
  screenshotNote.style.display = usesDOM ? 'none' : 'block';
  deepseekNote.style.display = usesDOM ? 'block' : 'none';
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
  modelSelect.innerHTML = '';
  p.models.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = m === 'gpt-4o-mini' ? STRINGS[currentLang].modelCheaper : m;
    modelSelect.appendChild(opt);
  });
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
    showResult(STRINGS[currentLang].errNoKey, true);
    return;
  }
  if (!prompt) {
    showResult(STRINGS[currentLang].errNoPrompt, true);
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

    // Read crop attachments
    const cropKey = 'cropAttachments_' + tab.id;
    const attachStored = await chrome.storage.session.get(cropKey);
    const cropItems = attachStored[cropKey] || [];

    // Determine input: crop images take precedence for vision providers
    if (cropItems.length > 0 && !providerUsesDOM(currentProvider, model)) {
      aiInput = cropItems.length === 1 ? cropItems[0] : await stitchImages(cropItems);
    } else if (providerUsesDOM(currentProvider, model)) {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: extractDOMText
      });
      aiInput = redactPII(results[0]?.result || '');
    } else {
      const screenshot = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'jpeg', quality: 85 });
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

    if (!rawText) throw new Error(STRINGS[currentLang].errAINoResult);

    const parsed = parseAIResponse(rawText);
    const targets = Array.isArray(parsed.targets) ? parsed.targets : [];

    try {
      await chrome.tabs.sendMessage(tab.id, {
        type: 'HIGHLIGHT_STEP',
        step: { targets }
      });
    } catch {
      // content script not ready (fresh page load) — scripting fallback
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: injectHighlights,
        args: [{ targets }]
      });
    }

    let display = parsed.explanation ? `💡 ${parsed.explanation}` : STRINGS[currentLang].highlightDone;
    if (Array.isArray(parsed.steps) && parsed.steps.length > 0) {
      display += '\n\n' + parsed.steps.join('\n');
    }
    showResult(display);

    // Clear attachments after successful scan
    if (cropItems.length > 0) {
      await chrome.storage.session.remove(cropKey);
      try { chrome.action.setBadgeText({ text: '', tabId: tab.id }); } catch {}
      renderAttachments([]);
    }

  } catch (err) {
    console.error(err);
    showResult(STRINGS[currentLang].errPrefix + err.message, true);
  } finally {
    setLoading(false);
  }
});

clearBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  try {
    await chrome.tabs.sendMessage(tab.id, { type: 'CLEAR_HIGHLIGHTS' });
  } catch {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        document.getElementById('ai-guide-overlay')?.remove();
        const s = document.getElementById('ai-guide-style');
        if (s?._reposition) {
          window.removeEventListener('scroll', s._reposition, true);
          window.removeEventListener('resize', s._reposition);
        }
        s?.remove();
      }
    });
  }
  showResult('');
});

function setLoading(loading) {
  scanBtn.disabled = loading;
  statusDot.className = 'status-dot ' + (loading ? 'loading' : 'active');
  if (loading) {
    btnIcon.textContent = '⏳';
    btnText.textContent = STRINGS[currentLang].scanning;
  } else {
    btnIcon.textContent = '📸';
    btnText.textContent = STRINGS[currentLang].btnScan;
  }
}

function showResult(text, isError = false) {
  if (!text) { resultBox.classList.remove('show'); return; }
  resultBox.innerText = text;
  resultBox.className = 'result-box show' + (isError ? ' error' : '');
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
      explanation: looksLikeJson ? STRINGS[currentLang].errTruncated : text,
      targets: []
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
  const existingStyle = document.getElementById('ai-guide-style');
  if (existingStyle?._reposition) {
    window.removeEventListener('scroll', existingStyle._reposition, true);
    window.removeEventListener('resize', existingStyle._reposition);
    existingStyle._reposition = null;
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
      const allClickable = document.querySelectorAll('button, a, input[type="submit"], input[type="button"], [role="button"], [role="link"], [role="menuitem"]');
      let bestExact = null, bestContains = null;
      for (const candidate of allClickable) {
        const text = (candidate.textContent || candidate.getAttribute('aria-label') || '').trim();
        const rect = candidate.getBoundingClientRect();
        if (!rect.width || !rect.height) continue;
        if (text === target.text_content) {
          if (!bestExact || rect.width < bestExact.getBoundingClientRect().width) bestExact = candidate;
        } else if (text.includes(target.text_content)) {
          if (!bestContains || rect.width < bestContains.getBoundingClientRect().width) bestContains = candidate;
        }
      }
      el = bestExact || bestContains;
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
    let rafId = null;
    styleEl._reposition = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
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
      });
    };
    window.addEventListener('scroll', styleEl._reposition, { passive: true, capture: true });
    window.addEventListener('resize', styleEl._reposition, { passive: true });
  }

  return highlighted;
}
