# GearUp Backend - Sports & Outdoor Gear Rental Service

GearUp is a robust, modular backend API built using Express, TypeScript, Prisma, and PostgreSQL. It implements user authentication with RBAC (Role-Based Access Control) for Customers, Providers, and Admins, transactional rental order booking with real-time stock management, and Stripe payment integration.

---

## 🚀 Live Links & Documentation

* **Live API URL**: [https://gearup-sigma.vercel.app](https://gearup-sigma.vercel.app)
* **Interactive API Documentation (Swagger)**: [https://gearup-sigma.vercel.app/docs](https://gearup-sigma.vercel.app/docs)
* **GitHub Repository**: [https://github.com/Nakib64/gearup](https://github.com/Nakib64/gearup)

---

## 🔑 Default Administrator Credentials

Use these credentials to test admin-moderation control panel APIs:
* **Admin Email**: `admin@gearup.com`
* **Admin Password**: `admin123`

*Note: You can re-generate/re-seed this admin user in any environment by running the database seed script.*

---

## 🛠️ Technology Stack
* **Runtime**: Node.js + Express
* **Language**: TypeScript
* **Database**: PostgreSQL (Hosted on Neon)
* **ORM**: Prisma ORM
* **Authentication**: JWT (JSON Web Tokens) with refresh-token rotations & cookie sessions
* **Payment Processor**: Stripe SDK
* **Input Validation**: Zod (Schema-based runtime validation)
* **Documentation**: Swagger UI

---

## 📂 Features & API Endpoints

### 1. Authentication (`/api/auth`)
* `POST /api/auth/register` (Public) - Register a new Customer or Provider.
* `POST /api/auth/login` (Public) - Login user, set httpOnly tokens, and return JWT.
* `POST /api/auth/refresh-token` (Public) - Rotates and issues a new access token using refresh token.
* `POST /api/auth/logout` (Public) - Clear auth tokens.
* `GET /api/auth/me` (Authenticated) - Retrieve the profile of the current logged-in user.

### 2. Category (`/api/categories`)
* `POST /api/categories` (Admin Only) - Create a gear category.
* `GET /api/categories` (Public) - Retrieve all catalog categories.

### 3. Gear Catalog (`/api/gear` & `/api/provider/gear`)
* `GET /api/gear` (Public) - Query and filter all listings where stock > 0. (Supports pagination, search query, brand, min/max price, and category mapping).
* `GET /api/gear/:id` (Public) - Retrieve gear details including child category, reviews list, average rating, and review count aggregates.
* `POST /api/provider/gear` (Provider Only) - Add a new gear item.
* `PUT /api/provider/gear/:id` (Provider Only) - Update listing details (verifies provider ownership).
* `DELETE /api/provider/gear/:id` (Provider Only) - Delete listing (verifies ownership and blocks deletion if linked to orders or reviews).

### 4. Rental Bookings (`/api/rentals` & `/api/provider/orders`)
* `POST /api/rentals` (Customer Only) - Place a new booking. Executes a database transaction to decrement inventory and snapshot daily price.
* `GET /api/rentals` (Customer Only) - View customer booking history and payment status.
* `GET /api/rentals/:id` (Customer / Owner Provider) - Get booking order details.
* `GET /api/provider/orders` (Provider Only) - View incoming orders for items owned by the provider.
* `PATCH /api/provider/orders/:id` (Provider Only) - Update order state transitions. Restores inventory stock back if status transitions to `CANCELLED` or `RETURNED`.

### 5. Payments (`/api/payments`)
* `POST /api/payments/create` (Customer Only) - Generates a Stripe PaymentIntent for booking total price.
* `POST /api/payments/confirm` (Public Webhook) - Stripe webhook / callback to mark Payment as COMPLETED and RentalOrder as PAID. Supports Stripe webhook signature validation.
* `GET /api/payments` (Customer Only) - Get payment transaction billing history.
* `GET /api/payments/:id` (Customer / Owner Provider) - Get details for a transaction.

### 6. Reviews (`/api/reviews`)
* `POST /api/reviews` (Customer Only) - Post a review for a gear item (only allowed after order is returned, enforces single-review constraint).

### 7. Administration (`/api/admin`)
* `GET /api/admin/users` (Admin Only) - Get all registered customers and providers.
* `PATCH /api/admin/users/:id` (Admin Only) - Suspend/activate a user account.
* `GET /api/admin/gear` (Admin Only) - View all listed gear on the platform.
* `GET /api/admin/rentals` (Admin Only) - View all platform orders.

---

## ⚙️ Setup and Installation

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in your root folder and add:
```env
DATABASE_URL="your-neon-postgres-connection-string"
JWT_ACCESS_SECRET="your-secure-access-secret"
JWT_REFRESH_SECRET="your-secure-refresh-secret"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
NODE_ENV="development"
PORT=3000

# Admin Default Seed Credentials
ADMIN_EMAIL="admin@gearup.com"
ADMIN_PASSWORD="admin123"

# Stripe Configuration
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### 3. Sync Database & Seed Admin
```bash
npx prisma db push
npm run seed
```

### 4. Running Locally
* Run development server:
  ```bash
  npm run dev
  ```
* Run Stripe webhook CLI listener:
  ```bash
  stripe listen --api-key sk_test_... --forward-to localhost:3000/api/payments/confirm
  ```
