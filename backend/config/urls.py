from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),

    # IAM multi-tenant (Super Admin Central, Companies, Users, Roles, Auth JWT)
    path("api/iam/",         include("apps.iam.urls")),

    # API legacy
    path("api/accounts/",   include("apps.accounts.urls")),
    path("api/transport/",  include("apps.transport.urls")),
    path("api/billets/",    include("apps.reservation_billets.urls")),
    path("api/client/",     include("apps.reservation_billets.client_urls")),
    path("api/client/sav/", include("apps.sav_aavis.client_urls")),
    path("api/sav/",        include("apps.sav_aavis.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
