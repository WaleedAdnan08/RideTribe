import httpx
from config import settings
import logging

logger = logging.getLogger(__name__)

async def get_place_details(place_id: str):
    """
    Fetches place details from Google Places API.
    Returns a dictionary with verified name, address, and geo coordinates.
    Returns None if API key is missing, verification fails, or place is not found.
    """
    if not settings.GOOGLE_MAPS_API_KEY:
        logger.warning("GOOGLE_MAPS_API_KEY is not set. Skipping verification.")
        return None

    url = "https://maps.googleapis.com/maps/api/place/details/json"
    params = {
        "place_id": place_id,
        "key": settings.GOOGLE_MAPS_API_KEY,
        "fields": "name,formatted_address,geometry"
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            if data.get("status") != "OK":
                logger.error(f"Google Places API Error for place_id {place_id}: {data.get('status')} - {data.get('error_message')}")
                return None
                
            result = data.get("result", {})
            return {
                "name": result.get("name"),
                "address": result.get("formatted_address"),
                "geo": {
                    "lat": result.get("geometry", {}).get("location", {}).get("lat"),
                    "lng": result.get("geometry", {}).get("location", {}).get("lng")
                }
            }
        except Exception as e:
            logger.error(f"Failed to fetch place details: {e}")
            return None