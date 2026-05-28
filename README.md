# Iwantapet.xyz

Iwantapet.xyz is an AI pet adoption assistant. It helps a user answer a lifestyle questionnaire, ranks realistic local pet data, explains why each pet fits, saves favorites, and drafts shelter outreach that cannot be sent without explicit user approval.

## MVP status

Working local MVP includes:

- React + TypeScript Vite frontend
- SpacetimeDB TypeScript backend/database schema and reducers
- Firebase Auth integration with email/password and Google sign-in
- No-key local demo auth fallback for development and tests
- Deterministic pet matching engine with hard filters and soft scoring
- Mock AI provider abstraction for profile summaries, match explanations, shelter messages, and shelter questions
- Saved-pets helpers
- Outreach draft workflow with approval guardrail and simulated sending only
- Responsive premium pet-focused UI
- Unit and UI tests for core logic and flows

## Setup

```bash
cd /Users/overtime/iwantapet
npm install --min-release-age=0
cd spacetimedb && npm install --min-release-age=0 && cd ..
```

The `--min-release-age=0` flag may be needed in this environment because npm has a safety window configured and the SpacetimeDB 2.3.0 package is recent.

## Run locally

Frontend only, using local mock/demo behavior:

```bash
npm run dev
```

SpacetimeDB development workflow:

```bash
spacetime build --project-path spacetimedb
spacetime publish iwantapet --module-path spacetimedb
spacetime generate --lang typescript --out-dir src/module_bindings --module-path spacetimedb
npm run dev
```

The frontend is structured so it can run without a live SpacetimeDB during tests, while generated bindings and server reducers are present for integration.

## Firebase setup

Create a Firebase web app and enable these Authentication providers:

- Email/password
- Google

Add these variables to `.env.local`:

```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_APP_ID=...
```

If these are absent, Iwantapet uses a local demo auth identity so tests and local UI exploration do not require real Firebase credentials.

## SpacetimeDB architecture

Server logic lives in `spacetimedb/src/index.ts`.

Tables:

- `users`
- `questionnaire_responses`
- `pets`
- `organizations`
- `matches`
- `saved_pets`
- `outreach_drafts`
- `agent_action_logs`

Reducers:

- `upsert_user_profile`
- `save_questionnaire`
- `upsert_pet`
- `generate_match_score`
- `save_pet`
- `unsave_pet`
- `create_outreach_draft`
- `log_agent_action`
- `mark_draft_approved`
- `mark_draft_sent`
- `seed_mock_pet_data`

Firebase UID and SpacetimeDB identity are stored together through the user/profile reducers. For production, Firebase OIDC ID tokens should be connected to SpacetimeDB auth so `ctx.sender` maps cleanly to the Firebase user identity.

## Matching engine

Core code lives in `src/domain/matching.ts`.

Hard filters:

- distance
- species
- housing restrictions
- allergies
- kids compatibility
- other-pet compatibility

Soft scoring:

- activity/energy level
- age preference
- grooming tolerance
- budget
- experience level
- schedule/time at home

The engine returns a 0-100 score, match reasons, mismatch warnings, and `filteredOut` status.

## AI layer

Core code lives in `src/domain/ai.ts`.

The `AiProvider` interface supports:

- `summarizeUserProfile`
- `explainPetMatch`
- `draftShelterMessage`
- `suggestQuestionsToAskShelter`

Tests use `createMockAiProvider`, so no real API key is required.

## Safety and agent guardrails

Iwantapet never contacts shelters, submits forms, or sends messages automatically.

Outreach lifecycle:

1. Draft created
2. Awaiting approval
3. Approved by user
4. Sent simulated contact

The reducer `mark_draft_sent` rejects any attempt to mark a draft sent unless status is `approved`, with the explicit guardrail message: `Cannot mark outreach sent without explicit user approval`.

Every outreach action is designed to be logged in `agent_action_logs`.

## Tests

```bash
npm test
npm run build
cd spacetimedb && npm run build
```

Coverage includes:

- questionnaire validation
- hard filters
- match scoring
- saved pets
- outreach approval guardrail
- AI mocks
- SpacetimeDB table/reducer presence
- landing/auth/questionnaire/dashboard/outreach UI flow

## Roadmap

- Wire Firebase OIDC ID token directly into SpacetimeDB auth sessions
- Replace mock pet data with source adapters for Petfinder, Adopt-a-Pet, RescueGroups, local shelters, and pet stores
- Add organization-specific outreach templates
- Add real email/form integrations gated by explicit per-message approval
- Add map/radius controls and ZIP geocoding
- Add shelter staff availability and follow-up reminders
- Add private table/API access control hardening for production user data
