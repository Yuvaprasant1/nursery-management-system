# Nursery Management System

A comprehensive full-stack application for managing nursery operations, inventory, transactions, and plant cataloging. This system helps nurseries track their inventory, manage sales, and organize plant varieties efficiently.

## 📋 Overview

The Nursery Management System is designed to help nursery owners and managers:
- Track inventory of plants and breeds
- Record sales and transactions
- Manage plant catalog and breeds
- Monitor business metrics through dashboards
- Handle multiple nurseries with user authentication

## ✨ Key Features

### Core Functionality
- **Plant Management**: Organize plants into categories with detailed information
- **Breed Management**: Track different breeds/varieties of plants with pricing and details
- **Inventory Tracking**: Real-time inventory management with automatic quantity tracking
- **Transaction Management**: Record sales, purchases, adjustments, and planting activities with edit capability and inventory validation
- **Payment Management**: Track payments associated with transactions (create, edit, delete payments) with integrated payment details view
- **Dashboard Analytics**: View summary statistics and recent transactions
- **Soft Delete**: All deletions are soft-deleted with audit trails for data integrity
- **Multi-Nursery Support**: Manage multiple nursery locations

### Technical Features
- **JWT Authentication**: Secure phone number-based login system
- **Role-Based Access**: User authentication with auto-creation on first login
- **Audit Trail**: Complete tracking of who created/updated/deleted records and when
- **Compensation Transactions**: Automatic reversal transactions when undoing or deleting transactions
- **Environment Profiles**: Separate configurations for development and production
- **API Documentation**: Auto-generated API documentation with Swagger/OpenAPI

## 🏗️ Architecture

### Application Structure
```
Nursery
 └── Plants (Categories)
      └── Breeds (Sellable Items)
           └── Inventory (1 per breed - tracks quantity)
           └── Transactions (All inventory changes)
```

### Transaction Types
- **SELL**: Selling items (reduces inventory)
- **PLANTED**: Planting items (increases inventory)
- **ADJUST**: Manual adjustment (can increase or decrease)
- **COMPENSATION**: Auto-created for undo/delete operations (reverses original)

## 🛠️ Technology Stack

### Backend (`Nursery-app`)
- **Framework**: Spring Boot 3.2.0
- **Language**: Java 17
- **Database**: Google Cloud Firestore (NoSQL)
- **Authentication**: Spring Security with JWT tokens
- **API Docs**: SpringDoc OpenAPI (Swagger UI)
- **Build Tool**: Gradle
- **Additional**: MapStruct (DTO mapping), Lombok (code generation)

### Frontend (`Nusery-web-frontend`)
- **Framework**: Next.js 14 (React 18)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form with Zod validation
- **HTTP Client**: Axios
- **Build Tool**: Next.js (built-in)

## 📁 Project Structure

```
Nursery/
├── Nursery-app/                    # Spring Boot Backend
│   ├── src/main/java/com/nursery/
│   │   ├── common/                 # Base classes, utilities, exceptions
│   │   ├── entity/                 # Data models
│   │   ├── repository/             # Data access layer (Firestore)
│   │   ├── service/                # Business logic
│   │   ├── controller/             # REST API endpoints
│   │   ├── security/               # JWT authentication
│   │   └── config/                 # Configuration classes
│   ├── src/main/resources/
│   │   ├── application.properties  # Base configuration
│   │   ├── application-dev.properties  # Development profile
│   │   └── application-prod.properties # Production profile
│   └── build.gradle                # Dependencies
│
└── Nusery-web-frontend/            # Next.js Frontend
    ├── src/
    │   ├── app/                    # Next.js App Router pages
    │   ├── components/             # Reusable UI components
    │   ├── screens/                # Screen/page components
    │   ├── api/                    # API client configuration
    │   ├── services/               # API service functions
    │   ├── contexts/               # React contexts (Auth, Theme)
    │   ├── hooks/                  # Custom React hooks
    │   └── utils/                  # Utility functions
    ├── package.json
    └── next.config.js
```

## 🚀 Quick Start

### Prerequisites

- **Java 17+** (for backend)
- **Node.js 18+** and **npm** (for frontend)
- **Google Cloud Project** with Firestore enabled
- **Firebase Service Account** JSON key file
- **Gradle** (included via wrapper, no separate installation needed)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Nursery
```

### 2. Backend Setup

#### Configure Firestore

1. **Create a Google Cloud Project** and enable Firestore
2. **Create a service account** and download the JSON key file
3. **Place the JSON key file** in the project root (or configure path in environment variables)
4. **Set environment variables**:

   **Windows (PowerShell):**
   ```powershell
   $env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\your\service-account-key.json"
   $env:GOOGLE_CLOUD_PROJECT="your-project-id"
   $env:SPRING_PROFILES_ACTIVE="dev"
   ```

   **macOS/Linux:**
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/service-account-key.json"
   export GOOGLE_CLOUD_PROJECT="your-project-id"
   export SPRING_PROFILES_ACTIVE=dev
   ```

#### Run Backend

```bash
cd Nursery-app

# Windows
gradlew.bat bootRun

# macOS/Linux
./gradlew bootRun
```

The backend will start on `http://localhost:8080`

**API Documentation**: Once running, visit `http://localhost:8080/swagger-ui.html` to see all available endpoints.

### 3. Frontend Setup

#### Install Dependencies

```bash
cd Nusery-web-frontend
npm install
```

#### Configure Environment Variables

Create a `.env.development` file:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_APP_NAME=Nursery Management
NEXT_PUBLIC_APP_ENV=development
```

#### Run Frontend

```bash
npm run dev
```

The frontend will start on `http://localhost:3000`

## 🎯 Environment Profiles

### Backend Profiles

The backend supports two profiles: **development** and **production**

**Development Profile** (`dev`):
- Relaxed security settings
- Detailed error messages
- CORS allows localhost origins
- Debug logging enabled
- Rate limiting: 120 requests/minute

**Production Profile** (`prod`):
- Strict security settings
- Hidden error details
- CORS restricted to specific origins
- Info/Warn logging only
- Rate limiting: 60 requests/minute
- Requires strong JWT secret

**Activate Profile:**

```bash
# Windows PowerShell
$env:SPRING_PROFILES_ACTIVE="dev"

# macOS/Linux
export SPRING_PROFILES_ACTIVE=dev
```

Then run the application normally.

### Frontend Environment

Next.js automatically loads environment files based on `NODE_ENV`:
- **Development**: Uses `.env.development` (auto-loaded with `npm run dev`)
- **Production**: Uses `.env.production` (auto-loaded with `npm run build`)

**Important Environment Variables:**
- `NEXT_PUBLIC_API_BASE_URL`: Backend API URL
- `NEXT_PUBLIC_APP_NAME`: Application name
- `NEXT_PUBLIC_APP_ENV`: Environment identifier

## 📡 API Overview

### Authentication
- `POST /auth/login` - Login with phone number (returns JWT token)
- `GET /auth/me` - Get current user information

### Dashboard
- `GET /dashboard/summary?nurseryId={id}` - Get summary statistics
- `GET /dashboard/recent-transactions?nurseryId={id}` - Get recent transactions

### Plants
- `GET /plants?nurseryId={id}` - List all plants
- `GET /plants/{id}` - Get plant details
- `POST /plants` - Create new plant
- `DELETE /plants/{id}` - Soft delete plant

### Breeds
- `GET /breeds?plantId={id}` - List breeds by plant
- `GET /breeds/{id}` - Get breed details
- `POST /breeds` - Create new breed
- `PUT /breeds/{id}` - Update breed
- `DELETE /breeds/{id}` - Soft delete breed

### Inventory
- `GET /inventory?nurseryId={id}` - List all inventory
- `GET /inventory/breed/{breedId}` - Get inventory for specific breed
- `POST /inventory/{breedId}/transaction` - Create transaction (updates inventory)

### Transactions
- `GET /transactions?breedId={id}` - List transactions by breed
- `GET /transactions/breed/{breedId}` - Get transactions for breed
- `GET /transactions/{id}` - Get transaction details
- `PUT /transactions/{id}` - Update transaction
- `POST /transactions/{id}/undo` - Undo a transaction
- `POST /transactions/{id}/soft-delete` - Soft delete transaction

### Payments
- `GET /payments/transaction/{transactionId}` - Get payments for a transaction
- `GET /payments/{id}` - Get payment details
- `POST /payments/transaction/{transactionId}` - Create payment for transaction
- `PUT /payments/{id}` - Update payment
- `POST /payments/{id}/soft-delete` - Soft delete payment

**Note**: All endpoints require JWT authentication except `/auth/login`

## 🔐 Authentication

### Login Flow

1. User provides phone number
2. Backend creates user if doesn't exist (auto-registration)
3. Returns JWT token
4. Frontend stores token in localStorage
5. Token is automatically included in all subsequent API requests

### Security Features

- **JWT Tokens**: Secure token-based authentication
- **Token Expiration**: Configurable (default: 24 hours)
- **Rate Limiting**: Protection against abuse
- **CORS**: Configured for allowed origins
- **Password Policy**: Enforced in production (min 8 chars, uppercase, lowercase, digit)

## 🗄️ Database (Firestore)

The application uses Google Cloud Firestore as its database. Firestore is a NoSQL document database that provides:
- Real-time data synchronization
- Automatic scaling
- Strong consistency
- Built-in offline support

### Collections Structure

- `nurseries` - Nursery information
- `plants` - Plant categories
- `breeds` - Plant breeds/varieties
- `inventory` - Current inventory quantities
- `transactions` - All inventory transactions
- `users` - User accounts

All documents include audit fields:
- `createdAt`, `createdBy`
- `updatedAt`, `updatedBy`
- `isDeleted`, `deletedAt`, `deletedBy` (for soft-deleted entities)

## 🧪 Development Guidelines

### Backend

1. **Follow the package structure**: Place files in appropriate packages
2. **Use DTOs**: Always use DTOs for API requests/responses, not entities
3. **Soft Delete**: Never hard delete; use soft delete with audit fields
4. **Transactions**: All inventory changes must go through transactions
5. **Error Handling**: Use custom exceptions from `common.exception` package
6. **Validation**: Use Spring Validation annotations on DTOs

### Frontend

1. **TypeScript**: Use strict TypeScript (no `any` types)
2. **Components**: Keep components small and reusable
3. **Error Handling**: Always handle errors with user-friendly messages
4. **Loading States**: Show loading indicators during API calls
5. **Forms**: Use React Hook Form with Zod validation
6. **API Calls**: Use TanStack Query for all API interactions

## 🚢 Production Deployment

### Backend Production Checklist

1. ✅ Set `SPRING_PROFILES_ACTIVE=prod`
2. ✅ Set strong `JWT_SECRET` (minimum 256 bits)
3. ✅ Configure `GOOGLE_CLOUD_PROJECT` environment variable
4. ✅ Set `GOOGLE_APPLICATION_CREDENTIALS` to service account path
5. ✅ Configure `CORS_ALLOWED_ORIGINS` with production frontend URL
6. ✅ Set appropriate `SERVER_PORT` if different from 8080
7. ✅ Ensure `.env` files are not committed to version control

### Frontend Production Checklist

1. ✅ Update `.env.production` with production backend URL
2. ✅ Run `npm run build` to create optimized production build
3. ✅ Test the production build with `npm start`
4. ✅ Ensure all environment variables are properly set
5. ✅ Verify API connectivity

### Build Commands

**Backend:**
```bash
cd Nursery-app
./gradlew clean build
# JAR file will be in: build/libs/nursery-app-1.0.0.jar
```

**Frontend:**
```bash
cd Nusery-web-frontend
npm run build
# Production files will be in: .next/ directory
```

## 🔧 Troubleshooting

### Backend Issues

**Port already in use:**
- Change `server.port` in `application.properties` or set `SERVER_PORT` environment variable

**Firestore connection issues:**
- Verify `GOOGLE_APPLICATION_CREDENTIALS` path is correct
- Check that service account has Firestore permissions
- Ensure `GOOGLE_CLOUD_PROJECT` is set correctly

**Profile not activating:**
- Check `SPRING_PROFILES_ACTIVE` environment variable
- Verify profile-specific property files exist

### Frontend Issues

**API connection errors:**
- Verify `NEXT_PUBLIC_API_BASE_URL` in `.env.development`
- Check that backend is running on the configured port
- Check browser console for CORS errors

**Environment variables not loading:**
- Restart Next.js dev server after changing `.env` files
- Ensure variables start with `NEXT_PUBLIC_` for client-side access
- Check file name is exactly `.env.development` or `.env.production`

## 📝 Important Notes

- **Never commit sensitive data**: Service account keys, JWT secrets, passwords
- **Use environment variables**: For all configuration that differs between environments
- **Soft delete only**: The system uses soft deletes to maintain data integrity
- **Transaction-based inventory**: Inventory quantities are always updated through transactions, never directly

## 📚 Additional Resources

- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [Next.js Documentation](https://nextjs.org/docs)
- [Firestore Documentation](https://cloud.google.com/firestore/docs)
- [TanStack Query Documentation](https://tanstack.com/query/latest)

## 📄 License

This project is part of a study project.

---

**Happy Coding! 🌱**

