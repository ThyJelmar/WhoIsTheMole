# Who Is The Mole — Statistics Webapp

A standalone web application to track and analyse candidate behaviour across episodes of the Dutch TV show *Wie is de Mol?*, calculating a mole score per candidate based on in-game observations.

---

## Features

- **Multi-season support** — create and manage multiple seasons with their own candidates, episodes and score weights
- **Per-episode entry** — log money earned/lost, key positions, suspicious acts, and who you suspect per episode
- **Per-assignment breakdown** — optionally split episode data across 2–5 individual assignments with a max amount per assignment
- **Mole score ranking** — candidates ranked by a configurable weighted score formula
- **Score history chart** — cumulative score development per candidate across episodes
- **Candidate status tracking** — candidates can be eliminated, return, and be eliminated again; all tracked per episode
- **Role-based access** — regular users enter their own observations; admins manage seasons, candidates, users and score weights
- **Notes** — free-text notes per assignment, per episode entry, and per candidate observation

---

## Tech stack

| Layer | Technology |
|---|---|
| Backend | C# .NET 9 · ASP.NET Core Web API · EF Core |
| Database | SQLite (development) · PostgreSQL (production) |
| Authentication | JWT Bearer tokens · httpOnly refresh cookies |
| Frontend | Vue 3 · Vuetify 3 · TypeScript · Pinia · Axios · Vite |

---

## Mole score formula

```
MoleScore = (MoneyEarned         ×  -0.1)
          + (MoneyLost           ×   0.09)
          + (KeyPositions        ×  20)
          + (SuspiciousActs      ×  10)
          + (TimesAccused        ×   5)
          + (AccusedByEliminated ×  40)
```

All weights are configurable per season by an administrator. `SuspiciousActs` can be negative — a negative value means a candidate did something only an innocent person would do.

---

## Project structure

```
WhoIsTheMole/
├── CLAUDE.md                        ← context file for Claude Code
├── docs/
│   └── BLUEPRINT.md                 ← full domain & architecture reference
├── backend/
│   ├── WhoIsTheMole.API/
│   ├── WhoIsTheMole.Application/
│   ├── WhoIsTheMole.Domain/
│   └── WhoIsTheMole.Infrastructure/
└── frontend/
    └── src/
        ├── views/
        │   ├── auth/
        │   ├── user/
        │   └── admin/
        ├── components/
        ├── stores/
        └── composables/
```

---

## Getting started

### Prerequisites

- [.NET 9 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org/)
- [Docker](https://www.docker.com/) (optional, for running with docker-compose)

### Run with Docker

```bash
git clone https://github.com/your-username/who-is-the-mole.git
cd who-is-the-mole
docker-compose up
```

Frontend: `http://localhost:5173`  
API: `http://localhost:5000`

### Run locally

**Backend**

```bash
cd backend/WhoIsTheMole.API
dotnet restore
dotnet run
```

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

### First login

On first run the database is seeded with an initial admin account:

| Field | Value |
|---|---|
| Email | `admin@example.com` |
| Password | `ChangeMe123!` |

> Change the admin password immediately after first login.

---

## Roles

| Action | User | Admin |
|---|:---:|:---:|
| View scores & rankings | ✅ | ✅ |
| Enter episode / assignment data | ✅ | ✅ |
| Create assignments | ✅ | ✅ |
| Create / edit seasons & episodes | ❌ | ✅ |
| Manage candidates | ❌ | ✅ |
| Adjust score weights | ❌ | ✅ |
| Manage users | ❌ | ✅ |

---

## Development

### Backend

```bash
cd backend

# Add a new EF Core migration
dotnet ef migrations add <MigrationName> --project WhoIsTheMole.Infrastructure --startup-project WhoIsTheMole.API

# Apply migrations
dotnet ef database update --project WhoIsTheMole.Infrastructure --startup-project WhoIsTheMole.API

# Run tests
dotnet test
```

### Frontend

```bash
cd frontend

npm run dev        # development server
npm run build      # production build
npm run type-check # TypeScript check
npm run lint       # ESLint
```

---

## Configuration

Key settings in `backend/WhoIsTheMole.API/appsettings.json`:

```json
{
  "Jwt": {
    "Secret": "your-secret-key-here",
    "AccessTokenExpiryMinutes": 15,
    "RefreshTokenExpiryDays": 7
  },
  "ConnectionStrings": {
    "Default": "Data Source=whoisthemole.db"
  },
  "Uploads": {
    "Path": "wwwroot/uploads"
  }
}
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a pull request

---

## Disclaimer

This project is a fan-made tool for personal use. It is not affiliated with or endorsed by AVROTROS or the makers of *Wie is de Mol?*.
