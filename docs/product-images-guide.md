# Hướng dẫn dùng ảnh sản phẩm (kiểu Apple)

Giao diện được thiết kế cho **ảnh render nền trong suốt (PNG)** — giống ảnh sản phẩm trên apple.com.
Ảnh có nền/bối cảnh (ảnh chụp lifestyle) sẽ trông không hợp với card sạch.

## Cách 1 — Bỏ ảnh vào thư mục cục bộ (khuyến nghị, ổn định nhất)

1. Lưu ảnh sản phẩm (ưu tiên **PNG nền trong suốt**) vào:
   ```
   client/public/products/
   ```
   Ví dụ: `client/public/products/iphone15.png`

2. Trỏ đường dẫn ảnh trong `scripts/seedProducts.js` (mảng `images`):
   ```js
   images: ['/products/iphone15.png'],
   ```
   Lưu ý: đường dẫn bắt đầu bằng `/products/...` (KHÔNG có `client/public`).

3. Nạp lại dữ liệu:
   ```bash
   npm run seed:products
   ```

## Cách 2 — Upload qua trang Admin (không cần sửa code)

1. Vào `/admin` → **Sản phẩm** → Thêm/Sửa sản phẩm.
2. Upload ảnh ở ô ảnh (ảnh được lưu base64 vào database).

## Lấy ảnh từ Apple

Trên trang sản phẩm của apple.com: chuột phải vào ảnh → **Save Image As…** (hoặc **Copy Image**),
rồi bỏ file vào `client/public/products/` theo Cách 1.

> ⚠️ **Bản quyền:** Ảnh chính thức của Apple có bản quyền. Dùng cho **đồ án học thuật / demo nội bộ**
> là chấp nhận được, nhưng KHÔNG dùng cho website thương mại công khai. Khi triển khai thật,
> hãy thay bằng ảnh bạn có quyền sử dụng.

## Ảnh mặc định

Trong `client/public/products/` có sẵn các render tối giản (SVG) dùng làm ảnh mặc định/khi thiếu ảnh:
`phone.svg`, `tablet.svg`, `audio.svg`, `accessory.svg`, `placeholder.svg`.
Nếu một đường dẫn ảnh bị lỗi/không tồn tại, frontend tự động hiển thị `placeholder.svg`.
