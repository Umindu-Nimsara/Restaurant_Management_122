# 🍽️ Restaurant Management System - Server API

A complete Node.js/Express REST API for a Restaurant Management System with JWT authentication, role-based access control (Admin / Chef / Waiter), MongoDB database, and Swagger documentation.

---

# 🚀 Quick Start

## 📌 Prerequisites

* Node.js (v16 or higher recommended)
* MongoDB (Local or Atlas)
* npm or yarn

---

## 📦 Installation

### 1️⃣ Install dependencies

```bash
npm install
```

### 2️⃣ Configure environment variables

Create `.env` file:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/restaurant_management
JWT_SECRET=your_super_secret_key
JWT_EXPIRES=1d
```

### 3️⃣ Start the server

```bash
npm start          # Production mode
npm run dev        # Development mode (nodemon)
```

Server runs on:

```
http://localhost:5000
```

---

# 📚 API Documentation

Swagger documentation:

```
http://localhost:5000/api-docs
```

---

# 🔐 Default Credentials

### 👑 Admin

* **Email:** [admin@restaurant.com](mailto:admin@restaurant.com)
* **Password:** admin123
* **Endpoint:** `POST /api/auth/login`

### 👨🍳 Chef

* **Email:** [chef@restaurant.com](mailto:chef@restaurant.com)
* **Password:** chef123

### 🧑🍳 Waiter

* **Email:** [waiter@restaurant.com](mailto:waiter@restaurant.com)
* **Password:** waiter123

---

# 📋 API Endpoints

---

# 🔐 Authentication APIs

```http
POST   /api/auth/register        # Admin creates staff (Admin only)
POST   /api/auth/login
GET    /api/auth/profile         # Requires JWT
PUT    /api/auth/change-password # Requires JWT
```

---

# 👤 User Management (Admin Only)

```http
GET    /api/users
GET    /api/users/:id
PUT    /api/users/:id
PUT    /api/users/:id/deactivate
PUT    /api/users/:id/activate
```

Roles:

* ADMIN
* CHEF
* WAITER

---

# 🍽️ Menu Management

```http
POST   /api/menu/categories
GET    /api/menu/categories
```

```http
POST   /api/menu/items
GET    /api/menu/items
GET    /api/menu/items/:id
PUT    /api/menu/items/:id
DELETE /api/menu/items/:id
```

Menu Item Fields:

* name
* categoryId
* price
* description
* imageUrl
* portionSize
* availability (AVAILABLE / OUT_OF_STOCK)
* isFeatured

---

# 📦 Inventory Management

## Ingredients

```http
POST   /api/inventory/ingredients
GET    /api/inventory/ingredients
PUT    /api/inventory/ingredients/:id
DELETE /api/inventory/ingredients/:id
```

Fields:

* name
* unit (kg, g, L, ml, pcs)
* quantity
* minLevel
* expiryDate

---

## Stock Movements

```http
POST   /api/inventory/stock
GET    /api/inventory/stock/:ingredientId
```

Movement Types:

* PURCHASE
* USAGE
* WASTE
* ADJUSTMENT

---

# 🧾 Order Management (KOT Flow)

## Create Order (Waiter)

```http
POST /api/orders
```

```json
{
  "tableId": "TABLE_ID",
  "items": [
    {
      "menuItemId": "MENU_ITEM_ID",
      "qty": 2,
      "note": "Less spicy"
    }
  ]
}
```

---

## Update Order Status

```http
PUT /api/orders/:id/status
```

Status Flow:

```
PENDING → COOKING → SERVED → PAID
```

---

## View Orders

```http
GET /api/orders
GET /api/orders/:id
```

---

# 🪑 Table Reservation

```http
POST   /api/reservations
GET    /api/reservations
GET    /api/reservations/:id
PUT    /api/reservations/:id
PUT    /api/reservations/:id/cancel
```

Reservation Fields:

* customerName
* phone
* email
* guestCount
* tableId
* startAt
* endAt
* status (BOOKED / ARRIVED / COMPLETED / NO_SHOW / CANCELLED)

---

# 🚚 Supplier Management

```http
POST   /api/suppliers
GET    /api/suppliers
PUT    /api/suppliers/:id
DELETE /api/suppliers/:id
```

Supplier Fields:

* name
* contactPerson
* phone
* email
* address
* contractStatus (ACTIVE / INACTIVE / SUSPENDED)

---

## Supplier Transactions

```http
POST /api/suppliers/:id/purchase
GET  /api/suppliers/:id/transactions
```

Purchase automatically updates inventory stock.

---

# 📊 Dashboard APIs

```http
GET /api/dashboard/statistics
```

Returns:

* Total Orders Today
* Total Revenue
* Low Stock Items
* Active Reservations
* Popular Menu Items

---

# 🗄️ Database Models

## Users

* name
* email
* passwordHash
* role (ADMIN / CHEF / WAITER)
* isActive
* failedLoginAttempts
* lockedUntil

---

## Menu Categories

* name
* slug

---

## Menu Items

* name
* categoryId
* price
* description
* portionSize
* availability
* isFeatured

---

## Ingredients

* name
* unit
* quantity
* minLevel
* expiryDate

---

## Orders

* orderNo
* tableId
* staffId
* status
* items[]
* subtotal
* total
* paymentMethod

---

## Reservations

* customerName
* guestCount
* tableId
* startAt
* endAt
* status

---

## Suppliers

* name
* contactPerson
* phone
* contractStatus

---

# 🛠️ Tech Stack

* Node.js
* Express.js
* MongoDB (Mongoose)
* JWT Authentication
* bcrypt Password Hashing
* Swagger / OpenAPI 3.0
* express-validator
* dotenv

---

# 📁 Project Structure

```
server/
├── src/
│   ├── config/
│   ├── controllers/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── menu/
│   │   ├── inventory/
│   │   ├── orders/
│   │   ├── reservations/
│   │   └── suppliers/
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   └── role.middleware.js
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── utils/
├── server.js
└── package.json
```

---

# ✅ Features

✅ JWT Authentication
✅ Role-Based Access Control (Admin / Chef / Waiter)
✅ Menu Management
✅ Inventory Tracking & Low Stock Alerts
✅ Order Management with KOT Workflow
✅ Supplier Management
✅ Table Reservation System
✅ Audit Logs
✅ Swagger API Documentation
✅ Input Validation
✅ Centralized Error Handling
