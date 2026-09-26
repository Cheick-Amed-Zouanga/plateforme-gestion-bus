from django.test import TestCase
from rest_framework.test import APIClient, APITestCase
from rest_framework import status
from .models import Company, Gare, Permission, Role, CustomUser, AuditLog


class IAMAPITestCase(APITestCase):
    """Tests pour les APIs IAM"""

    def setUp(self):
        """Créer des données de test"""
        # Créer des compagnies
        self.company_a = Company.objects.create(
            name='Company A',
            email='company-a@test.com',
            slug='company-a'
        )
        self.company_b = Company.objects.create(
            name='Company B',
            email='company-b@test.com',
            slug='company-b'
        )

        # Créer des permissions
        self.perm_users_read = Permission.objects.create(
            resource='iam',
            action='read',
            name='iam.read',
            description='Read IAM'
        )
        self.perm_users_create = Permission.objects.create(
            resource='iam',
            action='create',
            name='iam.create',
            description='Create IAM'
        )

        # Créer des rôles
        self.admin_role = Role.objects.create(
            company=self.company_a,
            name='Admin',
            description='Administrator'
        )
        self.admin_role.permissions.add(
            self.perm_users_read,
            self.perm_users_create
        )

        # Créer des utilisateurs
        self.admin_user = CustomUser.objects.create_user(
            email='admin@company-a.com',
            username='admin',
            password='admin123',
            company=self.company_a
        )
        self.admin_user.roles.add(self.admin_role)

        self.regular_user = CustomUser.objects.create_user(
            email='user@company-a.com',
            username='user',
            password='user123',
            company=self.company_a
        )

        self.other_company_user = CustomUser.objects.create_user(
            email='user@company-b.com',
            username='other_user',
            password='user123',
            company=self.company_b
        )

        # Client de test
        self.client = APIClient()

    def get_token(self, email, password):
        """Récupérer un JWT token"""
        response = self.client.post('/api/auth/login/', {
            'email': email,
            'password': password
        }, format='json')
        if response.status_code == 200:
            return response.data['access']
        return None

    # =======================
    # TESTS AUTHENTICATION
    # =======================

    def test_login_success(self):
        """Test login réussi"""
        response = self.client.post('/api/auth/login/', {
            'email': 'admin@company-a.com',
            'password': 'admin123'
        }, format='json')

        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['user']['email'], 'admin@company-a.com')

    def test_login_invalid_credentials(self):
        """Test login avec mauvais credentials"""
        response = self.client.post('/api/auth/login/', {
            'email': 'admin@company-a.com',
            'password': 'wrong_password'
        }, format='json')

        self.assertEqual(response.status_code, 401)

    def test_current_user_endpoint(self):
        """Test GET /api/auth/me/"""
        token = self.get_token('admin@company-a.com', 'admin123')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        response = self.client.get('/api/auth/me/', format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['user']['email'], 'admin@company-a.com')

    # =======================
    # TESTS USERS
    # =======================

    def test_list_users_authorized(self):
        """Test lister les users de sa company"""
        token = self.get_token('admin@company-a.com', 'admin123')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        response = self.client.get('/api/users/', format='json')
        self.assertEqual(response.status_code, 200)
        # Devrait voir 2 users (admin + regular)
        self.assertEqual(len(response.data['results']), 2)

    def test_list_users_multi_tenant_isolation(self):
        """Test que on ne peut voir que les users de sa company"""
        token = self.get_token('user@company-b.com', 'user123')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        response = self.client.get('/api/users/', format='json')
        self.assertEqual(response.status_code, 200)
        # Devrait voir 1 seul user (le sien)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['email'], 'user@company-b.com')

    def test_create_user(self):
        """Test créer un user"""
        token = self.get_token('admin@company-a.com', 'admin123')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        response = self.client.post('/api/users/', {
            'email': 'newuser@company-a.com',
            'username': 'newuser',
            'password': 'newuser123',
            'first_name': 'New',
            'last_name': 'User'
        }, format='json')

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['email'], 'newuser@company-a.com')
        # Vérifier que la company_id a été forcée
        self.assertEqual(response.data['company'], str(self.company_a.id))

    def test_create_user_without_permission(self):
        """Test créer un user sans permission"""
        token = self.get_token('user@company-a.com', 'user123')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        response = self.client.post('/api/users/', {
            'email': 'newuser@company-a.com',
            'username': 'newuser',
            'password': 'newuser123'
        }, format='json')

        self.assertEqual(response.status_code, 403)

    def test_update_user(self):
        """Test modifier un user"""
        token = self.get_token('admin@company-a.com', 'admin123')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        response = self.client.patch(
            f'/api/users/{self.regular_user.id}/',
            {'first_name': 'Updated'},
            format='json'
        )

        self.assertEqual(response.status_code, 200)
        self.regular_user.refresh_from_db()
        self.assertEqual(self.regular_user.first_name, 'Updated')

    def test_delete_user(self):
        """Test supprimer un user"""
        token = self.get_token('admin@company-a.com', 'admin123')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        user_id = self.regular_user.id
        response = self.client.delete(f'/api/users/{user_id}/', format='json')

        self.assertEqual(response.status_code, 204)
        with self.assertRaises(CustomUser.DoesNotExist):
            CustomUser.objects.get(id=user_id)

    # =======================
    # TESTS ROLES
    # =======================

    def test_list_roles(self):
        """Test lister les roles"""
        token = self.get_token('admin@company-a.com', 'admin123')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        response = self.client.get('/api/roles/', format='json')
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.data['results']), 1)

    def test_create_role(self):
        """Test créer un role"""
        token = self.get_token('admin@company-a.com', 'admin123')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        response = self.client.post('/api/roles/', {
            'name': 'Manager',
            'description': 'Manager Role',
            'permission_ids': [str(self.perm_users_read.id)]
        }, format='json')

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['name'], 'Manager')

    # =======================
    # TESTS PERMISSIONS
    # =======================

    def test_list_permissions(self):
        """Test lister les permissions"""
        token = self.get_token('admin@company-a.com', 'admin123')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        response = self.client.get('/api/permissions/', format='json')
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.data['results']), 2)

    def test_permissions_read_only(self):
        """Test que les permissions sont read-only"""
        token = self.get_token('admin@company-a.com', 'admin123')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        # POST ne devrait pas être autorisé
        response = self.client.post('/api/permissions/', {
            'resource': 'test',
            'action': 'create',
            'name': 'test.create'
        }, format='json')

        self.assertEqual(response.status_code, 405)  # Method Not Allowed

    # =======================
    # TESTS GARES
    # =======================

    def test_list_gares(self):
        """Test lister les gares"""
        # Créer une gare
        gare = Gare.objects.create(
            company=self.company_a,
            name='Test Gare',
            city='Dakar',
            address='123 Rue Test'
        )

        token = self.get_token('admin@company-a.com', 'admin123')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        response = self.client.get('/api/gares/', format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['results']), 1)

    def test_gares_multi_tenant_isolation(self):
        """Test que on ne voit que les gares de sa company"""
        # Créer des gares dans les deux companies
        gare_a = Gare.objects.create(
            company=self.company_a,
            name='Gare A',
            city='Dakar',
            address='123 Rue Test'
        )
        gare_b = Gare.objects.create(
            company=self.company_b,
            name='Gare B',
            city='Thiès',
            address='456 Rue Test'
        )

        token = self.get_token('admin@company-a.com', 'admin123')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        response = self.client.get('/api/gares/', format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], 'Gare A')

    # =======================
    # TESTS AUDIT LOGS
    # =======================

    def test_audit_log_creation_on_user_create(self):
        """Test que un audit log est créé quand on crée un user"""
        token = self.get_token('admin@company-a.com', 'admin123')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        # Créer un user
        response = self.client.post('/api/users/', {
            'email': 'audituser@company-a.com',
            'username': 'audituser',
            'password': 'audituser123'
        }, format='json')

        self.assertEqual(response.status_code, 201)

        # Vérifier que un audit log a été créé
        logs = AuditLog.objects.filter(
            action='create',
            resource_type='User'
        )
        self.assertGreater(logs.count(), 0)

    def test_list_audit_logs(self):
        """Test lister les audit logs"""
        token = self.get_token('admin@company-a.com', 'admin123')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        response = self.client.get('/api/audit-logs/', format='json')
        self.assertEqual(response.status_code, 200)

    def test_audit_logs_multi_tenant_isolation(self):
        """Test que on voit seulement les logs de sa company"""
        token_a = self.get_token('admin@company-a.com', 'admin123')
        token_b = self.get_token('user@company-b.com', 'user123')

        # Créer un log dans company A
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token_a}')
        self.client.post('/api/users/', {
            'email': 'new@company-a.com',
            'username': 'new',
            'password': 'new123'
        }, format='json')

        # Company A devrait voir au moins 1 log
        response = self.client.get('/api/audit-logs/', format='json')
        count_a = len(response.data['results'])
        self.assertGreaterEqual(count_a, 1)

        # Company B ne devrait pas voir les logs de A
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token_b}')
        response = self.client.get('/api/audit-logs/', format='json')
        count_b = len(response.data['results'])
        # Devrait être 0 ou très peu (pas les logs de A)
        self.assertEqual(count_b, 0)

    # =======================
    # TESTS PERMISSIONS CHECKS
    # =======================

    def test_unauthorized_user_cannot_access_api(self):
        """Test qu'un utilisateur non authentifié ne peut pas accéder à l'API"""
        response = self.client.get('/api/users/', format='json')
        self.assertEqual(response.status_code, 401)

    def test_superuser_has_all_permissions(self):
        """Test que un superuser a accès à tout"""
        superuser = CustomUser.objects.create_superuser(
            email='super@test.com',
            username='super',
            password='super123',
            company=self.company_a
        )

        token = self.get_token('super@test.com', 'super123')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        # Devrait pouvoir accéder à n'importe quel endpoint
        response = self.client.get('/api/users/', format='json')
        self.assertEqual(response.status_code, 200)

        response = self.client.get('/api/roles/', format='json')
        self.assertEqual(response.status_code, 200)

        response = self.client.get('/api/audit-logs/', format='json')
        self.assertEqual(response.status_code, 200)
