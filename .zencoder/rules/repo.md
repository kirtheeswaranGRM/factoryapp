---
description: Repository Information Overview
alwaysApply: true
---

# Factory Management System Information

## Repository Summary
This repository contains a full-stack factory management system. It consists of a Node.js Express backend for API services and report generation, and an Expo-based React Native mobile application for the frontend. The system uses PostgreSQL for data storage.

## Repository Structure
- **backend/**: Node.js Express server providing RESTful APIs, database connectivity, and PDF report generation using `pdfkit`.
- **Frontend/myapp_fixed/**: React Native mobile application built with Expo and TypeScript, featuring role-based access and production reporting.
- **db/**: Contains database schema backups and SQL scripts for PostgreSQL.
- **.zencoder/ & .zenflow/**: CI/CD and automation workflow configurations.

### Main Repository Components
- **Backend API**: Handles inventory management, user authentication, attendance logging, and production reporting.
- **Mobile Application**: Provides interfaces for Production Heads and other roles to manage factory operations.
- **Database**: PostgreSQL instance storing users, inventory, and production data.

## Projects

### Backend
**Configuration File**: [./backend/package.json](./backend/package.json)

#### Language & Runtime
**Language**: JavaScript (Node.js)  
**Version**: Node.js (CommonJS)  
**Build System**: npm  
**Package Manager**: npm

#### Dependencies
**Main Dependencies**:
- `express`: Web framework for the API.
- `pg`: PostgreSQL client for Node.js.
- `pdfkit`: PDF generation library for reports.
- `cors`: Cross-Origin Resource Sharing middleware.
- `body-parser`: Request body parsing middleware.

#### Build & Installation
```bash
cd backend
npm install
```

#### Main Files & Resources
- **Entry Point**: [./backend/server.js](./backend/server.js)
- **Routes**: [./backend/routes.js](./backend/routes.js)
- **Database Config**: [./backend/db.js](./backend/db.js)
- **API Config**: [./backend/apiconfig.js](./backend/apiconfig.js)

### Frontend (Mobile App)
**Configuration File**: [./Frontend/myapp_fixed/package.json](./Frontend/myapp_fixed/package.json)

#### Language & Runtime
**Language**: TypeScript (React Native)  
**Version**: React 19, React Native 0.81  
**Build System**: Expo  
**Package Manager**: npm

#### Dependencies
**Main Dependencies**:
- `expo`: Framework for universal React applications.
- `expo-router`: File-based routing for React Native.
- `lucide-react-native`: Icon library.
- `xlsx`: Spreadsheet parsing and generation.
- `react-native-reanimated`: Animation library.

**Development Dependencies**:
- `typescript`: For static typing.
- `@babel/core`: JavaScript compiler.

#### Build & Installation
```bash
cd Frontend/myapp_fixed
npm install
```

#### Usage & Operations
**Key Commands**:
```bash
# Start the Expo development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on Web
npm run web
```

#### Main Files & Resources
- **App Entry**: [./Frontend/myapp_fixed/app/index.tsx](./Frontend/myapp_fixed/app/index.tsx)
- **API Configuration**: [./Frontend/myapp_fixed/app/ApiConfig.tsx](./Frontend/myapp_fixed/app/ApiConfig.tsx)
- **Global Config**: [./Frontend/myapp_fixed/app.json](./Frontend/myapp_fixed/app.json)

## Database Configuration

**Type**: PostgreSQL
**Main File**: [./db/backup.sql](./db/backup.sql)
**Connection**:
- **Host**: `localhost`
- **Port**: `5432`
- **User**: `postgres`
- **Database**: `postgres`
