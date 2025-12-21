<<<<<<< HEAD
# Backend Development Plan: RideTribe (magical-bear-wag)

## 1️⃣ Executive Summary
This document outlines the backend development plan for **RideTribe**, a carpooling coordination platform. The backend will be built using **FastAPI (Python 3.13)** and **MongoDB Atlas** (via Motor & Pydantic v2).

**Key Constraints & Decisions:**
- **Architecture:** Monolithic FastAPI application (async).
- **Database:** MongoDB Atlas (Cloud) exclusively; no local DB instances.
- **Deployment:** No Docker; direct execution.
- **Git Strategy:** Single branch `main` only.
- **Testing:** Manual validation via Frontend UI after every task.
- **Sprints:** Dynamic sprints covering all visible frontend features.

---

## 2️⃣ In-Scope & Success Criteria

**In-Scope Features:**
- **User Authentication:** Signup, Login, Logout, Session management (JWT).
- **Tribe Management:** Create tribes, invite members (by phone), view members, manage trust levels.
- **Destinations:** Manage shared locations with address verification.
- **Schedules:** Manage child transport schedules (pickup/dropoff, recurrence).
- **Ride Matching:** Algorithmic matching of schedules to suggest rides.

**Success Criteria:**
- All frontend pages (`/login`, `/signup`, `/dashboard`, `/tribe`, `/schedule`, `/matches`) function with real backend data.
- No "mock data" remains in use; API calls replace local mock functions.
- All manual test steps pass consistently.
- Code is pushed to `main` only after verified success.

---

## 3️⃣ API Design

**Base Path:** `/api/v1`
**Error Format:** `{ "detail": "Error message" }`

### **Authentication**
- `POST /auth/signup` | Create account | Req: `{name, phone, password}` | Res: `{token, user}`
- `POST /auth/login` | Login | Req: `{phone, password}` | Res: `{token, user}`
- `GET /auth/me` | Get current user | Req: `Header: Bearer Token` | Res: `{user}`

### **Tribes**
- `GET /tribes` | List user's tribes | Res: `[Tribe]`
- `POST /tribes` | Create tribe | Req: `{name}` | Res: `Tribe`
- `GET /tribes/{id}/members` | Get tribe members | Res: `[TribeMembership]`
- `POST /tribes/{id}/invite` | Invite user | Req: `{phone, trust_level}` | Res: `TribeMembership` (pending)
- `PATCH /tribes/members/{id}` | Update trust/status | Req: `{trust_level, status}` | Res: `TribeMembership`

### **Destinations**
- `GET /destinations` | List available destinations | Res: `[Destination]`
- `POST /destinations` | Create destination | Req: `{name, address, category}` | Res: `Destination` (Verified)

### **Schedules**
- `GET /schedules` | List user's schedules | Res: `[ScheduleEntry]`
- `POST /schedules` | Create schedule | Req: `{child_name, dest_id, time, recurrence}` | Res: `ScheduleEntry`
- `DELETE /schedules/{id}` | Remove schedule | Res: `204 OK`

### **Matches**
- `GET /matches` | Get ride suggestions | Res: `[RideMatch]`
- `PATCH /matches/{id}` | Accept/Decline match | Req: `{status}` | Res: `RideMatch`
- `POST /matches/generate` | Trigger manual matching (optional, for testing) | Res: `{count: int}`

---

## 4️⃣ Data Model (MongoDB Atlas)

**Collections & Schemas (Pydantic v2)**

**1. users**
```json
{
  "_id": "ObjectId",
  "name": "Sarah",
  "phone": "+15550001111",
  "hashed_password": "...",
  "created_at": "ISO8601"
}
```

**2. tribes**
```json
{
  "_id": "ObjectId",
  "owner_id": "ObjectId(User)",
  "name": "Soccer Moms",
  "member_count": 1
}
```

**3. tribe_memberships**
```json
{
  "_id": "ObjectId",
  "tribe_id": "ObjectId",
  "user_id": "ObjectId",
  "trust_level": "direct",
  "status": "accepted"
}
```

**4. destinations**
```json
{
  "_id": "ObjectId",
  "name": "Lincoln School",
  "address": "123 School Rd",
  "google_place_id": "ChIJ...",
  "geo": { "lat": 34.0, "lng": -118.0 },
  "created_by": "ObjectId"
}
```

**5. schedules**
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId",
  "child_name": "Leo",
  "destination_id": "ObjectId",
  "pickup_time": "ISO8601",
  "dropoff_time": "ISO8601",
  "recurrence": "daily",
  "status": "active"
}
```

**6. matches**
```json
{
  "_id": "ObjectId",
  "requester_id": "ObjectId",
  "provider_id": "ObjectId",
  "schedule_entry_id": "ObjectId",
  "match_score": 95,
  "status": "suggested"
}
```

---

## 5️⃣ Frontend Audit & Feature Map

| Page / Component | Data Needed | Backend Endpoint | Notes |
|------------------|-------------|------------------|-------|
| **SignupPage** | User Reg | `POST /auth/signup` | |
| **LoginPage** | Auth Token | `POST /auth/login` | |
| **Dashboard** | User Info | `GET /auth/me` | Shows "Welcome {name}" |
| **TribePage** | List Tribes & Members | `GET /tribes`, `GET /tribes/{id}/members` | |
| **TribePage (Invite)** | Invite | `POST /tribes/{id}/invite` | |
| **SchedulePage** | List Trips | `GET /schedules` | |
| **SchedulePage (Add)** | Create Trip | `POST /schedules` | Requires fetching Destinations first |
| **Destinations** | List Dests | `GET /destinations` | |
| **RideMatchesPage** | List Matches | `GET /matches` | |

---

## 6️⃣ Configuration & ENV Vars

- `APP_ENV`: `development`
- `PORT`: `8000`
- `MONGODB_URI`: `mongodb+srv://...`
- `JWT_SECRET`: `(generated-secret)`
- `JWT_EXPIRES_IN`: `86400`
- `CORS_ORIGINS`: `http://localhost:5173` (Frontend URL)
- `GOOGLE_MAPS_API_KEY`: (Optional for MVP if mocking geo-lookup, else required)

---

## 7️⃣ Background Work

- **Matching Engine:**
  - **Trigger:** Synchronous call via `BackgroundTasks` whenever `POST /schedules` is called.
  - **Logic:** Find other schedules in the same tribe with similar time (+/- 15 mins) and same destination. Create `RideMatch` document.

---

## 8️⃣ Integrations

- **Google Places API (Simplified for MVP):**
  - Used in `POST /destinations` to geocode address strings to Lat/Lng.
  - *Fallback:* If API key missing, mock Lat/Lng for development.

---

## 9️⃣ Testing Strategy

- **Method:** Manual verification via Frontend UI.
- **Process:**
  1. Backend runs on localhost:8000.
  2. Frontend proxies or points to localhost:8000.
  3. Developer performs the "Manual Test Step" listed in the task.
  4. If success → Mark done.
  5. End of Sprint → Push to `main`.

---

## 🔟 Dynamic Sprint Plan & Backlog

### 🧱 S0 – Environment Setup & Frontend Connection

**Objectives:**
- Initialize FastAPI project structure.
- Connect to MongoDB Atlas.
- Establish `/healthz` and CORS.
- Configure Frontend to talk to Backend.

**Tasks:**
- **Setup FastAPI & Mongo**
  - Install `fastapi`, `uvicorn`, `motor`, `pydantic-settings`.
  - Create `main.py` with `FastAPI()` and CORS middleware.
  - Create `db.py` for Motor client connection.
  - **Manual Test Step:** Run `uvicorn main:app --reload`. Visit `http://localhost:8000/docs`.
  - **User Test Prompt:** "Check that the Swagger UI loads at localhost:8000/docs."

- **Implement Health Endpoint**
  - Add `GET /healthz` returning `{"status": "ok", "db": "connected"}`.
  - **Manual Test Step:** Hit `/healthz`.
  - **User Test Prompt:** "Request /healthz and confirm it returns DB connected status."

- **Frontend Integration Config**
  - Update `vite.config.ts` or `frontend/src/lib/utils.ts` (or creating an API client helper) to point to `http://localhost:8000/api/v1`.
  - **Manual Test Step:** Check browser console for connection errors (none expected yet).
  - **User Test Prompt:** "Ensure frontend configuration points to the correct backend port."

**Definition of Done:**
- Backend running.
- DB connected.
- Repo initialized and pushed to `main`.

---

### 🧩 S1 – Basic Auth (Signup / Login)

**Objectives:**
- Enable user creation and session management.
- Replace `AuthContext` mock logic with API calls.

**Tasks:**
- **User Model & Auth Routes**
  - Create `User` model in `models.py`.
  - Implement `POST /auth/signup` and `POST /auth/login`.
  - **Manual Test Step:** Use Swagger UI to create a user and get a token.
  - **User Test Prompt:** "Create a user via Swagger and verify you receive a JWT token."

- **Get Current User**
  - Implement `GET /auth/me` protected by JWT dependency.
  - **Manual Test Step:** Use Swagger 'Authorize' button, then hit `/auth/me`.
  - **User Test Prompt:** "Verify /auth/me returns the correct user profile."

- **Frontend Auth Integration**
  - Modify `frontend/src/contexts/AuthContext.tsx` to call API instead of `localStorage` mocks.
  - **Manual Test Step:** Open App -> Signup Page -> Create Account -> Verify redirection to Dashboard.
  - **User Test Prompt:** "Sign up a new user in the UI and confirm you are logged in and redirected."

**Definition of Done:**
- Full Auth lifecycle works in UI.
- Push to `main`.

---

### 📍 S2 – Destinations Management

**Objectives:**
- Allow users to view and create shared destinations (prerequisite for schedules).

**Tasks:**
- **Destination API**
  - Create `Destination` model.
  - Implement `GET /destinations` and `POST /destinations`.
  - **Manual Test Step:** Create a destination via Swagger.
  - **User Test Prompt:** "Create a destination called 'School' and verify it appears in the list."

- **Frontend Integration (Destinations)**
  - Wire up `DestinationsPage` (if exists) or the dropdown in `SchedulePage` to fetch real data.
  - **Manual Test Step:** Go to Schedule -> Add Trip -> Verify 'Destination' dropdown loads from backend (or mock list is replaced).
  - **User Test Prompt:** "Open the Schedule creation form and check if destinations load."

**Definition of Done:**
- Destinations can be created and listed.
- Push to `main`.

---

### 👥 S3 – Tribe Management

**Objectives:**
- Manage social connections (Tribes).

**Tasks:**
- **Tribe API**
  - Create `Tribe` and `TribeMembership` models.
  - Implement `POST /tribes` (Create tribe).
  - Implement `POST /tribes/{id}/invite` (Add member).
  - **Manual Test Step:** Create a tribe and invite a dummy phone number via Swagger.
  - **User Test Prompt:** "Create a tribe and invite a member via API."

- **Frontend Integration (Tribe Page)**
  - Update `TribePage.tsx` to fetch `GET /tribes` and members.
  - Wire "Invite Family" button to API.
  - **Manual Test Step:** Go to Tribe Page -> Create Tribe (if UI supports) or View Tribe -> Invite Member.
  - **User Test Prompt:** "Invite a member on the Tribe page and verify they appear in the list."

**Definition of Done:**
- Users can manage tribes via UI.
- Push to `main`.

---

### 📅 S4 – Schedule Management

**Objectives:**
- Core feature: Inputting transport needs.

**Tasks:**
- **Schedule API**
  - Create `ScheduleEntry` model.
  - Implement `POST /schedules` and `GET /schedules`.
  - **Manual Test Step:** Post a schedule entry via Swagger.
  - **User Test Prompt:** "Create a schedule entry and verify it is saved."

- **Frontend Integration (Schedule Page)**
  - Update `SchedulePage.tsx` to fetch and display real schedules.
  - Wire "Add Trip" form to `POST /schedules`.
  - **Manual Test Step:** Add a trip for 'Leo' to 'School' at 8:00 AM.
  - **User Test Prompt:** "Add a new trip in the UI and verify it appears in the schedule list."

**Definition of Done:**
- Schedules are persistent.
- Push to `main`.

---

### 🚗 S5 – Ride Matching Logic

**Objectives:**
- The "Magic": Automatically find matches between schedules.

**Tasks:**
- **Matching Algorithm**
  - Implement a helper function `find_matches(new_schedule)` that looks for overlapping schedules in the same tribe.
  - Hook this into `POST /schedules` using `BackgroundTasks`.
  - **Manual Test Step:** Create User A (Schedule: School 8am). Create User B (Same Tribe, Schedule: School 8am). Check DB for `matches` collection.
  - **User Test Prompt:** "Simulate two matching schedules and check if a match document is created."

- **Matches API & Frontend**
  - Implement `GET /matches`.
  - Update `RideMatchesPage.tsx` to display real matches.
  - **Manual Test Step:** Dashboard -> Matches -> Verify the match created above is visible.
  - **User Test Prompt:** "View the Matches page and confirm the suggested ride appears."

**Definition of Done:**
- End-to-end flow: Schedule -> Match -> UI Display works.
- Final Push to `main`.
=======
# Backend Development Plan: RideTribe

## 1️⃣ Executive Summary
- **Goal:** Build the backend for **RideTribe**, a carpooling coordination platform for parents.
- **Stack:** Python 3.13 (FastAPI), MongoDB Atlas (Motor), Pydantic v2.
- **Constraints:** No Docker, synchronous background tasks (using FastAPI `BackgroundTasks`), manual testing per task, single-branch (`main`) Git workflow.
- **Strategy:** 6 Sprints (S0-S5) to deliver all frontend-visible features, prioritizing dependencies (Auth -> Destinations -> Tribes -> Schedules -> Matching).

## 2️⃣ In-Scope & Success Criteria
- **In-Scope Features:**
  - User Authentication (Signup, Login, Logout)
  - Destination Management (Create, List)
  - Tribe Management (Create, Invite, List Members)
  - Schedule Management (Create, List, Delete)
  - Ride Matching (Algorithm, Suggestions, Accept/Decline)
- **Success Criteria:**
  - All frontend pages display real data from MongoDB.
  - Users can complete the core "Match Discovery" workflow end-to-end.
  - All manual verification steps pass via the frontend UI.

## 3️⃣ API Design
- **Base Path:** `/api/v1`
- **Error Format:** `{ "detail": "Description of error" }`
- **Auth Header:** `Authorization: Bearer <token>`
- **Endpoints:**
  - **Auth:**
    - `POST /auth/signup` - Register new user
    - `POST /auth/login` - Login and get token
    - `GET /auth/me` - Get current user profile
  - **Destinations:**
    - `GET /destinations` - List user's destinations
    - `POST /destinations` - Create new destination
  - **Tribes:**
    - `GET /tribes` - List user's tribes
    - `POST /tribes` - Create new tribe
    - `GET /tribes/{id}/members` - List members of a tribe
    - `POST /tribes/{id}/invite` - Invite member by phone (auto-accept for MVP)
  - **Schedules:**
    - `GET /schedules` - List user's schedules
    - `POST /schedules` - Create schedule (triggers matching)
    - `DELETE /schedules/{id}` - Delete schedule
  - **Matches:**
    - `GET /matches` - List matches (requester or provider)
    - `PATCH /matches/{id}` - Update match status (accept/decline)
    - `POST /matches/generate` - Trigger manual matching (dev/debug)

## 4️⃣ Data Model (MongoDB Atlas)
- **users**
  - `_id`: ObjectId
  - `name`: string
  - `phone`: string (unique)
  - `hashed_password`: string
  - `created_at`: datetime

- **destinations**
  - `_id`: ObjectId
  - `name`: string
  - `address`: string
  - `category`: string
  - `created_by`: ObjectId (User)
  - `created_at`: datetime

- **tribes**
  - `_id`: ObjectId
  - `owner_id`: ObjectId (User)
  - `name`: string
  - `member_count`: int
  - `created_at`: datetime

- **tribe_memberships**
  - `_id`: ObjectId
  - `tribe_id`: ObjectId
  - `user_id`: ObjectId
  - `trust_level`: string ("direct", "activity-specific", "emergency-only")
  - `status`: string ("accepted")
  - `created_at`: datetime

- **schedules**
  - `_id`: ObjectId
  - `user_id`: ObjectId
  - `child_name`: string
  - `destination_id`: ObjectId
  - `pickup_time`: datetime
  - `recurrence`: string
  - `status`: string ("active")
  - `created_at`: datetime

- **matches**
  - `_id`: ObjectId
  - `requester_id`: ObjectId
  - `provider_id`: ObjectId
  - `schedule_entry_id`: ObjectId
  - `provider_schedule_id`: ObjectId
  - `match_score`: int
  - `status`: string ("suggested", "accepted", "declined")
  - `created_at`: datetime

## 5️⃣ Frontend Audit & Feature Map
- **Signup/Login Pages:**
  - Route: `/login`, `/signup`
  - Needs: Auth endpoints, Token storage
- **Dashboard/Schedule Page:**
  - Route: `/schedule`
  - Needs: List/Create/Delete Schedules, List Destinations (for dropdown)
- **Tribe Page:**
  - Route: `/tribe`
  - Needs: List Tribes, Create Tribe, Invite Member, List Members
- **Destinations Page:**
  - Route: `/destinations`
  - Needs: List/Create Destinations
- **Ride Matches Page:**
  - Route: `/matches`
  - Needs: List Matches, Update Status

## 6️⃣ Configuration & ENV Vars
- `MONGODB_URI`: MongoDB Atlas connection string
- `JWT_SECRET`: Secret key for token signing
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Token validity duration
- `CORS_ORIGINS`: Frontend URL (e.g., `http://localhost:5173`)

## 7️⃣ Background Work
- **Match Generation:**
  - Trigger: On `POST /schedules`
  - Mechanism: FastAPI `BackgroundTasks`
  - Logic: Find overlaps (+/- 15 mins) with tribe members going to the same destination.

## 8️⃣ Integrations
- **None** (Google Places/Maps deferred/stubbed for MVP).

## 9️⃣ Testing Strategy
- **Manual Validation:**
  - Every task requires a "Manual Test Step" executed via the frontend UI.
  - "User Test Prompt" provided for easy verification.
- **Git:**
  - Commit and push to `main` ONLY after a full sprint's tasks are verified.

---

## 🔟 Dynamic Sprint Plan & Backlog (S0 → S5)

---

## 🧱 S0 – Environment Setup & Frontend Connection

**Objectives:**
- Initialize FastAPI project with Motor (MongoDB).
- Configure CORS and Env vars.
- Ensure frontend can connect to backend.

**Tasks:**
- Setup FastAPI + Motor + Config
  - Manual Test Step: Run backend `uvicorn main:app --reload`. Access `http://localhost:8000/api/v1/healthz`.
  - User Test Prompt: "Start the backend. Open localhost:8000/api/v1/healthz in browser and confirm it returns {'status': 'ok', 'db': 'connected'}."

- Configure CORS
  - Manual Test Step: Verify `main.py` includes CORS middleware for `http://localhost:5173`.
  - User Test Prompt: "Check backend logs or code to confirm CORS is enabled for the frontend port."

**Definition of Done:**
- Backend running, connected to Atlas, accessible by Frontend.

---

## 🧩 S1 – Basic Auth (Signup / Login)

**Objectives:**
- Secure access to the app.
- Persist users in MongoDB.

**Tasks:**
- Implement User Model & Signup (`POST /auth/signup`)
  - Manual Test Step: Go to Signup page. Enter Name, Phone, Password. Click Signup.
  - User Test Prompt: "Register a new user 'Test Mom' and confirm you are redirected to the login page or dashboard."

- Implement Login & JWT Generation (`POST /auth/login`)
  - Manual Test Step: Go to Login page. Enter credentials. Check browser Local Storage for `authToken`.
  - User Test Prompt: "Log in with the new account. Verify you gain access to the dashboard."

- Implement `GET /auth/me`
  - Manual Test Step: Refresh the page. Ensure user name is still displayed in the UI.
  - User Test Prompt: "Reload the app. Confirm your user profile name is still displayed."

**Definition of Done:**
- User can sign up, log in, and persist session via token.

---

## 📍 S2 – Destinations Management

**Objectives:**
- Allow users to create and manage common locations.

**Tasks:**
- Implement Destination Model & `POST /destinations`
  - Manual Test Step: Go to Destinations page. Click "Add Destination". Fill Name (e.g., "Central School"), Address. Save.
  - User Test Prompt: "Create a destination 'Central School'. Verify it appears in the list."

- Implement `GET /destinations`
  - Manual Test Step: Refresh Destinations page.
  - User Test Prompt: "Refresh Destinations page and confirm 'Central School' is listed."

**Definition of Done:**
- Destinations CRUD working from UI.

---

## 🤝 S3 – Tribe Management

**Objectives:**
- Enable users to build their trusted network.

**Tasks:**
- Implement Tribe Model & `POST /tribes`
  - Manual Test Step: Go to Tribe page. Click "Create Tribe". Enter Name. Save.
  - User Test Prompt: "Create a new tribe 'Soccer Group'."

- Implement `POST /tribes/{id}/invite` & `GET /tribes/{id}/members`
  - Manual Test Step: Create a SECOND user (in incognito). Get their phone number. In FIRST user's Tribe page, click "Invite Member", enter Second User's phone.
  - User Test Prompt: "Invite the second user to your tribe. Check that they appear in the member list."

- Implement `GET /tribes`
  - Manual Test Step: View Tribe page.
  - User Test Prompt: "Verify all your tribes are listed correctly."

**Definition of Done:**
- Users can form tribes and link accounts via phone number.

---

## 📅 S4 – Schedule Management

**Objectives:**
- Core data entry for ride needs.

**Tasks:**
- Implement Schedule Model & `POST /schedules`
  - Manual Test Step: Go to Schedule page. Click "Add Trip". Select Child, Destination, Time. Save.
  - User Test Prompt: "Add a pickup schedule for 'Leo' at 'Central School' for tomorrow 3 PM."

- Implement `GET /schedules`
  - Manual Test Step: View Schedule list.
  - User Test Prompt: "Verify the trip you just added appears on the schedule."

- Implement `DELETE /schedules/{id}`
  - Manual Test Step: Click Delete on a trip.
  - User Test Prompt: "Delete the trip and verify removal."

**Definition of Done:**
- Full Schedule CRUD.

---

## 🚗 S5 – Ride Matching Logic

**Objectives:**
- Automatically find overlaps.

**Tasks:**
- Implement Matching Algorithm (Background Task)
  - Logic: On Schedule Create -> Find intersection of (Same Destination + Time +/- 15m + Tribe Member).
  - Create `RideMatch` document.

- Implement `GET /matches`
  - Manual Test Step:
    1. User A (Tribe Owner): Adds Trip to School at 3:00 PM.
    2. User B (Tribe Member): Adds Trip to School at 3:00 PM.
    3. User A checks "Matches" page.
  - User Test Prompt: "As User A, verify you see a suggested match with User B."

- Implement `PATCH /matches/{id}` (Accept/Decline)
  - Manual Test Step: Click "Accept" on the match.
  - User Test Prompt: "Accept the ride match. Verify status changes to 'Accepted'."

**Definition of Done:**
- End-to-end flow: Schedules -> Match Generation -> UI Display.
>>>>>>> 99a7bd89d699575d6cfb6dac3b9a739fe47fe8e9
