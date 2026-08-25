import requests
import json

LOGIN_URL = 'http://127.0.0.1:8000/api/auth/login/'
REPORT_URL = 'http://127.0.0.1:8000/api/farm-report/?type=daily'

creds = {'email':'tempfarmer@example.com','password':'TempPass123!'}

try:
    r = requests.post(LOGIN_URL, json=creds, timeout=10)
    print('LOGIN', r.status_code)
    print(r.text)
    if r.status_code == 200:
        tokens = r.json()
        access = tokens.get('access')
        headers = {'Authorization': f'Bearer {access}'}
        rr = requests.get(REPORT_URL, headers=headers, timeout=10)
        print('\nREPORT', rr.status_code)
        print(rr.text)
except Exception as e:
    print('ERROR', e)
