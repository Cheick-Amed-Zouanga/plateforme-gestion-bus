# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

This is a **monorepo** containing a complete bus transportation management platform with three main components:

### Backend (Django REST API)
- **Path**: `backend/`
- **Tech Stack**: Django 6.0.2, Django REST Framework, SimpleJWT for authentication
- **Architecture**: Modular Django apps in `backend/apps/`:
  - `accounts` - User authentication and account management
  - `transport` - Bus routes, schedules, and transport operations
  - `reservation_billets` - Ticket booking and reservations
  - `paiements` - Payment processing
  - `suivis_temps_reel` - Real-time GPS tracking
  - `notification` - User notifications
  - `sav_aavis` - Customer service and feedback
- **Key Dependencies**: OpenRouteService (routing), QR code generation, JWT authentication, CORS support
- **Database**: Django ORM (PostgreSQL recommended for production)

### Web Frontend (React + Vite)
- **Path**: `web/app_web/`
- **Tech Stack**: React 19.2.0, Vite 7.3.1, React Router DOM 7.13.1
- **Purpose**: Admin and management interface for the platform
- **Build Tool**: Vite for fast development and optimized production builds

### Mobile App (Flutter)
- **Path**: `mobile/app_mobile/`
- **Tech Stack**: Flutter 3.9.2+, Dart
- **Purpose**: Client-facing mobile application for passengers
- **Key Features**: Ticket booking, real-time tracking, QR code display, secure storage
- **Key Libraries**: 
  - `dio` - HTTP client for backend API calls
  - `flutter_secure_storage` - Secure credential storage
  - `shared_preferences` - User preferences
  - `qr_flutter` - QR code generation

### Shared Resources
- **Path**: `shared/`
- Reserved for common conventions, API contracts, and shared schemas (currently empty)

## Development Commands

### Backend (Django)

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run development server (runs on http://localhost:8000)
python manage.py runserver

# Create and apply migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser for admin panel
python manage.py createsuperuser

# Run tests (if test suite exists)
python manage.py test

# Access Django admin
# Navigate to http://localhost:8000/admin
```

### Web Frontend (React)

```bash
cd web/app_web

# Install dependencies
npm install

# Start dev server (hot reload on http://localhost:5173)
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Preview production build
npm run preview
```

### Mobile (Flutter)

```bash
cd mobile/app_mobile

# Install dependencies
flutter pub get

# Run on connected device/emulator
flutter run

# Build APK for Android
flutter build apk

# Build iOS app
flutter build ios

# Run analyzer/linter
flutter analyze
```

## Key Development Notes

### Backend API
- Uses **SimpleJWT** for token-based authentication (JWT)
- CORS configured for web and mobile clients
- All API endpoints should follow RESTful conventions
- When modifying models in `apps/*/models.py`, remember to create and run migrations
- QR code and barcode generation is integrated for tickets

### Web Frontend
- Uses **React Router** for client-side routing
- ESLint configured for code quality
- Vite provides fast HMR (hot module replacement) during development
- Build output goes to `dist/` folder
- Currently foundational structure; business modules will be added progressively

### Mobile App
- Communicates with backend via **Dio HTTP client**
- Uses **flutter_secure_storage** for storing authentication tokens securely
- QR code functionality available via `qr_flutter`
- Google Fonts integration for typography
- Material Design for UI

## Git Workflow

Current development branch: `askia`
Main branch: `main`

Recent features:
- Mobile client journey implementation
- Admin/Chef dashboards
- Seating plan feature
- CSRF security improvements with JWT tokens
- Mobile login/register screens (responsive)

## Important Security Considerations

- **Authentication**: Uses JWT tokens with SimpleJWT
- **Storage**: Mobile app uses flutter_secure_storage for sensitive credentials
- **API Protection**: CORS configured, CSRF tokens implemented
- **QR Codes**: Used for secure ticket verification

## Project Structure Guidelines

- Backend: Keep business logic in model methods and serializers, use ViewSets for APIs
- Web: Component-based structure, use routing for major sections (admin, management, etc.)
- Mobile: Follow Flutter best practices with state management; use Dio interceptors for auth tokens
- Shared: Document API contracts and common schemas as they emerge

## Common Tasks

### Adding a New Backend Feature
1. Create a new app: `python manage.py startapp app_name` (in `apps/`)
2. Define models in `models.py`
3. Create serializers for API responses
4. Create ViewSets and routers in `urls.py` or similar
5. Run migrations: `python manage.py makemigrations && python manage.py migrate`

### Adding a New Web Page
1. Create a component in `web/app_web/src/`
2. Add a route in your routing configuration using React Router
3. Import and use the component

### Adding Mobile Features
1. Create Dart files in `lib/` following Flutter conventions
2. Use Dio for API calls to backend
3. Consider state management for complex features
4. Test on both Android and iOS emulators

## Useful Resources

- Django REST Framework docs: https://www.django-rest-framework.org/
- React Router docs: https://reactrouter.com/
- Flutter docs: https://flutter.dev/docs
- SimpleJWT docs: https://django-rest-framework-simplejwt.readthedocs.io/
