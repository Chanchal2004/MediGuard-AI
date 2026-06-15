"""OpenStreetMap Overpass API helper for nearby medical facilities."""
from __future__ import annotations

import math
from typing import List, Dict
import httpx


OVERPASS_URL = "https://overpass-api.de/api/interpreter"
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"


def _haversine(lat1, lon1, lat2, lon2) -> float:
    R = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


async def geocode(query: str) -> Dict | None:
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.get(
            NOMINATIM_URL,
            params={"q": query, "format": "json", "limit": 1},
            headers={"User-Agent": "MediGuardAI/1.0"},
        )
    if r.status_code != 200:
        return None
    data = r.json()
    if not data:
        return None
    return {"lat": float(data[0]["lat"]), "lon": float(data[0]["lon"]), "label": data[0]["display_name"]}


async def find_nearby_facilities(
    lat: float, lon: float, radius_m: int = 5000
) -> Dict[str, List[Dict]]:
    """Find hospitals, clinics, pharmacies near coordinates."""
    query = f"""
    [out:json][timeout:25];
    (
      node["amenity"="hospital"](around:{radius_m},{lat},{lon});
      way["amenity"="hospital"](around:{radius_m},{lat},{lon});
      node["amenity"="clinic"](around:{radius_m},{lat},{lon});
      way["amenity"="clinic"](around:{radius_m},{lat},{lon});
      node["amenity"="doctors"](around:{radius_m},{lat},{lon});
      node["amenity"="pharmacy"](around:{radius_m},{lat},{lon});
      way["amenity"="pharmacy"](around:{radius_m},{lat},{lon});
    );
    out center tags 50;
    """
    async with httpx.AsyncClient(
        timeout=30.0, headers={"User-Agent": "MediGuardAI/1.0"}
    ) as client:
        r = await client.post(OVERPASS_URL, data={"data": query})
    if r.status_code != 200:
        return {"hospitals": [], "clinics": [], "pharmacies": []}
    elements = r.json().get("elements", [])
    hospitals, clinics, pharmacies = [], [], []
    for el in elements:
        tags = el.get("tags", {})
        name = tags.get("name") or tags.get("operator") or "Unnamed facility"
        if el.get("type") == "node":
            elat, elon = el.get("lat"), el.get("lon")
        else:
            center = el.get("center", {})
            elat, elon = center.get("lat"), center.get("lon")
        if elat is None or elon is None:
            continue
        dist_km = _haversine(lat, lon, elat, elon)
        item = {
            "id": str(el.get("id")),
            "name": name,
            "lat": elat,
            "lon": elon,
            "distance_km": round(dist_km, 2),
            "phone": tags.get("phone") or tags.get("contact:phone"),
            "address": tags.get("addr:full")
            or ", ".join(filter(None, [tags.get("addr:housenumber"), tags.get("addr:street"), tags.get("addr:city")]))
            or None,
            "website": tags.get("website") or tags.get("contact:website"),
            "emergency": tags.get("emergency") == "yes",
            "osm_url": f"https://www.openstreetmap.org/{el.get('type')}/{el.get('id')}",
            "directions_url": f"https://www.openstreetmap.org/directions?from={lat},{lon}&to={elat},{elon}",
        }
        amenity = tags.get("amenity")
        if amenity == "hospital":
            hospitals.append(item)
        elif amenity in ("clinic", "doctors"):
            clinics.append(item)
        elif amenity == "pharmacy":
            pharmacies.append(item)
    hospitals.sort(key=lambda x: x["distance_km"])
    clinics.sort(key=lambda x: x["distance_km"])
    pharmacies.sort(key=lambda x: x["distance_km"])
    return {
        "hospitals": hospitals[:15],
        "clinics": clinics[:15],
        "pharmacies": pharmacies[:15],
    }
