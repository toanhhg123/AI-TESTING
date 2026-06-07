# Mobile Commerce API

Source base cho đồ án tốt nghiệp: website bán thiết bị di động dùng Node.js, Express, React và MongoDB.

## Yêu cầu

- Node.js 18+
- Docker và Docker Compose

## Chạy MongoDB

```bash
docker compose up -d
```

MongoDB chạy tại:

```text
mongodb://admin:password@localhost:27017/mobile_commerce?authSource=admin
```

Mongo Express chạy tại:

```text
http://localhost:8081
```

Tài khoản Mongo Express:

```text
admin / password
```

## Chạy API

```bash
cp .env.example .env
npm install
npm run dev
```

API mặc định chạy tại:

```text
http://localhost:3000
```

Health check:

```text
GET /api/health
```

## Tài khoản demo

Seed tài khoản mẫu:

```bash
npm run seed:users
```

Tài khoản khách hàng:

```text
customer@example.com / 123456
```

Tài khoản admin:

```text
admin@example.com / 123456
```

API đăng nhập:

```text
POST /api/auth/login
```

Tài liệu backend Auth và Product Manager:

```text
docs/backend-auth-product-guide.md
```

## Phân tích backend ưu tiên

Phần backend nên được triển khai theo thứ tự ưu tiên để hệ thống có luồng demo hoàn chỉnh sớm. Hai nhóm chức năng cần làm đầu tiên là xác thực/phân quyền và quản lý sản phẩm.

Các sơ đồ trong tài liệu dùng cú pháp PlantUML. Có thể render bằng PlantUML extension trong VS Code, IntelliJ hoặc công cụ PlantUML server.

Các block PlantUML có sử dụng `!pragma layout smetana` để ưu tiên layout engine nội bộ của PlantUML và hạn chế phụ thuộc vào Graphviz.

Nếu plugin vẫn báo lỗi `Cannot find Graphviz`, cài Graphviz:

```bash
brew install graphviz
```

Hoặc cấu hình lại đường dẫn `dot` trong IDE về:

```text
/opt/homebrew/bin/dot
```

Kiểm tra Graphviz:

```bash
dot -V
```

### Sơ đồ tổng quan chức năng

```plantuml
@startuml
!pragma layout smetana
left to right direction
skinparam packageStyle rectangle

actor "Khách hàng" as Customer
actor "Quản trị viên" as Admin

rectangle "Website bán thiết bị di động" {
  usecase "Đăng ký tài khoản" as UC_Register
  usecase "Đăng nhập" as UC_Login
  usecase "Xem danh sách sản phẩm" as UC_ViewProducts
  usecase "Tìm kiếm/lọc sản phẩm" as UC_SearchProducts
  usecase "Xem chi tiết sản phẩm" as UC_ViewProductDetail
  usecase "Quản lý giỏ hàng" as UC_ManageCart
  usecase "Đặt hàng" as UC_Checkout
  usecase "Xem lịch sử đơn hàng" as UC_ViewOrders
  usecase "Nhận gợi ý sản phẩm" as UC_Recommendation

  usecase "Quản lý sản phẩm" as UC_ManageProducts
  usecase "Quản lý đơn hàng" as UC_ManageOrders
  usecase "Quản lý người dùng" as UC_ManageUsers
  usecase "Xem dashboard thống kê" as UC_Dashboard
  usecase "Quản lý tồn kho" as UC_Inventory
}

Customer --> UC_Register
Customer --> UC_Login
Customer --> UC_ViewProducts
Customer --> UC_SearchProducts
Customer --> UC_ViewProductDetail
Customer --> UC_ManageCart
Customer --> UC_Checkout
Customer --> UC_ViewOrders
Customer --> UC_Recommendation

Admin --> UC_Login
Admin --> UC_ManageProducts
Admin --> UC_ManageOrders
Admin --> UC_ManageUsers
Admin --> UC_Dashboard
Admin --> UC_Inventory
@enduml
```

### 1. Auth và phân quyền

Auth là nền tảng bảo mật của hệ thống. Các chức năng như giỏ hàng, đặt hàng, lịch sử đơn hàng và trang quản trị đều cần xác định người dùng hiện tại là ai và người đó có quyền gì.

Mục tiêu của nhóm chức năng này:

- Cho phép khách hàng đăng ký tài khoản.
- Cho phép khách hàng và admin đăng nhập.
- Cấp JWT sau khi đăng nhập thành công.
- Xác thực request bằng JWT.
- Phân quyền giữa `customer` và `admin`.
- Cho phép frontend lấy thông tin người dùng hiện tại.

Các vai trò người dùng:

| Vai trò | Mô tả |
| --- | --- |
| `customer` | Khách hàng mua sản phẩm, quản lý giỏ hàng, đặt hàng và xem lịch sử đơn hàng. |
| `admin` | Quản trị viên quản lý sản phẩm, đơn hàng, tồn kho, người dùng và dashboard. |

Các API cần có:

| Method | Endpoint | Quyền | Mục đích |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Public | Đăng ký tài khoản khách hàng. |
| `POST` | `/api/auth/login` | Public | Đăng nhập và nhận JWT. |
| `POST` | `/api/auth/logout` | User | Đăng xuất ở phía client bằng cách xóa token. |
| `GET` | `/api/auth/me` | User | Lấy thông tin người dùng từ JWT. |

Luồng đăng nhập:

1. Người dùng nhập email và mật khẩu.
2. Backend tìm user theo email.
3. Backend so sánh mật khẩu bằng `bcryptjs`.
4. Nếu hợp lệ, backend tạo JWT bằng `jsonwebtoken`.
5. Frontend lưu token vào `localStorage`.
6. Các request sau gửi token qua header `Authorization: Bearer <token>`.

Sơ đồ sequence cho luồng đăng nhập:

```plantuml
@startuml
!pragma layout smetana
actor "Người dùng" as User
participant "React Client" as Client
participant "Auth API" as AuthAPI
database "MongoDB" as DB

User -> Client : Nhập email và mật khẩu
Client -> AuthAPI : POST /api/auth/login
AuthAPI -> DB : Tìm user theo email
DB --> AuthAPI : Trả về user hoặc null

alt Không tìm thấy user
  AuthAPI --> Client : 401 Email hoặc mật khẩu không đúng
  Client --> User : Hiển thị lỗi đăng nhập
else Tìm thấy user
  AuthAPI -> AuthAPI : bcrypt.compare(password, hashedPassword)

  alt Mật khẩu không đúng
    AuthAPI --> Client : 401 Email hoặc mật khẩu không đúng
    Client --> User : Hiển thị lỗi đăng nhập
  else Mật khẩu đúng
    AuthAPI -> AuthAPI : Tạo JWT accessToken
    AuthAPI --> Client : Trả accessToken và user
    Client -> Client : Lưu token vào localStorage
    Client --> User : Chuyển về trang chủ
  end
end
@enduml
```

Payload JWT nên chứa:

```json
{
  "sub": "user_id",
  "role": "customer"
}
```

Model `User` tối thiểu:

```text
fullName: String
email: String, unique
password: String, hashed
role: customer | admin
createdAt
updatedAt
```

Middleware cần có:

| Middleware | Mục đích |
| --- | --- |
| `authenticate` | Kiểm tra JWT, tìm user, gắn user vào `req.user`. |
| `authorize('admin')` | Chỉ cho phép admin truy cập API quản trị. |

Các lỗi cần xử lý:

- Thiếu email hoặc mật khẩu.
- Email không tồn tại.
- Mật khẩu không đúng.
- Token thiếu, sai hoặc hết hạn.
- User không có quyền truy cập.

### 2. Product API

Product API là phần trung tâm của website bán thiết bị di động. Frontend cần dữ liệu sản phẩm để hiển thị trang chủ, danh sách sản phẩm, chi tiết sản phẩm, bộ lọc và tìm kiếm.

Mục tiêu của nhóm chức năng này:

- Hiển thị danh sách sản phẩm cho khách hàng.
- Hiển thị chi tiết sản phẩm.
- Hỗ trợ tìm kiếm và lọc sản phẩm.
- Cho phép admin thêm, sửa, xóa sản phẩm.
- Quản lý tồn kho cơ bản.

Model `Product` tối thiểu:

```text
name: String
brand: String
category: String
price: Number
stock: Number
images: String[]
description: String
specifications: Object
createdAt
updatedAt
```

Sơ đồ class cho các entity chính:

```plantuml
@startuml
!pragma layout smetana
skinparam classAttributeIconSize 0

class User {
  +String id
  +String fullName
  +String email
  +String password
  +String role
  +Date createdAt
  +Date updatedAt
}

class Product {
  +String id
  +String name
  +String brand
  +String category
  +Number price
  +Number stock
  +String[] images
  +Object specifications
  +String description
  +Date createdAt
  +Date updatedAt
}

class Cart {
  +String id
  +String customerId
  +CartItem[] items
  +Date createdAt
  +Date updatedAt
}

class CartItem {
  +String productId
  +Number quantity
  +Number priceSnapshot
}

class Order {
  +String id
  +String customerId
  +OrderItem[] items
  +String status
  +Number totalAmount
  +String paymentMethod
  +String shippingAddress
  +Date createdAt
  +Date updatedAt
}

class OrderItem {
  +String productId
  +String productName
  +Number quantity
  +Number price
}

class Payment {
  +String id
  +String orderId
  +String method
  +String status
  +Number amount
  +Date paidAt
}

User "1" --> "0..1" Cart : owns
User "1" --> "0..*" Order : places
Cart "1" *-- "1..*" CartItem : contains
Order "1" *-- "1..*" OrderItem : contains
CartItem "*" --> "1" Product : references
OrderItem "*" --> "1" Product : references
Order "1" --> "0..1" Payment : has
@enduml
```

Các API public cho khách hàng:

| Method | Endpoint | Quyền | Mục đích |
| --- | --- | --- | --- |
| `GET` | `/api/products` | Public | Lấy danh sách sản phẩm, có lọc và phân trang. |
| `GET` | `/api/products/:id` | Public | Lấy chi tiết một sản phẩm. |
| `GET` | `/api/products/search` | Public | Tìm kiếm sản phẩm theo từ khóa. |
| `GET` | `/api/products/recommendations` | Public/User | Gợi ý sản phẩm mức đơn giản. |

Các API quản trị:

| Method | Endpoint | Quyền | Mục đích |
| --- | --- | --- | --- |
| `GET` | `/api/admin/products` | Admin | Lấy danh sách sản phẩm cho admin. |
| `POST` | `/api/admin/products` | Admin | Thêm sản phẩm mới. |
| `PATCH` | `/api/admin/products/:id` | Admin | Cập nhật sản phẩm. |
| `DELETE` | `/api/admin/products/:id` | Admin | Xóa hoặc ẩn sản phẩm. |

Các query nên hỗ trợ ở `GET /api/products`:

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

```text
GET /api/products?keyword=iphone&brand=Apple&minPrice=10000000&maxPrice=25000000&page=1&limit=12
```

Logic lọc sản phẩm nên có:

- `keyword`: tìm theo tên, thương hiệu hoặc mô tả.
- `brand`: lọc theo hãng như Apple, Samsung, Xiaomi.
- `category`: lọc điện thoại, máy tính bảng, phụ kiện.
- `minPrice`, `maxPrice`: lọc theo khoảng giá.
- `sort`: sắp xếp theo giá tăng/giảm hoặc mới nhất.
- `page`, `limit`: phân trang.

Validation khi admin tạo/cập nhật sản phẩm:

- `name` không được rỗng.
- `price` phải lớn hơn hoặc bằng 0.
- `stock` phải lớn hơn hoặc bằng 0.
- `brand` và `category` nên có giá trị rõ ràng.
- `images` có thể là mảng URL ảnh.

Thứ tự triển khai Product API:

1. Seed dữ liệu sản phẩm mẫu.
2. Làm `GET /api/products`.
3. Làm `GET /api/products/:id`.
4. Thêm tìm kiếm/lọc/phân trang.
5. Làm API admin thêm/sửa/xóa sản phẩm.
6. Kết nối frontend thay mock data bằng API thật.

Sơ đồ database dự kiến:

```plantuml
@startuml
!pragma layout smetana
hide circle
skinparam linetype ortho

entity "USERS" as USERS {
  * _id : ObjectId <<PK>>
  --
  fullName : String
  email : String <<unique>>
  password : String
  role : String
  createdAt : Date
  updatedAt : Date
}

entity "PRODUCTS" as PRODUCTS {
  * _id : ObjectId <<PK>>
  --
  name : String
  brand : String
  category : String
  price : Number
  stock : Number
  images : String[]
  specifications : Object
  description : String
  createdAt : Date
  updatedAt : Date
}

entity "CARTS" as CARTS {
  * _id : ObjectId <<PK>>
  --
  customer : ObjectId <<FK>>
  createdAt : Date
  updatedAt : Date
}

entity "CART_ITEMS" as CART_ITEMS {
  * cart : ObjectId <<FK>>
  * product : ObjectId <<FK>>
  --
  quantity : Number
  priceSnapshot : Number
}

entity "ORDERS" as ORDERS {
  * _id : ObjectId <<PK>>
  --
  customer : ObjectId <<FK>>
  status : String
  totalAmount : Number
  paymentMethod : String
  shippingAddress : String
  createdAt : Date
  updatedAt : Date
}

entity "ORDER_ITEMS" as ORDER_ITEMS {
  * order : ObjectId <<FK>>
  * product : ObjectId <<FK>>
  --
  productName : String
  quantity : Number
  price : Number
}

entity "PAYMENTS" as PAYMENTS {
  * _id : ObjectId <<PK>>
  --
  order : ObjectId <<FK>>
  method : String
  status : String
  amount : Number
  paidAt : Date
}

USERS ||--o| CARTS : owns
USERS ||--o{ ORDERS : places
CARTS ||--o{ CART_ITEMS : contains
PRODUCTS ||--o{ CART_ITEMS : appears_in
ORDERS ||--o{ ORDER_ITEMS : contains
PRODUCTS ||--o{ ORDER_ITEMS : appears_in
ORDERS ||--o| PAYMENTS : has
@enduml
```

Sơ đồ ERD tổng thể cho toàn bộ dự án:

Ghi chú:

- `PRODUCT_SEED_BATCHES` và `PRODUCT_SEED_ITEMS` là tùy chọn. Nếu seed dữ liệu chỉ là script chạy một lần thì không bắt buộc lưu 2 collection này.
- `DASHBOARD_SNAPSHOTS` là tùy chọn. Nếu dashboard tính trực tiếp từ `ORDERS`, `PRODUCTS`, `USERS` theo thời gian thực thì không cần lưu snapshot.
- `SEARCH_LOGS`, `PRODUCT_VIEW_EVENTS`, `USER_PRODUCT_EVENTS`, `RECOMMENDATION_RESULTS` phục vụ tìm kiếm nâng cao và gợi ý sản phẩm.

```plantuml
@startuml
!pragma layout smetana
hide circle
skinparam linetype ortho

entity "ROLES" as Roles {
  * _id : ObjectId <<PK>>
  --
  name : String
  description : String
}

entity "USERS" as Users {
  * _id : ObjectId <<PK>>
  --
  role : ObjectId <<FK>>
  fullName : String
  email : String <<unique>>
  password : String
  status : String
  createdAt : Date
  updatedAt : Date
}

entity "ADDRESSES" as Addresses {
  * _id : ObjectId <<PK>>
  --
  user : ObjectId <<FK>>
  receiverName : String
  phone : String
  province : String
  district : String
  ward : String
  detail : String
  isDefault : Boolean
}

entity "BRANDS" as Brands {
  * _id : ObjectId <<PK>>
  --
  name : String
  slug : String
  logoUrl : String
}

entity "CATEGORIES" as Categories {
  * _id : ObjectId <<PK>>
  --
  parent : ObjectId <<FK>>
  name : String
  slug : String
}

entity "PRODUCTS" as Products {
  * _id : ObjectId <<PK>>
  --
  brand : ObjectId <<FK>>
  category : ObjectId <<FK>>
  name : String
  slug : String
  price : Number
  salePrice : Number
  stock : Number
  description : String
  status : String
  createdBy : ObjectId <<FK>>
  updatedBy : ObjectId <<FK>>
  createdAt : Date
  updatedAt : Date
}

entity "PRODUCT_IMAGES" as ProductImages {
  * _id : ObjectId <<PK>>
  --
  product : ObjectId <<FK>>
  imageUrl : String
  altText : String
  sortOrder : Number
}

entity "PRODUCT_SPECIFICATIONS" as ProductSpecifications {
  * _id : ObjectId <<PK>>
  --
  product : ObjectId <<FK>>
  specKey : String
  specValue : String
  groupName : String
}

entity "INVENTORY_TRANSACTIONS" as InventoryTransactions {
  * _id : ObjectId <<PK>>
  --
  product : ObjectId <<FK>>
  admin : ObjectId <<FK>>
  type : String
  quantity : Number
  note : String
  createdAt : Date
}

entity "PRODUCT_SEED_BATCHES" as ProductSeedBatches {
  * _id : ObjectId <<PK>>
  --
  name : String
  source : String
  createdBy : ObjectId <<FK>>
  createdAt : Date
}

entity "PRODUCT_SEED_ITEMS" as ProductSeedItems {
  * _id : ObjectId <<PK>>
  --
  seedBatch : ObjectId <<FK>>
  product : ObjectId <<FK>>
  originalName : String
  importStatus : String
}

entity "CARTS" as Carts {
  * _id : ObjectId <<PK>>
  --
  customer : ObjectId <<FK>>
  status : String
  createdAt : Date
  updatedAt : Date
}

entity "CART_ITEMS" as CartItems {
  * _id : ObjectId <<PK>>
  --
  cart : ObjectId <<FK>>
  product : ObjectId <<FK>>
  quantity : Number
  priceSnapshot : Number
  createdAt : Date
  updatedAt : Date
}

entity "ORDERS" as Orders {
  * _id : ObjectId <<PK>>
  --
  customer : ObjectId <<FK>>
  shippingAddress : ObjectId <<FK>>
  status : String
  subtotal : Number
  shippingFee : Number
  discountAmount : Number
  totalAmount : Number
  paymentMethod : String
  note : String
  createdAt : Date
  updatedAt : Date
}

entity "ORDER_ITEMS" as OrderItems {
  * _id : ObjectId <<PK>>
  --
  order : ObjectId <<FK>>
  product : ObjectId <<FK>>
  productName : String
  productImage : String
  quantity : Number
  price : Number
  totalPrice : Number
}

entity "ORDER_STATUS_HISTORIES" as OrderStatusHistories {
  * _id : ObjectId <<PK>>
  --
  order : ObjectId <<FK>>
  changedBy : ObjectId <<FK>>
  fromStatus : String
  toStatus : String
  note : String
  createdAt : Date
}

entity "PAYMENTS" as Payments {
  * _id : ObjectId <<PK>>
  --
  order : ObjectId <<FK>>
  method : String
  status : String
  amount : Number
  transactionCode : String
  paidAt : Date
  createdAt : Date
}

entity "ADMIN_AUDIT_LOGS" as AdminAuditLogs {
  * _id : ObjectId <<PK>>
  --
  admin : ObjectId <<FK>>
  action : String
  targetType : String
  targetId : ObjectId
  beforeData : Object
  afterData : Object
  createdAt : Date
}

entity "DASHBOARD_SNAPSHOTS" as DashboardSnapshots {
  * _id : ObjectId <<PK>>
  --
  periodType : String
  periodValue : String
  totalRevenue : Number
  totalOrders : Number
  totalProducts : Number
  totalCustomers : Number
  lowStockCount : Number
  generatedAt : Date
}

entity "SEARCH_LOGS" as SearchLogs {
  * _id : ObjectId <<PK>>
  --
  user : ObjectId <<FK>>
  keyword : String
  brand : String
  category : String
  minPrice : Number
  maxPrice : Number
  resultCount : Number
  createdAt : Date
}

entity "PRODUCT_VIEW_EVENTS" as ProductViewEvents {
  * _id : ObjectId <<PK>>
  --
  user : ObjectId <<FK>>
  product : ObjectId <<FK>>
  source : String
  createdAt : Date
}

entity "USER_PRODUCT_EVENTS" as UserProductEvents {
  * _id : ObjectId <<PK>>
  --
  user : ObjectId <<FK>>
  product : ObjectId <<FK>>
  eventType : String
  score : Number
  createdAt : Date
}

entity "RECOMMENDATION_RESULTS" as RecommendationResults {
  * _id : ObjectId <<PK>>
  --
  user : ObjectId <<FK>>
  product : ObjectId <<FK>>
  recommendedProduct : ObjectId <<FK>>
  reason : String
  score : Number
  createdAt : Date
}

Roles ||--o{ Users : "phân quyền"
Users ||--o{ Addresses : "có địa chỉ"
Users ||--o| Carts : "có giỏ hàng"
Users ||--o{ Orders : "đặt hàng"
Users ||--o{ AdminAuditLogs : "thao tác admin"
Users ||--o{ SearchLogs : "tìm kiếm"
Users ||--o{ ProductViewEvents : "xem sản phẩm"
Users ||--o{ UserProductEvents : "tương tác"
Users ||--o{ RecommendationResults : "nhận gợi ý"

Brands ||--o{ Products : "sở hữu sản phẩm"
Categories ||--o{ Products : "phân loại"
Categories ||--o{ Categories : "danh mục cha-con"
Products ||--o{ ProductImages : "có ảnh"
Products ||--o{ ProductSpecifications : "có thông số"
Products ||--o{ InventoryTransactions : "biến động kho"
Products ||--o{ CartItems : "trong giỏ hàng"
Products ||--o{ OrderItems : "trong đơn hàng"
Products ||--o{ ProductViewEvents : "được xem"
Products ||--o{ UserProductEvents : "được tương tác"
Products ||--o{ RecommendationResults : "sản phẩm nguồn"
Products ||--o{ RecommendationResults : "sản phẩm được gợi ý"

ProductSeedBatches ||--o{ ProductSeedItems : "gồm dòng seed"
Products ||--o{ ProductSeedItems : "được tạo từ seed"

Carts ||--o{ CartItems : "gồm"
Orders ||--o{ OrderItems : "gồm"
Orders ||--o{ OrderStatusHistories : "có lịch sử trạng thái"
Orders ||--o| Payments : "thanh toán"
Addresses ||--o{ Orders : "dùng giao hàng"
Users ||--o{ OrderStatusHistories : "cập nhật trạng thái"

Orders ||..o{ DashboardSnapshots : "nguồn tổng hợp"
Products ||..o{ DashboardSnapshots : "nguồn tổng hợp"
Users ||..o{ DashboardSnapshots : "nguồn tổng hợp"
@enduml
```

### 3. Luồng mua hàng dự kiến

Phần này sẽ được triển khai sau Product API, nhưng nên mô tả sớm để thống nhất cách các module sản phẩm, giỏ hàng và đơn hàng phối hợp với nhau.

```plantuml
@startuml
!pragma layout smetana
start

:Khách hàng truy cập website;
:Xem danh sách sản phẩm;
:Tìm kiếm hoặc lọc sản phẩm;
:Xem chi tiết sản phẩm;
:Thêm sản phẩm vào giỏ hàng;

while (Tiếp tục mua sắm?) is (Có)
  :Xem danh sách sản phẩm;
  :Tìm kiếm hoặc lọc sản phẩm;
  :Xem chi tiết sản phẩm;
  :Thêm sản phẩm vào giỏ hàng;
endwhile (Không)

:Xem giỏ hàng;

if (Đã đăng nhập?) then (Chưa)
  :Đăng nhập hoặc đăng ký;
else (Rồi)
endif

:Nhập thông tin thanh toán/giao hàng;
:Backend kiểm tra tồn kho;

if (Còn hàng?) then (Có)
  :Tạo đơn hàng;
  :Trừ tồn kho;
  :Xóa giỏ hàng;
  :Hiển thị đặt hàng thành công;
  stop
else (Không)
  :Thông báo hết hàng hoặc lỗi đặt hàng;
  :Quay lại giỏ hàng;
  stop
endif
@enduml
```

## Chạy frontend

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

Frontend mặc định chạy tại:

```text
http://localhost:5173
```

## Cấu trúc thư mục

```text
src/
  app.js
  server.js
  config/
  controllers/
  middlewares/
  models/
  routes/
  services/
  utils/

client/
  src/
    api/
    components/
    layouts/
    pages/
    routes/
    styles/
```
