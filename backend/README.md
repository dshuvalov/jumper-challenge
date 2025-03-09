# 🚀 Jumper challenge backend

## 🛠️ Getting Started

### Step 1: 🚀 Initial Setup

- Install dependencies: `npm install`

### Step 2: ⚙️ Environment Configuration

- Decrypt `.env.enc` and `.env.local.enc` via `openssl`
```shell
openssl enc -aes-256-cbc -d -salt -pbkdf2 -in .env.enc -out .env -pass pass:<PASSWORD>
openssl enc -aes-256-cbc -d -salt -pbkdf2 -in .env.local.enc -out .env.local -pass pass:<PASSWORD>
```

### Step 3: 🏃‍♂️ Running the Project

- Development Mode: `npm run dev`
- Building: `npm run build`
- Production Mode: Set `.env` to `NODE_ENV="production"` then `npm run build && npm run start`

## Overview
### Key Features
- **Authentication & Session Management**:
  Authentication and session management are handled seamlessly using the **iron-session** library to ensure secure and efficient storage of user sessions. This approach provides cryptographically secure, serverless session data, reducing complexity while maintaining robust security.
- **Middleware-Driven Architecture**:
  The project takes advantage of the middleware pattern to ensure clean, modular, and reusable code for common tasks like:
    - Rate limiting
    - Authentication
    - Error handling
    - Logging requests

- **API Design**:
  RESTful APIs with a focus on clean and well-documented routes. Includes:
    - `health-check`: Basic route to check server uptime.
    - `auth`: User authentication endpoints.
    - `wallets`: Handles wallet-related operations.

- **Security**:
  Implemented security best practices using libraries like:
    - **helmet**: Provides basic security by setting HTTP response headers.
    - **cors**: Configured for restricted origins, enabling cross-origin requests securely.
    - **express-rate-limit**: To handle clients' rate of requests and prevent abuse.

- **Documentation**:
  Integrated OpenAPI documentation served via Swagger UI.

### Libraries & Technologies
- **Express.js**: Backend framework used to manage routing and middleware.
- **iron-session**: For robust session management.
- **Helmet**: Secures HTTP headers.
- **Cors**: Manages cross-origin resource sharing.
- **Pino**: High-performance logging.
- **Zod + OpenAPI**: For schema validation and API documentation.

## Code Organization
The codebase is designed for scalability and maintainability:
- **api/***: Defines feature-specific routes grouped logically (e.g., `authRouter`, `walletsRouter`).
- **api-docs**: Defines OpenAPI and Swagger document generator and router.
- **common/middleware** folder: Contains reusable logic for authentication, rate limiting, and error handling.
- **common/models** folder: Contains app models: Typescript typings and zod schemas.
- **common/third-parties** folder: Contains third-party SDKs.
- **common/utils**: Environment configuration, logging, and other shared helper functions.
- **

## Iron-Session for Authentication
For smooth and secure user authentication, the project integrates the **iron-session** library. This implementation ensures:
1. **Encrypted Cookies**: Session data is stored as encrypted cookies to provide secure and serverless state management.
2. **Performance**: Reduces server overhead by avoiding database lookups for session data.
3. **Flexibility**: Works seamlessly with stateless authentication to improve scalability.
