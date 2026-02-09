# Ticketa — Event Ticketing Platform

A full-stack event ticketing web application where **admins** create and manage events and **participants** browse events and make reservations. Built with **NestJS** (backend), **Next.js** (frontend), and **MongoDB** (database).

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [Option A — Docker (Recommended)](#option-a--docker-recommended)
  - [Option B — Run Locally Without Docker](#option-b--run-locally-without-docker)
- [Environment Variables](#environment-variables)
- [API Documentation (Swagger)](#api-documentation-swagger)
- [User Roles](#user-roles)
- [API Endpoints](#api-endpoints)
- [Default Test Accounts](#default-test-accounts)
- [Running Tests](#running-tests)
- [Troubleshooting](#troubleshooting)

---

## Features

- **Authentication** — Register / Login with JWT-based auth (Bearer tokens)
- **Role-based Access** — Admin and Participant roles with route guards
- **Event Management** (Admin) — Create, update, publish, cancel, and delete events
- **Event Browsing** (Public) — View all published events, search by name or location
- **Reservations** — Participants can reserve tickets; Admins can confirm or refuse
- **Ticket PDF Download** — Download a PDF ticket for confirmed reservations
- **Admin Dashboard** — Statistics overview (total events, fill rate, reservations)
- **Participant Dashboard** — View personal reservations and their status
- **Swagger API Docs** — Interactive API documentation at `/api`

---

## Tech Stack

| Layer     | Technology                                                     |
| --------- | -------------------------------------------------------------- |
| Frontend  | Next.js 16, React 19, Redux Toolkit, Tailwind CSS 4, Axios    |
| Backend   | NestJS 11, Mongoose (MongoDB ODM), Passport JWT, Swagger, PDFKit |
| Database  | MongoDB 7                                                      |
| Dev Tools | Docker & Docker Compose, TypeScript, ESLint, Prettier, Jest    |

---

## Project Structure

```
Ticketa/
├── docker-compose.yml        # Orchestrates all 3 services
├── README.md
│
├── backend/                  # NestJS REST API (port 3000)
│   ├── Dockerfile
│   ├── package.json
│   ├── request.http          # Sample HTTP requests for testing
│   └── src/
│       ├── main.ts           # App bootstrap + Swagger setup
│       ├── app.module.ts     # Root module
│       ├── auth/             # Register, Login, JWT strategy
│       ├── user/             # User CRUD (Admin)
│       ├── event/            # Event CRUD + publish/cancel
│       ├── reservation/      # Reservation CRUD + PDF ticket
│       ├── common/           # Guards, decorators, enums, filters
│       └── config/           # MongoDB config
│
└── frontend/                 # Next.js app (port 3001)
    ├── Dockerfile
    ├── package.json
    └── src/
        ├── app/              # Pages & layouts (App Router)
        │   ├── page.tsx      # Home — browse published events
        │   ├── (auth)/       # Login & Register pages
        │   ├── dashboard/    # Protected dashboard (admin + participant)
        │   └── events/[id]/  # Single event detail page
        ├── components/       # Reusable UI components
        └── lib/              # API client, Redux store, types
```

---

## Prerequisites

### Option A — Docker (easiest)

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### Option B — Local development

- [Node.js](https://nodejs.org/) **v20** or later
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [MongoDB](https://www.mongodb.com/try/download/community) **v7** running locally on port `27017`  
  _or_ a MongoDB Atlas connection string

---

## Getting Started

### Option A — Docker (Recommended)

This is the fastest way to get everything running. One command starts MongoDB, the backend, and the frontend.

```bash
# 1. Clone the repo
git clone <repository-url>
cd Ticketa

# 2. (Optional) Create a .env file in the project root to override defaults
#    See the "Environment Variables" section below

# 3. Build and start all services
docker compose up --build
```

Wait until you see logs from all three services (mongo, backend, frontend). Then open:

| Service           | URL                          |
| ----------------- | ---------------------------- |
| Frontend          | http://localhost:3001         |
| Backend API       | http://localhost:3000         |
| Swagger API Docs  | http://localhost:3000/api     |

To stop everything:

```bash
docker compose down
```

To stop everything **and delete the database data**:

```bash
docker compose down -v
```

---

### Option B — Run Locally Without Docker

You need **three terminals** — one for MongoDB (if not running as a service), one for the backend, and one for the frontend.

#### 1. Start MongoDB

If MongoDB is installed locally, make sure it's running on port `27017`. On most systems:

```bash
mongod
```

Or if you use MongoDB as a Windows service, it may already be running. You can verify by running:

```bash
mongosh --eval "db.adminCommand('ping')"
```

#### 2. Start the Backend

```bash
cd backend

# Install dependencies
npm install

# Create a .env file
#   (see "Environment Variables" section — you need at least MONGODB_URI and JWT_SECRET)

# Start in development mode (with hot-reload)
npm run start:dev
```

The backend will be available at **http://localhost:3000**.

#### 3. Start the Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start in development mode
npm run dev
```

The frontend will be available at **http://localhost:3001**.

---

## Environment Variables

### Backend (`backend/.env`)

Create a file named `.env` inside the `backend/` folder:

```env
MONGODB_URI=mongodb://localhost:27017/ticketa
JWT_SECRET=your-secret-key-change-this
PORT=3000
```

| Variable      | Description                          | Default (Docker)                       |
| ------------- | ------------------------------------ | -------------------------------------- |
| `MONGODB_URI` | MongoDB connection string            | `mongodb://mongo:27017/ticketa`        |
| `JWT_SECRET`  | Secret key for signing JWT tokens    | `super-secret-change-me`              |
| `PORT`        | Port the backend listens on          | `3000`                                 |

### Frontend

The frontend needs to know where the backend API is. This is set via:

| Variable              | Description                        | Default                    |
| --------------------- | ---------------------------------- | -------------------------- |
| `NEXT_PUBLIC_API_URL` | Backend API base URL               | `http://localhost:3000`    |

- **Docker**: Already configured in `docker-compose.yml`.
- **Local**: The default (`http://localhost:3000`) works out of the box if the backend runs on port 3000.

---

## API Documentation (Swagger)

Once the backend is running, visit:

**http://localhost:3000/api**

This opens an interactive Swagger UI where you can explore and test every API endpoint. You can authorize requests by clicking the **Authorize** button and pasting a JWT token obtained from the login endpoint.

---

## User Roles

| Role          | Capabilities                                                                                  |
| ------------- | --------------------------------------------------------------------------------------------- |
| `admin`       | Create/update/publish/cancel/delete events, manage users, confirm/refuse reservations, view stats |
| `participant` | Browse published events, make reservations, view own reservations, download ticket PDFs         |

When registering, you can specify a `role` field (`"admin"` or `"participant"`). If omitted, defaults to `participant`.

---

## API Endpoints

### Auth

| Method | Endpoint         | Auth | Description                |
| ------ | ---------------- | ---- | -------------------------- |
| POST   | `/auth/register` | No   | Register a new user        |
| POST   | `/auth/login`    | No   | Login, returns JWT token   |
| GET    | `/auth/me`       | Yes  | Get current user info      |

### Events

| Method | Endpoint              | Auth  | Description                            |
| ------ | --------------------- | ----- | -------------------------------------- |
| GET    | `/events`             | No    | List all published events              |
| GET    | `/events/:id`         | No    | Get a single published event           |
| GET    | `/events/admin`       | Admin | List all events (including drafts)     |
| GET    | `/events/admin/:id`   | Admin | Get any event by ID                    |
| GET    | `/events/stats`       | Admin | Get event & reservation statistics     |
| POST   | `/events`             | Admin | Create a new event                     |
| PATCH  | `/events/:id`         | Admin | Update an event                        |
| PATCH  | `/events/:id/publish` | Admin | Publish an event                       |
| PATCH  | `/events/:id/cancel`  | Admin | Cancel an event                        |
| DELETE | `/events/:id`         | Admin | Delete an event                        |

### Reservations

| Method | Endpoint                    | Auth  | Description                              |
| ------ | --------------------------- | ----- | ---------------------------------------- |
| POST   | `/reservations`             | Yes   | Create a reservation (pass `eventId`)    |
| GET    | `/reservations`             | Yes   | List reservations (filtered by role)     |
| GET    | `/reservations/:id`         | Yes   | Get a single reservation                 |
| PATCH  | `/reservations/:id/confirm` | Admin | Confirm a reservation                    |
| PATCH  | `/reservations/:id/refuse`  | Admin | Refuse a reservation                     |
| DELETE | `/reservations/:id`         | Yes   | Cancel/delete a reservation              |
| GET    | `/reservations/:id/pdf`     | Yes   | Download reservation ticket as PDF       |

### Users

| Method | Endpoint        | Auth  | Description               |
| ------ | --------------- | ----- | ------------------------- |
| GET    | `/user`         | Admin | List all users            |
| GET    | `/user/profile` | Yes   | Get own profile           |
| GET    | `/user/:id`     | Admin | Get user by ID            |
| PATCH  | `/user/:id`     | Admin | Update a user             |
| DELETE | `/user/:id`     | Admin | Delete a user             |

> **Auth legend**: "No" = public, "Yes" = any authenticated user, "Admin" = admin role required.

---

## Default Test Accounts

There are no seeded accounts. Register your first user via the UI or API:

**Register an admin** (via API):

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "password123",
    "confirmPassword": "password123",
    "role": "admin"
  }'
```

**Register a participant** (via UI):

Go to http://localhost:3001/register and fill in the form.

---

## Running Tests

### Backend Unit Tests

```bash
cd backend
npm test
```

### Backend E2E Tests

```bash
cd backend
npm run test:e2e
```

### Backend Test Coverage

```bash
cd backend
npm run test:cov
```

### Linting

```bash
# Backend
cd backend
npm run lint

# Frontend
cd frontend
npm run lint
```

---

## Troubleshooting

### "Cannot connect to MongoDB"

- **Docker**: Make sure Docker Desktop is running. Run `docker compose up --build` and wait for the mongo health check to pass.
- **Local**: Ensure MongoDB is running on `localhost:27017`. Check with `mongosh --eval "db.adminCommand('ping')"`.

### Backend starts but frontend shows network errors

- Make sure the backend is running on port **3000** before starting the frontend.
- If you changed the backend port, update `NEXT_PUBLIC_API_URL` accordingly.

### "Port 3000 already in use"

- Another process is using port 3000. Find and stop it:
  ```bash
  # Windows
  netstat -ano | findstr :3000
  taskkill /PID <PID> /F

  # macOS/Linux
  lsof -i :3000
  kill -9 <PID>
  ```

### Docker build fails on `bcrypt`

- This is handled in the Dockerfile (Alpine build dependencies are installed). If you still see issues, try `docker compose build --no-cache`.

### "Module not found" errors after pulling new changes

- Delete `node_modules` and reinstall:
  ```bash
  rm -rf node_modules
  npm install
  ```

### JWT token expired / Unauthorized

- Tokens expire. Log in again to get a new token.
- Make sure `JWT_SECRET` is the same value between restarts (especially in Docker if you override it via `.env`).
