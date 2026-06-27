# Personal Learning Tracker

<div align="center">

![Learning Tracker](https://img.shields.io/badge/Learning-Tracker-4F46E5?style=for-the-badge&logo=bookstack&logoColor=white)

**A production-grade SaaS application for tracking personal learning progress with intelligent scheduling, gamification, and professional email reminders.**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4-6DB33F?style=flat-square&logo=springboot)](https://spring.io/projects/spring-boot)
[![Java](https://img.shields.io/badge/Java-21-ED8B00?style=flat-square&logo=openjdk)](https://openjdk.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?style=flat-square&logo=postgresql)](https://supabase.com)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker)](https://docker.com)

</div>

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Vercel)                      │
│   React 19 · TypeScript · Vite · Tailwind CSS · shadcn   │
│   React Router · TanStack Query · React Hook Form · Zod  │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTPS / REST API
┌─────────────────────▼───────────────────────────────────┐
│                  BACKEND (Render.com)                     │
│   Java 21 · Spring Boot 3.4 · Spring Security · JWT      │
│   Spring Data JPA · Spring Mail · Spring Scheduler        │
└─────────────────────┬───────────────────────────────────┘
                      │ JDBC / SSL
┌─────────────────────▼───────────────────────────────────┐
│                 DATABASE (Supabase)                       │
│              PostgreSQL 15+ · 14 Tables                   │
└─────────────────────────────────────────────────────────┘
```

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔐 **Authentication** | Register, Login, Logout, Forgot Password, Email OTP, JWT |
| 👤 **Profile** | Edit name, email, password, notification preferences, timezone, theme |
| 📊 **Excel Upload** | Upload .xlsx, validate columns, preview data, reject invalid rows |
| 📅 **Learning Planner** | Search, filter, sort, pagination, assign dates, workload distribution |
| ✅ **Study Tracking** | Not Started / In Progress / Completed / Skipped / Missed + notes, ratings |
| 📆 **Calendar** | Month / Week / Day views with drag & drop reschedule |
| 📈 **Dashboard** | Today's tasks, stats, streaks, badges, charts, recent activity |
| 🔥 **Streaks** | GitHub-style contribution heatmap, current/longest/monthly streak |
| 🏆 **Badges** | 7 achievement badges with criteria-based auto-awarding |
| 📧 **Reminders** | 14 types of professional HTML email reminders |
| 📊 **Analytics** | Completion %, hours studied, forecast, burndown, category charts |

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+
- **Java** 21
- **Maven** 3.9+
- **Docker** (optional, for containerized deployment)
- **Supabase** account with PostgreSQL database
- **Gmail** account with App Password enabled

### 1. Clone and Configure

```bash
git clone <repository-url>
cd charu-learning-tracker

# Copy environment template
cp .env.example .env

# Edit .env with your actual values
```

### 2. Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_URL` | Supabase PostgreSQL JDBC URL | `jdbc:postgresql://db.xxx.supabase.co:5432/postgres?sslmode=require` |
| `DB_USERNAME` | Database username | `postgres` |
| `DB_PASSWORD` | Database password | `your-password` |
| `JWT_SECRET` | JWT signing key (64+ chars) | `openssl rand -base64 64` |
| `MAIL_USERNAME` | Gmail address | `you@gmail.com` |
| `MAIL_PASSWORD` | Gmail App Password | `xxxx xxxx xxxx xxxx` |
| `FRONTEND_URL` | Frontend URL (for CORS) | `http://localhost:5173` |
| `VITE_API_URL` | Backend API URL | `http://localhost:8080/api` |

### 3. Start Backend

```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

### 4. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

### 5. Docker (Alternative)

```bash
docker compose up --build
```

## 🌐 Deployment

### Backend → Render.com

1. Connect your GitHub repository to Render
2. Create a new **Web Service**
3. Select **Docker** runtime
4. Set Dockerfile path: `./backend/Dockerfile`
5. Set Docker context: `./backend`
6. Add all environment variables from `.env.example`
7. Set health check path: `/actuator/health`

### Frontend → Vercel

1. Connect your GitHub repository to Vercel
2. Set root directory: `frontend`
3. Framework preset: **Vite**
4. Add environment variable: `VITE_API_URL=https://your-backend.onrender.com/api`

### Database → Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Settings → Database** for connection string
3. Tables are auto-created by Hibernate on first run (`ddl-auto=update` in dev)

## 📁 Project Structure

```
charu-learning-tracker/
├── frontend/               # React + Vite + TypeScript
│   ├── src/
│   │   ├── api/            # Axios client, API services
│   │   ├── components/     # UI + feature components
│   │   ├── contexts/       # Auth, Theme contexts
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities, validators
│   │   ├── pages/          # Route pages
│   │   ├── types/          # TypeScript interfaces
│   │   └── App.tsx         # Root component
│   └── package.json
│
├── backend/                # Java 21 + Spring Boot 3.4
│   ├── src/main/java/com/learningtracker/
│   │   ├── config/         # Security, CORS, JWT, Mail
│   │   ├── controller/     # REST controllers
│   │   ├── dto/            # Request/Response DTOs
│   │   ├── entity/         # JPA entities
│   │   ├── exception/      # Global error handling
│   │   ├── mapper/         # MapStruct mappers
│   │   ├── repository/     # Spring Data JPA repos
│   │   ├── scheduler/      # Scheduled tasks
│   │   ├── security/       # JWT, filters, auth
│   │   ├── service/        # Business logic
│   │   └── constant/       # Constants, enums
│   └── pom.xml
│
├── docker-compose.yml
├── render.yaml             # Render deployment blueprint
├── .env.example
└── README.md
```

## 🔒 Security

- **JWT** with short-lived access tokens (30 min) and refresh tokens (7 days)
- **BCrypt** password hashing (strength 12)
- **CORS** configured for frontend origin only
- **Input validation** on all endpoints
- **SQL injection** prevention via JPA parameterized queries
- **XSS prevention** via React's default escaping
- **Rate limiting** ready architecture

## 📄 API Documentation

When the backend is running, visit:
- **Swagger UI**: `http://localhost:8080/swagger-ui.html`
- **OpenAPI JSON**: `http://localhost:8080/v3/api-docs`

## 📝 License

This project is private and proprietary.

---

<div align="center">
  Built with ❤️ for continuous learning
</div>
>>>>>>> 396f5f9 (Deploy app structure with updated endpoint router paths and react-router-dom bindings)
