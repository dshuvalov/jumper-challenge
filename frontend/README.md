# 🚀 Jumper challenge frontend

## Prerequisites
Make sure you have the following installed:
- **Node.js**: v20+ recommended.
- **npm**: v10+ (bundled with Node.js).

## Getting Started

1. Create `.env.local` file and pass API_URL
```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8080
```
2. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Key Technologies
- **React** for building the user interface.
- **Next.js** for server-side rendering and optimized performance.
- **Material-UI (Next.js Edition)** for styling.
- **Wagmi, viem & RainbowKit** for managing wallet connections.
- **React Virtuoso** for list virtualization and smooth scrolling.


## Authentication Flow
The frontend seamlessly integrates with the backend's **iron-session** package and RainbowKitAuthenticationProvider on the frontend:
- On successful login, a session token is stored securely on the session backend and transferred to frontend via `httpOnly` cookie.
- Persistent session management is handled via encrypted cookies.
- Session cookie are used for authenticating subsequent API calls, ensuring a user-friendly and secure experience.
