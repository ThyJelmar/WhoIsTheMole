# Blueprint: Who Is The Mole – Statistics Webapp
> Standalone webapp · C# .NET Backend · Vue 3 + Vuetify + TypeScript Frontend

---

## 1. Domain Logic & Scoring

### The mole score formula

```
MoleScore = (MoneyEarned    × -0.1)
          + (MoneyLost      ×  0.09)
          + (KeyPositions   ×  20)
          + (SuspiciousActs ×  10)     ← configurable weight, can be negative
          + (TimesAccused   ×  5)
          + (AccusedByEliminated × 40)
```

**Weight rationale:**
- Earning money → less suspicious → negative weight (-0.1)
- Losing money → sabotage signal → positive (+0.09)
- Key position → active sabotage opportunity → strong positive (+20)
- Suspicious act → small mole signal, but can also be *anti*-mole → **can be negative** (e.g. -1 for clearly innocent behaviour)
- Others accuse you → mole signal → positive (+5)
- Eliminated player accused you → strongest external signal → positive (+40)

> **KeyPositions** is always ≥ 0 (validation enforced in frontend & backend).
> **SuspiciousActs** can be negative — this represents acts that are *too obvious* for a real mole, or clearly innocent behaviour a real mole wouldn't do.

---

## 2. Domain Model

All entity names, property names, and file names are in **English**.

```
Season
  - id: Guid
  - name: string              (e.g. "Season 26 – Peru")
  - year: int
  - isActive: bool
  └─ candidates: Candidate[]
  └─ episodes: Episode[]
  └─ scoreWeights: ScoreWeights

Candidate
  - id: Guid
  - seasonId: Guid
  - name: string
  - photoUrl: string?
  - description: string?
  - isActive: bool            (false = eliminated and not returned)

CandidateParticipation      ← tracks status PER episode
  - id: Guid
  - candidateId: Guid
  - episodeId: Guid
  - status: enum              (Active | Eliminated | Returned)
  // Candidates can be eliminated and return multiple times

Episode
  - id: Guid
  - seasonId: Guid
  - number: int               (1–10)
  - title: string?
  └─ assignments: Assignment[]

Assignment
  - id: Guid
  - episodeId: Guid
  - number: int               (1–5 per episode)
  - description: string?
  - maxAmount: decimal?
  - note: string?             ← free-text note on the assignment itself (admin or user)

EpisodeEntry                ← user's input per candidate per episode
  - id: Guid
  - episodeId: Guid
  - candidateId: Guid
  - userId: Guid
  - moneyEarned: decimal?     ← total across all assignments in this episode
  - moneyLost: decimal?
  - keyPositions: int?        ← must be ≥ 0
  - suspiciousActs: int?      ← can be negative
  - note: string?             ← free-text note per candidate per episode
  - suspicions: Suspicion[]

AssignmentEntry             ← optional per-assignment breakdown (user)
  - id: Guid
  - assignmentId: Guid
  - candidateId: Guid
  - userId: Guid
  - moneyEarned: decimal?
  - moneyLost: decimal?
  - note: string?

Suspicion
  - id: Guid
  - episodeEntryId: Guid
  - suspectedCandidateId: Guid
  - rank: int                 (1–6, order of suspicion)

MoleScore                   (calculated, not stored)
  - candidateId: Guid
  - candidateName: string
  - photoUrl: string?
  - status: CandidateStatus
  - totalMoneyEarned: decimal
  - totalMoneyLost: decimal
  - totalKeyPositions: int
  - totalSuspiciousActs: int
  - totalTimesAccused: int
  - totalAccusedByEliminated: int
  - score: decimal
  - scorePerEpisode: decimal[]    (for cumulative chart)

User
  - id: Guid
  - email: string
  - passwordHash: string
  - name: string
  - role: enum                (User | Administrator)
  - isActive: bool

ScoreWeights                (one row per season, configurable by admin)
  - id: Guid
  - seasonId: Guid
  - moneyEarnedWeight: decimal         (default -0.1)
  - moneyLostWeight: decimal           (default 0.09)
  - keyPositionWeight: decimal         (default 20)
  - suspiciousActWeight: decimal       (default 10)
  - timesAccusedWeight: decimal        (default 5)
  - accusedByEliminatedWeight: decimal (default 40)
```

---

## 3. Roles & Permissions

| Action | User | Administrator |
|---|:---:|:---:|
| Register / log in | ✅ | ✅ |
| View own overview & scores | ✅ | ✅ |
| Enter data per episode / assignment | ✅ | ✅ |
| Create assignments | ✅ | ✅ |
| Manage own notes | ✅ | ✅ |
| Create / edit seasons | ❌ | ✅ |
| Create / edit episodes | ❌ | ✅ |
| Manage candidates (photo, description, status) | ❌ | ✅ |
| Adjust score weights | ❌ | ✅ |
| View / edit / delete users | ❌ | ✅ |
| Assign roles to users | ❌ | ✅ |

---

## 4. Candidate Status & Return

Status is tracked **per episode** via `CandidateParticipation`, never as a single flag on `Candidate`:

```
Example timeline for a candidate:
  Episode 1:  CandidateParticipation.status = Active
  Episode 2:  CandidateParticipation.status = Eliminated   ← counts as eliminator
  Episode 5:  CandidateParticipation.status = Returned
  Episode 7:  CandidateParticipation.status = Eliminated   ← counts again
```

**Business rules:**
- `AccusedByEliminated` increments for **every** episode where `status = Eliminated`, including repeated eliminations.
- A candidate with `status = Returned` participates normally in all calculations.
- `Candidate.isActive = false` only when definitively out (last status = Eliminated, never followed by Returned).
- Frontend shows a status badge: active / eliminated / returned.

---

## 5. Project Structure

```
WhoIsTheMole/
├── CLAUDE.md
├── docker-compose.yml
│
├── backend/
│   ├── WhoIsTheMole.API/
│   │   ├── Controllers/
│   │   │   ├── AuthController.cs
│   │   │   ├── UsersController.cs          ← [Admin] CRUD users
│   │   │   ├── SeasonsController.cs        ← [Admin] season management
│   │   │   ├── CandidatesController.cs     ← [Admin] candidate management
│   │   │   ├── EpisodesController.cs       ← [Admin] episode management
│   │   │   ├── AssignmentsController.cs    ← [User+Admin] assignment CRUD
│   │   │   ├── EntriesController.cs        ← [User+Admin] EpisodeEntry + AssignmentEntry
│   │   │   └── ScoresController.cs
│   │   ├── Program.cs                      ← seeds initial admin account
│   │   └── appsettings.json
│   │
│   ├── WhoIsTheMole.Application/
│   │   ├── Services/
│   │   │   ├── AuthService.cs
│   │   │   ├── MoleScoreService.cs
│   │   │   └── SeasonService.cs
│   │   └── DTOs/
│   │
│   ├── WhoIsTheMole.Domain/
│   │   └── Entities/                       ← all entities above
│   │
│   └── WhoIsTheMole.Infrastructure/
│       ├── Data/
│       │   └── AppDbContext.cs             ← EF Core, SQLite (dev) / PostgreSQL (prod)
│       └── Repositories/
│
└── frontend/
    ├── src/
    │   ├── api/                            ← axios wrappers per resource
    │   ├── components/
    │   │   ├── CandidateCard.vue
    │   │   ├── ScoreRanking.vue
    │   │   ├── EpisodeTimeline.vue
    │   │   ├── SuspicionMatrix.vue
    │   │   └── AssignmentEntry.vue
    │   ├── views/
    │   │   ├── auth/
    │   │   │   ├── LoginView.vue
    │   │   │   └── RegisterView.vue
    │   │   ├── user/
    │   │   │   ├── DashboardView.vue
    │   │   │   ├── EpisodeEntryView.vue
    │   │   │   └── CandidateDetailView.vue
    │   │   └── admin/
    │   │       ├── AdminDashboardView.vue
    │   │       ├── SeasonManagementView.vue
    │   │       ├── CandidateManagementView.vue
    │   │       └── UserManagementView.vue
    │   ├── stores/
    │   │   ├── authStore.ts
    │   │   └── moleStore.ts
    │   ├── composables/
    │   │   └── useMoleScore.ts
    │   └── router/
    │       └── index.ts                    ← guards: requiresAuth, requiresAdmin
    └── vite.config.ts
```

---

## 6. REST API Endpoints

All routes follow REST conventions: plural nouns, no verbs in URLs, HTTP method expresses the action.

### Auth
| Method | Route | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Create new account |
| `POST` | `/api/auth/login` | Public | Obtain JWT + refresh token |
| `POST` | `/api/auth/refresh` | Public | Exchange refresh token |
| `POST` | `/api/auth/logout` | Authenticated | Revoke refresh token |

### Seasons
| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/api/seasons` | Authenticated | List all seasons |
| `POST` | `/api/seasons` | Admin | Create season |
| `GET` | `/api/seasons/{id}` | Authenticated | Get season detail |
| `PUT` | `/api/seasons/{id}` | Admin | Update season |
| `DELETE` | `/api/seasons/{id}` | Admin | Delete season |
| `GET` | `/api/seasons/{id}/weights` | Admin | Get score weights |
| `PUT` | `/api/seasons/{id}/weights` | Admin | Update score weights |

### Candidates
| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/api/seasons/{id}/candidates` | Authenticated | List candidates in season |
| `POST` | `/api/seasons/{id}/candidates` | Admin | Add candidate to season |
| `GET` | `/api/candidates/{id}` | Authenticated | Get candidate detail |
| `PUT` | `/api/candidates/{id}` | Admin | Update name / photo / description |
| `DELETE` | `/api/candidates/{id}` | Admin | Remove candidate |
| `PUT` | `/api/candidates/{id}/participation` | Admin | Update episode status (eliminated / returned) |

### Episodes
| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/api/seasons/{id}/episodes` | Authenticated | List episodes in season |
| `POST` | `/api/seasons/{id}/episodes` | Admin | Create episode |
| `GET` | `/api/episodes/{id}` | Authenticated | Get episode + assignments |
| `PUT` | `/api/episodes/{id}` | Admin | Update episode |
| `DELETE` | `/api/episodes/{id}` | Admin | Delete episode |

### Assignments
| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/api/episodes/{id}/assignments` | Authenticated | List assignments in episode |
| `POST` | `/api/episodes/{id}/assignments` | User + Admin | Create assignment |
| `GET` | `/api/assignments/{id}` | Authenticated | Get assignment detail |
| `PUT` | `/api/assignments/{id}` | User + Admin | Update assignment |
| `DELETE` | `/api/assignments/{id}` | User + Admin | Delete assignment |

### Entries (user input)
| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/api/episodes/{id}/entries` | Authenticated | Own entries for an episode |
| `PUT` | `/api/episodes/{id}/entries/{candidateId}` | Authenticated | Save / update episode entry |
| `GET` | `/api/assignments/{id}/entries` | Authenticated | Own entries for an assignment |
| `PUT` | `/api/assignments/{id}/entries/{candidateId}` | Authenticated | Save / update assignment entry |

### Scores
| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/api/seasons/{id}/scores` | Authenticated | Mole scores sorted desc (own data) |
| `GET` | `/api/seasons/{id}/scores/history` | Authenticated | Score per episode (for chart) |

### Users (admin)
| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/api/users` | Admin | List all users |
| `GET` | `/api/users/{id}` | Admin | Get user detail |
| `PUT` | `/api/users/{id}` | Admin | Update user (incl. role) |
| `DELETE` | `/api/users/{id}` | Admin | Delete user |

---

## 7. Mole Score Calculation (C#)

```csharp
public decimal CalculateMoleScore(CandidateSummary c, ScoreWeights w)
{
    return (c.TotalMoneyEarned          * w.MoneyEarnedWeight)
         + (c.TotalMoneyLost            * w.MoneyLostWeight)
         + (c.TotalKeyPositions         * w.KeyPositionWeight)
         + (c.TotalSuspiciousActs       * w.SuspiciousActWeight)
         + (c.TotalTimesAccused         * w.TimesAccusedWeight)
         + (c.TotalAccusedByEliminated  * w.AccusedByEliminatedWeight);
}

// AccusedByEliminated: for every episode where CandidateParticipation.Status = Eliminated,
// check whether that eliminated candidate included this person in their Suspicions list.
// Candidates who are eliminated multiple times contribute each time.
```

**Validation rules (enforced in both backend and frontend):**
- `keyPositions` must be `>= 0`
- `suspiciousActs` can be any integer (negative = evidently innocent behaviour)
- `rank` in `Suspicion` must be between 1 and 6

---

## 8. Frontend Views

### User: DashboardView
- Ranked list of all candidates sorted by mole score (own input)
- `CandidateCard`: photo, name, score, status badge
- Colour coding: high score = warm (orange/red), low = cool (blue)
- Eliminated candidates subtly dimmed; returned ones show a return icon
- Click → CandidateDetailView

### User: EpisodeEntryView
- Tabs per episode (1–10, greyed out if not yet created by admin)
- Per episode: accordion with 2–5 assignments
  - Per assignment: maxAmount (read-only), moneyEarned, moneyLost, note
- Episode summary section (below assignments):
  - keyPositions (≥ 0), suspiciousActs (any integer, explain in tooltip), suspicions (max 6 names), note
- Save button (consider auto-save on blur)

### User: CandidateDetailView
- Header: photo, name, current rank, status badge
- Cumulative line chart of mole score per episode
- Table: all entered values per episode
- Suspicions section: who they accused + who accused them

### Admin: SeasonManagementView
- List of all seasons, mark active
- Create season: name, year, candidate list (name + photo upload + description)
- Create episodes, add assignments with maxAmount
- Update CandidateParticipation status (eliminated / returned)

### Admin: UserManagementView
- Table: name, email, role, active status
- Inline: change role, deactivate, delete

---

## 9. Authentication & Authorisation

- **JWT Bearer tokens** — access token 15 min, refresh token 7 days
- Store tokens in `httpOnly` cookies (safer than localStorage)
- Vue Router guards: `requiresAuth`, `requiresAdmin`
- Backend: `[Authorize]` and `[Authorize(Roles = "Administrator")]`
- **Seed in `Program.cs`**: one initial admin account (email + temporary password) so the app works immediately after first deployment

---

## 10. CLAUDE.md (place in project root)

```markdown
# Who Is The Mole – Project Context

## Stack
- Backend: C# .NET 9, ASP.NET Core Web API, EF Core, SQLite (dev) / PostgreSQL (prod)
- Frontend: Vue 3, Vuetify 3, TypeScript, Pinia, Axios, Vite
- Auth: JWT Bearer + refresh tokens (httpOnly cookies)
- Standalone webapp — no Excel import

## Architecture
Clean Architecture: Domain → Application → Infrastructure → API
No business logic in Controllers.

## Roles
- User: enter data per episode/assignment, view own scores, create assignments
- Administrator: manage seasons, episodes, candidates, users, score weights

## Mole score formula
score = (moneyEarned           × moneyEarnedWeight)
      + (moneyLost             × moneyLostWeight)
      + (keyPositions          × keyPositionWeight)
      + (suspiciousActs        × suspiciousActWeight)
      + (timesAccused          × timesAccusedWeight)
      + (accusedByEliminated   × accusedByEliminatedWeight)

Default weights: -0.1 / 0.09 / 20 / 10 / 5 / 40
Weights are configurable per season via ScoreWeights entity.

## Validation rules
- keyPositions: must be >= 0 (validated in both frontend and backend)
- suspiciousActs: can be any integer, including negative
  (negative = candidate did something that ONLY an innocent person would do)
- suspicion rank: 1–6

## Candidate status & return
- Use CandidateParticipation (status: Active|Eliminated|Returned) per episode.
- Candidates can be eliminated and return multiple times.
- AccusedByEliminated counts for every episode where status = Eliminated.
- Candidate.isActive = false only when definitively out of the game.

## Assignments
- Each Episode has 2–5 Assignments with maxAmount (set by admin or user).
- AssignmentEntry (per user) is optional — EpisodeEntry totals drive the score.

## Naming conventions
- All entity names, property names, file names, and API routes: English
- REST routes: plural nouns, no verbs, HTTP method expresses the action
- Nullable types for optional input fields (decimal?, int?)
- All EpisodeEntry/AssignmentEntry records are user-scoped (userId foreign key)
- Photos: store as file path in DB, serve via /uploads static endpoint — no base64 in DB
```

---

## 11. Recommended Build Order for Claude Code

**Phase 1 – Domain & Database**
```
"Create the solution structure (API, Application, Domain, Infrastructure).
Add all Domain entities as specified in the blueprint §2.
EF Core with SQLite, including a seed for an initial admin account."
```

**Phase 2 – Auth**
```
"Implement JWT authentication with refresh tokens via httpOnly cookies.
AuthController: POST /api/auth/register, login, refresh, logout.
Role-based authorisation middleware for User and Administrator."
```

**Phase 3 – Admin: Seasons & Candidates**
```
"Build SeasonsController and CandidatesController for admin.
Photo upload stored as file path, served via /uploads static endpoint.
CandidateParticipation created when adding a candidate to a season."
```

**Phase 4 – Episodes, Assignments & Entries**
```
"Build EpisodesController (admin only), AssignmentsController (user+admin),
and EntriesController (user+admin) for EpisodeEntry and AssignmentEntry."
```

**Phase 5 – Score Service**
```
"Implement MoleScoreService with configurable weights via ScoreWeights.
ScoresController returns sorted scores + history, scoped to the requesting user."
```

**Phase 6 – Frontend Scaffold**
```
"Vue 3 + Vite + Vuetify 3 + Pinia + TypeScript.
Router with requiresAuth and requiresAdmin guards.
authStore managing JWT via httpOnly cookies."
```

**Phase 7 – User Views**
```
"DashboardView with CandidateCard components (photo, score, status badge).
EpisodeEntryView with tabs per episode and accordion per assignment.
CandidateDetailView with cumulative line chart."
```

**Phase 8 – Admin Views**
```
"SeasonManagementView: create season, add candidates with photo,
update participation status (eliminated/returned).
UserManagementView: table with role change and delete."
```

---

## 12. Key Decisions & Edge Cases

| Topic | Decision |
|---|---|
| KeyPositions negative | ❌ Not allowed — validate `>= 0` in backend + frontend |
| SuspiciousActs negative | ✅ Allowed — means candidate acted too innocently |
| Candidate returns | Tracked via `CandidateParticipation` per episode, not a flag on `Candidate` |
| Multiple eliminations | `AccusedByEliminated` counts each elimination separately |
| Assignment creation | Both User and Admin roles can create assignments |
| Season / episode creation | Admin only |
| Score ownership | Every `EpisodeEntry` and `AssignmentEntry` is scoped to a `userId` |
| Photo storage | File path in DB, static `/uploads` endpoint — no base64 |
| First admin | Seeded in `Program.cs` on first run |
| Score weights | Configurable per season via `ScoreWeights` entity |
