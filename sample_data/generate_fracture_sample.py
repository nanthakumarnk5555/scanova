import os
import numpy as np
from PIL import Image, ImageFilter

def generate_rib_fracture_radiograph(output_path: str, seed: int = 555, width: int = 512, height: int = 512):
    """
    Generates an anatomically accurate trauma chest radiograph with an acute,
    visible traumatic cortical fracture of the 6th/7th lateral rib arc,
    including cortical step-off, fracture lucency line, and cortical discontinuity.
    """
    np.random.seed(seed)
    
    # 1. Soft tissue base
    img = np.full((height, width), 28.0, dtype=np.float32)
    y, x = np.ogrid[:height, :width]
    
    # 2. Body mask
    body_mask = ((x - width/2)**2 / (width * 0.44)**2 + (y - height/2)**2 / (height * 0.48)**2) <= 1
    img[body_mask] += 38.0
    
    # 3. Clavicles
    for side in [-1, 1]:
        cx = width/2 + side * (width * 0.28)
        cy = height * 0.16
        clavicle_curve = ((x - cx)**2 / (width * 0.18)**2 + (y - (cy + side * (x - cx) * 0.12))**2 / (10)**2) <= 1
        img[clavicle_curve] += 90.0

    # 4. Lungs (radiolucent airfields)
    for side in [-1, 1]:
        lx = width/2 + side * (width * 0.24)
        ly = height * 0.46
        lung_mask = ((x - lx)**2 / (width * 0.17)**2 + (y - ly)**2 / (height * 0.28)**2) <= 1
        img[lung_mask] = np.maximum(img[lung_mask] - 42.0, 8.0)

    # 5. Rib Cage
    fracture_rx = int(width * 0.76)
    fracture_ry = int(height * 0.58)

    for r in range(9):
        ry = int(height * (0.17 + r * 0.08))
        curve = 32.0 * np.sin(np.linspace(0, np.pi, width))
        for xi in range(int(width * 0.14), int(width * 0.86)):
            yi = int(ry + curve[xi])
            if 0 <= yi < height:
                # Acute fracture on 6th rib right lateral arc (r == 5)
                if r == 5 and abs(xi - fracture_rx) < 14:
                    # Cortical step-off / lucency break
                    if abs(xi - fracture_rx) < 4:
                        # Radiolucent fracture gap (crack)
                        img[max(0, yi - 3):min(height, yi + 3), xi] = np.maximum(img[max(0, yi - 3):min(height, yi + 3), xi] - 25.0, 10.0)
                    else:
                        # Displaced bone cortical fragments (step-off)
                        displacement = 6 if xi > fracture_rx else -3
                        target_y = yi + displacement
                        if 0 <= target_y < height:
                            img[max(0, target_y - 4):min(height, target_y + 4), xi] += 65.0
                else:
                    img[max(0, yi - 4):min(height, yi + 4), xi] += 42.0

    # 6. Spine
    spine_mask = (abs(x - width/2) < 22) & (y < height * 0.88)
    img[spine_mask] += 115.0

    # 7. Trachea
    trachea_mask = (abs(x - width/2) < 7) & (y > height * 0.08) & (y < height * 0.32)
    img[trachea_mask] = np.maximum(img[trachea_mask] - 60.0, 10.0)

    # 8. Diaphragmatic Domes
    diaphragm_mask_right = (x < width/2) & ((y - height * 0.72) > -18 * np.sin((x / (width/2)) * np.pi))
    diaphragm_mask_left = (x >= width/2) & ((y - height * 0.74) > -16 * np.sin(((x - width/2) / (width/2)) * np.pi))
    img[diaphragm_mask_right] += 55.0
    img[diaphragm_mask_left] += 55.0

    # 9. Cardiac Silhouette
    heart_mask = ((x - width * 0.44)**2 / (width * 0.17)**2 + (y - height * 0.60)**2 / (height * 0.17)**2) <= 1
    img[heart_mask] += 78.0

    # 10. Subtle chest wall contusion opacity near fracture
    contusion_mask = ((x - fracture_rx)**2 / 28**2 + (y - fracture_ry)**2 / 20**2) <= 1
    img[contusion_mask] += 25.0

    # 11. Add radiographic sensor grain & slight blur
    noise = np.random.normal(0, 6.0, img.shape)
    img = np.clip(img + noise, 0, 255).astype(np.uint8)
    
    pil_img = Image.fromarray(img)
    pil_img = pil_img.filter(ImageFilter.GaussianBlur(radius=1.0))
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    pil_img.save(output_path, "JPEG", quality=95)
    print(f"Generated traumatic rib fracture CXR at: {output_path}")

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    destinations = [
        os.path.join(base_dir, "sample_data", "virtual_traumatic_rib_fracture.jpg"),
        os.path.join(base_dir, "backend", "sample_data", "virtual_traumatic_rib_fracture.jpg"),
        os.path.join(base_dir, "frontend", "public", "virtual_cxr", "virtual_traumatic_rib_fracture.jpg"),
        os.path.join(base_dir, "TEST_IMAGES_FOR_UPLOAD", "virtual_traumatic_rib_fracture.jpg"),
    ]
    for dest in destinations:
        generate_rib_fracture_radiograph(dest)
