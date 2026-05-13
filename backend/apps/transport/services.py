import math
from django.conf import settings

# Coordonnées (latitude, longitude) des principales villes du Burkina Faso
VILLES_BURKINA = {
    'Ouagadougou':    (12.3647,  -1.5339),
    'Bobo-Dioulasso': (11.1771,  -4.2979),
    'Koudougou':      (12.2525,  -2.3628),
    'Banfora':        (10.6333,  -4.7667),
    'Ouahigouya':     (13.5833,  -2.4167),
    "Fada N'Gourma":  (12.0606,   0.3592),
    'Dédougou':       (12.4667,  -3.4667),
    'Kaya':           (13.0833,  -1.0833),
    'Tenkodogo':      (11.7833,  -0.3667),
    'Gaoua':          (10.3167,  -3.1833),
    'Ziniaré':        (12.5833,  -1.2833),
    'Kongoussi':      (13.3333,  -1.5333),
    'Réo':            (12.3167,  -2.4667),
    'Houndé':         (11.4833,  -3.5167),
    'Diébougou':      (10.9667,  -3.2500),
    'Léo':            (11.1000,  -2.1000),
    'Manga':          (11.6667,  -1.0667),
    'Toma':           (12.7667,  -2.9000),
    'Nouna':          (12.7333,  -3.8667),
    'Tougan':         (13.0667,  -3.0667),
    'Pô':             (11.1667,  -1.1500),
    'Bogandé':        (12.9833,   0.1333),
    'Gayéri':         (12.6333,   0.4667),
    'Sebba':          (13.4333,   0.5167),
    'Titao':          (13.7667,  -2.0833),
}


def coordonnees_ville(ville: str):
    """Retourne (latitude, longitude) pour une ville du Burkina Faso, ou None."""
    return VILLES_BURKINA.get(ville)


def _dist_point_segment(lat_p, lon_p, lat_a, lon_a, lat_b, lon_b):
    """
    Retourne (distance_km, t) : distance perpendiculaire d'un point P au segment A→B
    et paramètre t ∈ [0,1] indiquant la position de la projection sur le segment.
    Géométrie plane approchée — précise à l'échelle du Burkina Faso.
    """
    R = 6371.0
    cos_lat = math.cos(math.radians((lat_a + lat_b) / 2))
    # Vecteur A→B et A→P en km
    dx = (lon_b - lon_a) * cos_lat * R * math.pi / 180
    dy = (lat_b - lat_a) * R * math.pi / 180
    px = (lon_p - lon_a) * cos_lat * R * math.pi / 180
    py = (lat_p - lat_a) * R * math.pi / 180

    len2 = dx * dx + dy * dy
    if len2 == 0:
        return math.sqrt(px * px + py * py), 0.0

    t = (px * dx + py * dy) / len2
    tc = max(0.0, min(1.0, t))
    ex = px - tc * dx
    ey = py - tc * dy
    return math.sqrt(ex * ex + ey * ey), t


def trouver_arrets_potentiels(ville_depart: str, ville_arrivee: str, seuil_km: float = 120) -> list:
    """
    Retourne les villes de VILLES_BURKINA situées à moins de seuil_km
    de la droite départ→arrivée, triées par position sur l'itinéraire.
    Exclut la ville de départ et d'arrivée elles-mêmes.
    """
    if ville_depart not in VILLES_BURKINA or ville_arrivee not in VILLES_BURKINA:
        return []

    lat_d, lon_d = VILLES_BURKINA[ville_depart]
    lat_a, lon_a = VILLES_BURKINA[ville_arrivee]

    resultats = []
    for ville, (lat, lon) in VILLES_BURKINA.items():
        if ville in (ville_depart, ville_arrivee):
            continue
        dist_km, t = _dist_point_segment(lat, lon, lat_d, lon_d, lat_a, lon_a)
        # Doit être dans l'intervalle (entre départ et arrivée, pas derrière)
        if dist_km <= seuil_km and 0.05 <= t <= 0.95:
            dist_dep = _haversine(lat_d, lon_d, lat, lon)
            resultats.append({
                'ville': ville,
                'latitude': lat,
                'longitude': lon,
                'distance_depuis_depart_km': round(dist_dep, 1),
                '_t': t,
            })

    resultats.sort(key=lambda x: x['_t'])
    for r in resultats:
        del r['_t']
    return resultats


def _haversine(lat1, lon1, lat2, lon2) -> float:
    """Distance en km entre deux points GPS (formule haversine)."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    return R * 2 * math.asin(math.sqrt(a))


def calculer_segment(lat_dep: float, lon_dep: float, lat_arr: float, lon_arr: float) -> dict:
    """
    Calcule distance (km) et durée (minutes) entre deux points.
    Utilise OpenRouteService si la clé est configurée, sinon estimation haversine.
    """
    ors_key = getattr(settings, 'ORS_API_KEY', '')

    if ors_key:
        try:
            import openrouteservice
            client = openrouteservice.Client(key=ors_key)
            routes = client.directions(
                coordinates=[[lon_dep, lat_dep], [lon_arr, lat_arr]],
                profile='driving-car',
                units='km',
            )
            summary = routes['routes'][0]['summary']
            return {
                'distance_km':   round(summary['distance'], 1),
                'duree_minutes': round(summary['duration'] / 60),
            }
        except Exception:
            pass  # Fallback ci-dessous

    # Estimation linéaire (vitesse moyenne 80 km/h sur routes burkinabè)
    distance = _haversine(lat_dep, lon_dep, lat_arr, lon_arr)
    return {
        'distance_km':   round(distance, 1),
        'duree_minutes': round(distance / 80 * 60),
    }
