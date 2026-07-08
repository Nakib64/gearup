# GearUp Backend Implementation Plan
**Modular Architectural Design & Optimized Database Schema Blueprint**

This document provides a highly descriptive, step-by-step developer guide to implement the backend API for **GearUp** (Sports & Outdoor Gear Rental Service). The codebase is designed around a **NestJS-like Modular Architecture** implemented in Express & TypeScript, with a highly optimized, fully normalized PostgreSQL database managed by Prisma.

---

## 1. Modular Directory Structure

Organize the codebase under `src/` as follows:

```text
src/
├── app.ts                 # Express entry point
├── shared/                # Shared modules, global middlewares, and utilities
│   ├── prisma.service.ts  # Centralized Prisma Client singleton
│   ├── utils/
│   │   ├── app-error.ts   # Custom error class supporting consistent responses
│   │   └── response.ts    # Centralized response formatting wrappers
│   └── middlewares/
│       ├── auth.middleware.ts       # JWT Validation & request user injection
│       ├── roles.middleware.ts      # RBAC Route Guards (CUSTOMER, PROVIDER, ADMIN)
│       ├── error.middleware.ts      # Centralized Error Interceptor
│       └── validation.middleware.ts # Zod validation schema runner
└── modules/               # Domain-driven feature modules (NestJS-like structure)
    ├── auth/
    │   ├── auth.module.ts       # Wire router, controllers, and services
    │   ├── auth.controller.ts   # HTTP Request mapping & Response handlers
    │   ├── auth.service.ts      # Authentication logic (JWT, password hashes)
    │   ├── auth.routes.ts       # Route endpoints definition
    │   └── auth.dto.ts          # Zod validation schemas
    ├── category/
    │   └── [category.module | controller | service | routes | dto].ts
    ├── gear/
    │   └── [gear.module | controller | service | routes | dto].ts
    ├── rental/
    │   └── [rental.module | controller | service | routes | dto].ts
    ├── payment/
    │   └── [payment.module | controller | service | routes | dto].ts
    ├── review/
    │   └── [review.module | controller | service | routes | dto].ts
    └── admin/
        └── [admin.module | controller | service | routes].ts
```

---

## 2. Database Normalization & Schema Design
The schema is located inside the `prisma/schema` directory, split across functional modules:

### Enums (`prisma/schema/base.prisma`)
* `Role`: `CUSTOMER`, `PROVIDER`, `ADMIN`
* `UserStatus`: `ACTIVE`, `SUSPENDED`
* `OrderStatus`: `PLACED`, `CONFIRMED`, `PAID`, `PICKED_UP`, `RETURNED`, `CANCELLED`
* `PaymentStatus`: `PENDING`, `COMPLETED`, `FAILED`

### Models Detail
1. **`User`** (`prisma/schema/user.prisma`): Manages authentication and accounts. Contains role-based flags.
2. **`Category`** (`prisma/schema/category.prisma`): Flat structure cataloguing items.
3. **`GearItem`** (`prisma/schema/gear.prisma`): Represents listings. Has foreign key relations to `Category` and `User` (Provider). Contains stock tracking attributes.
4. **`RentalOrder`** (`prisma/schema/rental.prisma`): Tracks bookings. Links to `User` (Customer). Includes rent timestamps.
5. **`RentalItem`** (`prisma/schema/rental.prisma`): **Junction entity** separating the order detail from listing to normalize many-to-many booking capability. Stores `pricePerDay` snapshot at order placement to protect historical financial statistics from listing price updates.
6. **`Payment`** (`prisma/schema/payment.prisma`): Payment records mapping directly to Stripe payment tracking.
7. **`Review`** (`prisma/schema/review.prisma`): Customer reviews, constrained via a unique composite index `[customerId, rentalOrderId, gearItemId]` to enforce a strict limit of one review per user, per rental item, per booking.

---

## 3. Global Modules & Core Middlewares

### A. Centralized Response Utility (`src/shared/utils/response.ts`)
Must return JSON responses in a uniform envelope structure:
* **Success**: `{ "success": true, "message": "Success message", "data": ... }`
* **Error**: `{ "success": false, "message": "Error description", "errorDetails": ... }`

```typescript
export const sendResponse = (res: Response, statusCode: number, message: string, data?: any) => {
  return res.status(statusCode).json({ success: true, message, data });
};
```

### B. Error Handler Middleware (`src/shared/middlewares/error.middleware.ts`)
Catch all unhandled errors, formats stack/details, and issues clean error JSON structures:
```typescript
export class AppError extends Error {
  constructor(public statusCode: number, message: string, public errorDetails: any = null) {
    super(message);
  }
}
```

### C. Authentication & Guard Middlewares (`src/shared/middlewares/auth.middleware.ts`)
1. **JWT Verification**: Validates `Authorization: Bearer <token>`, fetches user status, confirms status is `ACTIVE` (rejects suspended accounts), and injects `req.user`.
2. **Role Verification Guard**: Dynamic factory function verifying user role against permitted endpoints.
   ```typescript
   export const restrictTo = (...roles: string[]) => {
     return (req: Request, res: Response, next: NextFunction) => {
       if (!roles.includes(req.user.role)) {
         throw new AppError(403, 'Forbidden: Insufficient privileges');
       }
       next();
     };
   };
   ```

### D. Input Validation Middleware (`src/shared/middlewares/validation.middleware.ts`)
Wraps `zod` parse logic to check `req.body`, `req.query`, or `req.params`. In case of validation failure, returns `400 Bad Request` with Zod structured errors inside `errorDetails`.

---

## 4. API Endpoints Specifications & Controller Logic

### Authentication Module (`/api/auth`)
1. **`POST /api/auth/register`** (Public)
   * **Body**: `email`, `password`, `name`, `role` (`CUSTOMER` or `PROVIDER`)
   * **Logic**: Hash password with `bcrypt` (10 rounds). Ensure email is unique. Create account with status `ACTIVE`.
2. **`POST /api/auth/login`** (Public)
   * **Body**: `email`, `password`
   * **Logic**: Validate credentials. Issue a signed JWT token containing `userId`, `email`, `role`, and `status`.
3. **`GET /api/auth/me`** (Authenticated)
   * **Logic**: Return profile details of current `req.user`.

### Category Module (`/api/categories`)
1. **`POST /api/categories`** (Admin Only)
   * **Body**: `name`, `description`
   * **Logic**: Insert new category into database.
2. **`GET /api/categories`** (Public)
   * **Logic**: Retrieve list of all categories.

### Gear Module (`/api/gear`)
1. **`GET /api/gear`** (Public)
   * **Query Filters**: `category`, `brand`, `minPrice`, `maxPrice`, `search` (searches text in title and description), `limit`, `page`.
   * **Logic**: Query `GearItem` where `stock > 0`.
2. **`GET /api/gear/:id`** (Public)
   * **Logic**: Find gear item including its parent `Category`, list reviews, and count average rating.
3. **`POST /api/provider/gear`** (Provider Only)
   * **Body**: `title`, `description`, `pricePerDay`, `brand`, `stock`, `categoryId`
   * **Logic**: Save gear with `providerId = req.user.id`.
4. **`PUT /api/provider/gear/:id`** (Provider Only)
   * **Logic**: Check that the gear item belongs to the calling Provider. Update details.
5. **`DELETE /api/provider/gear/:id`** (Provider Only)
   * **Logic**: Check listing ownership. Remove gear listing.

### Rental Module (`/api/rentals`)
1. **`POST /api/rentals`** (Customer Only)
   * **Body**: `startDate`, `endDate`, `items` (array of `{ gearItemId, quantity }`)
   * **Logic**:
     * Calculate rental days. Ensure duration is valid.
     * Query all items from DB to verify stock and fetch `pricePerDay`.
     * Check if requested quantities exceed stock.
     * Execute transaction:
       * Decrement inventory `stock` matching the requested items.
       * Insert `RentalOrder` record.
       * Insert `RentalItem` snapshot entries.
2. **`GET /api/rentals`** (Customer Only)
   * **Logic**: Get user's rental history, including associated rental items and payment status.
3. **`GET /api/rentals/:id`** (Customer / Owner Provider)
   * **Logic**: Show complete rental transaction details.
4. **`GET /api/provider/orders`** (Provider Only)
   * **Logic**: Query all incoming orders containing inventory items listed by the Provider.
5. **`PATCH /api/provider/orders/:id`** (Provider Only)
   * **Body**: `status` (`CONFIRMED` | `PICKED_UP` | `RETURNED` | `CANCELLED`)
   * **Logic**: Validate permitted states transition:
     * `PLACED` can transition to `CONFIRMED` or `CANCELLED`.
     * `CONFIRMED`/`PAID` can transition to `PICKED_UP`.
     * `PICKED_UP` can transition to `RETURNED`.
     * If transitioning to `CANCELLED` or items are `RETURNED`, increment corresponding item `stock` back.

### Payment Module (`/api/payments`)
1. **`POST /api/payments/create`** (Customer Only)
   * **Body**: `rentalOrderId`
   * **Logic**:
     * Fetch `RentalOrder` details and ensure it belongs to the Customer.
     * Verify payment status is not completed.
     * Call Stripe SDK: `stripe.paymentIntents.create` using order `totalPrice`.
     * In the Stripe payment metadata, store `rentalOrderId`.
     * Return `clientSecret` and `transactionId` (the payment intent ID) to client.
     * Create/Update a `Payment` record in the database with status `PENDING`.
2. **`POST /api/payments/confirm`** (Stripe Webhook / Callback endpoint)
   * **Logic**: Validate webhook signature (if secure webhook is configured). Look up the `rentalOrderId` from metadata. Update `Payment` status to `COMPLETED` and update `RentalOrder` status to `PAID` within a transaction.
3. **`GET /api/payments`** (Customer Only)
   * **Logic**: Return user's billing records list.

### Review Module (`/api/reviews`)
1. **`POST /api/reviews`** (Customer Only)
   * **Body**: `rentalOrderId`, `gearItemId`, `rating`, `comment`
   * **Logic**:
     * Verify the customer placed this rental order.
     * Verify the order status is `RETURNED`.
     * Verify that the customer has not already left a review for this item (enforce unique DB constraint).
     * Create review.

### Admin Module (`/api/admin`)
1. **`GET /api/admin/users`** (Admin Only)
   * **Logic**: Return list of all customers and providers.
2. **`PATCH /api/admin/users/:id`** (Admin Only)
   * **Body**: `status` (`ACTIVE` | `SUSPENDED`)
   * **Logic**: Update status. If suspended, active login sessions will fail at the next middleware authentication check.
3. **`GET /api/admin/gear`** (Admin Only)
   * **Logic**: Query all listed inventory items across the platform.
4. **`GET /api/admin/rentals`** (Admin Only)
   * **Logic**: Query all orders placed on the platform.

---

## 5. 20-Step Coding Checklist

Follow these steps sequentially to code the system:

* [ ] **Step 1**: Configure split prisma schema directory under `prisma/schema/` and run `npx prisma db push` to synchronize structures.
* [ ] **Step 2**: Implement the centralized database adapter instance in `src/shared/prisma.service.ts`.
* [ ] **Step 3**: Code generic HTTP exception wrappers (`AppError`) and global error handler middleware.
* [ ] **Step 4**: Set up input validation runtime middleware wrapping Zod schemas.
* [ ] **Step 5**: Write DTO schema schemas for registration and login validation inside `src/modules/auth/auth.dto.ts`.
* [ ] **Step 6**: Implement `AuthService` handling password hashing (`bcrypt`) and JWT sign operations.
* [ ] **Step 7**: Implement authentication routes (`POST /api/auth/register`, `POST /api/auth/login`) in `AuthController`.
* [ ] **Step 8**: Create JWT passport verify guard (`auth.middleware.ts`) and RBAC checks (`roles.middleware.ts`).
* [ ] **Step 9**: Code `/api/auth/me` endpoint verifying injected credentials mapping.
* [ ] **Step 10**: Code the `Category` module for Admins to create and public to fetch gear groups.
* [ ] **Step 11**: Build Zod query validator schema for filtration endpoints.
* [ ] **Step 12**: Develop `GearService` implementing database search, category mapping, and filtering.
* [ ] **Step 13**: Code public controller routes for browsing items (`GET /api/gear` & `GET /api/gear/:id`).
* [ ] **Step 14**: Implement Provider catalog endpoints to Add, Update, and Remove listings.
* [ ] **Step 15**: Implement Rental booking transaction check logic (stock reservation and pricing snapshots creation).
* [ ] **Step 16**: Create customer endpoints to query and place orders (`POST /api/rentals`, `GET /api/rentals`).
* [ ] **Step 17**: Develop Provider order tracking queues and state machine handlers (`CONFIRMED`, `PICKED_UP`, `RETURNED`, `CANCELLED`).
* [ ] **Step 18**: Set up Stripe integration service and payment intent endpoint (`POST /api/payments/create`).
* [ ] **Step 19**: Implement payment webhook callback to update statuses (`PAID`) and compile billing history endpoints.
* [ ] **Step 20**: Code Admin user-moderation control panels (suspensions, user listing query and tracking metrics).
