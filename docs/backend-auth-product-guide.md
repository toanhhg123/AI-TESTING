# Backend Auth và Product Manager Guide

Tài liệu này hướng dẫn chạy và kiểm thử các chức năng backend đã triển khai:

- Auth API dùng JWT.
- Middleware xác thực và phân quyền admin.
- Product API public cho khách hàng.
- Product Manager API cho admin.
- Seed user và sản phẩm test.

## 1. Chuẩn bị môi trường

Chạy MongoDB bằng Docker:

```bash
docker compose up -d
```

Nếu máy đang có MongoDB khác chiếm port `27017`, chạy MongoDB của project trên port khác:

```bash
MONGODB_PORT=27018 docker compose up -d mongodb
```

Khi đó cập nhật `MONGODB_URI` trong `.env`:

```text
MONGODB_URI=mongodb://admin:password@localhost:27018/mobile_commerce?authSource=admin
```

Cài dependency backend:

```bash
npm install
```

Tạo file `.env`:

```bash
cp .env.example .env
```

Biến môi trường quan trọng:

```text
PORT=3000
MONGODB_URI=mongodb://admin:password@localhost:27017/mobile_commerce?authSource=admin
MONGODB_PORT=27017
JWT_SECRET=change_this_secret_for_local_development
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

## 2. Seed dữ liệu test

Seed user demo:

```bash
npm run seed:users
```

Seed sản phẩm demo:

```bash
npm run seed:products
```

Seed toàn bộ dữ liệu test:

```bash
npm run seed:test
```

Tài khoản demo:

```text
Customer: customer@example.com / 123456
Admin:    admin@example.com / 123456
```

## 3. Chạy API

```bash
npm run dev
```

Hoặc:

```bash
npm start
```

Health check:

```bash
curl http://localhost:3000/api/health
```

## 4. Auth API

### Register

```http
POST /api/auth/register
```

Body:

```json
{
  "fullName": "Nguyen Van A",
  "email": "nguyenvana@example.com",
  "password": "123456"
}
```

Curl:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Nguyen Van A","email":"nguyenvana@example.com","password":"123456"}'
```

### Login

```http
POST /api/auth/login
```

Body:

```json
{
  "email": "admin@example.com",
  "password": "123456"
}
```

Curl:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"123456"}'
```

Response thành công:

```json
{
  "accessToken": "jwt_token",
  "user": {
    "id": "user_id",
    "fullName": "Demo Admin",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

### Get current user

```http
GET /api/auth/me
```

Curl:

```bash
TOKEN="paste_access_token_here"

curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

## 5. Middleware phân quyền

Backend hiện có:

```js
authenticate
authorize('admin')
```

Ý nghĩa:

- `authenticate`: kiểm tra JWT, tìm user, gắn user vào `req.user`.
- `authorize('admin')`: chỉ cho phép user có role `admin` truy cập.

Các API `/api/admin/*` đang được bảo vệ bằng:

```js
router.use(authenticate);
router.use(authorize('admin'));
```

## 6. Product API public

### Lấy danh sách sản phẩm

```http
GET /api/products
```

Query hỗ trợ:

```text
keyword
brand
category
minPrice
maxPrice
sort
page
limit
```

Ví dụ:

```bash
curl "http://localhost:3000/api/products?keyword=iphone&brand=Apple&page=1&limit=12"
```

Các giá trị `sort`:

```text
newest
price_asc
price_desc
name_asc
best_selling
featured
```

### Chi tiết sản phẩm

```http
GET /api/products/:id
```

Curl:

```bash
curl http://localhost:3000/api/products/PRODUCT_ID
```

### Search sản phẩm

```http
GET /api/products/search?keyword=iphone
```

Curl:

```bash
curl "http://localhost:3000/api/products/search?keyword=iphone"
```

### Recommendation đơn giản

```http
GET /api/products/recommendations
```

Theo brand/category:

```bash
curl "http://localhost:3000/api/products/recommendations?brand=Apple&limit=4"
```

Theo sản phẩm nguồn:

```bash
curl "http://localhost:3000/api/products/recommendations?productId=PRODUCT_ID&limit=4"
```

## 7. Product Manager API cho admin

Các API dưới đây yêu cầu token admin:

```bash
ADMIN_TOKEN="paste_admin_access_token_here"
```

### Danh sách sản phẩm cho admin

```http
GET /api/admin/products
```

Curl:

```bash
curl "http://localhost:3000/api/admin/products?page=1&limit=20" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

Admin có thể lọc cả sản phẩm `inactive` hoặc `deleted`:

```bash
curl "http://localhost:3000/api/admin/products?status=deleted" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Tạo sản phẩm

```http
POST /api/admin/products
```

Body:

```json
{
  "name": "OPPO Reno 12",
  "sku": "OP-RENO12-256",
  "brand": "OPPO",
  "category": "Điện thoại",
  "price": 9990000,
  "salePrice": 8990000,
  "stock": 30,
  "images": ["data:image/png;base64,iVBORw0KGgo..."],
  "description": "Điện thoại OPPO Reno 12 phục vụ dữ liệu demo.",
  "specifications": {
    "ram": "12GB",
    "storage": "256GB",
    "screen": "AMOLED"
  },
  "tags": ["oppo", "android", "camera"],
  "isFeatured": true,
  "status": "active"
}
```

Curl:

```bash
curl -X POST http://localhost:3000/api/admin/products \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"OPPO Reno 12","sku":"OP-RENO12-256","brand":"OPPO","category":"Điện thoại","price":9990000,"salePrice":8990000,"stock":30,"images":["data:image/png;base64,iVBORw0KGgo..."],"description":"Điện thoại OPPO Reno 12 phục vụ dữ liệu demo.","specifications":{"ram":"12GB","storage":"256GB"},"tags":["oppo","android"],"isFeatured":true,"status":"active"}'
```

Frontend admin đọc file ảnh bằng `FileReader.readAsDataURL()` rồi gửi chuỗi base64 trong `images[0]`. Backend đã tăng giới hạn JSON body lên `10mb`, nhưng nên giữ ảnh demo dưới `2MB` để database nhẹ và API phản hồi nhanh.

### Xem chi tiết sản phẩm trong admin

```http
GET /api/admin/products/:id
```

Curl:

```bash
curl http://localhost:3000/api/admin/products/PRODUCT_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Cập nhật sản phẩm

```http
PATCH /api/admin/products/:id
```

Curl:

```bash
curl -X PATCH http://localhost:3000/api/admin/products/PRODUCT_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"price":9490000,"stock":25,"isFeatured":false}'
```

### Xóa sản phẩm

```http
DELETE /api/admin/products/:id
```

API này xóa mềm bằng cách chuyển `status` sang `deleted`.

Curl:

```bash
curl -X DELETE http://localhost:3000/api/admin/products/PRODUCT_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## 8. Kiểm thử nhanh end-to-end

Chạy seed:

```bash
npm run seed:test
```

Chạy API:

```bash
npm start
```

Login admin và lấy token:

```bash
ADMIN_TOKEN=$(curl -sS -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"123456"}' \
  | node -pe 'JSON.parse(require("fs").readFileSync(0, "utf8")).accessToken')
```

Gọi danh sách sản phẩm:

```bash
curl "http://localhost:3000/api/products?limit=5"
```

Gọi admin products:

```bash
curl "http://localhost:3000/api/admin/products?limit=5" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## 9. Ghi chú triển khai

- Product delete hiện là soft delete, không xóa document khỏi MongoDB.
- Public Product API chỉ trả sản phẩm `status=active`.
- Admin Product API có thể xem cả `active`, `inactive`, `deleted`.
- Recommendation hiện là rule-based theo sản phẩm nguồn, brand, category, giá gần nhau, `isFeatured` và `soldCount`.
- Dashboard, Cart, Order mới ở mức định hướng trong document, chưa triển khai đầy đủ trong code ở bước này.
