from django.shortcuts import render

from django.shortcuts import render, get_object_or_404
from .models import Group, SubSection, Room, Message
from django.http import JsonResponse

# Dashboard view to show all groups
def groups_dashboard(request):
    groups = Group.objects.filter(members=request.user)
    return render(request, 'mygroups/dashboard.html', {'groups': groups})

# API endpoint to fetch a single group's details
def group_detail_api(request, group_id):
    group = get_object_or_404(Group, id=group_id)

    # Get rooms
    rooms = group.rooms.all()
    room_list = [{'id': r.id, 'name': r.name, 'type': r.type} for r in rooms]

    # Get sections
    sections = group.sections.all()
    section_list = [{'id': s.id, 'name': s.get_name_display()} for s in sections]

    data = {
        'group_name': group.name,
        'rooms': room_list,
        'sections': section_list,
    }

    return JsonResponse(data)

from django.shortcuts import render, get_object_or_404
from .models import Group  # use your actual group model name

def group_detail(request, group_id):
    group = get_object_or_404(Group, id=group_id)
    context = {'group': group}
    return render(request, 'mygroups/group_detail.html', context)
