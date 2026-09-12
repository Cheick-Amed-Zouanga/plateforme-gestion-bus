from django.core.management.base import BaseCommand
from apps.iam.models import Company, CustomUser


class Command(BaseCommand):
    help = 'Seed test users for multi-tenant platform'

    def handle(self, *args, **options):
        self.stdout.write("🌱 Seeding multi-tenant test data...\n")

        # ──── Créer les compagnies ────
        dakar_transport, created = Company.objects.get_or_create(
            slug='dakar-transport',
            defaults={
                'name': 'Dakar Transport',
                'email': 'info@dakar-transport.com',
                'phone': '+221701234567',
                'address': 'Dakar, Senegal',
                'subscription': 'pro',
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f"✅ Compagnie créée: {dakar_transport.name}"))
        else:
            self.stdout.write(f"ℹ️  Compagnie existe: {dakar_transport.name}")

        senegal_express, created = Company.objects.get_or_create(
            slug='senegal-express',
            defaults={
                'name': 'Senegal Express',
                'email': 'info@senegal-express.com',
                'phone': '+221702345678',
                'address': 'Senegal',
                'subscription': 'pro',
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f"✅ Compagnie créée: {senegal_express.name}"))
        else:
            self.stdout.write(f"ℹ️  Compagnie existe: {senegal_express.name}")

        # ──── Créer le Super Admin Central (company=NULL, is_superuser=True) ────
        super_admin, created = CustomUser.objects.get_or_create(
            email='superadmin@platform.com',
            defaults={
                'username': 'superadmin',
                'first_name': 'Super',
                'last_name': 'Admin',
                'company': None,  # Super Admin n'a pas de company
                'is_staff': True,
                'is_superuser': True,
            }
        )
        if created:
            super_admin.set_password('superadmin@2024')
            super_admin.save()
            self.stdout.write(self.style.SUCCESS(f"✅ Super Admin créé: {super_admin.email}"))
        else:
            self.stdout.write(f"ℹ️  Super Admin existe: {super_admin.email}")

        # ──── Créer Admin Dakar Transport ────
        admin_dakar, created = CustomUser.objects.get_or_create(
            email='admin@dakar-transport.com',
            defaults={
                'username': 'admin_dakar',
                'first_name': 'Chef',
                'last_name': 'Dakar',
                'company': dakar_transport,  # Admin de Dakar Transport
                'is_staff': False,
                'is_superuser': False,
            }
        )
        if created:
            admin_dakar.set_password('admin@2024')
            admin_dakar.save()
            self.stdout.write(self.style.SUCCESS(f"✅ Admin Dakar créé: {admin_dakar.email}"))
        else:
            self.stdout.write(f"ℹ️  Admin Dakar existe: {admin_dakar.email}")

        # ──── Créer Admin Senegal Express ────
        admin_senegal, created = CustomUser.objects.get_or_create(
            email='admin@senegal-express.com',
            defaults={
                'username': 'admin_senegal',
                'first_name': 'Directeur',
                'last_name': 'Senegal',
                'company': senegal_express,  # Admin de Senegal Express
                'is_staff': False,
                'is_superuser': False,
            }
        )
        if created:
            admin_senegal.set_password('admin@2024')
            admin_senegal.save()
            self.stdout.write(self.style.SUCCESS(f"✅ Admin Senegal créé: {admin_senegal.email}"))
        else:
            self.stdout.write(f"ℹ️  Admin Senegal existe: {admin_senegal.email}")

        self.stdout.write(self.style.SUCCESS("\n✨ Seeding complété avec succès!"))
        self.stdout.write("\n📝 Identifiants de test:")
        self.stdout.write("  👑 Super Admin:  superadmin@platform.com / superadmin@2024")
        self.stdout.write("  🏢 Dakar:        admin@dakar-transport.com / admin@2024")
        self.stdout.write("  🏢 Senegal:      admin@senegal-express.com / admin@2024")
