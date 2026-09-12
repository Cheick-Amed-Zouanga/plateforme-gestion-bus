from django.test import TestCase
from .models import Company, Permission, Role, CustomUser


class IAMTestCase(TestCase):
    """Tests pour le système IAM"""

    def setUp(self):
        """Créer des données de test"""
        # Créer une compagnie
        self.company = Company.objects.create(
            name='Test Company',
            email='test@company.com',
            slug='test-company'
        )

        # Créer des permissions
        self.perm_bus_read = Permission.objects.create(
            resource='bus',
            action='read',
            name='bus.read',
            description='Voir les bus'
        )

        self.perm_bus_create = Permission.objects.create(
            resource='bus',
            action='create',
            name='bus.create',
            description='Créer un bus'
        )

        # Créer un rôle avec permissions
        self.manager_role = Role.objects.create(
            company=self.company,
            name='Manager',
            description='Gestionnaire de la compagnie'
        )
        self.manager_role.permissions.add(self.perm_bus_read, self.perm_bus_create)

        # Créer un utilisateur
        self.user = CustomUser.objects.create(
            email='user@company.com',
            username='testuser',
            company=self.company
        )
        self.user.roles.add(self.manager_role)

    def test_user_has_permission(self):
        """Tester si l'utilisateur a une permission"""
        self.assertTrue(self.user.has_permission('bus.read'))
        self.assertTrue(self.user.has_permission('bus.create'))
        self.assertFalse(self.user.has_permission('bus.delete'))

    def test_user_has_any_permission(self):
        """Tester si l'utilisateur a au moins une permission"""
        self.assertTrue(self.user.has_any_permission('bus.read', 'bus.delete'))
        self.assertFalse(self.user.has_any_permission('bus.delete', 'bus.update'))

    def test_user_has_all_permissions(self):
        """Tester si l'utilisateur a toutes les permissions"""
        self.assertTrue(self.user.has_all_permissions('bus.read', 'bus.create'))
        self.assertFalse(self.user.has_all_permissions('bus.read', 'bus.delete'))

    def test_superuser_has_all_permissions(self):
        """Un superuser a toutes les permissions"""
        superuser = CustomUser.objects.create_superuser(
            email='admin@company.com',
            username='admin',
            password='admin123',
            company=self.company
        )

        self.assertTrue(superuser.has_permission('bus.read'))
        self.assertTrue(superuser.has_permission('bus.delete'))
        self.assertTrue(superuser.has_all_permissions('bus.read', 'bus.create', 'bus.delete'))

    def test_get_permissions(self):
        """Récupérer toutes les permissions d'un utilisateur"""
        perms = self.user.get_permissions()
        perm_names = list(perms.values_list('name', flat=True))

        self.assertIn('bus.read', perm_names)
        self.assertIn('bus.create', perm_names)
        self.assertNotIn('bus.delete', perm_names)
