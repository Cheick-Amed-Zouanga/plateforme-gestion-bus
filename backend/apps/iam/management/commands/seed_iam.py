from django.core.management.base import BaseCommand
from apps.iam.models import Permission, Role


class Command(BaseCommand):
    help = 'Seed the database with default permissions and roles'

    def handle(self, *args, **options):
        self.stdout.write('🌱 Seeding permissions...')

        # Permissions par ressource
        permissions_data = [
            # Bus
            ('bus', 'create', 'Créer un bus'),
            ('bus', 'read', 'Voir les bus'),
            ('bus', 'update', 'Modifier un bus'),
            ('bus', 'delete', 'Supprimer un bus'),

            # Trajet
            ('trajet', 'create', 'Créer un trajet'),
            ('trajet', 'read', 'Voir les trajets'),
            ('trajet', 'update', 'Modifier un trajet'),
            ('trajet', 'delete', 'Supprimer un trajet'),

            # Employé
            ('employe', 'create', 'Ajouter un employé'),
            ('employe', 'read', 'Voir les employés'),
            ('employe', 'update', 'Modifier un employé'),
            ('employe', 'delete', 'Supprimer un employé'),

            # Gare
            ('gare', 'create', 'Créer une gare'),
            ('gare', 'read', 'Voir les gares'),
            ('gare', 'update', 'Modifier une gare'),
            ('gare', 'delete', 'Supprimer une gare'),

            # Tarif
            ('tarif', 'create', 'Créer un tarif'),
            ('tarif', 'read', 'Voir les tarifs'),
            ('tarif', 'update', 'Modifier un tarif'),
            ('tarif', 'delete', 'Supprimer un tarif'),

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

            # IAM
            ('iam', 'create', 'Créer un utilisateur/rôle'),
            ('iam', 'read', 'Voir les utilisateurs/rôles'),
            ('iam', 'update', 'Modifier un utilisateur/rôle'),
            ('iam', 'delete', 'Supprimer un utilisateur/rôle'),

            # Dashboard
            ('dashboard', 'read', 'Accéder au dashboard'),
        ]

        created_count = 0
        for resource, action, description in permissions_data:
            name = f'{resource}.{action}'
            perm, created = Permission.objects.get_or_create(
                resource=resource,
                action=action,
                defaults={
                    'name': name,
                    'description': description,
                }
            )
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'  ✓ {name}'))
            else:
                self.stdout.write(f'  → {name} (already exists)')

        self.stdout.write(self.style.SUCCESS(f'\n✅ {created_count} permissions created'))

        # Rôles globaux (company=None)
        self.stdout.write('\n🎭 Seeding global roles...')

        roles_data = [
            {
                'name': 'Administrateur',
                'description': 'Accès complet à la plateforme',
                'permissions': [p[2] for p in permissions_data],  # Tous les perms
            },
            {
                'name': 'Manager',
                'description': 'Gestion des trajets, bus et employés',
                'permissions': [
                    'bus.read', 'bus.update',
                    'trajet.create', 'trajet.read', 'trajet.update',
                    'employe.read', 'employe.update',
                    'gare.read',
                    'billet.read',
                    'rapport.read',
                    'dashboard.read',
                ],
            },
            {
                'name': 'Contrôleur',
                'description': 'Validation des billets à bord',
                'permissions': [
                    'billet.read', 'billet.update',
                    'trajet.read',
                    'bus.read',
                    'gare.read',
                    'dashboard.read',
                ],
            },
            {
                'name': 'Réceptionniste',
                'description': 'Vente et gestion des billets',
                'permissions': [
                    'billet.create', 'billet.read', 'billet.update',
                    'paiement.read',
                    'trajet.read',
                    'tarif.read',
                    'gare.read',
                    'dashboard.read',
                ],
            },
            {
                'name': 'Chef de gare',
                'description': 'Gestion d\'une gare spécifique',
                'permissions': [
                    'gare.read', 'gare.update',
                    'employe.read', 'employe.update',
                    'billet.read',
                    'trajet.read',
                    'paiement.read',
                    'rapport.read',
                    'dashboard.read',
                ],
            },
            {
                'name': 'SAV',
                'description': 'Support client et remboursements',
                'permissions': [
                    'billet.read', 'billet.update',
                    'paiement.read', 'paiement.update',
                    'trajet.read',
                    'dashboard.read',
                ],
            },
            {
                'name': 'Comptable',
                'description': 'Gestion financière et rapports',
                'permissions': [
                    'paiement.read',
                    'billet.read',
                    'rapport.create', 'rapport.read',
                    'dashboard.read',
                ],
            },
        ]

        created_roles = 0
        for role_data in roles_data:
            role, created = Role.objects.get_or_create(
                company=None,
                name=role_data['name'],
                defaults={'description': role_data['description']}
            )

            # Ajouter les permissions
            # Nettoyer les perms existantes
            role.permissions.clear()

            # Ajouter les nouvelles
            perms = Permission.objects.filter(description__in=role_data['permissions'])
            role.permissions.set(perms)

            if created:
                created_roles += 1
                self.stdout.write(self.style.SUCCESS(f'  ✓ {role.name}'))
            else:
                self.stdout.write(f'  → {role.name} (already exists)')

        self.stdout.write(
            self.style.SUCCESS(f'\n✅ {created_roles} global roles created\n')
        )

        self.stdout.write(
            self.style.SUCCESS('🎉 Database seeding completed!')
        )
