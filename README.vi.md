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
2. Chọn **AI Provider**: OpenAI / Claude / Qwen
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

## Task nhiều bước

Khi task cần thực hiện trên nhiều trang, AI trả về kế hoạch từng bước dạng text để bạn đọc trong ô kết quả, đồng thời highlight các element cần click **trên trang hiện tại**. Sang trang tiếp theo, bấm **Scan & Phân tích** lại để nhận highlight cho trang đó.

## Chọn vùng màn hình

Bấm **Thêm vùng màn hình** để kéo chọn các vùng cụ thể trên trang. Tối đa 5 vùng — được ghép thành 1 ảnh gửi lên AI thay cho screenshot toàn trang. Hữu ích khi cần tập trung AI vào một phần cụ thể của UI phức tạp.

## Xử lý sự cố

- **Không chụp được screenshot**: reload tab trước khi scan
- **AI không tìm được element**: thử mô tả rõ hơn, hoặc đổi sang provider khác

## Mở rộng

- `popup.js`: thêm provider mới vào object `PROVIDERS`
- `content.js`: `injectHighlightsForStep` — tuỳ chỉnh màu highlight và animation
