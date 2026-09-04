# Phone Center

Phone Center is a Gin web server that serves the existing pages and exposes a
MySQL-backed product API.

## Run locally

1. Create a MySQL database:

   ```sql
   CREATE DATABASE phone_center CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. Copy `.env.example` to `.env` (or export the variables in your hosting
   provider). Set `MYSQL_PASSWORD` and a strong `JWT_SECRET`.

3. Start from the project root:

   ```bash
   go run ./backend
   ```

The server automatically creates/updates the `products` and `users` tables.
Products can be inserted through the authenticated admin API (`POST /api/products`).
The default local admin account is `admin@local` / `password`; change or remove
it before exposing the server publicly.

## Routes

- `GET /` — home page
- `GET /products` — product listing page
- `GET /product-detail?id=1` — product detail page
- `GET /api/products` — products from MySQL
- `GET /api/products/:id` — one product from MySQL
- `POST /login` — obtain a JWT
- `POST|PUT|DELETE /api/products[/:id]` — authenticated product management

`GET /api/products` also accepts `category`, `q`, `limit`, and `offset` query
parameters. The old `/templates/...html` links redirect to the new server routes,
so existing bookmarks continue to work.
