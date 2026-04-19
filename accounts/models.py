from django.db import models
from django.contrib.auth.models import AbstractUser

# ----------------------
# ✅ Custom User Model
# ----------------------
class CustomUser(AbstractUser):
    profile_picture = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
    email = models.EmailField(unique=True)

    class Meta:
        verbose_name = 'user'
        verbose_name_plural = 'users'


    def __str__(self):
        return self.username
    
    