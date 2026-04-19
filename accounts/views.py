from django.urls import path
from . import views
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth import get_user_model
from django.contrib import messages
from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_POST
from django.template.loader import render_to_string
from mygroups.models import Group, SubSection
from .forms import CustomUserCreationForm, CustomLoginForm, UserSettingsForm

User = get_user_model()

def landing(request):
    return render(request, 'accounts/landing.html')

def login_view(request):
    form = CustomLoginForm(request, data=request.POST or None)
    if request.method == 'POST' and form.is_valid():
        login(request, form.get_user())
        return redirect('home')
    return render(request, 'accounts/login.html', {'form': form})

def signup_view(request):
    if request.method == 'POST':
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            user = form.save(commit=False)
            user.username = form.cleaned_data['email']
            user.first_name = form.cleaned_data['first_name']
            user.save()
            login(request, user)
            return redirect('home')
        else:
            messages.error(request, "Signup failed.")
    else:
        form = CustomUserCreationForm()
    return render(request, 'accounts/signup.html', {'form': form})

@login_required
def home(request):
    user_groups = request.user.joined_groups.all()
    return render(request, 'accounts/home.html', {'user_groups': user_groups})

@login_required
def settings_view(request):
    if request.method == 'POST':
        form = UserSettingsForm(request.POST, request.FILES, instance=request.user)
        if form.is_valid():
            form.save()
            messages.success(request, 'Profile updated.')
            return redirect('settings')
    else:
        form = UserSettingsForm(instance=request.user)
    return render(request, 'accounts/settings.html', {'form': form})

@login_required
def delete_account(request):
    if request.method == 'POST':
        request.user.delete()
        logout(request)
        return redirect('landing')
    return render(request, 'accounts/delete_account.html')

def learn_more(request):
    return render(request, 'accounts/learn_more.html')

@login_required
def groups_view(request):
    # Show groups the user is part of
    groups = Group.objects.filter(members=request.user)
    return render(request, 'panels/groups.html', {'groups': groups})

@login_required
def group_panel(request):
    # All groups (optional public listing)
    groups = Group.objects.all()
    return render(request, 'panels/groups.html', {'groups': groups})

@login_required
def load_create_group_form(request):
    # Renders the create group modal form
    return render(request, 'panels/create_group.html')

@login_required
def get_group_sections(request, group_id):
    group = get_object_or_404(Group, id=group_id)
    sections = group.sections.all()

    buttons_html = render_to_string('panels/group_sections/section_button.html', {
        'group': group,
        'sections': sections
    })

    return JsonResponse({'buttons_html': buttons_html})

@login_required
def load_subsection(request, group_id, section_name):
    group = get_object_or_404(Group, id=group_id)

    valid_sections = ['chat', 'faq', 'bot', 'room', 'help', 'goals', 'tasks', 'timer']
    if section_name not in valid_sections:
        return HttpResponse("Invalid section", status=404)

    template_name = f'panels/group_sections/{section_name}.html'
    return render(request, template_name, {'group': group})

from django.contrib.auth.decorators import login_required
from django.http import HttpResponse
from django.shortcuts import render

@login_required
def load_panel(request, panel_name):
    template_map = {
        'groups': 'panels/groups.html',
        'tasks': 'panels/tasks.html',
        'timer': 'panels/timer.html',
        'goals': 'panels/goals.html',
    }

    template = template_map.get(panel_name)
    if not template:
        return HttpResponse("Invalid panel", status=404)

    context = {}
    if panel_name == 'groups':
        # Fetch only groups where this user is a member
        context['groups'] = Group.objects.filter(members=request.user).order_by('-id')

    return render(request, template, context)


@login_required
def chat_room(request, group_name):
    return render(request, 'chat/chat_room.html', {'group_name': group_name})

from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.http import JsonResponse
import json
from django.template.loader import render_to_string

@login_required
@require_POST
def create_group_ajax(request):
    try:
        data = json.loads(request.body)
        name = data.get('name')
        features = data.get('features', [])  # features submitted by user

        if not name:
            return JsonResponse({'success': False, 'error': 'Group name is required'})

        if Group.objects.filter(name=name).exists():
            return JsonResponse({'success': False, 'error': 'Group already exists'})

        # Create the group and add the creator
        group = Group.objects.create(name=name, owner=request.user)
        group.members.add(request.user)

        # Add default subsections automatically
        default_sections = ['chat', 'faq', 'bot']  # you can add more
        for feature in default_sections:
            SubSection.objects.create(group=group, name=feature)

        # Add any additional features user selected
        for feature in features:
            SubSection.objects.create(group=group, name=feature)

        # Render the HTML for this group (for sidebar)
        group_html = render_to_string('partials/group_item.html', {'group': group})

        return JsonResponse({
            'success': True,
            'group_html': group_html,
            'group_id': group.id
        })
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})
