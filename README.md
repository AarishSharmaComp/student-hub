# Student Hub

Student Hub is a full-stack academic management platform for students, teachers, and academic administrators. It brings courses, assignments, attendance, grades, announcements, student records, and academic reporting into one focused workspace.

## Overview

The application uses a React frontend and a Node.js API backed by SQLite. Authentication, authorization, validation, and academic relationships are enforced by the API rather than trusted solely in the browser.

## Features

### Students

- Personalized academic dashboard
- Enrolled course overview
- Assignment deadlines and submission status
- Text-based assignment submissions
- Assignment grades and teacher feedback
- Course and overall attendance records
- Attendance warnings
- Published grades and academic performance summaries
- Announcements with read status
- Profile and password settings

### Teachers

- Teaching dashboard and course roster
- Course details and student access
- Attendance recording by course and date
- Grade entry and updates
- Assignment creation and editing
- Submission review and feedback
- Course announcements
- Student search and academic record review

### Academic administrators

- Student enrollment, editing, search, filtering, pagination, and deletion
- Teacher account creation
- Course creation, editing, and enrollment management
- Institution-wide announcements
- Attendance and academic reports
- Department statistics and rankings
- Student record CSV export
- Transactional import of records from the original browser-based prototype

## Tech stack

### Frontend

- React 18
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Radix UI primitives and shared UI components
- Lucide React icons
- Sonner notifications
- Next Themes for light/dark mode

### Backend

- Node.js HTTP server
- Zod request validation
- `node:crypto` password hashing and secure token generation
- HttpOnly, SameSite session cookies

### Database

- SQLite through Node's built-in `node:sqlite` module
- Foreign keys, constraints, indexes, and transactional writes

## Architecture

```text
React + TypeScript frontend
            │
            │ same-origin /api requests
            ▼
Node.js HTTP API
            │
            ▼
SQLite database
```

The Vite development server proxies `/api` requests to the API on port `3001`. In production, the API serves the built frontend and the API from one process.

## Project structure

```text
student-hub/
├── public/                 # favicon and static assets
├── server/
│   ├── api.mjs             # routes, validation, sessions, authorization
│   ├── database.mjs        # schema, indexes, demo seed, password hashing
│   └── api.test.mjs        # API workflow and security tests
├── src/
│   ├── components/         # layouts, forms, shared UI, error handling
│   ├── contexts/           # authentication state
│   ├── lib/                # API client and domain helpers
│   ├── pages/              # role-based screens and academic modules
│   └── types/              # shared TypeScript models
├── .env.example
├── index.html
├── package.json
└── README.md
```

## Getting started

Requires Node.js 22.13 or newer because the API uses the built-in `node:sqlite` module.

```bash
npm install
cp .env.example .env
```

Start the API and frontend in separate terminals:

```bash
# Terminal 1
npm run api

# Terminal 2
npm run dev
```

Open [http://localhost:8080](http://localhost:8080).

The example environment enables a local demo workspace. Demo credentials are shown on the sign-in page:

| Role | Username | Password |
| --- | --- | --- |
| Academic office | `admin` | `admin123` |
| Teacher | `teacher` | `teacher123` |
| Student | `aarav.sharma` | `student123` |

Demo mode is for local development only. The server refuses to run in production with `DEMO_MODE=true`.

## Environment variables

The example file contains the variables used by the API:

```env
PORT=3001
APP_ORIGIN=http://localhost:8080
DATABASE_PATH=./data/student-hub.sqlite
DEMO_MODE=true
```

For a non-demo production deployment, set `DEMO_MODE=false` and provide an initial administrator:

```env
NODE_ENV=production
APP_ORIGIN=https://hub.example.edu
DATABASE_PATH=/var/lib/student-hub/student-hub.sqlite
ADMIN_USERNAME=registrar
ADMIN_PASSWORD=<unique-password-of-at-least-12-characters>
```

Do not commit `.env` files or real credentials. The database directory is ignored by git.

## API

All protected endpoints require the authenticated session cookie.

### Authentication

- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `POST /api/auth/password`

### Workspace and records

- `GET /api/bootstrap`
- `GET|POST|PATCH|DELETE /api/students`
- `POST /api/courses`
- `PATCH|DELETE /api/courses/:id`
- `PUT /api/courses/:id/enrollments`
- `PUT /api/attendance`
- `PUT /api/grades`
- `POST /api/assignments`
- `PATCH|DELETE /api/assignments/:id`
- `PUT /api/assignments/:id/submit`
- `PUT /api/assignments/:id/grade`
- `POST /api/announcements`
- `PATCH|DELETE /api/announcements/:id`
- `PUT /api/announcements/:id/read`
- `POST /api/teachers`
- `POST /api/import`

## User roles and permissions

- **Student:** Can access their own profile, enrolled courses, attendance, grades, assignments, submissions, and announcements.
- **Teacher:** Can manage academic activity for courses assigned to them and review students enrolled in those courses.
- **Admin:** Can manage institution-wide students, teachers, courses, enrollments, reports, exports, and announcements.

The backend is authoritative for these permissions; frontend navigation is not treated as a security boundary.

## Security

- Passwords are salted and hashed with `scrypt`.
- Sessions use opaque, expiring HttpOnly and SameSite cookies.
- Logout invalidates sessions server-side.
- Login attempts are rate-limited.
- API payloads are validated with Zod.
- Foreign keys, uniqueness rules, check constraints, and transactions protect data integrity.
- Student and course ownership checks are enforced on the server.
- Request size limits and security response headers are enabled.
- CSV exports escape spreadsheet formulas.

## Responsive design

The interface supports desktop, tablet, and mobile layouts. Desktop uses a persistent sidebar, while smaller screens use an accessible navigation drawer. Tables, forms, dialogs, dashboards, and cards adapt to narrower viewports.

## Development commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run api` | Start the local API server |
| `npm run build` | Build the production frontend |
| `npm start` | Serve the production build through the API |
| `npm run lint` | Run ESLint |
| `npm test` | Run frontend tests |
| `npm run test:api` | Run API authorization and workflow tests |

## Future improvements

- Institutional SSO
- Configurable GPA policies
- Timetable and room scheduling
- Secure assignment file uploads
- Email notifications
- Administrative audit logs
- PostgreSQL support for larger deployments

## License

No license has been assigned to this repository yet.
