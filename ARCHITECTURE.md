# 🏗️ Architecture Multi-Tenant SaaS

---

## 📐 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         WEB ADMIN                                │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                      React Admin Panel                     │  │
│  │  ┌──────────┐  ┌──────────────────┐  ┌─────────────────┐ │  │
│  │  │ Sidebar  │  │    TopBar        │  │  Main Content   │ │  │
│  │  │          │  │  (Gare Selector) │  │  (Dynamic Pages)│ │  │
│  │  │ - Dynamic│  │                  │  │                 │ │  │
│  │  │   by role│  │ - Notifications  │  │ - Transport     │ │  │
│  │  │ - IAM    │  │ - User Menu      │  │ - RH            │ │  │
│  │  │ - Transport
│  │  │ - RH     │  │                  │  │ - Finances      │ │  │
│  │  │ - Finance                      │  │ - Support       │ │  │
│  │  │ - Support                      │  │ - IAM           │ │  │
│  │  └──────────┘  └──────────────────┘  └─────────────────┘ │  │
│  │                                                              │  │
│  │              DataTable + Forms + Charts                      │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Technologies: React, TypeScript, Tailwind, shadcn              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ API REST
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND DJANGO                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Django REST API                        │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐ ┌───────────┐ │  │
│  │  │ Users    │  │ Roles    │  │ Perms    │ │ Audit Log │ │  │
│  │  │ Company  │  │ Gare     │  │ Auth     │ │ Transport │ │  │
│  │  │ Finance  │  │ RH       │  │ Support  │ │ etc.      │ │  │
│  │  └──────────┘  └──────────┘  └──────────┘ └───────────┘ │  │
│  │                                                              │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │           MIDDLEWARE (Tenant Filtering)              │ │  │
│  │  │  - TenantMiddleware (JWT → tenant_id)               │ │  │
│  │  │  - Auto-filter all queries by company_id             │ │  │
│  │  │  - Prevent cross-tenant access                       │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  │                                                              │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │            MODELS (Multi-Tenant)                     │ │  │
│  │  │  - Company (Tenant root)                            │ │  │
│  │  │  - Gare (company ForeignKey)                        │ │  │
│  │  │  - CustomUser (company ForeignKey + roles)          │ │  │
│  │  │  - Permission (40+ CRUD permissions)                │ │  │
│  │  │  - Role (permissions ManyToMany)                    │ │  │
│  │  │  - AuditLog (complete action tracking)              │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  │                                                              │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │        AUTHORIZATION (RBAC)                         │ │  │
│  │  │  @require_permission('resource.action')             │ │  │
│  │  │  @require_any_permission(...)                       │ │  │
│  │  │  @require_all_permissions(...)                      │ │  │
│  │  │                                                      │ │  │
│  │  │  Rôles pré-configurés:                             │ │  │
│  │  │  - Administrateur (all)                            │ │  │
│  │  │  - Manager (trajets + employés)                    │ │  │
│  │  │  - Chef de gare (gare + employés)                  │ │  │
│  │  │  - Contrôleur (validation billets)                 │ │  │
│  │  │  - Réceptionniste (vente billets)                  │ │  │
│  │  │  - SAV (support + remboursements)                  │ │  │
│  │  │  - Comptable (rapports financiers)                 │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Technologies: Django, DRF, JWT, UUID                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────┐                │
│  │ Companies   │  │ Gares       │  │ Users    │                │
│  │ id (UUID)   │  │ id (UUID)   │  │ id (UUID)│                │
│  │ name        │  │ company_id ──→ │company_id│──→ Companies   │
│  │ email       │  │ name        │  │ gare_id  │──→ Gares       │
│  │ slug        │  │ city        │  │ roles ──────→ Roles       │
│  │ subscription│  │             │  │          │                │
│  │             │  │             │  │          │                │
│  └─────────────┘  └─────────────┘  └──────────┘                │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐       │
│  │ Permissions  │  │ Roles        │  │ AuditLog        │       │
│  │ id (UUID)    │  │ id (UUID)    │  │ id (UUID)       │       │
│  │ resource     │  │ company_id   │  │ user_id         │       │
│  │ action       │  │ name         │  │ company_id      │       │
│  │ name         │  │ description  │  │ action          │       │
│  │              │  │ permissions ◄──→ resource_type   │       │
│  │              │  │              │  │ old_values      │       │
│  │              │  │              │  │ new_values      │       │
│  └──────────────┘  └──────────────┘  └─────────────────┘       │
│                                                                  │
│  Database: PostgreSQL (recommended for multi-tenant)            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔑 Multi-Tenant Isolation

### Data Isolation Strategy

```
Company A                      Company B
├── Gare A1                    ├── Gare B1
├── Gare A2                    ├── Gare B2
├── Users (A)                  ├── Users (B)
├── Roles (A)                  ├── Roles (B)
└── Permissions (A)            └── Permissions (B)
     ↓                            ↓
   Filtered by                 Filtered by
   company_id=A_ID             company_id=B_ID
     ↓                            ↓
Each request includes        Each request includes
JWT with tenant_id           JWT with tenant_id
```

### Tenant ID Flow

```
Client                        Middleware               Database
  │                             │
  ├─ Login ───────────────────→ │
  │                             ├─ Extract company_id
  │                             ├─ Create JWT(tenant_id)
  │ ← JWT(tenant_id) ──────────┤
  │                             │
  ├─ Request + JWT ───────────→ │
  │                             ├─ Decode JWT
  │                             ├─ Extract tenant_id
  │                             ├─ request.tenant_id = tenant_id
  │                             │
  │                             ├─ Apply filters:
  │                             │  Model.objects.filter(
  │                             │    company_id=request.tenant_id
  │                             │  )
  │                             │
  │                             ├─ Fetch filtered data
  │ ← Tenant-specific data ────┤
  │                             │
```

---

## 🎯 Request Flow

```
1. AUTHENTICATION
   POST /api/auth/login
   └─ Email + Password
      └─ Validate user + company
      └─ Create JWT with tenant_id
      └─ Return: { access_token, refresh_token, company_id }

2. AUTHORIZED REQUEST
   GET /api/users/
   Header: Authorization: Bearer JWT
   └─ TenantMiddleware
      └─ Extract tenant_id from JWT
      └─ request.tenant_id = tenant_id
   └─ @require_permission('iam.read')
      └─ Check user has permission
   └─ View function
      └─ TenantManager auto-filters
      └─ Return only company_id=tenant_id users
      └─ Response: [User1, User2, ...] (filtered)

3. UNAUTHORIZED REQUEST
   GET /api/users/?company_id=OTHER_COMPANY
   Header: Authorization: Bearer JWT(tenant_id=A)
   └─ TenantMiddleware
      └─ request.tenant_id = A
   └─ View tries to filter by ?company_id=B
      └─ User's company_id != requested company_id
      └─ TenantMiddleware.process_view
      └─ Response: 403 Forbidden - Tenant mismatch
```

---

## 🔐 Permission Hierarchy

```
Request
   │
   ├─ User.is_superuser?
   │  └─ YES ──→ Has all permissions
   │  └─ NO  ──→ Continue
   │
   ├─ User.roles.permissions
   │  ├─ Has permission?
   │  │  └─ YES ──→ Allow request
   │  │  └─ NO  ──→ 403 Forbidden
   │
   └─ Audit log creation
      └─ action, resource_type, old_values, new_values
      └─ Stored for compliance/debugging
```

---

## 📊 Components Architecture

### Frontend Layer

```
AdminLayout (Main wrapper)
├── Sidebar (Navigation)
│   ├── Dashboard
│   ├── Transport
│   │   ├── Bus
│   │   ├── Routes
│   │   └── Tickets
│   ├── RH
│   │   ├── Employees
│   │   └── Teams
│   ├── Finances
│   │   ├── Payments
│   │   └── Reports
│   ├── Support
│   │   └── Tickets
│   ├── IAM
│   │   ├── Users
│   │   ├── Roles
│   │   ├── Permissions
│   │   └── Audit Logs
│   └── Settings
│       ├── Company
│       └── Gares
│
├── TopBar (Header)
│   ├── Gare Selector (dropdown)
│   ├── Notifications
│   ├── Settings
│   └── User Menu
│
└── Main Content (Dynamic)
    ├── Page Components
    ├── DataTable (with sort/search/paginate)
    ├── Forms (with validation)
    ├── Modals (CRUD)
    ├── Charts (Charts library)
    └── Notifications (Toast)
```

---

## 🚀 Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  React App (Build: npm run build)                               │
│  Deployed on: Vercel / Netlify / AWS S3 + CloudFront           │
│  Environment: REACT_APP_API_URL=https://api.example.com        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                      (HTTPS/CORS)
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                       BACKEND (Django)                           │
│  Deployed on: AWS EC2 / DigitalOcean / Heroku                  │
│  Gunicorn + Nginx + SSL                                        │
│  Environment:                                                    │
│    - DEBUG=False                                                │
│    - ALLOWED_HOSTS=example.com                                 │
│    - DATABASE_URL=postgresql://...                             │
│    - JWT_SECRET_KEY=secure_key                                 │
│    - CORS_ALLOWED_ORIGINS=https://app.example.com             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE (PostgreSQL)                       │
│  Hosted on: AWS RDS / Managed database service                  │
│  Backups: Daily automated backups                               │
│  Replication: Multi-AZ for HA                                   │
│  SSL: Encrypted connections                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📈 Scalability

### Horizontal Scaling

```
Load Balancer
├── Backend Server 1 (Gunicorn)
├── Backend Server 2 (Gunicorn)
├── Backend Server 3 (Gunicorn)
└── Backend Server N (Gunicorn)
        │
        └─→ Shared Database (PostgreSQL)
            └─→ Connection pool
```

### Database Scaling

- **Read Replicas** - For read-heavy operations
- **Sharding** - By company_id if > 1M companies
- **Caching** - Redis for frequently accessed data

### Frontend Scaling

- **CDN** - For static assets
- **Code splitting** - React lazy loading
- **Compression** - Gzip for API responses

---

## 🔒 Security Checklist

- [x] JWT authentication
- [x] RBAC with granular permissions
- [x] Tenant isolation (all queries filtered)
- [x] Audit logging
- [x] CORS configuration
- [x] SQL injection prevention (ORM)
- [x] XSS prevention (React + Tailwind)
- [ ] Rate limiting (Phase 5)
- [ ] 2FA (Phase 5 - optional)
- [ ] IP whitelisting (Phase 5 - optional)

---

## 📚 API Response Format

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Manager Role",
    "permissions": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "name": "bus.read",
        "resource": "bus",
        "action": "read"
      }
    ]
  },
  "meta": {
    "timestamp": "2024-09-12T10:30:00Z",
    "version": "1.0.0"
  }
}
```

---

**Architecture Version:** 1.0.0  
**Last Updated:** 2024-09-12  
**Status:** ✅ Complete for Phase 0-1
