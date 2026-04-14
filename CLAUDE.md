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

score = (moneyEarned × moneyEarnedWeight) + (moneyLost × moneyLostWeight) + (keyPositions × keyPositionWeight) + (suspiciousActs × suspiciousActWeight) + (timesAccused × timesAccusedWeight) + (accusedByEliminated × accusedByEliminatedWeight)

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

## Testing

- Every service method in the Application layer gets a unit test
- Test project: `WhoIsTheMole.Tests` (xUnit + Moq + FluentAssertions)
- Naming convention: `MethodName_StateUnderTest_ExpectedBehavior`
- Always write tests alongside the implementation, not after
- Mock all external dependencies (repositories, DbContext)
- MoleScoreService must have full coverage for all weight combinations,
  including negative SuspiciousActs and multiple eliminations
