from django.urls import path
from . import views
from django.conf import settings
from django.conf.urls.static import static
from django.contrib.auth import views as auth_views
from .views import delete_account


urlpatterns = [
    path('', views.landing, name='landing'),
    path('login/', views.login_view, name='login'),
    path('signup/', views.signup_view, name='signup'),
    path('home/', views.home, name='home'),
    path('chat/<str:group_name>/', views.chat_room, name='chat_room'),
    path('settings/', views.settings_view, name='settings'),
     path('settings/password/', auth_views.PasswordChangeView.as_view(
        template_name='accounts/change_password.html',
        success_url='/settings/password/done/'
    ), name='change_password'),

    path('settings/password/done/', auth_views.PasswordChangeDoneView.as_view(
        template_name='accounts/change_password_done.html'
    ), name='password_change_done'),
     path('settings/delete/', delete_account, name='delete_account'),
     path('learn-more/', views.learn_more, name='learn_more'),
      path('load-panel/<str:panel_name>/', views.load_panel, name='load_panel'),
    path('groups/', views.groups_view, name='groups'),  
    path('groups/all/', views.group_panel, name='group_panel'),  
    path('groups/create/', views.load_create_group_form, name='load_create_group_form'),  
    path('groups/create/submit/', views.create_group_ajax, name='create_group_ajax'), 
    path('groups/<int:group_id>/section-buttons/', views.get_group_sections, name='get_group_sections'), 
    path('groups/<int:group_id>/section/<str:section_name>/', views.load_subsection, name='load_subsection'), 
]






if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)