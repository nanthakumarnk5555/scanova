import urllib.request, uuid, json

def test_image(img_path, filename, mime):
    boundary = '----Boundary' + uuid.uuid4().hex
    with open(img_path, 'rb') as f:
        img_data = f.read()

    parts = [
        f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="{filename}"\r\nContent-Type: {mime}\r\n\r\n'.encode('utf-8'),
        img_data,
        f'\r\n--{boundary}\r\nContent-Disposition: form-data; name="patient_age"\r\n\r\n45\r\n'.encode('utf-8'),
        f'--{boundary}--\r\n'.encode('utf-8')
    ]
    body = b''.join(parts)

    req = urllib.request.Request(
        'http://127.0.0.1:8000/api/v1/xrays/upload-and-predict',
        data=body,
        headers={'Content-Type': f'multipart/form-data; boundary={boundary}'}
    )
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode())
        pred = res['prediction']
        print(f"[{filename}] -> Prediction: {pred['prediction']} ({pred['confidence']*100:.1f}%) | Probabilities: {pred['probabilities']}")

print("=== VERIFYING LIVE PREDICTIONS ON BOTH CLASSES ===")
test_image('backend/uploads/xrays/xray_1b6ddc94-c4f9-4747-8ea5-e4e5cf17e51e.webp', 'user_google_normal.webp', 'image/webp')
test_image('PNEUMONIA_CASE_CXR.jpg', 'bacterial_pneumonia_case.jpg', 'image/jpeg')
