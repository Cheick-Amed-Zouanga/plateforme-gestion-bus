from django.core.management.base import BaseCommand
from apps.iam.models import Company, Gare, Role, CustomUser
from apps.accounts.models import ProfilEmploye


def _sync_profil_employe(user):
    """
    Pont avec l'ancien système métier (apps.reservation_billets, pages
    /chef, /sav, /controleur...) qui repose encore sur ProfilEmploye.
    On (re)crée/actualise le ProfilEmploye correspondant à partir du rôle
    calculé par le nouveau système IAM (CustomUser.get_primary_role()).
    """
    role = user.get_primary_role()
    if not role:
        return
    ProfilEmploye.objects.update_or_create(
        utilisateur=user,
        defaults={
            'company': user.company,
            'role': role,
            'actif': user.is_active,
        },
    )


class Command(BaseCommand):
    help = 'Seed the database with multi-tenant companies, roles, and users'

    def handle(self, *args, **options):
        self.stdout.write('🌱 Seeding multi-tenant structure...\n')
        self.stdout.write(
            self.style.WARNING(
                'ℹ️  Lance d\'abord `python manage.py seed_iam` (permissions + rôles globaux).\n'
            )
        )

        # ==================== SUPER ADMIN CENTRAL ====================
        self.stdout.write('👑 Creating Super Admin Central (Platform Admin)...\n')

        super_admin, created = CustomUser.objects.get_or_create(
            email='superadmin@platform.com',
            defaults={
                'username': 'superadmin',
                'first_name': 'Platform',
                'last_name': 'Admin',
                'company': None,  # NO COMPANY - Central Admin
                'is_staff': True,
                'is_superuser': True,
                'is_active': True,
            }
        )

        if created:
            super_admin.set_password('superadmin@2024')
            super_admin.save()
            self.stdout.write(self.style.SUCCESS(f'✓ Super Admin créé: {super_admin.email}'))
        else:
            self.stdout.write(f'→ Super Admin existant: {super_admin.email}')

        _sync_profil_employe(super_admin)
        self.stdout.write('\n')

        # ==================== COMPAGNIES DE TRANSPORT ====================
        self.stdout.write('🏢 Creating transport companies...\n')

        companies_data = [
            {
                'slug': 'dakar-transport',
                'name': 'Dakar Transport Co.',
                'email': 'contact@dakar-transport.com',
                'phone': '+226 25 30 11 11',
                'address': 'Avenue Kwame Nkrumah, Ouagadougou',
                'subscription': 'pro',
            },
            {
                'slug': 'senegal-express',
                'name': 'Senegal Express',
                'email': 'contact@senegal-express.com',
                'phone': '+226 25 30 22 22',
                'address': 'Secteur 4, Ouagadougou',
                'subscription': 'enterprise',
            },
            {
                'slug': 'ndiaye-voyages',
                'name': 'Ndiaye Voyages',
                'email': 'contact@ndiaye-voyages.com',
                'phone': '+226 20 97 33 33',
                'address': 'Avenue de la Révolution, Bobo-Dioulasso',
                'subscription': 'pro',
            },
            {
                'slug': 'rakieta',
                'name': 'Rakieta Transport',
                'email': 'contact@rakieta.bf',
                'phone': '+226 25 36 44 44',
                'address': 'Gare routière, Ouagadougou',
                'subscription': 'enterprise',
            },
            {
                'slug': 'tsr-voyageurs',
                'name': 'TSR Voyageurs',
                'email': 'contact@tsr.bf',
                'phone': '+226 25 37 55 55',
                'address': 'Zone du Bois, Ouagadougou',
                'subscription': 'pro',
            },
            {
                'slug': 'staf-express',
                'name': 'STAF Express',
                'email': 'contact@staf.bf',
                'phone': '+226 20 98 66 66',
                'address': 'Colma, Bobo-Dioulasso',
                'subscription': 'free',
            },
        ]

        companies = {}
        for company_data in companies_data:
            company, created = Company.objects.get_or_create(
                slug=company_data['slug'],
                defaults=company_data
            )
            companies[company_data['slug']] = company
            if created:
                self.stdout.write(self.style.SUCCESS(f'✓ Company créée: {company.name}'))
            else:
                self.stdout.write(f'→ Company existante: {company.name}')

        self.stdout.write('\n')

        # ==================== GARES PAR COMPAGNIE ====================
        self.stdout.write('🏁 Creating gares (ticket points)...\n')

        # Gares Burkina par compagnie (points de vente)
        gares_par_slug = {
            'dakar-transport': [
                ('Ouagadougou Central', 'Ouagadougou', 'Gare routière Ouaga'),
                ('Bobo Terminal', 'Bobo-Dioulasso', 'Gare routière Bobo'),
            ],
            'senegal-express': [
                ('Ouaga Express', 'Ouagadougou', 'Avenue de la Nation'),
                ('Koudougou Gare', 'Koudougou', 'Centre-ville Koudougou'),
            ],
            'ndiaye-voyages': [
                ('Bobo Ndiaye', 'Bobo-Dioulasso', 'Avenue de la Révolution'),
                ('Banfora Escale', 'Banfora', 'Route de Bobo'),
            ],
            'rakieta': [
                ('Rakieta Ouaga', 'Ouagadougou', 'Gare routière'),
                ('Rakieta Bobo', 'Bobo-Dioulasso', 'Gare routière'),
                ('Rakieta Ouahi', 'Ouahigouya', 'Centre-ville'),
            ],
            'tsr-voyageurs': [
                ('TSR Ouaga', 'Ouagadougou', 'Zone du Bois'),
                ('TSR Fada', "Fada N'Gourma", 'Gare routière'),
                ('TSR Tenkodogo', 'Tenkodogo', 'Centre'),
            ],
            'staf-express': [
                ('STAF Bobo', 'Bobo-Dioulasso', 'Colma'),
                ('STAF Banfora', 'Banfora', 'Gare'),
                ('STAF Ouaga', 'Ouagadougou', 'Dassasgho'),
            ],
        }

        for slug, company in companies.items():
            for name, city, address in gares_par_slug.get(slug, []):
                gare, created = Gare.objects.get_or_create(
                    company=company,
                    name=f'{company.name} - {name}',
                    defaults={
                        'city': city,
                        'address': address,
                        'phone': company.phone or '',
                    },
                )
                if created:
                    self.stdout.write(f'  ✓ {company.name}: {gare.name}')

        self.stdout.write('\n')

        # ==================== UTILISATEURS PAR COMPAGNIE ====================
        # On réutilise les rôles GLOBAUX (company=None) créés par `seed_iam`,
        # plutôt que de recréer des rôles par compagnie (évite les doublons
        # de nommage type "Chef de Gare" vs "Chef de gare").
        self.stdout.write('👥 Creating users per company...\n')

        global_roles = {
            r.name: r for r in Role.objects.filter(company=None)
        }
        missing = [
            n for n in
            ['Administrateur', 'Manager', 'Contrôleur', 'Réceptionniste', 'Chef de gare', 'SAV', 'Comptable']
            if n not in global_roles
        ]
        if missing:
            self.stdout.write(self.style.ERROR(
                f'❌ Rôles globaux manquants: {missing}. '
                f'Lance `python manage.py seed_iam` avant `seed_users`.'
            ))
            return

        for slug, company in companies.items():
            gare = company.gares.first()

            users_data = [
                {
                    'email': f'admin@{slug}.com',
                    'username': f'admin_{slug}',
                    'password': 'admin@2024',
                    'first_name': 'Admin',
                    'last_name': company.name,
                    'gare': gare,
                    'roles': [global_roles['Administrateur']],
                    'is_staff': True,
                },
                {
                    'email': f'manager@{slug}.com',
                    'username': f'manager_{slug}',
                    'password': 'manager@2024',
                    'first_name': 'Manager',
                    'last_name': company.name,
                    'gare': gare,
                    'roles': [global_roles['Manager']],
                },
                {
                    'email': f'chefgare@{slug}.com',
                    'username': f'chef_{slug}',
                    'password': 'chefgare@2024',
                    'first_name': 'Chef de Gare',
                    'last_name': company.name,
                    'gare': gare,
                    'roles': [global_roles['Chef de gare']],
                },
                {
                    'email': f'sav@{slug}.com',
                    'username': f'sav_{slug}',
                    'password': 'sav@2024',
                    'first_name': 'Support',
                    'last_name': 'Client',
                    'gare': None,
                    'roles': [global_roles['SAV']],
                },
                {
                    'email': f'controleur@{slug}.com',
                    'username': f'controleur_{slug}',
                    'password': 'controleur@2024',
                    'first_name': 'Contrôleur',
                    'last_name': company.name,
                    'gare': gare,
                    'roles': [global_roles['Contrôleur']],
                },
                {
                    'email': f'receptionniste@{slug}.com',
                    'username': f'receptionniste_{slug}',
                    'password': 'reception@2024',
                    'first_name': 'Réceptionniste',
                    'last_name': company.name,
                    'gare': gare,
                    'roles': [global_roles['Réceptionniste']],
                },
                {
                    'email': f'comptable@{slug}.com',
                    'username': f'comptable_{slug}',
                    'password': 'comptable@2024',
                    'first_name': 'Comptable',
                    'last_name': company.name,
                    'gare': None,
                    'roles': [global_roles['Comptable']],
                },
            ]

            for user_data in users_data:
                roles = user_data.pop('roles')
                user, created = CustomUser.objects.get_or_create(
                    email=user_data['email'],
                    defaults={**user_data, 'company': company}
                )

                if created:
                    user.set_password(user_data['password'])
                    user.save()
                    self.stdout.write(f'  ✓ {company.name}: {user.email}')
                else:
                    self.stdout.write(f'  → {company.name}: {user.email} (existant)')

                # Toujours (re)synchroniser les rôles, même si le compte existait
                # déjà (auto-réparation après un changement de nommage des rôles).
                if roles:
                    user.roles.set(roles)

                _sync_profil_employe(user)

        self.stdout.write(
            self.style.SUCCESS('\n✅ Multi-tenant seeding completed!\n')
        )

        # ==================== AFFICHER LES IDENTIFIANTS ====================
        self.stdout.write(self.style.SUCCESS('📝 Platform Admin Credentials:'))
        self.stdout.write('─' * 60)
        self.stdout.write('👑 SUPER ADMIN CENTRAL (Platform Admin)')
        self.stdout.write('   Email: superadmin@platform.com')
        self.stdout.write('   Password: superadmin@2024')
        self.stdout.write('')

        for slug, company in companies.items():
            self.stdout.write(self.style.SUCCESS(f'🏢 {company.name}'))
            self.stdout.write(f'   Admin (Chef):     admin@{slug}.com / admin@2024')
            self.stdout.write(f'   Manager:          manager@{slug}.com / manager@2024')
            self.stdout.write(f'   Chef de Gare:     chefgare@{slug}.com / chefgare@2024')
            self.stdout.write(f'   SAV:              sav@{slug}.com / sav@2024')
            self.stdout.write(f'   Contrôleur:       controleur@{slug}.com / controleur@2024')
            self.stdout.write(f'   Réceptionniste:   receptionniste@{slug}.com / reception@2024')
            self.stdout.write(f'   Comptable:        comptable@{slug}.com / comptable@2024')
            self.stdout.write('')

        self.stdout.write('─' * 60)
