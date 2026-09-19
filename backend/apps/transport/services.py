import math
from django.conf import settings

# Coordonnées (latitude, longitude) — Burkina Faso + Sénégal
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

VILLES_SENEGAL = {
    'Dakar':         (14.6928, -17.4467),
    'Thiès':         (14.7886, -16.9260),
    'Saint-Louis':   (16.0179, -16.4896),
    'Kaolack':       (14.1825, -16.2533),
    'Ziguinchor':    (12.5833, -16.2719),
    'Tambacounda':   (13.7707, -13.6673),
    'Mbour':         (14.4198, -16.9638),
    'Rufisque':      (14.7153, -17.2706),
    'Diourbel':      (14.6600, -16.2333),
    'Louga':         (15.6187, -16.2264),
    'Kolda':         (12.8939, -14.9408),
    'Fatick':        (14.3349, -16.4110),
    'Matam':         (15.6559, -13.2554),
    'Kédougou':      (12.5572, -12.1758),
    'Sédhiou':       (12.7081, -15.5569),
}

# Catalogue unifié pour les lignes (tenant multi-pays)
VILLES = {**VILLES_BURKINA, **VILLES_SENEGAL}


def coordonnees_ville(ville: str):
    """Retourne (latitude, longitude) pour une ville connue, ou None."""
    return VILLES.get(ville)


def _dist_point_segment(lat_p, lon_p, lat_a, lon_a, lat_b, lon_b):
    """
    Retourne (distance_km, t) : distance perpendiculaire d'un point P au segment A→B
    et paramètre t ∈ [0,1] indiquant la position de la projection sur le segment.
    Géométrie plane approchée — précise à l'échelle régionale.
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
    Retourne les villes de VILLES situées à moins de seuil_km
    de la droite départ→arrivée, triées par position sur l'itinéraire.
    Exclut la ville de départ et d'arrivée elles-mêmes.
    """
    if ville_depart not in VILLES or ville_arrivee not in VILLES:
        return []

    lat_d, lon_d = VILLES[ville_depart]
    lat_a, lon_a = VILLES[ville_arrivee]

    resultats = []
    for ville, (lat, lon) in VILLES.items():
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

    # Estimation linéaire (vitesse moyenne 80 km/h)
    distance = _haversine(lat_dep, lon_dep, lat_arr, lon_arr)
    return {
        'distance_km':   round(distance, 1),
        'duree_minutes': round(distance / 80 * 60),
    }


def _resoudre_bus_horaire(horaire):
    """Bus à utiliser pour matérialiser un départ depuis un horaire."""
    from .models import Bus

    if horaire.bus_defaut_id and horaire.bus_defaut and horaire.bus_defaut.actif:
        return horaire.bus_defaut

    qs = Bus.objects.filter(actif=True, type_bus=horaire.type_bus)
    if horaire.company_id:
        qs = qs.filter(company=horaire.company)
    return qs.order_by('id').first()


def _duree_ligne_minutes(ligne):
    """Durée totale estimée de la ligne (dernier arrêt.temps_depuis_depart)."""
    dernier = ligne.arrets.order_by('-ordre').first()
    if dernier and dernier.temps_depuis_depart:
        return int(dernier.temps_depuis_depart)
    return None


def _horaire_couvre_jour(horaire, jour):
    """True si l'horaire circule ce jour-là (jours + bornes de validité)."""
    if not horaire.actif:
        return False
    if horaire.date_debut and jour < horaire.date_debut:
        return False
    if horaire.date_fin and jour > horaire.date_fin:
        return False
    return jour.weekday() in set(horaire.jours_list())


def materialiser_depart(horaire, jour):
    """
    Crée le Trajet du jour pour cet horaire s'il n'existe pas encore.
    L'horaire 08:00 Lun–Dim = un départ chaque jour concerné sur la ligne.
    Retourne (trajet|None, cree: bool, erreur: str|None).
    """
    from datetime import datetime, timedelta
    from django.utils import timezone
    from .models import Trajet

    if not _horaire_couvre_jour(horaire, jour):
        return None, False, None

    bus = _resoudre_bus_horaire(horaire)
    if bus is None:
        return None, False, f'Aucun bus {horaire.type_bus} actif pour cet horaire.'

    naive = datetime.combine(jour, horaire.heure_depart)
    depart = timezone.make_aware(naive, timezone.get_current_timezone())
    if depart <= timezone.now():
        return None, False, None

    existing = Trajet.objects.filter(ligne=horaire.ligne, depart_prevu=depart).first()
    if existing:
        return existing, False, None

    duree = horaire.duree_estimee_min or _duree_ligne_minutes(horaire.ligne)
    arrivee = depart + timedelta(minutes=duree) if duree else None

    trajet = Trajet.objects.create(
        company=horaire.company or horaire.ligne.company,
        ligne=horaire.ligne,
        bus=bus,
        horaire=horaire,
        depart_prevu=depart,
        arrivee_prevue=arrivee,
        statut=Trajet.Statut.PLANIFIE,
    )
    return trajet, True, None


def dates_prochains_departs(horaire, nb_departs=7):
    """Prochaines dates de circulation de l'horaire (pas une fenêtre « X jours » fixe)."""
    from datetime import timedelta
    from django.utils import timezone

    today = timezone.localdate()
    dates = []
    jour = today
    # Garde-fou : max 90 jours calendaires pour trouver nb_departs occurrences
    for _ in range(90):
        if _horaire_couvre_jour(horaire, jour):
            from datetime import datetime
            naive = datetime.combine(jour, horaire.heure_depart)
            depart = timezone.make_aware(naive, timezone.get_current_timezone())
            if depart > timezone.now():
                dates.append(jour)
                if len(dates) >= nb_departs:
                    break
        jour += timedelta(days=1)
    return dates


def assurer_departs_horaire(horaire, date=None, nb_departs=7):
    """
    Matérialise les départs d'un horaire :
    - si date fournie : uniquement ce jour (s'il est un jour de circulation)
    - sinon : les nb_departs prochaines occurrences selon les jours cochés
    """
    crees = 0
    ignores = 0
    erreur = None

    if date is not None:
        cibles = [date] if _horaire_couvre_jour(horaire, date) else []
    else:
        cibles = dates_prochains_departs(horaire, nb_departs=nb_departs)

    for jour in cibles:
        _, cree, err = materialiser_depart(horaire, jour)
        if err and not cree:
            erreur = err
        elif cree:
            crees += 1
        else:
            ignores += 1

    return {'crees': crees, 'ignores': ignores, 'erreur': erreur}


def assurer_trajets_recherche(ville_depart, ville_arrivee, date=None, nb_departs=7):
    """
    Avant une recherche client : matérialise les départs des horaires
    dont la ligne couvre le segment demandé.
    """
    from .models import HoraireLigne, ArretLigne

    dep_lower = ville_depart.lower()
    arr_lower = ville_arrivee.lower()

    ligne_ids = set()
    for ligne_id in (
        ArretLigne.objects.filter(ville__iexact=ville_depart)
        .values_list('ligne_id', flat=True)
        .distinct()
    ):
        arrets = list(
            ArretLigne.objects.filter(ligne_id=ligne_id).order_by('ordre')
            .values_list('ville', 'ordre')
        )
        dep = next((a for a in arrets if a[0].lower() == dep_lower), None)
        arr = next((a for a in arrets if a[0].lower() == arr_lower), None)
        if dep and arr and arr[1] > dep[1]:
            ligne_ids.add(ligne_id)

    if not ligne_ids:
        return {'crees': 0, 'ignores': 0, 'horaires': 0}

    horaires = (
        HoraireLigne.objects
        .filter(actif=True, ligne_id__in=ligne_ids, ligne__active=True)
        .select_related('ligne', 'bus_defaut', 'company')
    )
    total_crees = 0
    total_ignores = 0
    for horaire in horaires:
        r = assurer_departs_horaire(horaire, date=date, nb_departs=nb_departs)
        total_crees += r['crees']
        total_ignores += r['ignores']

    return {'crees': total_crees, 'ignores': total_ignores, 'horaires': horaires.count()}


# Compat : anciennes commandes / appels
def generer_trajets(horaire, jours_avant=14):
    """Compatibilité : matérialise les prochaines occurrences (ignore jours_avant)."""
    return assurer_departs_horaire(horaire, date=None, nb_departs=max(7, min(jours_avant, 30)))


def generer_tous_horaires(jours_avant=14, company=None, nb_departs=7):
    """Matérialise les prochains départs de tous les horaires actifs."""
    from .models import HoraireLigne

    qs = HoraireLigne.objects.filter(actif=True).select_related('ligne', 'bus_defaut', 'company')
    if company is not None:
        qs = qs.filter(company=company)

    total_crees = 0
    total_ignores = 0
    erreurs = []
    for horaire in qs:
        result = assurer_departs_horaire(horaire, date=None, nb_departs=nb_departs)
        total_crees += result['crees']
        total_ignores += result['ignores']
        if result['erreur']:
            erreurs.append(f'Horaire #{horaire.id}: {result["erreur"]}')

    return {
        'crees': total_crees,
        'ignores': total_ignores,
        'horaires': qs.count(),
        'erreurs': erreurs,
    }
