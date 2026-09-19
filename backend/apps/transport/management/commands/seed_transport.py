"""
Seed transport : bus, sièges, lignes, arrêts, tarifs, horaires + départs.

Prérequis : python manage.py seed_iam && python manage.py seed_users
Usage    : python manage.py seed_transport
"""
from datetime import time

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.iam.models import Company
from apps.transport.models import (
    ArretLigne,
    Bus,
    HoraireLigne,
    Ligne,
    Siege,
    Tarif,
)
from apps.transport.services import VILLES, _haversine, generer_tous_horaires


# Vitesse moyenne pour estimer la durée (km/h)
_VITESSE_KMH = 55

# Catalogues de lignes par compagnie (slug → routes)
# Chaque route : code, nom, villes (ordre), horaires (h, m), type_bus, prix_base_xof
ROUTES_PAR_COMPAGNIE = {
    'dakar-transport': [
        {
            'code': 'DKT-OUA-BOB',
            'nom': 'Ouagadougou — Bobo-Dioulasso',
            'villes': ['Ouagadougou', 'Koudougou', 'Houndé', 'Bobo-Dioulasso'],
            'horaires': [(6, 30), (8, 0), (12, 0), (15, 30), (20, 0)],
            'type_bus': 'STANDARD',
            'prix_base': 5000,
        },
        {
            'code': 'DKT-OUA-BAN',
            'nom': 'Ouagadougou — Banfora',
            'villes': ['Ouagadougou', 'Bobo-Dioulasso', 'Banfora'],
            'horaires': [(7, 0), (14, 0), (21, 0)],
            'type_bus': 'VIP',
            'prix_base': 7000,
        },
    ],
    'senegal-express': [
        {
            'code': 'SEX-OUA-KOU',
            'nom': 'Ouagadougou — Koudougou Express',
            'villes': ['Ouagadougou', 'Réo', 'Koudougou'],
            'horaires': [(7, 30), (10, 0), (13, 0), (17, 0)],
            'type_bus': 'STANDARD',
            'prix_base': 2000,
        },
        {
            'code': 'SEX-OUA-OUA',
            'nom': 'Ouagadougou — Ouahigouya',
            'villes': ['Ouagadougou', 'Kongoussi', 'Ouahigouya'],
            'horaires': [(6, 0), (11, 0), (16, 30)],
            'type_bus': 'STANDARD',
            'prix_base': 3500,
        },
    ],
    'ndiaye-voyages': [
        {
            'code': 'NDY-BOB-BAN',
            'nom': 'Bobo-Dioulasso — Banfora',
            'villes': ['Bobo-Dioulasso', 'Banfora'],
            'horaires': [(8, 0), (11, 0), (15, 0), (18, 30)],
            'type_bus': 'STANDARD',
            'prix_base': 1500,
        },
        {
            'code': 'NDY-BOB-OUA',
            'nom': 'Bobo-Dioulasso — Ouagadougou',
            'villes': ['Bobo-Dioulasso', 'Houndé', 'Koudougou', 'Ouagadougou'],
            'horaires': [(5, 45), (9, 0), (13, 30), (19, 0)],
            'type_bus': 'VIP',
            'prix_base': 5500,
        },
    ],
    'rakieta': [
        {
            'code': 'RAK-OUA-BOB',
            'nom': 'Rakieta Ouaga — Bobo',
            'villes': ['Ouagadougou', 'Koudougou', 'Bobo-Dioulasso'],
            'horaires': [(6, 0), (8, 30), (14, 0), (22, 0)],
            'type_bus': 'STANDARD',
            'prix_base': 4500,
        },
        {
            'code': 'RAK-OUA-OHG',
            'nom': 'Rakieta Ouaga — Ouahigouya',
            'villes': ['Ouagadougou', 'Titao', 'Ouahigouya'],
            'horaires': [(7, 0), (12, 0), (17, 0)],
            'type_bus': 'STANDARD',
            'prix_base': 3000,
        },
        {
            'code': 'RAK-OUA-DED',
            'nom': 'Rakieta Ouaga — Dédougou',
            'villes': ['Ouagadougou', 'Koudougou', 'Tougan', 'Dédougou'],
            'horaires': [(6, 45), (13, 0)],
            'type_bus': 'STANDARD',
            'prix_base': 4000,
        },
    ],
    'tsr-voyageurs': [
        {
            'code': 'TSR-OUA-FAD',
            'nom': "TSR Ouaga — Fada N'Gourma",
            'villes': ['Ouagadougou', 'Ziniaré', "Fada N'Gourma"],
            'horaires': [(6, 15), (10, 30), (15, 0)],
            'type_bus': 'STANDARD',
            'prix_base': 4000,
        },
        {
            'code': 'TSR-OUA-TEN',
            'nom': 'TSR Ouaga — Tenkodogo',
            'villes': ['Ouagadougou', 'Manga', 'Tenkodogo'],
            'horaires': [(7, 0), (11, 30), (16, 0)],
            'type_bus': 'STANDARD',
            'prix_base': 3500,
        },
        {
            'code': 'TSR-OUA-PO',
            'nom': 'TSR Ouaga — Pô',
            'villes': ['Ouagadougou', 'Pô'],
            'horaires': [(8, 0), (14, 30)],
            'type_bus': 'STANDARD',
            'prix_base': 2500,
        },
    ],
    'staf-express': [
        {
            'code': 'STF-BOB-BAN',
            'nom': 'STAF Bobo — Banfora',
            'villes': ['Bobo-Dioulasso', 'Banfora'],
            'horaires': [(7, 0), (9, 30), (12, 0), (16, 0), (19, 0)],
            'type_bus': 'STANDARD',
            'prix_base': 1200,
        },
        {
            'code': 'STF-BOB-GAO',
            'nom': 'STAF Bobo — Gaoua',
            'villes': ['Bobo-Dioulasso', 'Diébougou', 'Gaoua'],
            'horaires': [(6, 30), (13, 0)],
            'type_bus': 'STANDARD',
            'prix_base': 3000,
        },
        {
            'code': 'STF-OUA-BOB',
            'nom': 'STAF Ouaga — Bobo',
            'villes': ['Ouagadougou', 'Bobo-Dioulasso'],
            'horaires': [(5, 30), (10, 0), (18, 0)],
            'type_bus': 'VIP',
            'prix_base': 6000,
        },
    ],
}

# Immatriculations / capacités bus par compagnie
BUS_PAR_COMPAGNIE = {
    'dakar-transport': [
        ('BF-1234-AA', 'STANDARD', 40),
        ('BF-1235-AA', 'STANDARD', 40),
        ('BF-2001-VIP', 'VIP', 28),
    ],
    'senegal-express': [
        ('BF-3301-BB', 'STANDARD', 45),
        ('BF-3302-BB', 'STANDARD', 45),
        ('BF-3303-VIP', 'VIP', 30),
    ],
    'ndiaye-voyages': [
        ('BF-4401-CC', 'STANDARD', 40),
        ('BF-4402-CC', 'STANDARD', 40),
        ('BF-4403-VIP', 'VIP', 26),
    ],
    'rakieta': [
        ('BF-5501-DD', 'STANDARD', 50),
        ('BF-5502-DD', 'STANDARD', 50),
        ('BF-5503-DD', 'STANDARD', 45),
        ('BF-5504-VIP', 'VIP', 32),
    ],
    'tsr-voyageurs': [
        ('BF-6601-EE', 'STANDARD', 42),
        ('BF-6602-EE', 'STANDARD', 42),
        ('BF-6603-VIP', 'VIP', 28),
    ],
    'staf-express': [
        ('BF-7701-FF', 'STANDARD', 38),
        ('BF-7702-FF', 'STANDARD', 38),
        ('BF-7703-VIP', 'VIP', 24),
    ],
}


def _duree_minutes(lat1, lon1, lat2, lon2):
    km = _haversine(lat1, lon1, lat2, lon2)
    return max(15, int(round((km / _VITESSE_KMH) * 60)))


def _prix_segment(prix_base, dist_km, dist_totale):
    """Prix proportionnel à la distance, min 500 XOF."""
    if dist_totale <= 0:
        return prix_base
    ratio = dist_km / dist_totale
    return max(500, int(round(prix_base * ratio / 100) * 100))


class Command(BaseCommand):
    help = 'Seed bus, lignes, tarifs, horaires et départs (multi-compagnies Burkina)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--nb-departs',
            type=int,
            default=10,
            help='Nombre de prochains départs à matérialiser par horaire (défaut: 10)',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        nb_departs = options['nb_departs']
        self.stdout.write('🚌 Seeding transport (bus / lignes / horaires)...\n')

        companies = {
            c.slug: c
            for c in Company.objects.filter(slug__in=ROUTES_PAR_COMPAGNIE.keys())
        }
        if len(companies) < 5:
            self.stdout.write(self.style.ERROR(
                f'❌ Seulement {len(companies)} compagnie(s) trouvée(s). '
                'Lance d\'abord: python manage.py seed_users'
            ))
            return

        bus_par_company = {}
        for slug, company in companies.items():
            bus_par_company[slug] = self._seed_bus(company, BUS_PAR_COMPAGNIE.get(slug, []))

        total_lignes = 0
        total_horaires = 0
        total_tarifs = 0

        for slug, routes in ROUTES_PAR_COMPAGNIE.items():
            company = companies.get(slug)
            if not company:
                continue
            buses = bus_par_company.get(slug, [])
            for route in routes:
                ligne, n_tarifs, n_hor = self._seed_route(company, route, buses)
                if ligne:
                    total_lignes += 1
                    total_tarifs += n_tarifs
                    total_horaires += n_hor

        self.stdout.write('\n📅 Matérialisation des départs...')
        result = generer_tous_horaires(nb_departs=nb_departs)
        self.stdout.write(self.style.SUCCESS(
            f"\n✅ Transport seed OK\n"
            f"   Compagnies : {len(companies)}\n"
            f"   Lignes     : {total_lignes}\n"
            f"   Tarifs     : {total_tarifs}\n"
            f"   Horaires   : {total_horaires}\n"
            f"   Trajets    : {result['crees']} créés "
            f"({result['ignores']} déjà présents)\n"
        ))
        if result.get('erreurs'):
            for e in result['erreurs']:
                self.stdout.write(self.style.WARNING(f'   ⚠ {e}'))

        self.stdout.write('🔎 Exemples de recherches mobile :')
        self.stdout.write('   • Ouagadougou → Bobo-Dioulasso')
        self.stdout.write('   • Ouagadougou → Banfora')
        self.stdout.write('   • Bobo-Dioulasso → Banfora')
        self.stdout.write('   • Ouagadougou → Ouahigouya')
        self.stdout.write("   • Ouagadougou → Fada N'Gourma\n")

    def _seed_bus(self, company, specs):
        created_buses = []
        for immat, type_bus, capacite in specs:
            bus, created = Bus.objects.get_or_create(
                immatriculation=immat,
                defaults={
                    'company': company,
                    'type_bus': type_bus,
                    'capacite': capacite,
                    'actif': True,
                },
            )
            if not created and bus.company_id != company.id:
                bus.company = company
                bus.type_bus = type_bus
                bus.capacite = capacite
                bus.actif = True
                bus.save()

            existing = set(bus.sieges.values_list('numero', flat=True))
            to_create = [
                Siege(bus=bus, numero=str(i))
                for i in range(1, bus.capacite + 1)
                if str(i) not in existing
            ]
            if to_create:
                Siege.objects.bulk_create(to_create)

            created_buses.append(bus)
            mark = '✓' if created else '→'
            self.stdout.write(
                f'  {mark} Bus {bus.immatriculation} ({type_bus}, {bus.sieges.count()} sièges)'
            )
        return created_buses

    def _seed_route(self, company, route, buses):
        code = route['code']
        villes = route['villes']
        for v in villes:
            if v not in VILLES:
                self.stdout.write(self.style.ERROR(f'  ❌ Ville inconnue: {v}'))
                return None, 0, 0

        ligne, created = Ligne.objects.get_or_create(
            code=code,
            defaults={
                'company': company,
                'nom': route['nom'],
                'description': f"Ligne seed {route['nom']}",
                'active': True,
            },
        )
        if not created:
            ligne.company = company
            ligne.nom = route['nom']
            ligne.active = True
            ligne.save(update_fields=['company', 'nom', 'active'])

        # Arrêts
        if not ligne.arrets.exists():
            arrets_payload = []
            for i, ville in enumerate(villes):
                lat, lon = VILLES[ville]
                dist = 0.0
                duree_route = 0
                if i > 0:
                    prev = villes[i - 1]
                    plat, plon = VILLES[prev]
                    dist = round(_haversine(plat, plon, lat, lon), 1)
                    duree_route = _duree_minutes(plat, plon, lat, lon)
                arrets_payload.append(ArretLigne(
                    ligne=ligne,
                    ordre=i,
                    ville=ville,
                    latitude=lat,
                    longitude=lon,
                    distance_depuis_precedent=dist,
                    duree_route_depuis_precedent=duree_route,
                    duree_montee_passagers=5 if i > 0 else 10,
                    duree_descente_passagers=5 if i < len(villes) - 1 else 10,
                    duree_pause=10 if 0 < i < len(villes) - 1 else 0,
                    est_depart=(i == 0),
                    est_arrivee=(i == len(villes) - 1),
                ))
            # Créer sans signal en boucle trop lourde : save un par un OK
            for a in arrets_payload:
                a.save()
            ligne.recalculer_temps()

        arrets = list(ligne.arrets.order_by('ordre'))
        mark = '✓' if created else '→'
        self.stdout.write(
            f'  {mark} Ligne {ligne.code} ({len(arrets)} arrêts) — {company.name}'
        )

        # Tarifs tous segments i→j
        type_bus = route.get('type_bus', 'STANDARD')
        prix_base = route.get('prix_base', 5000)
        lat0, lon0 = VILLES[villes[0]]
        latn, lonn = VILLES[villes[-1]]
        dist_totale = _haversine(lat0, lon0, latn, lonn)
        n_tarifs = 0
        for i, dep in enumerate(arrets):
            for arr in arrets[i + 1:]:
                d_km = _haversine(dep.latitude, dep.longitude, arr.latitude, arr.longitude)
                prix = _prix_segment(prix_base, d_km, dist_totale)
                _, t_created = Tarif.objects.get_or_create(
                    ligne=ligne,
                    arret_depart=dep,
                    arret_arrivee=arr,
                    type_bus=type_bus,
                    defaults={
                        'company': company,
                        'prix': prix,
                        'devise': 'XOF',
                    },
                )
                if t_created:
                    n_tarifs += 1
                # Aussi un tarif STANDARD si la route est VIP (recherche flexible)
                if type_bus == 'VIP':
                    prix_std = max(500, prix - 1000)
                    _, t2 = Tarif.objects.get_or_create(
                        ligne=ligne,
                        arret_depart=dep,
                        arret_arrivee=arr,
                        type_bus='STANDARD',
                        defaults={
                            'company': company,
                            'prix': prix_std,
                            'devise': 'XOF',
                        },
                    )
                    if t2:
                        n_tarifs += 1

        # Horaires
        bus_defaut = next(
            (b for b in buses if b.type_bus == type_bus),
            buses[0] if buses else None,
        )
        duree_ligne = arrets[-1].temps_depuis_depart if arrets else None
        n_hor = 0
        for h, m in route.get('horaires', []):
            heure = time(h, m)
            horaire, h_created = HoraireLigne.objects.get_or_create(
                company=company,
                ligne=ligne,
                heure_depart=heure,
                type_bus=type_bus,
                defaults={
                    'jours': '0,1,2,3,4,5,6',
                    'bus_defaut': bus_defaut,
                    'duree_estimee_min': duree_ligne,
                    'actif': True,
                },
            )
            if not h_created:
                horaire.bus_defaut = bus_defaut or horaire.bus_defaut
                horaire.duree_estimee_min = duree_ligne
                horaire.actif = True
                horaire.jours = '0,1,2,3,4,5,6'
                horaire.save()
            else:
                n_hor += 1

        return ligne, n_tarifs, n_hor
