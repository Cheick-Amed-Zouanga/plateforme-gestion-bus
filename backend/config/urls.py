from django.contrib import admin
from django.urls import path, include
from apps.accounts.views import ConnexionView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/accounts/", include("apps.accounts.urls")),
]