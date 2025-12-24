# RideTribe Manual Testing Guide

This guide outlines the steps to verify the core functionality of the RideTribe application, including the new "Invite Acceptance" and "Destination Verification" features.

## Prerequisites
1.  **Backend Running:** Ensure the backend server is running (`start-backend.bat` or `uvicorn backend.main:app --reload`).
2.  **Frontend Running:** Ensure the frontend development server is running (`start-frontend.bat` or `npm run dev` in `frontend/`).
3.  **Database:** Ensure your MongoDB instance is running. You can reset the database for a clean start using `python backend/reset_db.py`.

---

## 1. Authentication & Setup
**Goal:** Create two distinct users to test interaction.

1.  **Open Browser A (e.g., Chrome):** Navigate to `http://localhost:5173`.
2.  **Sign Up User A (The Driver/Parent):**
    *   Click "Sign Up".
    *   Name: `Alice`
    *   Phone: `1111111111`
    *   Password: `password`
    *   *Result:* You should be redirected to the Dashboard.
3.  **Open Browser B (e.g., Firefox or Incognito):** Navigate to `http://localhost:5173`.
4.  **Sign Up User B (The Friend/Neighbor):**
    *   Click "Sign Up".
    *   Name: `Bob`
    *   Phone: `2222222222`
    *   Password: `password`
    *   *Result:* You should be redirected to the Dashboard.

---

## 2. Tribe Management & Invite Flow
**Goal:** Establish a trusted connection between Alice and Bob.

1.  **User A (Alice) - Create Tribe:**
    *   Go to "My Tribe" page.
    *   Click "Create New Tribe".
    *   Name: `Soccer Moms`.
    *   *Result:* Tribe card appears.
2.  **User A (Alice) - Invite User B:**
    *   Click "Invite Member" on the `Soccer Moms` card.
    *   Enter Phone: `2222222222` (Bob's number).
    *   Select Trust Level: `Direct`.
    *   Click "Send Invite".
    *   *Result:* Toast message "Invite sent successfully".
3.  **User B (Bob) - Accept Invite:**
    *   Refresh the page or check Notifications (Bell icon).
    *   **Method 1 (Notifications):** Open Notification Center. You should see "Invite Received". It should say **"You have been invited by Alice to join the tribe 'Soccer Moms'!"**. Click **Accept**.
    *   **Method 2 (Tribe Page):** Go to "My Tribe" page. Look for the **"Pending Invites"** section at the top. Click **Accept** on the `Soccer Moms` card.
    *   *Result:* `Soccer Moms` moves to the main list. Bob is now a member.

---

## 3. Destination Management (Intelligent Verification)
**Goal:** Add a shared location for carpooling.

1.  **User A (Alice) - Add Destination:**
    *   Go to "Destinations" page.
    *   Click "Add New Destination".
    *   Name: `Central Park` (or leave empty to auto-fill).
    *   Address: Start typing `Central Park, New York`.
    *   **Verification Check:** Select a suggestion from the dropdown (this uses Google Places API).
    *   Click "Save Changes".
    *   *Result:* Destination appears in the list. It should have a "Verified Location" badge if the backend API key is working correctly.

---

## 4. Scheduling & Matching
**Goal:** Trigger the AI matching algorithm.

1.  **User A (Alice) - Schedule a Trip:**
    *   Go to "Schedule" page.
    *   Click "Schedule Trip".
    *   Child: `Leo`.
    *   Destination: Select `Central Park` (or whatever you created).
    *   Date: Select **Tomorrow's Date**.
    *   Time: `08:00 AM`.
    *   Recurrence: `One-time`.
    *   Click "Schedule Trip".
2.  **User B (Bob) - Schedule a Matching Trip:**
    *   Go to "Destinations" page. **Create the same destination** (e.g. search "Central Park" again) so Bob has it in his list. *(Note: In a future update, Tribes will share destination libraries).*
    *   Go to "Schedule" page.
    *   Click "Schedule Trip".
    *   Child: `Mia`.
    *   Destination: Select his `Central Park`.
    *   Date: Select **Tomorrow's Date** (Same as Alice).
    *   Time: `08:05 AM` (Within 15 mins of Alice).
    *   Click "Schedule Trip".

---

## 5. Verifying the Match
**Goal:** Confirm the system identified the overlap.

1.  **User A (Alice) - Check Matches:**
    *   Wait 10-20 seconds (background task latency).
    *   Go to "Ride Matches" page.
    *   *Result:* You should see a card: "Match with Bob for Central Park".
    *   Click "Accept".
2.  **User B (Bob) - Confirm:**
    *   Go to "Ride Matches" page.
    *   *Result:* Status should update to "Accepted" (once refreshed).

---

## Troubleshooting
*   **No Match Found?** Ensure both users are in the same Tribe (Step 2) and used the exact same Google Place (or same Destination Name) and time window (+/- 15 mins).
*   **Invite Failed?** Ensure you are inviting a registered phone number. Invites to unregistered numbers are blocked.