# 🚀 Multi-Tenant SaaS Platform - Bus Management System

Plateforme de gestion complète pour les compagnies de transport avec architecture **multi-tenant**, **RBAC** (Role-Based Access Control), et **IAM** (Identity & Access Management).

---

## 📱 Projets Inclus

### 1. **Mobile App (Flutter)**
Application mobile pour clients - achat de billets, suivi trajets, gestion billets.

**État:** ✅ Phases 1-2 COMPLÈTES
- 22+ composants réutilisables
- 4 pages refactorisées
- Design system cohérent

### 2. **Web Admin Panel (React + Django)**
Tableau de bord d'administration unifié pour gérer tous les aspects de la plateforme.

**État:** ✅ Phases 0-1 COMPLÈTES
- Architecture multi-tenant
- RBAC avec 7 rôles
- Interface admin moderne shadcn

### 3. **Backend API (Django REST)**
API REST sécurisée avec authentification JWT et filtrage automatique par tenant.

**État:** ✅ Models + Middleware + Decorators COMPLETS
- 6 models Django
- Middleware de tenant isolation
- 40+ permissions granulaires

---

## 🏗️ Architecture

### Stack Technique

```
Frontend:     React 18 + TypeScript + Tailwind + shadcn
Backend:      Django 4 + Django REST Framework + JWT
Mobile:       Flutter + Material Design
Database:     PostgreSQL (multi-tenant ready)
Auth:         JWT with tenant_id embedded
```

### Multi-Tenant Design

```
┌─────────────────────────────────────────────┐
│         Each Company (Tenant)                │
│                                             │
│  ├─ Gares (Points de vente)                │
│  ├─ Users (Employees)                      │
│  ├─ Roles (Custom by company)              │
│  ├─ Permissions (By role)                  │
│  └─ All Data (Filtered by company_id)      │
│                                             │
└─────────────────────────────────────────────┘
         ↓
   Tenant Isolation
   (All queries filtered by company_id)
         ↓
   Cross-tenant access IMPOSSIBLE
```

---

## 🔐 Security Features

✅ **JWT Authentication**
- Tokens embed tenant_id
- Auto-refresh mechanism
- 24-hour expiry

✅ **RBAC (Role-Based Access Control)**
- 7 pre-configured roles
- 40+ granular permissions
- Per-resource CRUD permissions

✅ **Tenant Isolation**
- TenantMiddleware extracts tenant_id
- All queries auto-filtered
- Cross-tenant access prevention

✅ **Audit Logging**
- All actions logged
- Old/new values tracked
- IP address recorded

---

## 📊 User Roles

| Rôle | Permissions | Use Case |
|------|-------------|----------|
| **Administrateur** | All | Full platform access |
| **Manager** | Bus/Trajets/Employés | Operations management |
| **Chef de Gare** | Gare/Employés/Billets | Site management |
| **Contrôleur** | Billets/Trajets | On-bus validation |
| **Réceptionniste** | Billets/Paiements | Ticket sales |
| **SAV** | Billets/Remboursements | Customer support |
| **Comptable** | Paiements/Rapports | Financial reports |

---

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- Node.js 16+
- PostgreSQL 12+
- Flutter (for mobile)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Database setup
python manage.py migrate
python manage.py seed_iam
python manage.py createsuperuser

# Run server
python manage.py runserver
# → Admin: http://localhost:8000/admin
```

### Frontend Setup

```bash
cd web/app_web

# Install dependencies
npm install

# Run dev server
npm run dev
# → App: http://localhost:5173
```

### Mobile Setup

```bash
cd mobile/app_mobile

# Get dependencies
flutter pub get

# Run on device/emulator
flutter run
```

---

## 📋 API Endpoints (Phase 2)

### Authentication
```
POST   /api/auth/login/              ← Email + Password
POST   /api/auth/refresh/            ← Refresh token
POST   /api/auth/logout/             ← Logout
GET    /api/auth/me/                 ← Current user + permissions
```

### IAM Management
```
GET    /api/users/                   ← List users (paginated)
POST   /api/users/                   ← Create user
PATCH  /api/users/{id}/              ← Update user
DELETE /api/users/{id}/              ← Delete user

GET    /api/roles/                   ← List roles
POST   /api/roles/                   ← Create role
PATCH  /api/roles/{id}/              ← Update permissions
DELETE /api/roles/{id}/              ← Delete role

GET    /api/permissions/             ← List all permissions
GET    /api/audit-logs/              ← List audit logs
```

### Company Management
```
GET    /api/companies/me/            ← Current company
GET    /api/companies/me/gares/      ← List gares
POST   /api/companies/me/gares/      ← Create gare
PATCH  /api/companies/me/gares/{id}/ ← Update gare
DELETE /api/companies/me/gares/{id}/ ← Delete gare
```

---

## 🎯 Implementation Timeline

| Phase | Titre | Heures | État |
|-------|-------|--------|------|
| **0** | Multi-Tenant Foundation | 3-4h | ✅ COMPLETE |
| **1** | Frontend Setup + Components | 2-3h | ✅ COMPLETE |
| **2** | IAM Backend APIs | 4-5h | 🚀 IN PROGRESS |
| **3** | Frontend IAM Pages | 4-5h | ⏳ TODO |
| **4** | Dashboard Modules | 4-5h | ⏳ TODO |
| **5** | Polish & Testing | 2-3h | ⏳ TODO |
| | **TOTAL** | **21-22h** | |

---

## 📁 Project Structure

```
plateforme-gestion-bus/
├── backend/
│   ├── apps/
│   │   └── iam/              ✅ Multi-tenant IAM
│   │       ├── models.py
│   │       ├── views.py      (Phase 2)
│   │       ├── serializers.py
│   │       ├── middleware.py
│   │       ├── decorators.py
│   │       ├── admin.py
│   │       └── urls.py       (Phase 2)
│   └── manage.py
│
├── web/
│   └── app_web/
│       └── src/
│           ├── components/
│           │   ├── ui/        ✅ shadcn
│           │   │   ├── button.tsx
│           │   │   ├── card.tsx
│           │   │   ├── input.tsx
│           │   │   └── badge.tsx
│           │   └── shared/    ✅ Layouts
│           │       ├── AdminLayout.tsx
│           │       ├── Sidebar.tsx
│           │       ├── TopBar.tsx
│           │       ├── DataTable.tsx
│           │       └── StatCard.tsx
│           ├── features/
│           │   ├── admin/
│           │   │   └── pages/
│           │   │       └── Dashboard.tsx  ✅
│           │   └── iam/
│           │       └── pages/
│           │           ├── RolesPage.tsx  ✅
│           │           ├── UsersPage.tsx  (Phase 3)
│           │           ├── PermissionsPage.tsx (Phase 3)
│           │           └── AuditLogsPage.tsx (Phase 3)
│           ├── hooks/       (Phase 3)
│           └── lib/
│               └── utils.ts ✅
│
├── mobile/
│   └── app_mobile/
│       └── lib/
│           ├── core/
│           │   └── theme/    ✅ Design system
│           ├── shared/
│           │   └── components/ ✅ 22+ components
│           └── features/
│               ├── home/     ✅ Refactored
│               ├── search/   ✅ Refactored
│               ├── booking/  ✅ Refactored
│               └── tickets/  ✅ Refactored
│
├── PHASE0_PHASE1_COMPLETE.md
├── IMPLEMENTATION_PLAN.md
├── ARCHITECTURE.md
├── NEXT_STEPS.md
└── README_MULTITENANT_SAAS.md
```

---

## 🔧 Configuration

### Django Settings Required

```python
# settings.py

INSTALLED_APPS = [
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'apps.iam',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'apps.iam.middleware.TenantMiddleware',
]

AUTH_USER_MODEL = 'iam.CustomUser'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=24),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
}
```

### Environment Variables

```bash
# Backend
DEBUG=False
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://user:pass@localhost/bus_db
ALLOWED_HOSTS=localhost,example.com
CORS_ALLOWED_ORIGINS=http://localhost:3000

# Frontend
VITE_API_URL=http://localhost:8000/api
```

---

## ✨ Key Features

### For End Users
- 🎫 Easy ticket booking
- 📱 QR code tickets
- 💳 Multiple payment methods
- 🔔 Real-time notifications
- 📍 GPS tracking

### For Administrators
- 📊 Unified dashboard
- 👥 User management with roles
- 🚌 Bus & route management
- 💰 Financial reports
- 📋 Audit logging
- 🔐 Complete IAM system

### For Companies
- 📈 Performance metrics
- 💹 Revenue tracking
- 👥 Team management
- 🎯 Custom roles & permissions
- 🔒 Data security & isolation

---

## 🧪 Testing

### Backend Tests
```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test apps.iam

# With coverage
coverage run --source='.' manage.py test
coverage report
```

### Frontend Tests (Phase 5)
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:coverage
```

---

## 📚 Documentation

- **[PHASE0_PHASE1_COMPLETE.md](./PHASE0_PHASE1_COMPLETE.md)** - What's been completed
- **[IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)** - Full 5-phase plan
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture details
- **[NEXT_STEPS.md](./NEXT_STEPS.md)** - Phase 2 quick start

---

## 🚀 Deployment

### Docker (Phase 5)
```dockerfile
# Backend
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["gunicorn", "config.wsgi"]

# Frontend
FROM node:16-alpine
WORKDIR /app
COPY package*.json .
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "run", "preview"]
```

### Production Checklist
- [ ] DEBUG=False
- [ ] SECRET_KEY secured
- [ ] Database backups enabled
- [ ] SSL certificates
- [ ] CDN configured
- [ ] Monitoring setup
- [ ] Rate limiting
- [ ] WAF rules

---

## 📞 Support & Contributing

### Issues & Bugs
Create an issue on GitHub with:
- Description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)

### Contributing
1. Fork repository
2. Create feature branch: `git checkout -b feature/xyz`
3. Commit changes: `git commit -m 'Add xyz'`
4. Push: `git push origin feature/xyz`
5. Open Pull Request

---

## 📄 License

Proprietary - All rights reserved

---

## 👥 Team

**Project Lead:** Cheick Amed Zouanga  
**Email:** cheickahmedzouanga@gmail.com  
**Status:** Active Development

---

## 🎯 Next Phase

**Phase 2 Focus:** Backend APIs Implementation
- Create REST endpoints for all IAM operations
- Implement JWT authentication fully
- Add permission checking middleware
- Write comprehensive tests

**Estimated Start:** 2024-09-13  
**Estimated Duration:** 4-5 hours

---

## 📈 Project Status

```
✅ Phase 0: Multi-Tenant Architecture    COMPLETE
✅ Phase 1: Frontend Setup + Components  COMPLETE
🚀 Phase 2: IAM Backend APIs             IN PROGRESS
⏳ Phase 3: Frontend IAM Pages            TODO
⏳ Phase 4: Dashboard Modules             TODO
⏳ Phase 5: Polish & Testing              TODO
```

**Overall Progress: 28.6% (2/7 phases complete)**

---

**Last Updated:** 2024-09-12  
**Next Update:** After Phase 2 completion

🚀 **Let's build an amazing platform!**
