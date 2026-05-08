# AI Screen Guide — Chrome Extension

> Chụp màn hình → AI đọc → khoanh đỏ nút cần bấm

## Cài đặt (Load unpacked)

1. Giải nén folder này ra máy
2. Mở Chrome → vào `chrome://extensions/`
3. Bật **Developer mode** (góc trên phải)
4. Click **Load unpacked** → chọn folder này
5. Extension xuất hiện trên toolbar

## Cách dùng

1. Click icon extension trên toolbar
2. Chọn **AI Provider**: OpenAI / DeepSeek / Claude / Qwen
3. Dán **API key** vào ô (lưu local, không gửi đi đâu ngoài provider đó)
4. Nhập câu hỏi, VD: *"Tôi muốn tạo VM mới trên GCP. Tôi nên bấm vào đâu?"*
5. Click **Scan & Phân tích**
6. Extension chụp screenshot → gửi AI → **vẽ vòng đỏ** lên nút cần bấm

## Hỗ trợ provider

| Provider | Input | Model mặc định | Ghi chú |
|---|---|---|---|
| **OpenAI** | Screenshot | gpt-4o | |
| **Claude** | Screenshot | claude-sonnet-4-6 | |
| **Qwen** | Screenshot | qwen-vl-max | |
| **DeepSeek** | DOM text | deepseek-chat | Đọc DOM thay vì screenshot |

## Flow nhiều bước

Khi AI phát hiện task cần nhiều trang, nó trả về kế hoạch từng bước. Extension sẽ:

- Highlight element cần click trên trang hiện tại
- Tự động phát hiện điều hướng trang và highlight bước tiếp theo
- Hiển thị badge bước ("AI Guide — Bước 2 / 4") trên trang
- Hiện nút Re-scan nếu không tìm được element ở bước hiện tại

## Xử lý sự cố

- **Không chụp được screenshot**: reload tab trước khi scan
- **AI không tìm được element**: thử mô tả rõ hơn, hoặc đổi sang provider khác
- **Bước không tự chuyển**: thử hỏi rõ hơn, VD thêm tên trang web hoặc tên tính năng vào câu hỏi

## Mở rộng

- `popup.js`: thêm provider mới vào object `PROVIDERS`
- `content.js`: `injectHighlightsForStep` — tuỳ chỉnh màu highlight và animation
- `background.js`: logic phát hiện điều hướng và chuyển bước
