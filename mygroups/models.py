from django.db import models
from django.conf import settings
from django.utils import timezone

# Group model
class Group(models.Model):
    name = models.CharField(max_length=100)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    members = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='joined_groups')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

# SubSection (chat, call, FAQ, bot)
class SubSection(models.Model):
    SECTION_CHOICES = [
        ('chat', 'Chat'),
        ('bot', 'Bot'),
        ('room', 'Custom Room'),
        ('faq', 'FAQs'),
        ('help', 'Help Desk'),
    ]
    group = models.ForeignKey(Group, related_name='sections', on_delete=models.CASCADE)
    name = models.CharField(max_length=50, choices=SECTION_CHOICES)

    def __str__(self):
        return f"{self.group.name} - {self.get_name_display()}"

# Room model
class Room(models.Model):
    ROOM_TYPES = (
        ('chat', 'Chat'),
        ('call', 'Call'),
        ('faq', 'FAQ'),
        ('bot', 'Bot'),
        ('notes', 'Notes'),
    )
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='rooms')
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=10, choices=ROOM_TYPES)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.type})"

# Messages in a room
class Message(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.sender.username} in {self.room.name}: {self.content[:20]}"

# Group-wide messages (optional)
class GroupMessage(models.Model):
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sender.username} in {self.group.name}: {self.content[:20]}"
