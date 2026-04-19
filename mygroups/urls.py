from django.urls import path
from . import views
app_name = 'mygroups'
urlpatterns = [
    path('dashboard/', views.groups_dashboard, name='groups_dashboard'),
    path('api/group/<int:group_id>/', views.group_detail_api, name='group_detail_api'),
    path('mygroups/', include('mygroups.urls')),

]

