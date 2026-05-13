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
