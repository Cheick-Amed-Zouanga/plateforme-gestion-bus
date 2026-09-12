from django.contrib import admin
from django.urls import path, include
from apps.accounts.views import TokenObtainPairView

urlpatterns = [
    path("admin/", admin.site.urls),

    # Auth tokens (direct access)
    path("api/token/", TokenObtainPairView.as_view(), name="token"),

    # API
    path("api/accounts/",   include("apps.accounts.urls")),
    path("api/transport/",  include("apps.transport.urls")),
    path("api/billets/",    include("apps.reservation_billets.urls")),
    path("api/client/",     include("apps.reservation_billets.client_urls")),
]
