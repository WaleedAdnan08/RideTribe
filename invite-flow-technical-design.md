# Technical Design: Tribe Invite Acceptance Flow

## Overview
Currently, when a user is invited to a tribe, they are automatically added as a member (if they exist) or added upon signup (if they are new). The requirement is to change this flow so that users must explicitly **accept** or **reject** an invitation.

## Current Flow
1.  **Inviter** sends invite via `POST /tribes/{tribe_id}/invite`.
2.  **Backend** checks if user exists:
    *   **If User Exists:**
        *   Checks if already member.
        *   **Action:** Immediately creates a `TribeMembership` with status `accepted`.
        *   **Action:** Increments tribe member count.
        *   **Action:** Sends notification `invite_received`.
    *   **If User Does Not Exist:**
        *   **Action:** Creates a `PendingInvite`.
3.  **New User Signup (`POST /auth/signup`):**
    *   Checks for `PendingInvite` by phone.
    *   **Action:** Immediately converts `PendingInvite` to `TribeMembership` with status `accepted`.
    *   **Action:** Increments tribe member count.
    *   **Action:** Sends notification `invite_accepted`.

## Proposed "Acceptance" Flow

### 1. Data Model Changes
*   **`TribeMembership`**: The `status` field already exists. We will use it more strictly.
    *   Values: `invited` (new), `accepted`, `rejected` (optional, or just delete).
*   **`PendingInvite`**: Remains mostly the same, but the transition to membership will now be to `invited` status instead of `accepted`.

### 2. Backend Logic Changes

#### A. Invite Endpoint (`POST /tribes/{tribe_id}/invite`)
*   **If User Exists:**
    *   Create `TribeMembership` with status `invited` (instead of `accepted`).
    *   **DO NOT** increment tribe member count yet.
    *   Send notification `invite_received` (Actionable: "Accept/Decline").
*   **If User Does Not Exist:**
    *   Create `PendingInvite`. (No change needed here).

#### B. Signup Endpoint (`POST /auth/signup`)
*   Find `PendingInvite`.
*   Create `TribeMembership` with status `invited` (instead of `accepted`).
*   **DO NOT** increment tribe member count yet.
*   Send notification `invite_received` (Actionable: "Accept/Decline").
*   Delete `PendingInvite`.

#### C. New Endpoints (Tribe Response)
We need endpoints for the user to respond to the invite.

*   `POST /tribes/{tribe_id}/join` (or `accept-invite`)
    *   **Logic:**
        *   Find membership for `(tribe_id, user_id)` with status `invited`.
        *   Update status to `accepted`.
        *   Increment tribe member count.
        *   Notify tribe owner (optional but good UX).
*   `POST /tribes/{tribe_id}/decline` (or `reject-invite`)
    *   **Logic:**
        *   Find membership for `(tribe_id, user_id)` with status `invited`.
        *   Delete the membership record.
        *   (Optional) Keep record with `rejected` status if we want to block re-invites, but for now deletion is cleaner.

### 3. API Changes

#### `POST /tribes/{tribe_id}/respond`
Instead of two endpoints, we can have one status update endpoint.

*   **Request Body:**
    ```json
    {
      "status": "accepted" | "declined"
    }
    ```

### 4. Frontend Changes
*   **Notifications:** Update the notification UI to show "Accept" and "Decline" buttons for `invite_received` notifications.
*   **Tribe List:** Possibly show "Invited" tribes in a separate section or visually distinct.
*   **Dashboard:** Show pending invites prominently.

## Detailed Implementation Plan

### Phase 1: Backend
1.  **Modify `POST /tribes/{tribe_id}/invite`**:
    *   Change initial membership status to `invited`.
    *   Remove member count increment.
2.  **Modify `POST /auth/signup`**:
    *   Change converted membership status to `invited`.
    *   Remove member count increment.
3.  **Create `POST /tribes/{tribe_id}/respond`**:
    *   Handle `accepted`: Update status, increment count.
    *   Handle `declined`: Delete membership.

### Phase 2: Frontend
1.  **API Integration**: Add `respondToInvite(tribeId, status)` service method.
2.  **Notification Component**: Add action buttons to invite notifications.
3.  **Tribe List**: Display pending invites.