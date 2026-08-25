import os
import django
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agrismart_backend.settings')
import django
django.setup()

from api.models import CustomUser
from rest_framework_simplejwt.tokens import RefreshToken

email = 'tempfarmer@example.com'
password = 'TempPass123!'

u = CustomUser.objects.filter(email=email).first()
if not u:
    u = CustomUser.objects.create_user(email=email, password=password, full_name='Temp Farmer')
    print('created')
else:
    print('exists')

r = RefreshToken.for_user(u)
print('ACCESS:'+str(r.access_token))
print('REFRESH:'+str(r))
