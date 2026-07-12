# 🚀 AssetFlow – Enterprise Asset & Resource Management System

> A modern ERP-style Asset Management System designed to streamline asset lifecycle management, resource allocation, maintenance workflows, and organizational audits.

---

# 📌 Project Overview

AssetFlow is a full-stack Enterprise Resource Planning (ERP) application built to help organizations efficiently manage physical assets throughout their lifecycle.

The system enables administrators to manage assets, employees, departments, locations, allocations, transfers, bookings, maintenance requests, and audit cycles from a single platform.

Inspired by enterprise solutions like Odoo, AssetFlow focuses on scalability, security, clean architecture, and an intuitive user experience.

---

# ❗ Problem Statement

Organizations often struggle with:

- Manual asset tracking
- Asset misplacement
- Poor allocation visibility
- Lack of maintenance workflows
- Missing audit history
- Resource booking conflicts
- Decentralized asset information

These challenges lead to increased operational costs, poor asset utilization, compliance issues, and inefficient workflows.

AssetFlow addresses these problems by providing a centralized platform that automates asset management and organizational workflows.

---

# ✨ Features

## Authentication
- JWT Authentication
- Refresh Token Authentication
- Protected Routes
- Role-based Access Control

## Dashboard
- Live Statistics
- Recent Activities
- Pending Approvals
- Quick Insights

## Asset Management
- Asset CRUD
- Categories
- Status Tracking
- Asset Details

## Organization Setup
- Departments
- Locations
- Employees

## Allocation & Transfer
- Allocate Assets
- Return Assets
- Transfer Between Locations
- Approval Workflow

## Resource Booking
- Meeting Rooms
- Vehicles
- Equipment
- Conflict Detection

## Maintenance Management
- Maintenance Requests
- Kanban Workflow
- Technician Assignment
- Resolution Tracking

## Asset Audit
- Audit Cycles
- Asset Verification
- Discrepancy Reports
- Audit History

---

# 🛠 Tech Stack

## Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Query
- React Hook Form
- Zod
- React Router
- Lucide Icons

## Backend

- Node.js
- Express.js
- TypeScript

## Database

- PostgreSQL

## Authentication

- JWT
- HTTP-only Cookies

---

# 🏗 Architecture

```text
                     +-----------------------+
                     |      React Frontend   |
                     |-----------------------|
                     | Dashboard             |
                     | Assets                |
                     | Organization          |
                     | Allocation            |
                     | Booking               |
                     | Maintenance           |
                     | Audit                 |
                     +-----------+-----------+
                                 |
                           REST APIs
                                 |
                     +-----------v-----------+
                     |     Express Server    |
                     |-----------------------|
                     | Authentication        |
                     | Assets Module         |
                     | Organization Module   |
                     | Booking Module        |
                     | Maintenance Module    |
                     | Audit Module          |
                     +-----------+-----------+
                                 |
                           PostgreSQL
```

---

# 🗄 Database Schema

```text
Users
-----
id
name
email
password
role_id

Roles
-----
id
name

Departments
-----------
id
name

Locations
---------
id
name

Employees
---------
id
user_id
department_id
location_id

Assets
------
id
asset_code
name
category
status
location_id

Allocations
-----------
id
asset_id
employee_id
allocated_at
returned_at

Transfers
----------
id
asset_id
from_location
to_location
status

Bookings
--------
id
resource_id
employee_id
start_time
end_time

Resources
---------
id
name
type
status

Maintenance
-----------
id
asset_id
issue
priority
status
technician
cost

Audits
------
id
department
start_date
end_date

Audit_Items
-----------
id
audit_id
asset_id
verification_status
remarks

Activity_Logs
-------------
id
entity
action
performed_by
created_at
```

---

# 📁 Folder Structure

```text
AssetFlow
│
├── frontend
│   ├── src
│   │   ├── components
│   │   ├── pages
│   │   ├── hooks
│   │   ├── context
│   │   ├── services
│   │   ├── layouts
│   │   ├── routes
│   │   ├── types
│   │   └── utils
│   │
│   └── public
│
├── backend
│   ├── server
│   │   ├── modules
│   │   ├── middleware
│   │   ├── routes
│   │   ├── db
│   │   ├── services
│   │   └── utils
│
└── README.md
```

---

# ⚙ Installation

## Clone Repository

```bash
git clone https://github.com/your-username/AssetFlow.git
```

```bash
cd AssetFlow
```

---

## Backend

```bash
cd backend

npm install

npm run dev
```

---

## Frontend

```bash
cd frontend

npm install

npm run dev
```

---

## Environment Variables

Create `.env`

```env
DATABASE_URL=

JWT_SECRET=

REFRESH_SECRET=

PORT=5000
```

---

# 📡 API Documentation

## Authentication

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | /auth/login | Login |
| POST | /auth/logout | Logout |
| POST | /auth/refresh | Refresh Token |

---

## Assets

| Method | Endpoint |
|---------|----------|
| GET | /assets |
| GET | /assets/:id |
| POST | /assets |
| PUT | /assets/:id |
| DELETE | /assets/:id |

---

## Organization

### Departments

```
GET /departments
POST /departments
PUT /departments/:id
DELETE /departments/:id
```

### Locations

```
GET /locations
POST /locations
PUT /locations/:id
DELETE /locations/:id
```

### Employees

```
GET /employees
POST /employees
PUT /employees/:id
DELETE /employees/:id
```

---

## Allocations

```
GET /allocations
POST /allocations
PUT /allocations/:id
```

---

## Transfers

```
GET /transfers
POST /transfers
PUT /transfers/:id
```

---

## Bookings

```
GET /bookings
POST /bookings
PUT /bookings/:id
DELETE /bookings/:id
```

---

## Maintenance

```
GET /maintenance
POST /maintenance
PUT /maintenance/:id
```

---

## Audits

```
GET /audits
POST /audits
PUT /audits/:id
```

---

# 🔒 Security

- JWT Authentication
- Refresh Token Rotation
- HTTP-only Cookies
- Input Validation with Zod
- Protected Routes
- Role-based Authorization

---

# 🚀 Future Improvements

- QR Code Asset Tracking
- Barcode Scanner Integration
- Asset Depreciation Module
- Predictive Maintenance
- Email Notifications
- Push Notifications
- Advanced Analytics Dashboard
- AI-powered Asset Insights
- Mobile Application
- Multi-organization Support
- Document Management
- Digital Signature Workflow
- Report Export (PDF/Excel)
- Calendar Integration

---

# 👨‍💻 Team

Developed for the **Odoo Hackathon**.

---

# 📄 License

This project is intended for educational and hackathon purposes.
