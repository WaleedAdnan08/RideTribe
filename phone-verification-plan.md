# 📱 Real-Time Phone Verification Integration Plan

## 1. Executive Summary
To integrate real-time phone verification "intelligently," we recommend using a **Managed Verification Service** (specifically **Twilio Verify**) rather than building a custom OTP (One-Time Password) system. This approach offloads complex security concerns (rate limiting, brute force protection, code generation) and ensures high delivery rates.

**Why Twilio Verify?**
- **Zero Database State:** We don't need to store codes or expiry times; Twilio handles the lifecycle.
- **Security Built-in:** Includes default rate limiting and fraud protection.
- **Global Reach:** Intelligent routing for reliable SMS delivery.

---

## 2. Architecture & Flow

### A. Current Flow (Unsafe)
1. User enters Name, Phone, Password.
2. `POST /auth/signup` -> User created immediately.
   - *Risk:* Fake accounts, typo in phone numbers preventing future access.

### B. Proposed "Intelligent" Flow
We will implement a **Verify-First** approach. The user must prove ownership of the phone number *before* the account is created.

#### 1. Request Code (Frontend -> Backend -> Twilio)
- **User Action:** Enters Phone Number on Signup Form.
- **API Call:** `POST /auth/request-verify` `{ "phone": "+1555..." }`
- **Backend Logic:**
  1. Check if phone is already registered in `users` collection (Fail early if yes).
  2. Call Twilio Verify API (`v2/Services/{SID}/Verifications`) to send SMS.
- **User Feedback:** Input field for "6-digit code" appears.

#### 2. Complete Signup (Frontend -> Backend -> Twilio)
- **User Action:** Enters 6-digit code, Name, and Password -> Clicks "Sign Up".
- **API Call:** `POST /auth/signup` `{ "name": "...", "phone": "...", "password": "...", "code": "123456" }`
- **Backend Logic:**
  1. Call Twilio Verify API (`v2/Services/{SID}/VerificationCheck`) with `phone` and `code`.
  2. **If Valid:** Proceed with existing User Creation logic (hash password, save to DB, generate JWT).
  3. **If Invalid:** Return 400 Error ("Incorrect or expired code").

---

## 3. Implementation Steps

### Phase 1: Backend Setup
1. **Environment Variables:**
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_VERIFY_SERVICE_SID`
2. **Dependency:** Add `twilio` python package.
3. **New Utility:** Create `utils/verification.py` to wrap Twilio calls.
4. **New Endpoint:** `POST /auth/request-verify` (Rate limited).
5. **Update Endpoint:** Modify `POST /auth/signup` to accept and validate `code`.

### Phase 2: Frontend Updates
1. **Signup Form State:** Add steps or conditional rendering.
   - *Step 1:* Phone Number input + "Send Code" button.
   - *Step 2:* Code input + Name/Password inputs + "Create Account" button.
2. **Error Handling:** Graceful display of "Invalid Code" or "Too many attempts".

### Phase 3: Login (Optional/Future)
- While the primary task is for *signup*, this infrastructure allows for "Passwordless Login" via SMS in the future if desired.

---

## 4. Cost & Constraints
- **Cost:** Twilio Verify charges per successful verification (approx. $0.05 USD).
- **Dev Mode:** For development without cost, we can use a **"Magic Code"** strategy.
  - If `APP_ENV=development` and phone is a specific "Test Number" (e.g., `+15550000000`), the backend mocks the Twilio call and accepts a fixed code (e.g., `888888`).

## 5. Security Considerations
- **Rate Limiting:** Prevent SMS spamming by limiting `request-verify` calls per IP/Phone.
- **Input Sanitization:** Ensure phone numbers are strictly E.164 format before sending to Twilio.
