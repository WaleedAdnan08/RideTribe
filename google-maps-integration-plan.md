# Google Maps & Places Integration Plan

## 1. Environment Setup
- Create `frontend/.env` file (if it doesn't exist).
- Add `VITE_GOOGLE_MAPS_API_KEY` variable.
- **Action Required:** User needs to provide the API Key or add it to the file.

## 2. Dependencies
- Install `@vis.gl/react-google-maps`: The official React components for Google Maps.
- Install `@types/google.maps`: For TypeScript support.

## 3. New Components

### `src/components/ui/PlaceAutocomplete.tsx`
A reusable input component that:
- Loads the Google Maps Places Library.
- Provides address autocomplete suggestions as the user types.
- Returns formatted address data (Address, Place ID, Lat/Lng) upon selection.

### `src/components/ui/Map.tsx`
A reusable Map component to render the Google Map with markers.

## 4. Feature Integration

### A. Destinations Page (`frontend/src/pages/DestinationsPage.tsx`)
- **Current:** Simple text input for "Address".
- **New:** Replace "Address" input with `PlaceAutocomplete`.
- **Logic:** 
    - When a user selects a place, auto-fill the "Name" (if empty) and "Address" fields.
    - Capture `lat` and `lng` coordinates and `google_place_id`.
    - Send this rich data to the backend when saving.

### B. Ride Matches Page (`frontend/src/pages/RideMatchesPage.tsx`)
- **Current:** Table view of matches.
- **New:** Split view (Map + List) or Toggle view.
- **Map Visualization:**
    - Show a marker for the "Destination" (e.g., the School).
    - Show markers for the "Requester" and "Provider" locations (approximate or based on their saved home address if available).
    - *Note: This depends on having geo-coordinates for users/destinations.*

## 5. Backend Considerations
- The `Destination` model in `backend/models.py` already supports `geo` (lat/lng) and `google_place_id`.
- No major backend schema changes required, just ensuring we populate these fields from the frontend.

## 6. Verification
- Verify address autocomplete works.
- Verify coordinates are saved to the database.
- Verify map renders correctly on the Matches page.