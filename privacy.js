const PRIVACY_CONTENT = {
  vi: `
    <div class="meta">AI Screen Guide Extension &nbsp;·&nbsp; Cập nhật lần cuối: 2026-05-09 &nbsp;·&nbsp; v1.0.0</div>

    <div class="highlight">
      <p>Extension này <strong>không có server riêng</strong>. Mọi dữ liệu chỉ đi thẳng từ trình duyệt của bạn đến AI provider bạn chọn, và không được lưu trữ bởi chúng tôi.</p>
    </div>

    <h2>1. Dữ liệu nào được thu thập</h2>
    <ul>
      <li><strong>Screenshot trang web hiện tại</strong> — chụp màn hình vùng hiển thị khi bạn nhấn "Scan" (không chọn vùng).</li>
      <li><strong>Vùng màn hình do bạn chọn</strong> — nếu bạn dùng tính năng "Thêm vùng màn hình", chỉ các vùng bạn kéo chọn mới được crop và gửi lên AI (thay thế cho screenshot toàn trang). Tối đa 5 vùng, được ghép dọc thành 1 ảnh trước khi gửi.</li>
      <li><strong>Câu hỏi bạn nhập</strong> — nội dung trong ô "Câu hỏi" được gửi kèm lên AI provider.</li>
      <li><strong>API Key</strong> — được lưu trong bộ nhớ bảo mật của trình duyệt trên máy của bạn. Không bao giờ được gửi đến server nào ngoài AI provider tương ứng.</li>
    </ul>

    <h2>2. Dữ liệu được gửi đến đâu</h2>
    <p>Tuỳ provider bạn chọn, dữ liệu được gửi đến một trong các địa chỉ sau:</p>
    <div class="provider-list">
      <div class="provider"><strong>OpenAI</strong> <span>api.openai.com</span><br><a href="https://openai.com/policies/privacy-policy" target="_blank">Chính sách quyền riêng tư của OpenAI</a></div>
      <div class="provider"><strong>DeepSeek</strong> <span>api.deepseek.com</span><br><a href="https://cdn.deepseek.com/policies/en-US/deepseek-privacy-policy.html" target="_blank">Chính sách quyền riêng tư của DeepSeek</a></div>
      <div class="provider"><strong>Alibaba Qwen</strong> <span>dashscope-intl.aliyuncs.com</span><br><a href="https://chat.qwen.ai/legal-agreement/privacy-policy" target="_blank">Chính sách quyền riêng tư của Qwen</a></div>
      <div class="provider"><strong>Anthropic Claude</strong> <span>api.anthropic.com</span><br><a href="https://www.anthropic.com/legal/privacy" target="_blank">Chính sách quyền riêng tư của Anthropic</a></div>
    </div>
    <p>Extension chỉ kết nối đến đúng địa chỉ của provider bạn đang chọn, không gửi dữ liệu đi nơi nào khác.</p>

    <h2>3. Dữ liệu được lưu ở đâu</h2>
    <ul>
      <li>API key được lưu trong bộ nhớ bảo mật của trình duyệt trên máy của bạn — không đồng bộ lên cloud, chỉ tồn tại trên thiết bị này.</li>
      <li>Câu hỏi gần nhất được lưu lại trong bộ nhớ bảo mật của trình duyệt trên máy của bạn để tiện nhập lại.</li>
      <li>Screenshot và vùng ảnh đã chọn <strong>không được lưu lại</strong> sau khi gửi đi — chúng chỉ tồn tại tạm thời trong bộ nhớ của trình duyệt và bị xóa ngay khi đóng tab hoặc sau khi Scan.</li>
      <li>Extension <strong>không có database, không có server, không theo dõi lịch sử sử dụng</strong>.</li>
    </ul>

    <h2>4. Quyền của bạn</h2>
    <ul>
      <li><strong>Xóa API key</strong>: Nhấn "Xóa tất cả dữ liệu" trong popup để xóa toàn bộ.</li>
      <li><strong>Xóa câu hỏi đã lưu</strong>: Được xóa cùng khi nhấn "Xóa tất cả dữ liệu".</li>
      <li><strong>Gỡ extension</strong>: Toàn bộ dữ liệu local (API key, cài đặt) sẽ bị xóa hoàn toàn.</li>
    </ul>

    <h2>5. Dữ liệu nhạy cảm</h2>
    <p>Nếu trang web bạn đang xem có chứa thông tin nhạy cảm (mật khẩu hiển thị, số thẻ ngân hàng, thông tin cá nhân), hãy đảm bảo thông tin đó không nằm trong vùng màn hình bạn chọn — hoặc không hiển thị trên màn hình nếu dùng chế độ Scan toàn trang.</p>

    <h2>6. Liên hệ</h2>
    <p>Nếu bạn có câu hỏi về quyền riêng tư, vui lòng liên hệ: <a href="mailto:bachbachkhoa1911@gmail.com">bachbachkhoa1911@gmail.com</a></p>
  `,
  en: `
    <div class="meta">AI Screen Guide Extension &nbsp;·&nbsp; Last updated: 2026-05-09 &nbsp;·&nbsp; v1.0.0</div>

    <div class="highlight">
      <p>This extension has <strong>no server</strong>. All data goes directly from your browser to the AI provider you choose, and is not stored by us.</p>
    </div>

    <h2>1. What data is collected</h2>
    <ul>
      <li><strong>Current page screenshot</strong> — captures the visible area when you click "Scan" (without region selection).</li>
      <li><strong>Screen regions you select</strong> — if you use the "Add screen region" feature, only the regions you drag-select are cropped and sent to the AI (replacing a full-page screenshot). Up to 5 regions, stitched vertically into one image before sending.</li>
      <li><strong>Your question</strong> — the content of the "Question" field is sent to the AI provider.</li>
      <li><strong>API Key</strong> — stored in your browser's secure local storage on your device. Never sent to any server other than the corresponding AI provider.</li>
    </ul>

    <h2>2. Where data is sent</h2>
    <p>Depending on the provider you choose, data is sent to one of these addresses:</p>
    <div class="provider-list">
      <div class="provider"><strong>OpenAI</strong> <span>api.openai.com</span><br><a href="https://openai.com/policies/privacy-policy" target="_blank">OpenAI Privacy Policy</a></div>
      <div class="provider"><strong>DeepSeek</strong> <span>api.deepseek.com</span><br><a href="https://cdn.deepseek.com/policies/en-US/deepseek-privacy-policy.html" target="_blank">DeepSeek Privacy Policy</a></div>
      <div class="provider"><strong>Alibaba Qwen</strong> <span>dashscope-intl.aliyuncs.com</span><br><a href="https://chat.qwen.ai/legal-agreement/privacy-policy" target="_blank">Qwen Privacy Policy</a></div>
      <div class="provider"><strong>Anthropic Claude</strong> <span>api.anthropic.com</span><br><a href="https://www.anthropic.com/legal/privacy" target="_blank">Anthropic Privacy Policy</a></div>
    </div>
    <p>The extension only connects to the address of the provider you are currently using, and does not send data anywhere else.</p>

    <h2>3. Where data is stored</h2>
    <ul>
      <li>API key is stored in your browser's secure local storage on your device — not synced to the cloud, exists only on this machine.</li>
      <li>Your most recent question is saved in your browser's secure local storage on your device for convenience.</li>
      <li>Screenshots and selected regions are <strong>not stored</strong> after being sent — they only exist temporarily in your browser's memory and are cleared as soon as the tab is closed or after Scan.</li>
      <li>The extension has <strong>no database, no server, and does not track usage history</strong>.</li>
    </ul>

    <h2>4. Your rights</h2>
    <ul>
      <li><strong>Delete API key</strong>: Click "Delete all data" in the popup to remove everything.</li>
      <li><strong>Delete saved question</strong>: Removed when you click "Delete all data".</li>
      <li><strong>Uninstall extension</strong>: All local data (API key, settings) will be completely removed.</li>
    </ul>

    <h2>5. Sensitive data</h2>
    <p>If the website you are viewing contains sensitive information (visible passwords, bank card numbers, personal data), make sure that information is not in the screen region you selected — or not visible on screen if you are using full-page Scan mode.</p>

    <h2>6. Contact</h2>
    <p>If you have questions about privacy, please contact: <a href="mailto:bachbachkhoa1911@gmail.com">bachbachkhoa1911@gmail.com</a></p>
  `
};

let privacyLang = 'vi';

const TITLES = { vi: 'Chính sách quyền riêng tư', en: 'Privacy Policy' };

function applyPrivacyLanguage(lang) {
  privacyLang = lang;
  document.getElementById('privacyTitle').textContent = TITLES[lang];
  document.getElementById('privacyContent').innerHTML = PRIVACY_CONTENT[lang];
  document.querySelectorAll('.lang-btn[data-lang]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
  document.documentElement.lang = lang;
  document.title = lang === 'vi'
    ? 'Chính sách quyền riêng tư — AI Screen Guide'
    : 'Privacy Policy — AI Screen Guide';
}

document.querySelectorAll('.lang-btn[data-lang]').forEach(btn => {
  btn.addEventListener('click', () => {
    const newLang = btn.dataset.lang;
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ language: newLang });
    }
    applyPrivacyLanguage(newLang);
  });
});

// Render Vietnamese immediately
applyPrivacyLanguage('vi');

// Override with stored language if available
if (typeof chrome !== 'undefined' && chrome.storage) {
  chrome.storage.local.get('language', ({ language }) => {
    if (language === 'en') applyPrivacyLanguage('en');
  });
}
