from api.models import CustomUser
from rest_framework_simplejwt.tokens import RefreshToken

u = CustomUser.objects.filter(email='tempfarmer@example.com').first()
if not u:
    u = CustomUser.objects.create_user(email='tempfarmer@example.com', password='TempPass123!', full_name='Temp Farmer')
    print('created')
else:
    print('exists')

r = RefreshToken.for_user(u)
print('ACCESS:'+str(r.access_token))
print('REFRESH:'+str(r))
