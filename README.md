# Prisma + PostgreSQL + JWT Auth Task Management API

A backend REST API for managing user tasks (todos) built with **Express**, **TypeScript**, **Prisma ORM v7**, and **PostgreSQL**. It includes user authentication with **JWT (stored in HTTP cookies)**, password hashing with **bcrypt**, input validation using **Zod**, and request timing middleware.

---

## Features

- **User Authentication**: Sign up and sign in with password hashing (`bcrypt`) and JWT cookie-based sessions (`jsonwebtoken` + `cookie-parser`).
- **Schema Validation**: Request body validation for credentials using **Zod**.
- **Task / Todo CRUD**: Create, read, update, and delete user-specific todos stored in PostgreSQL.
- **Prisma ORM v7 + Driver Adapter**: Uses `@prisma/client` with `@prisma/adapter-pg` and `prisma7.config.ts`.
- **Custom Middlewares**:
  - `authmiddleware`: Verifies the JWT token from cookies and attaches the authenticated user's `id` to `res.locals.id`.
  - `timemiddleware`: Logs HTTP method, route, status code, and execution time in milliseconds.

---

## Tech Stack

- **Runtime & Language**: Node.js, TypeScript (`tsx`)
- **Framework**: Express 5
- **Database & ORM**: PostgreSQL, Prisma ORM v7 (`@prisma/client`, `@prisma/adapter-pg`)
- **Authentication & Security**: `jsonwebtoken`, `bcrypt`, `cookie-parser`
- **Validation**: `zod`

---

## Project Structure

```text
├── generated/prisma/       # Generated Prisma Client output
├── lib/
│   └── client-setup.ts     # PrismaPg adapter & PrismaClient initialization
├── prisma/
│   ├── migrations/         # SQL migration files
│   └── schema.prisma       # Prisma data models (User, Posts)
├── index.ts                # Express server & route handlers
├── middleware.ts           # JWT auth middleware & request timing middleware
├── prisma7.config.ts       # Prisma v7 configuration file
├── package.json            # Dependencies and scripts
└── tsconfig.json           # TypeScript configuration
```

---

## Database Schema

Defined in `prisma/schema.prisma`:

```prisma
model User {
  id       Int     @id @default(autoincrement())
  username String  @unique
  password String
  post     Posts[]
}

model Posts {
  id          Int    @id @default(autoincrement())
  title       String @unique
  description String
  userId      Int
  user        User   @relation(fields: [userId], references: [id])
}
```

---

## Getting Started

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- A running **PostgreSQL** database (local or hosted, e.g., Neon, Supabase, Prisma Postgres)

### 2. Clone the Repository & Install Dependencies

```bash
git clone https://github.com/sohail4291/prisma_postgres_jwtAuth_task_mgmt.git
cd week13-prisma-todo
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
SECRET_KEY="your_jwt_secret_key"
PORT=3000
```

### 4. Run Prisma Migrations & Generate Client

```bash
npx prisma migrate dev --config prisma7.config.ts
npx prisma generate --config prisma7.config.ts
```

### 5. Start the Development Server

```bash
npm run dev
```

The server listens on `http://localhost:3000`.

---

## API Endpoints

### Authentication

#### 1. `POST /signup`
Register a new user.

- **Validation Rules**:
  - `username`: 4 to 10 characters
  - `password`: 6 to 14 characters
- **Request Body**:
  ```json
  {
    "username": "john_doe",
    "password": "password123"
  }
  ```
- **Response**:
  ```json
  {
    "user created successfully ": "john_doe"
  }
  ```

#### 2. `POST /signin`
Authenticate a user and receive a `token` cookie (valid for 1 hour).

- **Request Body**:
  ```json
  {
    "username": "john_doe",
    "password": "password123"
  }
  ```
- **Response**:
  ```json
  {
    "user logged in ": "john_doe",
    "token ": "<jwt_token>"
  }
  ```

---

### Todo Management

> **Note:** Protected routes require the `token` cookie set during `/signin`.

#### 3. `GET /get`
Fetch all todos belonging to the authenticated user.

- **Auth Required**: Yes (`authmiddleware`)
- **Response**: Array of todo objects or `"no todos in your bucket"`.

#### 4. `POST /add-todo/`
Create a new todo for the authenticated user.

- **Auth Required**: Yes (`authmiddleware`)
- **Request Body**:
  ```json
  {
    "title": "Buy groceries",
    "description": "Milk, eggs, and bread"
  }
  ```
- **Response**:
  ```json
  {
    "todo added ": {
      "id": 1,
      "title": "Buy groceries",
      "description": "Milk, eggs, and bread",
      "userId": 1
    }
  }
  ```

#### 5. `PUT /edit-todo`
Update an existing todo's title and description by its current `title`.

- **Auth Required**: Yes (`authmiddleware`)
- **Request Body**:
  ```json
  {
    "title": "Buy groceries",
    "newtitle": "Buy weekly groceries",
    "description": "Milk, eggs, bread, and fruits"
  }
  ```
- **Response**: The updated todo object.

#### 6. `DELETE /delete-todo/`
Delete a todo by its `title`.

- **Request Body**:
  ```json
  {
    "title": "Buy weekly groceries"
  }
  ```
- **Response**: The deleted todo object or `"not found"`.

---

## License

ISC
