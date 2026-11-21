# 🐛 BugTracker - Jira-like Issue Tracker

Enterprise-style issue tracking system. **Backend:** Java 17 · Spring Boot 3 · Spring Security + JWT · Hibernate/JPA · PostgreSQL/MySQL (H2 for zero-config) · Swagger.
**Frontend:** React 18 · Vite · Tailwind CSS · dnd-kit (drag & drop) · Axios · React Router.

## Features (all 10 use cases)

| # | Use case | Where |
|---|----------|-------|
| 1 | User authentication (JWT) | `AuthController`, `JwtService`, `JwtAuthFilter`, `Login/Register` pages |
| 2 | Project creation & team management | `ProjectController` (CRUD + add/remove members), Team modal |
| 3 | Issue / bug creation | `POST /api/projects/{id}/issues`, "New issue" modal |
| 4 | Assign issues to users | `PATCH /api/issues/{id}/assign`, assignee dropdown (members only) |
| 5 | Kanban workflow (To Do → In Progress → Done) | `PATCH /api/issues/{id}/status`, dnd-kit board with optimistic updates |
| 6 | Ticket comments | `/api/issues/{id}/comments`, comment thread in the issue modal |
| 7 | Filters & search | `GET /api/projects/{id}/issues?status&priority&type&assigneeId&unassigned&q` (JPA Specifications) |
| 8 | Edit / delete issues | `PUT` / `DELETE /api/issues/{id}` with authorization |
| 9 | Role-based permissions | ADMIN / MANAGER / DEVELOPER, see matrix below |
| 10 | Screenshot upload | `POST /api/issues/{id}/screenshot` (multipart, PNG/JPEG/GIF/WEBP, 5MB) |

Extras: dashboard with stats, board/list toggle, admin user-management page, Swagger UI, Dockerfiles + docker-compose, demo seed data.

## Quick start (local)

Requirements: JDK 17+, Maven 3.9+, Node 18+.

```bash
# 1. backend  (http://localhost:8080 - uses an embedded H2 file DB, nothing to install)
cd backend
mvn spring-boot:run

# 2. frontend (http://localhost:5173)
cd frontend
cp .env.example .env
npm install
npm run dev
```

Swagger UI: <http://localhost:8080/swagger-ui.html> → login via `/api/auth/login`, click **Authorize**, paste the token.

### Demo accounts (seeded on first start)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@bugtracker.com | Admin@123 |
| Manager | manager@bugtracker.com | Manager@123 |
| Developer | dev@bugtracker.com | Dev@1234 |
| Developer | dana@bugtracker.com | Dev@1234 |

Set `SEED_DEMO_DATA=false` in production. When registering, the **first** user of an empty database becomes ADMIN; later users choose Developer or Manager (admins can change roles on the *Users* page).

## Using PostgreSQL / MySQL

Set environment variables before starting the backend (Hibernate creates the tables automatically):

```bash
# PostgreSQL
export DB_URL=jdbc:postgresql://localhost:5432/bugtracker
export DB_USERNAME=postgres
export DB_PASSWORD=postgres
# MySQL
# export DB_URL=jdbc:mysql://localhost:3306/bugtracker?createDatabaseIfNotExist=true

export JWT_SECRET='at-least-32-characters-long-random-string'
mvn spring-boot:run
```

Or run everything with Docker: `docker compose up --build` → frontend <http://localhost:3000>, API <http://localhost:8080>.

## Role-based permissions

| Action | ADMIN | MANAGER | DEVELOPER |
|--------|:----:|:------:|:--------:|
| See all projects | ✅ | own / member of | member of |
| Create project | ✅ | ✅ | ❌ |
| Edit/delete project, manage members | ✅ | only projects they own | ❌ |
| Create issue, comment, move card on board | ✅ | ✅ (if member) | ✅ (if member) |
| Edit issue / upload screenshot | ✅ | project owner | reporter or assignee |
| Assign issue | ✅ | project owner | reporter / assignee, or self-assign |
| Delete issue | ✅ | project owner | reporter only |
| Delete comment | ✅ | project owner | own comments |
| Change user roles | ✅ | ❌ | ❌ |

All rules live in `service/PermissionService.java` and are enforced server-side (UI only mirrors them).

## REST API summary

```
POST   /api/auth/register | /api/auth/login        GET /api/auth/me
GET    /api/users                                   PUT /api/users/{id}/role        (ADMIN)
GET    /api/dashboard
GET/POST         /api/projects
GET/PUT/DELETE   /api/projects/{id}
POST/DELETE      /api/projects/{id}/members/{userId}
GET/POST         /api/projects/{id}/issues          (filters: status, priority, type, assigneeId, unassigned, q)
GET/PUT/DELETE   /api/issues/{id}
PATCH            /api/issues/{id}/status | /assign
POST/DELETE      /api/issues/{id}/screenshot        (multipart field "file")
GET/POST         /api/issues/{id}/comments          DELETE /api/comments/{id}
GET    /api/files/{name}                            (serves uploaded screenshots)
```
`backend/api-tests.http` contains ready-to-run requests (VS Code REST Client / IntelliJ).

## Project structure

```
backend/src/main/java/com/bugtracker
  config/      SecurityConfig, OpenApiConfig, DataSeeder
  security/    JwtService, JwtAuthFilter, CustomUserDetailsService
  model/       User, Project, Issue, Comment + enums
  repository/  Spring Data repos, IssueSpecs (dynamic filters)
  service/     Auth, User, Project, Issue, Comment, Dashboard, Permission, FileStorage
  controller/  REST controllers
  dto/         request/response records + Mapper
  exception/   typed exceptions + GlobalExceptionHandler
frontend/src
  pages/       Login, Register, Dashboard, ProjectBoard, Users
  components/  KanbanBoard, IssueModal, MembersModal, ProjectFormModal, Navbar ...
  context/     AuthContext, ToastContext
```

## Deployment (Day 12)

**Backend → Render / Railway** (use the included `backend/Dockerfile`)
1. Create a PostgreSQL database; copy its connection details.
2. Create a Web Service from the repo, root directory `backend`, runtime Docker.
3. Environment variables: `DB_URL` (`jdbc:postgresql://HOST:5432/DBNAME`), `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET` (long random), `CORS_ORIGINS` (your frontend URL), `SEED_DEMO_DATA=false`.
4. Uploaded screenshots are stored on disk (`UPLOAD_DIR`, default `./uploads`). On Render/Railway attach a persistent disk/volume and point `UPLOAD_DIR` to it, otherwise files vanish on redeploy.

**Frontend → Vercel / Netlify / Render Static**
- Root `frontend`, build `npm run build`, output `dist`, env `VITE_API_URL=https://YOUR-BACKEND/api`.
- Add an SPA rewrite so all paths serve `index.html` (Vercel: `{"rewrites":[{"source":"/(.*)","destination":"/"}]}`; Netlify: `/* /index.html 200`).

## Tests

`mvn test` runs unit tests for JWT handling and permission rules.

## Notes / ideas to extend

Optional Spring WebSocket real-time board updates, pagination for very large projects, email notifications, activity log.
