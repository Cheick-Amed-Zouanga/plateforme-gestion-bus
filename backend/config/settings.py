import os
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')

# --- Environnement ---
SECRET_KEY   = os.environ['SECRET_KEY']
DEBUG        = os.environ.get('DEBUG', 'False') == 'True'
ORS_API_KEY  = os.environ.get('ORS_API_KEY', '')

ALLOWED_HOSTS = ['127.0.0.1', 'localhost']


# --- Applications ---
INSTALLED_APPS = [
    'rest_framework',
    'corsheaders',

    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'apps.accounts',
    'apps.transport',
    'apps.reservation_billets',
    'apps.paiements',
    'apps.suivis_temps_reel',
    'apps.notification',
    'apps.sav_aavis',

    'rest_framework_simplejwt.token_blacklist',
]

# --- Middleware ---
# CorsMiddleware doit être en premier
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'


# --- Base de données ---
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}


# --- Validation des mots de passe ---
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]


# --- Internationalisation ---
LANGUAGE_CODE = 'fr-fr'
TIME_ZONE = 'America/Montreal'
USE_I18N = True
USE_TZ = True


# --- Fichiers statiques ---
STATIC_URL = 'static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# --- CORS (autorise le frontend React à appeler l'API) ---
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
]
CORS_ALLOW_CREDENTIALS = True  # obligatoire pour envoyer les cookies JWT

CSRF_TRUSTED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
]


# --- Email ---
# En développement les emails s'affichent dans la console
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
DEFAULT_FROM_EMAIL = 'noreply@terrasso.local'


# --- Cache (stocke les codes de réinitialisation de compte) ---
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'terrasso-reinitialisation-compte',
    }
}


# --- Session ---
SESSION_COOKIE_AGE = 1800              # expire après 30 min d'inactivité
SESSION_SAVE_EVERY_REQUEST = True
SESSION_EXPIRE_AT_BROWSER_CLOSE = True


# --- DRF : utilise notre classe d'auth JWT par cookie ---
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'apps.accounts.authentication.JWTCookieAuthentication',
    ),
}


# --- JWT ---
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME':    timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME':   timedelta(days=7),
    'ROTATE_REFRESH_TOKENS':    True,  # génère un nouveau refresh à chaque renouvellement
    'BLACKLIST_AFTER_ROTATION': True,  # invalide l'ancien refresh token
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
}

# Noms des cookies JWT
JWT_AUTH_COOKIE         = 'access_token'
JWT_AUTH_REFRESH_COOKIE = 'refresh_token'
JWT_AUTH_COOKIE_SAMESITE = 'Lax'
JWT_AUTH_COOKIE_SECURE  = not DEBUG  # True en prod : cookie envoyé uniquement en HTTPS


# --- Sécurité HTTPS ---
# Toutes ces options sont désactivées en développement (DEBUG=True)
# et activées automatiquement en production (DEBUG=False)
SECURE_SSL_REDIRECT             = not DEBUG  # redirige HTTP → HTTPS
SECURE_HSTS_SECONDS             = 31536000 if not DEBUG else 0  # HSTS actif 1 an en prod
SECURE_HSTS_INCLUDE_SUBDOMAINS  = not DEBUG
SECURE_HSTS_PRELOAD             = not DEBUG
SESSION_COOKIE_SECURE           = not DEBUG  # cookie session en HTTPS uniquement
CSRF_COOKIE_SECURE              = not DEBUG  # cookie CSRF en HTTPS uniquement
