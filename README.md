# VIN POS System

[![Node.js Version](https://img.shields.io/badge/node-22.x-green.svg)](https://nodejs.org)
[![NPM Version](https://img.shields.io/badge/npm-10.x-red.svg)](https://nodejs.org)
[![Express Framework](https://img.shields.io/badge/express-5.x-blue.svg)](https://expressjs.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.x-3178C6.svg)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-7.x-2D3748.svg)](https://www.prisma.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

A production-ready, TypeScript-powered Point of Sale (POS) backend API built with Express.js, Prisma ORM, PostgreSQL, and Zod validation. It provides secure cookie-based authentication, role-based access control, inventory and product management, customer loyalty tracking, atomic sales transactions with stock reconciliation, and Paystack payment verification.

---

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Project](#running-the-project)
- [API Overview](#api-overview)
- [User Roles](#user-roles)
- [Project Workflow](#project-workflow)
- [Database Models](#database-models)
- [Available Scripts](#available-scripts)
- [Future Improvements](#future-improvements)
- [Author](#author)
- [License](#license)

---

# Features

## Authentication & Security

- User registration with email verification tokens
- Resend verification email with cooldown rate limiting
- Secure login using username and password (`bcryptjs`)
- Dual-token JWT authentication (`accessToken` + `refreshToken`) via signed HTTP-only cookies
- Persistent refresh token tracking per session (`Token` model)
- Forgot password and token-based password reset via email
- Account lockout protection after repeated failed login attempts
- Rate limiting on authentication and email endpoints (`express-rate-limit`)
- Security headers via `helmet`

---

## User Management

- Fetch current authenticated user profile
- View all active users (excluding passwords and security tokens)
- Update user details and roles (with self-role-change protection)
- Delete users safely (hard delete when no sales exist; soft delete preserving historical sales records otherwise)
- Authenticated password update with old password verification

---

## Product & Inventory Management

- Create products with duplicate-name validation
- List and filter products by search query, category, and minimum/maximum price range
- View single product details
- Update product details, pricing, and stock quantities
- Delete products

---

## Customer & Loyalty Management

- Register customers with unique phone number and optional email
- List all customers ordered by registration date
- Automatic loyalty points accrual on completed sales (1 point per ₵10 spent)

---

## Sales & Payment Processing

- Process cash, mobile money (`MOBILE_MONEY`), and credit card (`CREDIT_CARD`) sales
- Atomic Prisma database transactions for stock validation, stock decrement, sale recording, line-item creation, and loyalty point updates
- Automatic cash change calculation and insufficient cash protection
- Paystack transaction verification integrated directly into the sale creation workflow
- View all sales with total revenue and itemized product/customer details
- View sales recorded by the currently logged-in cashier
- View single sale details by ID

---

# Technology Stack

## Backend

- Node.js
- Express.js (v5)
- TypeScript
- PostgreSQL
- Prisma ORM (`@prisma/adapter-pg`)
- Zod (request validation)
- JSON Web Tokens (`jsonwebtoken`) with signed HTTP-only cookies
- `bcryptjs` (password hashing)
- Brevo API (transactional emails)
- Paystack API (payment verification)
- `helmet`, `morgan`, `cookie-parser`, `express-rate-limit`

## Testing & Tooling

- Jest & `ts-jest`
- `tsx` (development runner)
- `tsup` (ESM production bundler)

---

# System Architecture

The application follows a layered backend architecture consisting of:

- **Routing Layer** (`routes/`): Defines REST endpoints, rate limiters, auth guards, and Zod validation middleware
- **Middleware Layer** (`middleware/`): Handles JWT cookie authentication, role authorization, request validation, 404 responses, and centralized error handling
- **Controller Layer** (`controllers/`): Parses HTTP requests and maps service responses to HTTP status codes and JSON payloads
- **Service Layer** (`services/`): Encapsulates core business logic for auth, users, customers, products, sales, emails, and Paystack payments
- **Data Access Layer** (`lib/prisma.ts`, `prisma/`): Manages typed PostgreSQL queries and atomic transactions through Prisma Client
- **Database Layer**: PostgreSQL relational schema managed via Prisma migrations

This separation improves maintainability, type safety, and testability while keeping external integrations (Brevo and Paystack) isolated from core business logic.

---

# Project Structure

```text
pos-system/
│
├── server/
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   │
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── customer.controller.ts
│   │   │   ├── product.controller.ts
│   │   │   ├── sale.controller.ts
│   │   │   └── user.controller.ts
│   │   ├── docs/
│   │   ├── lib/
│   │   │   └── prisma.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── errorHandler.middleware.ts
│   │   │   ├── notFound.ts
│   │   │   └── validation.middleware.ts
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── customer.routes.ts
│   │   │   ├── product.routes.ts
│   │   │   ├── sale.routes.ts
│   │   │   └── user.routes.ts
│   │   ├── services/
│   │   │   ├── auth/
│   │   │   │   └── auth.service.ts
│   │   │   ├── customer/
│   │   │   │   └── customer.service.ts
│   │   │   ├── email/
│   │   │   │   ├── email.config.ts
│   │   │   │   ├── email.service.ts
│   │   │   │   └── resetPasswordEmailHTML.ts
│   │   │   ├── payment/
│   │   │   │   ├── payment.service.ts
│   │   │   │   └── paystack.service.ts
│   │   │   ├── product/
│   │   │   │   └── product.service.ts
│   │   │   ├── sale/
│   │   │   │   └── sale.service.ts
│   │   │   └── user/
│   │   │       └── user.service.ts
│   │   ├── types/
│   │   │   ├── auth.types.ts
│   │   │   ├── customer.types.ts
│   │   │   ├── express.d.ts
│   │   │   ├── payment.types.ts
│   │   │   ├── product.types.ts
│   │   │   ├── sale.types.ts
│   │   │   └── user.types.ts
│   │   ├── utils/
│   │   │   ├── mockProducts.json
│   │   │   ├── passwordUtils.ts
│   │   │   └── tokenUtils.ts
│   │   ├── validators/
│   │   │   ├── auth.validator.ts
│   │   │   ├── customer.validator.ts
│   │   │   ├── product.validator.ts
│   │   │   ├── sale.validator.ts
│   │   │   └── user.validator.ts
│   │   └── server.ts
│   │
│   ├── jest.config.ts
│   ├── package.json
│   ├── prisma.config.ts
│   ├── tsconfig.json
│   └── .env
│
├── LICENSE
└── README.md
```

---

# Prerequisites

Install the following:

- Node.js (v22 or later)
- PostgreSQL
- npm (v10 or later)
- Git

---

# Installation

Clone the repository

```bash
git clone https://github.com/kelvin-agyeman/pos-system.git
```

Navigate into the server directory

```bash
cd pos-system/server
```

Install dependencies

```bash
npm install
```

Generate the Prisma Client and apply database migrations

```bash
npx prisma generate
npx prisma migrate deploy
```

---

# Environment Variables

Create a `.env` file inside the `server` directory.

Example:

```env
NODE_ENV=development
PORT=3000

DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/pos_db

JWT_SECRET=your_jwt_secret_key

CLIENT_URL=http://localhost:5173

BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=your_verified_sender_email

PAYSTACK_SECRET_KEY=your_paystack_secret_key
```

---

# Running the Project

Development

```bash
npm run dev
```

Build

```bash
npm run build
```

Production

```bash
npm start
```

---

# API Overview

All API routes are mounted under `/api/v1`:

| Module | Base Path | Key Operations |
| --- | --- | --- |
| Auth | `/api/v1/auth` | Register, login, logout, verify email, resend verification, forgot/reset password |
| Users | `/api/v1/users` | Current user profile, list users, update user/role, delete user, change password |
| Customers | `/api/v1/customers` | Register customer, list customers |
| Products | `/api/v1/products` | Create, list/filter (`search`, `category`, `minPrice`, `maxPrice`), get by ID, update, delete |
| Sales | `/api/v1/sales` | Create sale (cash or Paystack), list all sales, cashier sales, get sale by ID |

---

# User Roles

## Cashier (`CASHIER`)

- Login and manage own password
- View current user profile
- Register and view customers
- Browse/manage products and checkout carts
- Process cash and Paystack sales
- View own sales history

---

## Administrator (`ADMIN`)

- All Cashier capabilities
- View all registered users
- Update user details and assign/change roles
- Delete user accounts
- Monitor store-wide sales and revenue

---

# Project Workflow

1. A user registers and verifies their email via Brevo verification links.
2. The user logs in and receives signed `accessToken` and `refreshToken` HTTP-only cookies.
3. Products are stocked and maintained in inventory with category and pricing metadata.
4. At checkout, the cashier optionally registers or selects a `Customer`.
5. For `CASH` sales, the system verifies product stock, validates `cashGiven >= totalAmount`, and computes change.
6. For Paystack payments (`MOBILE_MONEY` or `CREDIT_CARD` with `paymentReference`), the system verifies the transaction via Paystack and confirms `paidAmount >= totalAmount`.
7. Inside an atomic Prisma transaction, the sale and `SalesItem` records are created, product stock quantities are decremented, and customer loyalty points are awarded.

---

# Database Models

Defined in `server/prisma/schema.prisma`:

- `User` (`Role`: `ADMIN`, `CASHIER`)
- `Token`
- `Customer`
- `Product`
- `Sale` (`PaymentMethod`: `CASH`, `MOBILE_MONEY`, `CREDIT_CARD`)
- `SalesItem`

---

# Available Scripts

Run inside the `server` directory:

```bash
npm run dev
```

Starts the development server with `tsx watch`.

```bash
npm run build
```

Bundles `src/server.ts` for production using `tsup` and copies OpenAPI docs if present.

```bash
npm start
```

Runs the compiled production server (`dist/server.js`).

```bash
npm test
```

Runs the Jest test suite.

---

# Future Improvements

- Automated unit and integration test suite with Jest
- Sales analytics, low-stock alerts, and receipt generation
- Containerization with Docker

---

# Author

**Kelvin Oppong Agyeman**

Computer Science Student

Kwame Nkrumah University of Science and Technology (KNUST)

---

# License

This project is licensed under the MIT License.
