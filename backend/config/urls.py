from django.contrib import admin
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
]
