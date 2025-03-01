# TAlkai247 Daily

A modern AI-powered communication platform that helps you manage and automate your daily conversations.

## Server Setup

### Prerequisites
- Node.js (v20.x recommended)
- PostgreSQL database
- npm or yarn

### Environment Variables
Create a `.env` file in the `server` directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/talkai247"

# JWT
JWT_SECRET="your-secret-key-here"
JWT_EXPIRES_IN="24h"

# OpenRouter
OPENROUTER_API_KEY="your-openrouter-api-key"
OPENROUTER_BASE_URL="https://openrouter.ai/api/v1"
```

### Database Setup
1. Create a PostgreSQL database named `talkai247`
2. Run Prisma migrations:
```bash
cd server
npx prisma migrate deploy
```

### Installation & Running
1. Install dependencies:
```bash
cd server
npm install
```

2. Start the development server:
```bash
npm run dev
```

The server will run on `http://localhost:3000`.

### Managing the Server

#### Starting the Server
You can start the server in two ways:

1. Using npm (recommended for development):
```bash
npm run dev
```

2. Using Node directly:
```bash
node server/index.js
```

#### Troubleshooting Server Issues

If you encounter the "Port 3000 is already in use" error:

1. Find the process using port 3000:
```bash
lsof -i :3000
```

2. Kill the existing process (replace [PID] with the process ID from step 1):
```bash
kill -9 [PID]
```

3. Start the server again using one of the methods above.

### Authentication Endpoints

#### Register a New User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <your-jwt-token>
```

### Troubleshooting Common Issues

#### TypeScript/Module Issues
If you encounter TypeScript or module-related errors:
1. Check `tsconfig.json` is configured for CommonJS:
```json
{
  "compilerOptions": {
    "module": "CommonJS",
    "moduleResolution": "node"
  }
}
```
2. Ensure import statements don't use .js extensions
3. Make sure `package.json` doesn't have `"type": "module"`

### Database Reset
If you need to reset the database:
1. Drop the existing database:
```sql
DROP DATABASE talkai247;
CREATE DATABASE talkai247;
```

2. Run migrations again:
```bash
npx prisma migrate reset --force
```

This will create a fresh database with the default schema and no data.

## Client Setup

[Client setup instructions to be added]

## License

[License information to be added]