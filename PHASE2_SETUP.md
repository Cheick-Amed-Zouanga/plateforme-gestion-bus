# 🚀 PHASE 2: IAM Backend APIs - Setup Instructions

**Status:** ✅ READY FOR IMPLEMENTATION

---

## 📦 Installation des Dependencies

Ajouter à `backend/requirements.txt`:

```
djangorestframework==3.14.0
djangorestframework-simplejwt==5.3.0
django-cors-headers==4.3.0
django-filter==23.5
```

Puis installer:
```bash
cd backend
pip install -r requirements.txt
```

---

## ⚙️ Configuration Django (settings.py)

Ajouter/modifier les settings Django:

```python
# INSTALLED_APPS
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',
    
    # Apps locales
    'apps.iam',  # ← AJOUTER
    # ... autres apps
]

# MIDDLEWARE
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # ← AJOUTER
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'apps.iam.middleware.TenantMiddleware',  # ← AJOUTER
]

# Django REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

# JWT Configuration
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=24),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': False,
    'UPDATE_LAST_LOGIN': False,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUDIENCE': None,
    'ISSUER': None,
    'JTI_CLAIM': 'jti',
    'TOKEN_TYPE_CLAIM': 'token_type',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'USER_AUTHENTICATION_RULE': 'rest_framework_simplejwt.authentication.default_user_authentication_rule',
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'AUTH_REFRESH_CLASSES': ('rest_framework_simplejwt.tokens.RefreshToken',),
    'AUTH_COOKIE': None,
    'AUTH_COOKIE_DOMAIN': None,
    'AUTH_COOKIE_SECURE': False,
    'AUTH_COOKIE_HTTP_ONLY': False,
    'AUTH_COOKIE_PATH': '/',
    'AUTH_COOKIE_SAMESITE': 'Lax',
}

# CORS Configuration
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]

# Custom User Model
AUTH_USER_MODEL = 'iam.CustomUser'

# Security (à activer en production)
# CSRF_TRUSTED_ORIGINS = ['http://localhost:3000', 'http://localhost:5173']
# SECURE_SSL_REDIRECT = True
# SESSION_COOKIE_SECURE = True
# CSRF_COOKIE_SECURE = True
```

---

## 🔗 Ajouter les URLs (urls.py)

Dans `backend/urls.py`:

```python
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('apps.iam.urls')),  # ← AJOUTER
    # ... autres urls
]
```

---

## 🗃️ Migrations

Exécuter les migrations:

```bash
cd backend

# Créer les migrations
python manage.py makemigrations

# Appliquer les migrations
python manage.py migrate

# Seed les permissions et rôles
python manage.py seed_iam

# Créer un superuser (optional)
python manage.py createsuperuser
```

---

## 📝 Variables d'Environnement

Créer `backend/.env`:

```bash
DEBUG=False
SECRET_KEY=your-very-secret-key-change-this
ALLOWED_HOSTS=localhost,127.0.0.1,example.com
DATABASE_URL=postgresql://user:password@localhost:5432/bus_db
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
JWT_SECRET_KEY=your-jwt-secret-key
JWT_ALGORITHM=HS256
```

Puis charger les variables:

```python
# settings.py
import os
from dotenv import load_dotenv

load_dotenv()

DEBUG = os.getenv('DEBUG', 'False') == 'True'
SECRET_KEY = os.getenv('SECRET_KEY')
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost').split(',')
# ... etc
```

---

## 🚀 Lancer le serveur

```bash
cd backend

# Mode développement
python manage.py runserver
# → http://localhost:8000/

# Accès à l'admin Django
# → http://localhost:8000/admin/

# API documentation (Swagger)
# → http://localhost:8000/api/schema/
# → http://localhost:8000/api/docs/
```

---

## ✅ Endpoints Disponibles

### Authentication
```
POST   /api/auth/login/              ✅ Login (email + password)
POST   /api/auth/refresh/            ✅ Refresh token
GET    /api/auth/me/                 ✅ Current user info
```

### Users Management
```
GET    /api/users/                   ✅ List users (paginated + filtered)
POST   /api/users/                   ✅ Create user
GET    /api/users/{id}/              ✅ Get user detail
PATCH  /api/users/{id}/              ✅ Update user
DELETE /api/users/{id}/              ✅ Delete user
POST   /api/users/{id}/change_password/ ✅ Change password
```

### Roles Management
```
GET    /api/roles/                   ✅ List roles
POST   /api/roles/                   ✅ Create role
GET    /api/roles/{id}/              ✅ Get role detail
PATCH  /api/roles/{id}/              ✅ Update role + permissions
DELETE /api/roles/{id}/              ✅ Delete role
```

### Permissions (ReadOnly)
```
GET    /api/permissions/             ✅ List all permissions
GET    /api/permissions/by_resource/ ✅ Grouped by resource
```

### Companies & Gares
```
GET    /api/companies/me/            ✅ Current company info
GET    /api/gares/                   ✅ List gares (current company)
POST   /api/gares/                   ✅ Create gare
PATCH  /api/gares/{id}/              ✅ Update gare
DELETE /api/gares/{id}/              ✅ Delete gare
```

### Audit Logs (ReadOnly)
```
GET    /api/audit-logs/              ✅ List audit logs (filtered by company)
GET    /api/audit-logs/by_user/      ✅ Filter by user
GET    /api/audit-logs/by_action/    ✅ Filter by action
GET    /api/audit-logs/by_resource/  ✅ Filter by resource
```

---

## 🧪 Tests

Lancer les tests API:

```bash
# Tous les tests
python manage.py test apps.iam.tests_api

# Test spécifique
python manage.py test apps.iam.tests_api.IAMAPITestCase.test_login_success

# Avec coverage
coverage run --source='apps.iam' manage.py test apps.iam
coverage report
coverage html
```

---

## 📊 Exemple de Requête

### Login
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@company.com", "password": "admin123"}'

# Response:
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "admin@company.com",
    "company": "550e8400-e29b-41d4-a716-446655440001",
    ...
  }
}
```

### Get Current User
```bash
curl -X GET http://localhost:8000/api/auth/me/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Response:
{
  "user": { ... },
  "company": { ... },
  "permissions": ["bus.read", "bus.create", ...],
  "accessible_gares": [ ... ]
}
```

### List Users
```bash
curl -X GET http://localhost:8000/api/users/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"

# Response:
{
  "count": 10,
  "next": "http://localhost:8000/api/users/?page=2",
  "previous": null,
  "results": [
    {
      "id": "...",
      "email": "user@company.com",
      "company": "...",
      "roles": [ ... ],
      "is_active": true,
      ...
    },
    ...
  ]
}
```

### Create User
```bash
curl -X POST http://localhost:8000/api/users/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@company.com",
    "username": "newuser",
    "password": "securepassword",
    "first_name": "New",
    "last_name": "User",
    "role_ids": ["role-uuid-1", "role-uuid-2"]
  }'

# Response (201 Created):
{
  "id": "...",
  "email": "newuser@company.com",
  "company": "...",
  "created_at": "2024-09-12T...",
  ...
}
```

### List Audit Logs
```bash
curl -X GET "http://localhost:8000/api/audit-logs/?action=create&resource_type=User" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Response:
{
  "count": 5,
  "results": [
    {
      "id": "...",
      "action": "create",
      "resource_type": "User",
      "user": "...",
      "old_values": null,
      "new_values": { ... },
      "created_at": "2024-09-12T...",
      ...
    },
    ...
  ]
}
```

---

## 🔐 Checklist de Sécurité

- [x] Authentication JWT avec tenant_id embedded
- [x] Tenant isolation (all queries filtered)
- [x] Permission checking via decorators
- [x] Audit logging pour chaque action
- [x] CORS configuration
- [x] Cross-tenant access prevention
- [ ] Rate limiting (Phase 5)
- [ ] API documentation/Swagger (Phase 5)
- [ ] 2FA support (Phase 5 - optional)

---

## 📚 Fichiers Créés en Phase 2

```
backend/apps/iam/
├── views.py                 ✅ 7 ViewSets + Auth endpoints
├── urls.py                  ✅ URL routing avec router
├── filters.py               ✅ Custom filters par model
├── permissions.py           ✅ DRF permission classes
├── tests_api.py             ✅ Comprehensive API tests
└── (existing files)
    ├── models.py            (from Phase 0)
    ├── middleware.py        (from Phase 0)
    ├── decorators.py        (from Phase 0)
    ├── serializers.py       (from Phase 0)
    ├── admin.py             (from Phase 0)
    └── management/          (from Phase 0)
```

---

## 🎯 Prochaines Étapes

**Phase 3 Focus:** Frontend IAM Pages
- Créer les API hooks (useUsers, useRoles, etc.)
- Implémenter les pages React (Users, Roles, Permissions, AuditLogs)
- Ajouter les modals CRUD
- Intégrer avec le API backend

**Estimated Duration:** 4-5 heures

---

## 📖 Ressources Utiles

- DRF Documentation: https://www.django-rest-framework.org/
- SimpleJWT: https://django-rest-framework-simplejwt.readthedocs.io/
- Django Filters: https://django-filter.readthedocs.io/
- Testing DRF: https://www.django-rest-framework.org/api-guide/testing/

---

**Status:** ✅ PHASE 2 READY  
**Estimated Time:** 4-5 hours  
**Next:** Phase 3 - Frontend IAM Pages

Let's build! 🚀
