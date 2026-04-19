from django.contrib import admin
from .models import Group, SubSection, Room, Message, GroupMessage

admin.site.register(Group)
admin.site.register(SubSection)
admin.site.register(Room)
admin.site.register(Message)
admin.site.register(GroupMessage)

