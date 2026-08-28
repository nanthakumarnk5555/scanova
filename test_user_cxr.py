import urllib.request
import uuid
import json

boundary = '----Boundary' + uuid.uuid4().hex
img_path = r'C:\Users\ADMIN\.gemini\antigravity-ide\brain\1f84b0d9-1f42-402b-8464-e14436c8381a\.user_uploaded\media_1787650523125.jpg'

with open(img_path, 'rb') as f:
    file_bytes = f.read()

parts = []
parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="user_cancer_cxr.jpg"\r\nContent-Type: image/jpeg\r\n\r\n'.encode('utf-8'))
parts.append(file_bytes)
parts.append(f'\r\n--{boundary}\r\nContent-Disposition: form-data; name="patient_age"\r\n\r\n54\r\n'.encode('utf-8'))
parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="patient_sex"\r\n\r\nF\r\n'.encode('utf-8'))
parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="site_id"\r\n\r\nONCOLOGY_SUITE_1\r\n'.encode('utf-8'))
parts.append(f'--{boundary}--\r\n'.encode('utf-8'))

body = b''.join(parts)

req = urllib.request.Request(
    'http://127.0.0.1:8000/api/v1/xrays/upload-and-predict',
    data=body,
    headers={'Content-Type': f'multipart/form-data; boundary={boundary}'}
)

with urllib.request.urlopen(req) as resp:
    res_data = json.loads(resp.read().decode())
    print('HTTP Status:', resp.status)
    print('AI Classification:', res_data['prediction']['prediction'])
    print('Confidence Score:', f"{round(res_data['prediction']['confidence'] * 100, 1)}%")
    print('Model Version:', res_data['prediction']['model_version'])
    print('Probabilities:', res_data['prediction']['probabilities'])
    print('Heatmap URL:', res_data['prediction']['heatmap_url'])
