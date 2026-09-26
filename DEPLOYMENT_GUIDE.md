# 🚀 Deployment Guide - Multi-Tenant SaaS Platform

---

## 📋 Pre-Deployment Checklist

### Backend (Django)
- [ ] All migrations applied
- [ ] Django admin configured
- [ ] DEBUG = False in production
- [ ] ALLOWED_HOSTS configured
- [ ] SECRET_KEY secured (use environment variable)
- [ ] Database backups automated
- [ ] Static files collected
- [ ] Media files storage configured
- [ ] Email backend configured
- [ ] CORS properly configured
- [ ] SSL/TLS certificates installed
- [ ] Rate limiting configured
- [ ] Logging configured
- [ ] Error monitoring setup (e.g., Sentry)

### Frontend (React)
- [ ] Build tested locally (`npm run build`)
- [ ] Environment variables configured
- [ ] API_URL points to production backend
- [ ] All pages tested in production build
- [ ] Analytics configured (optional)
- [ ] Error tracking configured (optional)
- [ ] Performance monitoring setup (optional)

### Database (PostgreSQL)
- [ ] Backups automated daily
- [ ] Replication configured (optional)
- [ ] SSL connections enabled
- [ ] Indexes optimized
- [ ] Connection pooling configured

---

## 🐳 Docker Setup

### Backend Dockerfile

```dockerfile
FROM python:3.9-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . .

# Collect static files
RUN python manage.py collectstatic --noinput

# Run gunicorn
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "4"]
```

### Frontend Dockerfile

```dockerfile
FROM node:16-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  db:
    image: postgres:13
    environment:
      POSTGRES_DB: bus_platform
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    command: gunicorn config.wsgi:application --bind 0.0.0.0:8000
    environment:
      DEBUG: "False"
      SECRET_KEY: ${SECRET_KEY}
      DATABASE_URL: postgresql://admin:${DB_PASSWORD}@db:5432/bus_platform
      ALLOWED_HOSTS: ${ALLOWED_HOSTS}
    ports:
      - "8000:8000"
    depends_on:
      - db

  frontend:
    build: ./web/app_web
    ports:
      - "80:80"
    environment:
      VITE_API_URL: ${API_URL}
    depends_on:
      - backend

volumes:
  postgres_data:
```

---

## ☁️ Cloud Deployment Options

### Option 1: AWS

**Components:**
- **EC2:** Backend (Gunicorn + Nginx)
- **RDS:** PostgreSQL database
- **CloudFront:** CDN for frontend
- **S3:** Media files storage
- **Route 53:** DNS
- **ACM:** SSL certificates

**Deployment Steps:**
```bash
# 1. Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier bus-platform \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password ${DB_PASSWORD}

# 2. Launch EC2 instance
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.micro \
  --key-name my-key-pair

# 3. Deploy via GitHub Actions or CodeDeploy
```

### Option 2: DigitalOcean

**Components:**
- **App Platform:** Backend
- **Managed Databases:** PostgreSQL
- **Spaces:** Object storage
- **App Platform:** Frontend

```bash
# Deploy via doctl
doctl apps create --spec app.yaml
```

### Option 3: Heroku

**Backend:**
```bash
heroku login
heroku create bus-platform-backend
git push heroku main
heroku run python manage.py migrate
heroku config:set DEBUG=False
```

**Frontend:**
```bash
heroku create bus-platform-frontend
echo "web: npm run preview" > Procfile
git push heroku main
```

---

## 📊 Environment Configuration

### Backend (.env)

```bash
# Django
DEBUG=False
SECRET_KEY=your-very-secret-key-here
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/bus_db

# Security
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
CSRF_TRUSTED_ORIGINS=https://yourdomain.com

# CORS
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Email
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# AWS S3 (optional)
USE_S3=True
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_STORAGE_BUCKET_NAME=bus-platform-media

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
```

### Frontend (.env.production)

```bash
VITE_API_URL=https://api.yourdomain.com
VITE_APP_NAME=Bus Platform
VITE_ANALYTICS_ID=your-analytics-id
```

---

## 🚀 Deployment Process

### Step 1: Prepare Backend

```bash
cd backend

# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Seed data
python manage.py seed_iam

# Collect static files
python manage.py collectstatic --noinput

# Run tests
python manage.py test

# Run linter
flake8 .
```

### Step 2: Build Frontend

```bash
cd web/app_web

# Install dependencies
npm install

# Build for production
npm run build

# Test build
npm run preview

# Run tests
npm run test

# Check bundle size
npm run analyze
```

### Step 3: Database Setup

```bash
# Create database
createdb bus_platform

# Set permissions
psql bus_platform -c "GRANT ALL ON SCHEMA public TO admin;"

# Enable extensions
psql bus_platform -c "CREATE EXTENSION IF NOT EXISTS uuid-ossp;"

# Run migrations
python manage.py migrate

# Create backups
pg_dump bus_platform > backup_$(date +%Y%m%d).sql
```

### Step 4: Deploy

**Using Docker:**
```bash
docker-compose build
docker-compose up -d
docker-compose exec backend python manage.py migrate
```

**Using Git + CI/CD:**
```bash
git push origin main
# Trigger CI/CD pipeline (GitHub Actions, GitLab CI, etc.)
```

### Step 5: Post-Deployment

```bash
# Verify backend health
curl https://api.yourdomain.com/api/health/

# Verify frontend
curl https://yourdomain.com

# Check SSL
openssl s_client -connect yourdomain.com:443

# Monitor logs
tail -f /var/log/django.log
```

---

## 🔐 Security Checklist

### SSL/TLS
- [ ] Certificate installed and valid
- [ ] Auto-renewal configured
- [ ] HSTS header enabled
- [ ] Redirect HTTP to HTTPS

### Authentication
- [ ] JWT tokens expire properly
- [ ] Refresh token rotation enabled
- [ ] CORS properly restricted
- [ ] CSRF protection enabled

### Database
- [ ] SSL connections required
- [ ] Backups encrypted
- [ ] Access logs enabled
- [ ] SQL injection prevention (ORM used)

### API
- [ ] Rate limiting configured
- [ ] Input validation on all endpoints
- [ ] API documentation hidden in production
- [ ] Sensitive data not logged

### Infrastructure
- [ ] Firewall rules tight
- [ ] SSH keys rotated
- [ ] Secrets not in code
- [ ] Dependencies up-to-date

---

## 📊 Monitoring Setup

### Error Tracking (Sentry)

```python
# settings.py
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration

sentry_sdk.init(
    dsn=os.environ.get('SENTRY_DSN'),
    integrations=[DjangoIntegration()],
    traces_sample_rate=0.1,
    send_default_pii=False
)
```

### Performance Monitoring

```python
# middleware.py
import time
from django.utils.deprecation import MiddlewareMixin

class PerformanceMonitoringMiddleware(MiddlewareMixin):
    def process_request(self, request):
        request.start_time = time.time()

    def process_response(self, response):
        duration = time.time() - request.start_time
        if duration > 1:  # Log if > 1 second
            logger.warning(f"{request.path} took {duration}s")
        return response
```

### Logging

```python
# settings.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'ERROR',
            'class': 'logging.FileHandler',
            'filename': '/var/log/django_errors.log',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'ERROR',
            'propagate': True,
        },
    },
}
```

---

## 📈 Performance Optimization

### Backend
```python
# Enable database query optimization
DATABASES = {
    'default': {
        # ... connection settings
        'CONN_MAX_AGE': 600,  # Connection pooling
        'OPTIONS': {
            'connect_timeout': 10,
        }
    }
}

# Enable caching
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
    }
}
```

### Frontend
```typescript
// Lazy loading
const Dashboard = React.lazy(() => import('./pages/Dashboard'))

// Code splitting
const routes = [
  { path: '/admin/users', component: React.lazy(() => import('./features/iam/pages/UsersPage')) },
]

// Image optimization
<img src="image.webp" alt="..." />
```

---

## 🔄 Continuous Integration/Deployment

### GitHub Actions Example

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-python@v2
      - run: pip install -r requirements.txt
      - run: python manage.py test
      - run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: docker-compose build
      - run: docker-compose push
      - run: ssh deploy@server "cd app && docker-compose pull && docker-compose up -d"
```

---

## 📱 Mobile Deployment (Flutter)

### Android Release

```bash
flutter build apk --release
flutter build appbundle --release
```

Upload to Google Play Store.

### iOS Release

```bash
flutter build ios --release
```

Submit to App Store.

---

## 🎯 Post-Launch Monitoring

### Daily Checks
- [ ] Error rate < 0.5%
- [ ] Response time < 500ms average
- [ ] Database connections healthy
- [ ] Backups completed successfully

### Weekly Checks
- [ ] Security updates available
- [ ] Disk space usage < 80%
- [ ] API rate limits not exceeded
- [ ] User feedback reviewed

### Monthly Checks
- [ ] Performance trends analyzed
- [ ] Capacity planning review
- [ ] Security audit
- [ ] Backup restore test

---

## 🆘 Troubleshooting

### 500 Error
```bash
# Check logs
tail -f /var/log/django_errors.log
docker-compose logs backend
```

### Slow Queries
```bash
# Enable query logging
LOGGING['handlers']['sql'] = {
    'level': 'DEBUG',
    'class': 'logging.FileHandler',
    'filename': '/var/log/django_sql.log',
}

# Analyze with Django Debug Toolbar (dev only)
pip install django-debug-toolbar
```

### Database Connection Issues
```bash
# Check connection
psql -h localhost -U admin -d bus_db -c "SELECT 1;"

# Reset connection pool
docker-compose restart backend
```

---

## 📞 Support & Escalation

### Issue Severity
- **Critical:** System down, data loss risk
- **High:** Major feature broken, performance degraded
- **Medium:** Minor bugs, cosmetic issues
- **Low:** Nice-to-have improvements

### Escalation Process
1. Local troubleshooting (15 min)
2. Team consultation (30 min)
3. Vendor support if needed
4. Emergency procedures if necessary

---

**Deployment Status:** ✅ READY FOR PRODUCTION

Good luck with your deployment! 🚀
