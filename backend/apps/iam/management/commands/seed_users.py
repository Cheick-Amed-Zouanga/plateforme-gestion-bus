from django.core.management.base import BaseCommand
from apps.iam.models import Company, Gare, Role, Permission, CustomUser


class Command(BaseCommand):
    help = 'Seed the database with multi-tenant companies, roles, and users'

    def handle(self, *args, **options):
        self.stdout.write('🌱 Seeding multi-tenant structure...\n')

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

        self.stdout.write('\n')

        # ==================== COMPAGNIES DE TRANSPORT ====================
        self.stdout.write('🏢 Creating transport companies...\n')

        companies_data = [
            {
                'slug': 'dakar-transport',
                'name': 'Dakar Transport Co.',
                'email': 'contact@dakar-transport.com',
                'phone': '+221 33 123 4567',
                'address': '123 Avenue Cheikh Anta Diop, Dakar',
                'subscription': 'pro',
            },
            {
                'slug': 'senegal-express',
                'name': 'Senegal Express',
                'email': 'contact@senegal-express.com',
                'phone': '+221 33 234 5678',
                'address': '456 Boulevard de la Mer, Dakar',
                'subscription': 'enterprise',
            },
            {
                'slug': 'ndiaye-voyages',
                'name': 'Ndiaye Voyages',
                'email': 'contact@ndiaye-voyages.com',
                'phone': '+221 33 345 6789',
                'address': '789 Rue de Thiès, Thiès',
                'subscription': 'pro',
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

        for slug, company in companies.items():
            gares_data = [
                {
                    'name': f'{company.name} - Dakar Central',
                    'city': 'Dakar',
                    'address': '123 Rue de l\'Indépendance, Dakar',
                    'phone': '+221 33 111 1111',
                },
                {
                    'name': f'{company.name} - Thiès',
                    'city': 'Thiès',
                    'address': '456 Avenue Ould Daddah, Thiès',
                    'phone': '+221 77 222 2222',
                },
            ]

            for gare_data in gares_data:
                gare, created = Gare.objects.get_or_create(
                    company=company,
                    name=gare_data['name'],
                    defaults={
                        'city': gare_data['city'],
                        'address': gare_data['address'],
                        'phone': gare_data['phone'],
                    }
                )
                if created:
                    self.stdout.write(f'  ✓ {company.name}: {gare.name}')

        self.stdout.write('\n')

        # ==================== RÔLES PAR COMPAGNIE ====================
        self.stdout.write('🎭 Creating company-specific roles...\n')

        company_roles_data = [
            {
                'name': 'Chef de Gare',
                'description': 'Responsable d\'une gare spécifique',
                'permissions': ['gare.read', 'gare.update', 'employe.read', 'billet.read']
            },
            {
                'name': 'Manager Local',
                'description': 'Manager pour une compagnie',
                'permissions': ['bus.read', 'trajet.read', 'trajet.update', 'employe.read']
            },
            {
                'name': 'Service Client',
                'description': 'SAV et support client',
                'permissions': ['billet.read', 'billet.update', 'paiement.read']
            },
        ]

        for slug, company in companies.items():
            for role_data in company_roles_data:
                role, created = Role.objects.get_or_create(
                    company=company,
                    name=role_data['name'],
                    defaults={'description': role_data['description']}
                )

                if created:
                    # Assigner les permissions
                    perms = Permission.objects.filter(name__in=role_data['permissions'])
                    role.permissions.set(perms)
                    self.stdout.write(f'  ✓ {company.name}: {role.name}')

        self.stdout.write('\n')

        # ==================== UTILISATEURS PAR COMPAGNIE ====================
        self.stdout.write('👥 Creating users per company...\n')

        # Récupérer les rôles globaux
        admin_role = Role.objects.filter(name='Administrateur', company=None).first()

        for slug, company in companies.items():
            chef_gare_role = Role.objects.filter(company=company, name='Chef de Gare').first()
            manager_role = Role.objects.filter(company=company, name='Manager Local').first()
            sav_role = Role.objects.filter(company=company, name='Service Client').first()

            gare = company.gares.first()

            users_data = [
                {
                    'email': f'admin@{slug}.com',
                    'username': f'admin_{slug}',
                    'password': 'admin@2024',
                    'first_name': 'Admin',
                    'last_name': company.name,
                    'gare': gare,
                    'roles': [admin_role, manager_role] if admin_role and manager_role else [],
                    'is_staff': True,
                },
                {
                    'email': f'manager@{slug}.com',
                    'username': f'manager_{slug}',
                    'password': 'manager@2024',
                    'first_name': 'Manager',
                    'last_name': company.name,
                    'gare': gare,
                    'roles': [manager_role] if manager_role else [],
                },
                {
                    'email': f'chefgare@{slug}.com',
                    'username': f'chef_{slug}',
                    'password': 'chefgare@2024',
                    'first_name': 'Chef de Gare',
                    'last_name': company.name,
                    'gare': gare,
                    'roles': [chef_gare_role] if chef_gare_role else [],
                },
                {
                    'email': f'sav@{slug}.com',
                    'username': f'sav_{slug}',
                    'password': 'sav@2024',
                    'first_name': 'Support',
                    'last_name': 'Client',
                    'gare': None,
                    'roles': [sav_role] if sav_role else [],
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
                    if roles:
                        user.roles.set(roles)
                    self.stdout.write(f'  ✓ {company.name}: {user.email}')

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
            self.stdout.write(f'   Admin: admin@{slug}.com / admin@2024')
            self.stdout.write(f'   Manager: manager@{slug}.com / manager@2024')
            self.stdout.write(f'   Chef de Gare: chefgare@{slug}.com / chefgare@2024')
            self.stdout.write(f'   SAV: sav@{slug}.com / sav@2024')
            self.stdout.write('')

        self.stdout.write('─' * 60)
