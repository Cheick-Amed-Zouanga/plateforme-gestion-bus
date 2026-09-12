# 🚀 PROCHAINES ÉTAPES - Phase 2 (Backend APIs)

---

## 📋 Préparation Immédiate

### 1. Django Settings Configuration

Ajouter à `settings.py`:

```python
# Installed apps
INSTALLED_APPS = [
    # ...
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'apps.iam',  # ← Ajouter
]

# Middleware
MIDDLEWARE = [
    # ...
    'corsheaders.middleware.CorsMiddleware',
    'apps.iam.middleware.TenantMiddleware',  # ← Ajouter
]

# Django REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': [
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
}

# JWT Configuration
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=24),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
}

# CORS
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    # En production: ajuster selon domaine
]

# Custom User Model
AUTH_USER_MODEL = 'iam.CustomUser'
```

### 2. Créer le fichier URLs

`backend/apps/iam/urls.py`:
```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, RoleViewSet, PermissionViewSet,
    CompanyViewSet, GareViewSet, AuditLogViewSet,
    AuthTokenView, AuthRefreshView, CurrentUserView
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'roles', RoleViewSet, basename='role')
router.register(r'permissions', PermissionViewSet, basename='permission')
router.register(r'companies', CompanyViewSet, basename='company')
router.register(r'gares', GareViewSet, basename='gare')
router.register(r'audit-logs', AuditLogViewSet, basename='auditlog')

urlpatterns = [
    path('auth/login/', AuthTokenView.as_view(), name='auth-login'),
    path('auth/refresh/', AuthRefreshView.as_view(), name='auth-refresh'),
    path('auth/me/', CurrentUserView.as_view(), name='auth-me'),
    path('', include(router.urls)),
]
```

Puis dans `backend/urls.py`:
```python
urlpatterns = [
    # ...
    path('api/', include('apps.iam.urls')),
]
```

### 3. Migrations Django

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py seed_iam
python manage.py createsuperuser
```

---

## 🔨 Commandes à exécuter

### Backend Setup
```bash
cd backend

# Installer les dependencies DRF
pip install djangorestframework
pip install djangorestframework-simplejwt
pip install django-cors-headers
pip install django-filter

# Migrations
python manage.py makemigrations
python manage.py migrate

# Seed data
python manage.py seed_iam

# Create superuser
python manage.py createsuperuser

# Run server
python manage.py runserver
```

### Frontend Setup
```bash
cd web/app_web

# Installer les dependencies
npm install
npm install clsx tailwind-merge
npm install lucide-react

# Install shadcn
npx shadcn-ui@latest init
# Choisir "Tailwind CSS"

# Run dev server
npm run dev
```

---

## 📝 Fichiers à Créer Ensuite (Phase 2)

### Backend (Django APIs)

1. **`backend/apps/iam/views.py`**
   - UserViewSet (CRUD)
   - RoleViewSet (CRUD)
   - PermissionViewSet (ReadOnly)
   - CompanyViewSet (Current company)
   - GareViewSet (CRUD)
   - AuditLogViewSet (ReadOnly + filters)
   - AuthTokenView (Login)
   - AuthRefreshView (Token refresh)
   - CurrentUserView (Me endpoint)

2. **`backend/apps/iam/filters.py`**
   - UserFilter (by email, role, is_active)
   - RoleFilter (by name, company)
   - AuditLogFilter (by action, user, date range)

3. **`backend/apps/iam/permissions.py`**
   - IsAuthenticated (custom)
   - HasPermission (custom DRF permission)
   - IsCompanyMember (cross-tenant prevention)

4. **`backend/apps/iam/tests_api.py`**
   - API endpoint tests
   - Authentication tests
   - Permission tests
   - Multi-tenant isolation tests

### Frontend (React Pages + Hooks)

1. **API Hooks (Custom)**
   - `src/hooks/useUsers.ts` - CRUD users
   - `src/hooks/useRoles.ts` - CRUD roles
   - `src/hooks/usePermissions.ts` - Get permissions
   - `src/hooks/useAuditLogs.ts` - List audit logs
   - `src/hooks/useAuth.ts` - Login/logout/refresh

2. **Modal Components**
   - `src/features/iam/components/UserModal.tsx`
   - `src/features/iam/components/RoleModal.tsx`
   - `src/features/iam/components/PermissionSelector.tsx`

3. **Pages IAM**
   - Améliorer `RolesPage.tsx` (déjà créée)
   - `UsersPage.tsx` - Complete CRUD
   - `PermissionsPage.tsx` - Readonly list
   - `AuditLogsPage.tsx` - Logs with filters

---

## 🎯 Checklist Phase 2

### Backend
- [ ] Views.py avec 7 ViewSets
- [ ] Filters.py avec custom filters
- [ ] Permissions.py avec classes personnalisées
- [ ] Tests API (CRUD, auth, permissions)
- [ ] Documentation Swagger/OpenAPI
- [ ] Error handling (custom exception handler)

### Frontend
- [ ] API service layer (axiosInstance)
- [ ] useUsers hook (CRUD)
- [ ] useRoles hook (CRUD)
- [ ] usePermissions hook
- [ ] useAuditLogs hook
- [ ] UserModal component
- [ ] RoleModal component
- [ ] PermissionSelector component
- [ ] UsersPage avec DataTable + modals
- [ ] PermissionsPage (readonly)
- [ ] AuditLogsPage avec filtres
- [ ] Toast notifications
- [ ] Error boundaries

---

## 📊 Endpoints à Implémenter

### Authentication
```
POST   /api/auth/login/              → { email, password }
POST   /api/auth/refresh/            → { refresh_token }
POST   /api/auth/logout/             → {}
GET    /api/auth/me/                 → { user details + permissions }
```

### Users Management
```
GET    /api/users/                   → List (paginated)
POST   /api/users/                   → Create
GET    /api/users/{id}/              → Detail
PATCH  /api/users/{id}/              → Update
DELETE /api/users/{id}/              → Delete
POST   /api/users/{id}/change-password/ → Change password
```

### Roles Management
```
GET    /api/roles/                   → List
POST   /api/roles/                   → Create
GET    /api/roles/{id}/              → Detail
PATCH  /api/roles/{id}/              → Update permissions
DELETE /api/roles/{id}/              → Delete
```

### Permissions (ReadOnly)
```
GET    /api/permissions/             → List all
GET    /api/permissions/?resource=X  → Filter by resource
```

### Companies (Current)
```
GET    /api/companies/me/            → Current company
GET    /api/companies/me/gares/      → List gares
POST   /api/companies/me/gares/      → Create gare
PATCH  /api/companies/me/gares/{id}/ → Update gare
DELETE /api/companies/me/gares/{id}/ → Delete gare
```

### Audit Logs (ReadOnly + Filter)
```
GET    /api/audit-logs/              → List with pagination
GET    /api/audit-logs/?user=X&action=Y&date_from=Z  → Filter
GET    /api/audit-logs/{id}/         → Detail
```

---

## 🔑 Environment Variables

### Backend (.env)
```
DEBUG=False
SECRET_KEY=your-secret-key-here
DATABASE_URL=postgresql://user:password@localhost:5432/bus_db
ALLOWED_HOSTS=localhost,127.0.0.1,example.com
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://app.example.com
JWT_SECRET_KEY=your-jwt-secret-key
JWT_ALGORITHM=HS256
```

### Frontend (.env.local)
```
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME=Bus Manager
```

---

## 📚 Ressources Utiles

### Django
- [DRF Documentation](https://www.django-rest-framework.org/)
- [Django JWT](https://django-rest-framework-simplejwt.readthedocs.io/)
- [Django Testing](https://docs.djangoproject.com/en/stable/topics/testing/)

### React
- [React Query (TanStack Query)](https://tanstack.com/query/latest)
- [Zod (Validation)](https://zod.dev/)
- [React Hook Form](https://react-hook-form.com/)

### Testing
- [Pytest](https://pytest.org/)
- [Cypress](https://www.cypress.io/)
- [Vitest](https://vitest.dev/)

---

## ⚡ Quick Start Commands

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_iam
python manage.py runserver

# Frontend
cd web/app_web
npm install
npm run dev
```

Puis ouvrir:
- Admin Django: http://localhost:8000/admin
- Frontend: http://localhost:5173
- API Swagger: http://localhost:8000/api/schema/ (Phase 2)

---

## 🎬 Demo Flow

1. **Login** → `/api/auth/login`
   - Email: admin@company.com, Password: admin123
   - Reçoit: { access_token, refresh_token, user }

2. **Load Dashboard** → `/api/auth/me` + `/api/companies/me/`
   - Get current user + company details

3. **List Users** → `/api/users/`
   - Filtered automatiquement par company_id (tenant)

4. **Create User** → `POST /api/users/`
   - Auto-set company_id à current company

5. **Edit Permissions** → `PATCH /api/roles/{id}/`
   - Modify permissions for role

6. **Audit Trail** → `/api/audit-logs/`
   - See all actions by users

---

**Ready for Phase 2? 🚀**

Next: Implementing Django REST APIs for complete IAM system!
