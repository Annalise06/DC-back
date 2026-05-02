# DC Loans — Backend API

Express + MongoDB backend for the DC Loans platform.  
Supports US and SA applicant auth, secure refresh token rotation, and an admin API.

---

## Quick Start

### 1. Install dependencies
```bash
cd dc-loans-backend
npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env
```
Open `.env` and fill in your values. See the comments inside `.env.example` for step-by-step instructions on getting your MongoDB URI and generating JWT secrets.

### 3. Seed the admin account
This creates your first admin login using the credentials in `.env`.
```bash
npm run seed:admin
```

### 4. Start the development server
```bash
npm run dev
```

The API will be running at **http://localhost:5000**  
Swagger docs will be at **http://localhost:5000/api-docs**

---

## Project Structure

```
dc-loans-backend/
├── .env.example              # Environment variable template (copy → .env)
├── .gitignore
├── package.json
└── src/
    ├── server.js             # Express app entry point — middleware, routes, startup
    │
    ├── config/
    │   ├── db.js             # MongoDB connection
    │   └── swagger.js        # OpenAPI / Swagger config and shared schemas
    │
    ├── models/
    │   ├── USUser.js         # US applicant schema (SSN, US address, USD)
    │   ├── SAUser.js         # SA applicant schema (RSA ID, SA province, ZAR)
    │   └── Admin.js          # Admin schema (separate collection)
    │
    ├── controllers/
    │   └── authController.js # All auth logic: signup, login, refresh, logout, /me
    │
    ├── routes/
    │   ├── auth.js           # /api/auth/* routes
    │   └── admin.js          # /api/admin/* routes (protected)
    │
    ├── middleware/
    │   ├── auth.js           # protect, requireRole, requireCountry
    │   └── errorHandler.js   # Global error handler, 404 handler, asyncHandler
    │
    ├── services/
    │   └── tokenService.js   # JWT generation/verification, refresh token hashing, cookies
    │
    ├── validators/
    │   └── authValidators.js # express-validator rules for US signup, SA signup, login
    │
    └── utils/
        └── seedAdmin.js      # One-time script to create the first admin account
```

---

## API Endpoints

All endpoints are prefixed with `/api`.  
Full interactive docs available at `/api-docs` when the server is running.

### Auth — US Applicants

| Method | Endpoint           | Auth     | Description              |
|--------|--------------------|----------|--------------------------|
| POST   | /auth/us/signup    | None     | Register a US applicant  |
| POST   | /auth/us/login     | None     | Log in as a US applicant |

### Auth — SA Applicants

| Method | Endpoint           | Auth     | Description              |
|--------|--------------------|----------|--------------------------|
| POST   | /auth/sa/signup    | None     | Register an SA applicant |
| POST   | /auth/sa/login     | None     | Log in as an SA applicant|

### Auth — Shared

| Method | Endpoint           | Auth           | Description                            |
|--------|--------------------|----------------|----------------------------------------|
| POST   | /auth/refresh      | Cookie only    | Silently renew access token            |
| POST   | /auth/logout       | Optional Bearer| Invalidate refresh token, clear cookie |
| GET    | /auth/me           | Bearer         | Get current user's profile             |

### Admin

| Method | Endpoint                         | Auth         | Description                  |
|--------|----------------------------------|--------------|------------------------------|
| POST   | /admin/auth/login                | None         | Admin login                  |
| GET    | /admin/users/us                  | Admin Bearer | List all US users (paginated)|
| GET    | /admin/users/sa                  | Admin Bearer | List all SA users (paginated)|
| GET    | /admin/users/:country/:id        | Admin Bearer | Get a single user            |
| PATCH  | /admin/users/:country/:id/loan   | Admin Bearer | Update loan financial data   |
| PATCH  | /admin/users/:country/:id/status | Admin Bearer | Activate / deactivate user   |

---

## Authentication Flow

```
1. User signs up or logs in
        ↓
2. Server issues:
   - Access token (JWT, 15 min) → returned in JSON body
   - Refresh token (JWT, 7 days) → set as httpOnly cookie

3. Frontend stores access token in memory (React state/context)
   Frontend never touches the refresh cookie (browser handles it automatically)
        ↓
4. Every API request:
   Authorization: Bearer <accessToken>
        ↓
5. When access token expires (401 response):
   Frontend calls POST /auth/refresh
   → Server reads the cookie, rotates the refresh token, issues a new access token
        ↓
6. On logout:
   Frontend calls POST /auth/logout
   → Server removes the refresh token hash from DB and clears the cookie
   → Frontend clears the access token from memory
```

---

## US vs SA Differences

| Field              | US                          | SA                          |
|--------------------|-----------------------------|-----------------------------|
| Identity number    | SSN (last 4 only)           | RSA ID (13-digit, Luhn-validated) |
| Address division   | State (2-letter code)       | Province (9 SA provinces)   |
| Postal code        | ZIP (5 or 9 digit)          | Postal code (4 digit)       |
| Phone format       | +1XXXXXXXXXX                | +27XXXXXXXXX                |
| Date locale        | en-US                       | en-ZA                       |
| DB collection      | `ususers`                   | `sausers`                   |

---

## Security Features

- **bcrypt** (cost 12) for password hashing
- **Refresh token rotation** — each refresh token is single-use; reuse triggers full session invalidation
- **httpOnly cookies** — refresh tokens are inaccessible to JavaScript (XSS protection)
- **Helmet** — sets secure HTTP headers
- **Rate limiting** — 20 requests per 15 minutes per IP on all auth routes
- **CORS** — restricted to the configured `CLIENT_URL`
- **Generic error messages** — login errors never reveal whether the email exists

---

## Frontend Integration Changes Needed

When connecting the React frontend (`dc-loans`) to this backend:

| File                   | Change                                                                 |
|------------------------|------------------------------------------------------------------------|
| `App.jsx`              | Replace `authed` boolean with user object from `/auth/me` on mount     |
| `LoginPage.jsx`        | Call `POST /api/auth/us/login` or `/api/auth/sa/login`                 |
| `SignupPage.jsx`       | Call `POST /api/auth/us/signup` or `/api/auth/sa/signup`               |
| `DashSidebar.jsx`      | Call `POST /api/auth/logout` before navigating on sign-out             |
| All API calls          | Add `Authorization: Bearer <accessToken>` header                       |
| `useApp.js`            | On 401 response, call `/auth/refresh` then retry the original request  |
