from django.core.management.base import BaseCommand
from apps.iam.models import Permission, Role


# Catalogue permissions : ressource × action
# Flux cible :
#   Super Admin  → company.* (+ tout via is_superuser)
#   Administrateur (tenant) → tout sauf company.create/delete plateforme
#   Manager → gares, bus/places, lignes, trajets, tarifs, employés
#   Chef de gare → ops gare
#   Réceptionniste / Contrôleur / SAV / Comptable → métier limité
PERMISSIONS_DATA = [
    # Compagnie (tenant) — create/delete = Super Admin plateforme
    ('company', 'create', 'Créer une compagnie (tenant)'),
    ('company', 'read', 'Voir une compagnie'),
    ('company', 'update', 'Modifier une compagnie'),
    ('company', 'delete', 'Supprimer une compagnie'),

    # Gare
    ('gare', 'create', 'Créer une gare'),
    ('gare', 'read', 'Voir les gares'),
    ('gare', 'update', 'Modifier une gare'),
    ('gare', 'delete', 'Supprimer une gare'),

    # Bus (+ sièges générés via capacité)
    ('bus', 'create', 'Créer un bus et ses places'),
    ('bus', 'read', 'Voir les bus'),
    ('bus', 'update', 'Modifier un bus'),
    ('bus', 'delete', 'Supprimer un bus'),

    # Ligne
    ('ligne', 'create', 'Créer une ligne'),
    ('ligne', 'read', 'Voir les lignes'),
    ('ligne', 'update', 'Modifier une ligne'),
    ('ligne', 'delete', 'Supprimer une ligne'),

    # Trajet
    ('trajet', 'create', 'Créer un trajet'),
    ('trajet', 'read', 'Voir les trajets'),
    ('trajet', 'update', 'Modifier un trajet'),
    ('trajet', 'delete', 'Supprimer un trajet'),

    # Tarif
    ('tarif', 'create', 'Créer un tarif'),
    ('tarif', 'read', 'Voir les tarifs'),
    ('tarif', 'update', 'Modifier un tarif'),
    ('tarif', 'delete', 'Supprimer un tarif'),

    # Employé
    ('employe', 'create', 'Ajouter un employé'),
    ('employe', 'read', 'Voir les employés'),
    ('employe', 'update', 'Modifier un employé'),
    ('employe', 'delete', 'Supprimer un employé'),

    # Billet
    ('billet', 'create', 'Créer un billet'),
    ('billet', 'read', 'Voir les billets'),
    ('billet', 'update', 'Modifier un billet'),
    ('billet', 'delete', 'Supprimer un billet'),

    # Paiement
    ('paiement', 'create', 'Créer un paiement'),
    ('paiement', 'read', 'Voir les paiements'),
    ('paiement', 'update', 'Modifier un paiement'),
    ('paiement', 'delete', 'Supprimer un paiement'),

    # Rapport
    ('rapport', 'create', 'Créer un rapport'),
    ('rapport', 'read', 'Voir les rapports'),
    ('rapport', 'update', 'Modifier un rapport'),
    ('rapport', 'delete', 'Supprimer un rapport'),

    # Support client (SAV)
    ('sav', 'create', 'Créer un ticket support'),
    ('sav', 'read', 'Voir les tickets support'),
    ('sav', 'update', 'Traiter un ticket support'),
    ('sav', 'delete', 'Supprimer un ticket support'),

    # IAM (comptes utilisateurs de la compagnie)
    ('iam', 'create', 'Créer un utilisateur'),
    ('iam', 'read', 'Voir les utilisateurs'),
    ('iam', 'update', 'Modifier un utilisateur'),
    ('iam', 'delete', 'Supprimer un utilisateur'),

    # Rôle & Permission (catalogue plateforme, réservé aux administrateurs)
    ('role', 'read', 'Voir le catalogue des rôles et permissions'),

    # Audit
    ('audit', 'read', 'Voir les journaux d\'audit'),

    # Dashboard
    ('dashboard', 'read', 'Accéder au dashboard'),
]


def _all_perm_names():
    return [f'{r}.{a}' for r, a, _ in PERMISSIONS_DATA]


def _perms(*names):
    return list(names)


# Rôles globaux (company=None) — assignés ensuite par compagnie via seed_users
ROLES_DATA = [
    {
        'name': 'Administrateur',
        'description': 'Admin de la compagnie : accès complet au tenant (pas de création de nouvelles compagnies plateforme)',
        'permissions': [
            n for n in _all_perm_names()
            if n not in ('company.create', 'company.delete')
        ],
    },
    {
        'name': 'Manager',
        'description': 'Opérations compagnie : gares, bus/places, lignes, trajets, tarifs, employés',
        'permissions': _perms(
            # Compagnie (lecture / maj profil)
            'company.read', 'company.update',
            # Onboarding ops
            'gare.create', 'gare.read', 'gare.update', 'gare.delete',
            'bus.create', 'bus.read', 'bus.update', 'bus.delete',
            'ligne.create', 'ligne.read', 'ligne.update', 'ligne.delete',
            'trajet.create', 'trajet.read', 'trajet.update', 'trajet.delete',
            'tarif.create', 'tarif.read', 'tarif.update', 'tarif.delete',
            # Équipe (comptes employés déjà créés : Manager consulte, ne gère pas les rôles/permissions)
            'employe.create', 'employe.read', 'employe.update', 'employe.delete',
            'iam.read',
            # Lecture métier
            'billet.read',
            'paiement.read',
            'rapport.read',
            'sav.read', 'sav.create', 'sav.update',
            'audit.read',
            'dashboard.read',
        ),
    },
    {
        'name': 'Chef de gare',
        'description': 'Gestion d\'une gare : employés locaux, billets, trajets du site',
        'permissions': _perms(
            'gare.read', 'gare.update',
            'bus.read',
            'ligne.read',
            'trajet.read', 'trajet.update',
            'tarif.read',
            'employe.read', 'employe.update',
            'billet.read', 'billet.update',
            'paiement.read',
            'rapport.read',
            'sav.read',
            'dashboard.read',
        ),
    },
    {
        'name': 'Réceptionniste',
        'description': 'Vente et gestion des billets au guichet',
        'permissions': _perms(
            'billet.create', 'billet.read', 'billet.update',
            'paiement.create', 'paiement.read',
            'trajet.read',
            'tarif.read',
            'ligne.read',
            'gare.read',
            'bus.read',
            'dashboard.read',
        ),
    },
    {
        'name': 'Contrôleur',
        'description': 'Validation des billets à bord',
        'permissions': _perms(
            'billet.read', 'billet.update',
            'trajet.read',
            'bus.read',
            'gare.read',
            'ligne.read',
            'dashboard.read',
        ),
    },
    {
        'name': 'SAV',
        'description': 'Support client et remboursements',
        'permissions': _perms(
            'billet.read', 'billet.update',
            'paiement.read', 'paiement.update',
            'trajet.read',
            'gare.read',
            'rapport.read',
            'sav.create', 'sav.read', 'sav.update',
            'dashboard.read',
        ),
    },
    {
        'name': 'Comptable',
        'description': 'Gestion financière et rapports',
        'permissions': _perms(
            'paiement.read',
            'billet.read',
            'rapport.create', 'rapport.read',
            'company.read',
            'dashboard.read',
        ),
    },
]


class Command(BaseCommand):
    help = (
        'Seed permissions + rôles globaux IAM '
        '(flux Super Admin → compagnie → Manager → gares/bus)'
    )

    def handle(self, *args, **options):
        self.stdout.write('Seeding permissions...')

        created_count = 0
        for resource, action, description in PERMISSIONS_DATA:
            name = f'{resource}.{action}'
            perm, created = Permission.objects.get_or_create(
                resource=resource,
                action=action,
                defaults={
                    'name': name,
                    'description': description,
                },
            )
            # Garde name/description à jour si déjà existant
            if not created:
                updated = False
                if perm.name != name:
                    perm.name = name
                    updated = True
                if perm.description != description:
                    perm.description = description
                    updated = True
                if updated:
                    perm.save(update_fields=['name', 'description'])
                    self.stdout.write(f'  ~ {name} (updated)')
                else:
                    self.stdout.write(f'  -> {name} (already exists)')
            else:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'  + {name}'))

        self.stdout.write(self.style.SUCCESS(f'\n{created_count} permissions creees'))

        self.stdout.write('\nSeeding global roles...')
        created_roles = 0

        for role_data in ROLES_DATA:
            role, created = Role.objects.get_or_create(
                company=None,
                name=role_data['name'],
                defaults={'description': role_data['description']},
            )

            if role.description != role_data['description']:
                role.description = role_data['description']
                role.save(update_fields=['description'])

            role.permissions.clear()
            perms = Permission.objects.filter(name__in=role_data['permissions'])
            role.permissions.set(perms)

            missing = set(role_data['permissions']) - set(perms.values_list('name', flat=True))
            if missing:
                self.stdout.write(self.style.WARNING(
                    f'  ! {role.name}: permissions introuvables: {sorted(missing)}'
                ))

            if created:
                created_roles += 1
                self.stdout.write(self.style.SUCCESS(
                    f'  + {role.name} ({perms.count()} perms)'
                ))
            else:
                self.stdout.write(
                    f'  -> {role.name} (resync, {perms.count()} perms)'
                )

        self.stdout.write(self.style.SUCCESS(f'\n{created_roles} roles crees / resync OK\n'))
        self.stdout.write(self.style.SUCCESS(
            'Seed IAM termine.\n'
            '   Super Admin (is_superuser) -> cree les compagnies\n'
            '   Manager -> cree gares + bus/places + lignes/trajets\n'
        ))
