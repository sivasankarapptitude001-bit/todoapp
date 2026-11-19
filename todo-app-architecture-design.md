# Todo Application --- Overall Architecture & Design

**Document version:** 1.0\
**Status:** Proposed MVP design\
**Deployment target:** Local development

------------------------------------------------------------------------

## 1. Purpose and scope

This document describes the architecture and implementation design for a
small Todo application. Users can create accounts, authenticate, and
manage their own todo items.

The first release is an MVP. It prioritizes a simple, maintainable
design while keeping clear boundaries between application modules.

### 1.1 Functional requirements

1.  Users can register with a username and password.
2.  Users can log in.
3.  Authenticated users can create todo items.
4.  Users can view their own todo items.
5.  Users can update a todo item's name.
6.  Users can delete their own todo items.
7.  Users can mark a task as complete and reopen it.

### 1.2 Core business rules

-   A user can own multiple tasks.
-   Every task belongs to exactly one user.
-   A user can only read, update, complete, or delete their own tasks.
-   A task is pending when `completion_date` is `NULL`.
-   A task is completed when `completion_date` has a value.
-   Deleting a user cascades to their tasks.
-   Passwords are never stored in plaintext.

### 1.3 Out of scope for the MVP

The following are intentionally deferred: task due dates, priorities,
categories, descriptions, recurring tasks, reminders, sharing, social
login, password reset, refresh-token rotation, and production cloud
deployment.

------------------------------------------------------------------------

## 2. Technology stack

  -----------------------------------------------------------------------
  Area                    Technology              Purpose
  ----------------------- ----------------------- -----------------------
  Frontend                React.js + TypeScript   User interface

  Frontend build tool     Vite                    Local development and
                                                  build

  Frontend routing        React Router            Page navigation

  Frontend API client     Axios                   HTTP communication

  Frontend auth state     React Context           Authentication state

  Backend                 Node.js + Express.js +  REST API
                          TypeScript              

  ORM                     Sequelize               Models, queries, and
                                                  migrations

  Database                PostgreSQL              Persistent relational
                                                  storage

  Validation              Zod                     Request validation

  Authentication          JWT                     Stateless access-token
                                                  authentication

  Password hashing        bcrypt                  Secure password hashing

  Backend tests           Jest + Supertest        Unit and API
                                                  integration tests

  Frontend tests          React Testing Library   Component and
                                                  interaction tests

  Local database runtime  Docker Compose          Run PostgreSQL locally
  -----------------------------------------------------------------------

**Architecture style:** Modular monolith with layered backend modules.

A modular monolith is appropriate for this scope. It avoids the
operational overhead of microservices while keeping responsibilities
separated so the application can evolve.

------------------------------------------------------------------------

## 3. High-level architecture

``` mermaid
flowchart TB
    U[User / Browser]
    FE[React Frontend]
    API[Express REST API]
    MW[Middleware: Authentication, Validation, Error Handling]
    AUTH[Auth Module]
    TASK[Task Module]
    USER[User Module]
    ORM[Sequelize ORM]
    DB[(PostgreSQL)]

    U --> FE
    FE <-->|HTTPS / JSON| API
    API --> MW
    MW --> AUTH
    MW --> TASK
    AUTH --> USER
    AUTH --> ORM
    TASK --> ORM
    USER --> ORM
    ORM --> DB
```

### 3.1 Component responsibilities

  -----------------------------------------------------------------------
  Component                           Responsibility
  ----------------------------------- -----------------------------------
  React frontend                      Renders pages and manages user
                                      interactions

  Express API                         Exposes versioned REST endpoints

  Authentication middleware           Verifies JWT and identifies the
                                      current user

  Validation middleware/schemas       Validates request parameters and
                                      bodies

  Auth module                         Registration and login use cases

  User module                         User model and user persistence

  Task module                         Task CRUD and completion use cases

  Services                            Enforce business rules

  Repositories                        Encapsulate persistence queries

  Sequelize                           Maps TypeScript models to
                                      PostgreSQL

  PostgreSQL                          Stores users and tasks
  -----------------------------------------------------------------------

The frontend communicates only with the backend API. It never connects
directly to the database.

------------------------------------------------------------------------

## 4. Database design

The MVP uses two tables: `users` and `tasks`.

### 4.1 Entity relationship

``` mermaid
erDiagram
    USERS ||--o{ TASKS : owns

    USERS {
        uuid id PK
        varchar username UK
        varchar password_hash
        timestamptz created_at
        timestamptz updated_at
    }

    TASKS {
        uuid id PK
        uuid user_id FK
        varchar name
        timestamptz completion_date
        timestamptz created_at
        timestamptz updated_at
    }
```

### 4.2 `users` table

  Column            Type           Constraints        Description
  ----------------- -------------- ------------------ -----------------------
  `id`              UUID           Primary key        User identifier
  `username`        VARCHAR(100)   NOT NULL, UNIQUE   Login username
  `password_hash`   VARCHAR(255)   NOT NULL           bcrypt password hash
  `created_at`      TIMESTAMPTZ    NOT NULL           Creation timestamp
  `updated_at`      TIMESTAMPTZ    NOT NULL           Last update timestamp

### 4.3 `tasks` table

  -------------------------------------------------------------------------
  Column              Type              Constraints       Description
  ------------------- ----------------- ----------------- -----------------
  `id`                UUID              Primary key       Task identifier

  `user_id`           UUID              NOT NULL, FK to   Task owner
                                        `users.id`        

  `name`              VARCHAR(255)      NOT NULL          Task name

  `completion_date`   TIMESTAMPTZ       NULL              Completion
                                                          timestamp; NULL
                                                          means pending

  `created_at`        TIMESTAMPTZ       NOT NULL          Creation
                                                          timestamp

  `updated_at`        TIMESTAMPTZ       NOT NULL          Last update
                                                          timestamp
  -------------------------------------------------------------------------

An explicit `status` column is not needed in the MVP because completion
can be derived from `completion_date`. If the task lifecycle becomes
more complex, a status field can be introduced later.

### 4.4 Initial SQL schema

Sequelize migrations should be the source of truth for schema changes.
The following SQL illustrates the intended initial schema:

``` sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    completion_date TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_tasks_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_tasks_user_id ON tasks(user_id);
```

The database UUID-generation strategy must be consistent with the
Sequelize model and migration configuration. The application may
generate UUIDs instead of relying on a database extension.

------------------------------------------------------------------------

## 5. Backend architecture

### 5.1 Layered request flow

``` mermaid
flowchart TD
    R[HTTP Request] --> ROUTE[Route]
    ROUTE --> AUTH[Authentication Middleware]
    AUTH --> VALIDATE[Request Validation]
    VALIDATE --> CTRL[Controller]
    CTRL --> SERVICE[Service / Business Logic]
    SERVICE --> REPO[Repository]
    REPO --> MODEL[Sequelize Model]
    MODEL --> DB[(PostgreSQL)]
    DB --> MODEL
    MODEL --> REPO
    REPO --> SERVICE
    SERVICE --> CTRL
    CTRL --> RESP[HTTP Response]
```

### 5.2 Layer responsibilities

-   **Routes:** Map HTTP methods and paths to middleware and
    controllers.
-   **Controllers:** Read validated input, call services, and translate
    results into HTTP responses.
-   **Services:** Implement business rules and coordinate repository
    operations.
-   **Repositories:** Encapsulate database access and ownership-scoped
    queries.
-   **Models:** Define Sequelize mappings and relationships.
-   **Validation:** Validate request bodies, route parameters, and query
    parameters.
-   **Middleware:** Handle authentication, not-found responses, and
    errors.

Controllers should not contain SQL or Sequelize queries. Services should
not depend on Express request or response objects.

### 5.3 Suggested backend folder structure

``` text
todo-backend/
├── src/
│   ├── config/
│   │   ├── database.ts
│   │   ├── environment.ts
│   │   └── jwt.ts
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.validation.ts
│   │   ├── users/
│   │   │   ├── user.model.ts
│   │   │   └── user.repository.ts
│   │   └── tasks/
│   │       ├── task.routes.ts
│   │       ├── task.controller.ts
│   │       ├── task.service.ts
│   │       ├── task.repository.ts
│   │       ├── task.model.ts
│   │       └── task.validation.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── not-found.middleware.ts
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   ├── common/
│   │   ├── errors/
│   │   ├── types/
│   │   └── utils/
│   ├── app.ts
│   └── server.ts
├── tests/
│   ├── unit/
│   └── integration/
├── .env.example
├── .gitignore
├── .sequelizerc
├── package.json
└── tsconfig.json
```

------------------------------------------------------------------------

## 6. API design

All endpoints use the `/api/v1` prefix and JSON request/response bodies.

### 6.1 Authentication endpoints

  ---------------------------------------------------------------------------------
  Method           Endpoint                          Auth required Purpose
  ---------------- ------------------------- --------------------- ----------------
  POST             `/api/v1/auth/register`                      No Create an
                                                                   account

  POST             `/api/v1/auth/login`                         No Authenticate and
                                                                   issue an access
                                                                   token
  ---------------------------------------------------------------------------------

#### Register request

``` json
{
  "username": "siva",
  "password": "MyPassword123"
}
```

#### Register response --- `201 Created`

``` json
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "username": "siva"
  }
}
```

The response must never include the password or password hash.

#### Login request

``` json
{
  "username": "siva",
  "password": "MyPassword123"
}
```

#### Login response --- `200 OK`

``` json
{
  "success": true,
  "data": {
    "accessToken": "jwt-token",
    "user": {
      "id": "user-uuid",
      "username": "siva"
    }
  }
}
```

### 6.2 Task endpoints

All task endpoints require authentication.

  Method   Endpoint                         Purpose
  -------- -------------------------------- -------------------------------------
  POST     `/api/v1/tasks`                  Create a task
  GET      `/api/v1/tasks`                  List the authenticated user's tasks
  GET      `/api/v1/tasks/:id`              Get one task owned by the user
  PUT      `/api/v1/tasks/:id`              Update a task name
  PATCH    `/api/v1/tasks/:id/completion`   Complete or reopen a task
  DELETE   `/api/v1/tasks/:id`              Delete a task

#### Create task request

``` json
{
  "name": "Complete architecture design"
}
```

#### Update task request

``` json
{
  "name": "Complete architecture and LLD"
}
```

#### Completion request

``` json
{
  "completed": true
}
```

When `completed` is true, the service sets `completion_date` to the
current timestamp. When false, it sets `completion_date` to `NULL`.

#### Example task response

``` json
{
  "success": true,
  "data": {
    "id": "task-uuid",
    "name": "Complete architecture design",
    "completionDate": null,
    "createdAt": "2026-11-20T10:00:00.000Z",
    "updatedAt": "2026-11-20T10:00:00.000Z"
  }
}
```

### 6.3 API behavior and status codes

  HTTP status   Meaning
  ------------- ---------------------------------------------
  200           Successful read or update
  201           Resource created
  204           Resource deleted; no response body
  400           Invalid request
  401           Missing, invalid, or expired authentication
  404           Resource not found or not owned by the user
  409           Username already exists
  500           Unexpected server error

Use a consistent error response:

``` json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Task name is required"
  }
}
```

------------------------------------------------------------------------

## 7. Authentication and authorization

### 7.1 Registration flow

``` mermaid
sequenceDiagram
    actor User
    participant API as Express API
    participant Auth as Auth Service
    participant DB as PostgreSQL

    User->>API: POST /auth/register
    API->>API: Validate request
    API->>Auth: Register username and password
    Auth->>DB: Find username
    DB-->>Auth: Existing user or not found
    Auth->>Auth: Hash password with bcrypt
    Auth->>DB: Insert user
    DB-->>Auth: Created user
    Auth-->>API: Safe user details
    API-->>User: 201 Created
```

### 7.2 Login flow

``` mermaid
sequenceDiagram
    actor User
    participant API as Express API
    participant Auth as Auth Service
    participant DB as PostgreSQL

    User->>API: POST /auth/login
    API->>API: Validate request
    API->>Auth: Authenticate credentials
    Auth->>DB: Find user by username
    DB-->>Auth: User and password hash
    Auth->>Auth: Compare password using bcrypt
    Auth->>Auth: Sign JWT
    Auth-->>API: Token and safe user details
    API-->>User: 200 OK
```

### 7.3 JWT design

Use a signed JWT with a subject claim identifying the user.

Example decoded payload:

``` json
{
  "sub": "user-uuid",
  "username": "siva",
  "iat": 1795168800,
  "exp": 1795172400
}
```

Initial access-token expiry: one hour.

The JWT signing secret must be supplied through an environment variable
and must be a strong random value. Do not hardcode it in source code.

### 7.4 Token transport

For the browser-based React application, prefer an `HttpOnly`, `Secure`,
`SameSite` cookie over storing JWTs in `localStorage`.

-   `HttpOnly` prevents frontend JavaScript from reading the token.
-   `Secure` should be enabled in HTTPS environments.
-   `SameSite` should be configured according to the deployment
    topology.
-   If cross-site cookies are required, use appropriate CSRF protection.
-   Configure CORS to allow only the expected frontend origin and
    credentials.

For local development over HTTP, cookie settings must be adjusted for
the local environment. Do not treat local cookie settings as production
settings.

### 7.5 Authorization and task ownership

The authenticated user ID must come from the verified JWT, not from a
client-provided `user_id`.

Every task query must be scoped by both task ID (where applicable) and
authenticated user ID.

Example:

``` sql
SELECT *
FROM tasks
WHERE id = :task_id
  AND user_id = :authenticated_user_id;
```

The same ownership condition must apply to updates and deletes. This
prevents insecure direct object reference vulnerabilities.

------------------------------------------------------------------------

## 8. Frontend architecture

### 8.1 Screens

1.  **Login:** Username, password, login action, and registration link.
2.  **Registration:** Username, password, confirm-password field, and
    create-account action.
3.  **Dashboard:** List tasks, create tasks, edit names, mark complete,
    reopen, and delete.
4.  **Edit task:** A form or modal for updating the task name.

### 8.2 Frontend folder structure

``` text
todo-frontend/
├── src/
│   ├── api/
│   │   ├── axios.ts
│   │   ├── auth.api.ts
│   │   └── task.api.ts
│   ├── components/
│   │   ├── common/
│   │   └── tasks/
│   │       ├── TaskItem.tsx
│   │       ├── TaskList.tsx
│   │       └── TaskForm.tsx
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   └── Dashboard.tsx
│   ├── context/
│   │   └── AuthContext.tsx
│   ├── hooks/
│   │   └── useTasks.ts
│   ├── routes/
│   │   └── ProtectedRoute.tsx
│   ├── types/
│   │   ├── auth.types.ts
│   │   └── task.types.ts
│   ├── App.tsx
│   └── main.tsx
├── .env.example
└── package.json
```

### 8.3 Frontend responsibilities

-   React Router handles page navigation.
-   A protected route prevents unauthenticated users from accessing the
    dashboard.
-   React Context stores the current authenticated user's safe profile
    and authentication state.
-   Axios provides a shared API client.
-   The API client sends credentials when cookie-based authentication is
    used.
-   Task components render task data and invoke API operations.
-   Loading, empty, validation, and error states should be represented
    in the UI.

React Context is sufficient for this MVP. A separate state-management
library is not necessary yet.

------------------------------------------------------------------------

## 9. Configuration and local development

### 9.1 Backend environment variables

Example `.env.example`:

``` dotenv
NODE_ENV=development
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=todo_db
DB_USER=todo_user
DB_PASSWORD=change_me

JWT_SECRET=replace_with_a_strong_random_secret
JWT_EXPIRES_IN=1h

BCRYPT_ROUNDS=12

FRONTEND_URL=http://localhost:5173
```

Validate required environment variables at startup. Do not commit real
`.env` files or secrets to source control.

### 9.2 Frontend environment variables

Example `.env.example`:

``` dotenv
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

Only non-secret configuration should be exposed to the frontend.

### 9.3 Local development topology

  Component      Address
  -------------- -------------------------
  React / Vite   `http://localhost:5173`
  Express API    `http://localhost:3000`
  PostgreSQL     `localhost:5432`

Recommended local setup:

-   Run PostgreSQL in Docker Compose.
-   Run Express directly on the developer machine.
-   Run React directly on the developer machine.
-   Use separate terminal sessions for frontend and backend.
-   Use Sequelize migrations to create and evolve the schema.

------------------------------------------------------------------------

## 10. Error handling and validation

### 10.1 Validation rules

Initial suggested rules:

  Field             Rules
  ----------------- ----------------------------------------------
  Username          Required, trimmed, 3--100 characters, unique
  Password          Required, minimum 12 characters recommended
  Task name         Required, trimmed, 1--255 characters
  Task ID           Must be a valid UUID
  Completion flag   Must be a boolean

The exact username character policy can be finalized during
implementation. Passwords should not be trimmed or silently transformed.

### 10.2 Error handling

Use a centralized Express error-handling middleware.

-   Validation failures return `400`.
-   Invalid or expired JWTs return `401`.
-   Missing or non-owned task resources return `404`.
-   Duplicate usernames return `409`.
-   Unexpected errors return `500` with a generic message.

Do not expose stack traces, SQL errors, password hashes, or secrets in
API responses.

------------------------------------------------------------------------

## 11. Testing strategy

  -----------------------------------------------------------------------
  Test level              Tool                    Scope
  ----------------------- ----------------------- -----------------------
  Backend unit            Jest                    Services and business
                                                  rules

  Backend integration     Jest + Supertest        API routes and
                                                  middleware

  Database integration    PostgreSQL test         Migrations,
                          database                constraints, ownership
                                                  queries

  Frontend component      React Testing Library   Forms, task components,
                                                  route behavior

  End-to-end              Optional future         Complete user journeys
                          addition                
  -----------------------------------------------------------------------

### 11.1 Authentication test cases

-   Register a new user successfully.
-   Reject an existing username.
-   Reject invalid registration input.
-   Login with valid credentials.
-   Reject an incorrect password.
-   Reject unknown usernames with a generic authentication error.
-   Reject requests with missing, invalid, or expired tokens.
-   Ensure password hashes are never returned.

### 11.2 Task test cases

-   Create a task for the authenticated user.
-   List only the authenticated user's tasks.
-   Fetch a task owned by the authenticated user.
-   Update a task name.
-   Delete a task.
-   Mark a task complete.
-   Reopen a completed task.
-   Reject attempts to read, update, or delete another user's task.
-   Reject invalid task IDs and invalid payloads.

Cross-user access tests are mandatory because task ownership is a
central security requirement.

------------------------------------------------------------------------

## 12. Implementation roadmap

### Phase 1 --- Project foundation

-   Initialize Express + TypeScript.
-   Initialize React + TypeScript + Vite.
-   Configure PostgreSQL.
-   Configure Sequelize.
-   Add database migrations.
-   Add environment validation.
-   Add health-check endpoint.
-   Add centralized error handling.

**Acceptance criteria:** Backend starts, connects to PostgreSQL, runs
migrations, and responds successfully to a health check.

### Phase 2 --- Authentication

-   Implement User model and repository.
-   Implement registration.
-   Hash passwords using bcrypt.
-   Implement login and JWT issuance.
-   Implement authentication middleware.
-   Configure cookie-based token transport.
-   Add authentication tests.

**Acceptance criteria:** Users can register and log in, and protected
routes reject unauthenticated requests.

### Phase 3 --- Task management APIs

-   Implement Task model and repository.
-   Implement task creation and listing.
-   Implement task retrieval and name update.
-   Implement task deletion.
-   Implement completion and reopening.
-   Enforce ownership in every operation.
-   Add unit and integration tests.

**Acceptance criteria:** Authenticated users can manage their own tasks
but cannot access another user's tasks.

### Phase 4 --- Frontend implementation

-   Build registration and login screens.
-   Implement authentication state and protected routes.
-   Build the todo dashboard.
-   Implement task creation, editing, completion, reopening, and
    deletion.
-   Integrate APIs.
-   Add loading, empty, and error states.

**Acceptance criteria:** A user can complete the main todo workflow
through the browser.

### Phase 5 --- Integration and polish

-   Run frontend and backend integration tests.
-   Verify security and ownership scenarios.
-   Verify migrations on a clean database.
-   Add Docker Compose for local PostgreSQL.
-   Document setup and run instructions.

**Acceptance criteria:** A new developer can clone the project,
configure the environment, start the application, and use the MVP
locally.

------------------------------------------------------------------------

## 13. Future enhancements

These are potential extensions, not MVP commitments.

  -----------------------------------------------------------------------
  Enhancement                         Possible design change
  ----------------------------------- -----------------------------------
  Due dates                           Add `due_date` to tasks

  Priority                            Add a priority field

  Categories                          Introduce a categories table and
                                      relationship

  Description                         Add a task description

  Search and filters                  Add query parameters and indexes as
                                      needed

  Pagination                          Add limit/offset or cursor
                                      pagination

  Refresh tokens                      Introduce refresh-token lifecycle
                                      and rotation

  Password reset                      Add time-limited reset tokens

  Soft deletion                       Add `deleted_at`

  Recurring tasks                     Add recurrence configuration

  Production deployment               Add hosting, HTTPS, managed
                                      database, logging, and monitoring
  -----------------------------------------------------------------------

Add these only when the product requirements justify them.

------------------------------------------------------------------------

## 14. Final architectural decisions

  -----------------------------------------------------------------------
  Decision                            Selected approach
  ----------------------------------- -----------------------------------
  Architecture                        Modular monolith

  Backend                             Express.js + Node.js + TypeScript

  Backend layering                    Routes → Controllers → Services →
                                      Repositories → Models

  Frontend                            React.js + TypeScript

  Database                            PostgreSQL

  ORM                                 Sequelize

  Primary keys                        UUID

  Authentication                      JWT

  Password hashing                    bcrypt

  Browser token transport             HttpOnly cookie

  API style                           REST

  API versioning                      `/api/v1`

  Request validation                  Zod

  Frontend auth state                 React Context

  Frontend routing                    React Router

  Backend testing                     Jest + Supertest

  Deployment                          Local development

  Database runtime                    Docker Compose
  -----------------------------------------------------------------------

## 15. Immediate next step

Begin with **Phase 1 --- Project Foundation**.

The first implementation increment should deliver:

1.  Backend project structure and TypeScript configuration.
2.  Express application and server bootstrap.
3.  PostgreSQL Docker Compose configuration.
4.  Sequelize database connection.
5.  Initial `users` and `tasks` migrations.
6.  A `GET /health` endpoint.
7.  Centralized error handling.
8.  README instructions for running the backend and database locally.

Once this foundation is verified, proceed to authentication and then
task management.

------------------------------------------------------------------------

**End of document --- Todo Application Architecture & Design v1.0**
