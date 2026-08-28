import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

def generate_chest_xray(condition="normal", output_path="sample.jpg", width=512, height=512):
    """
    Generates high-fidelity synthetic chest radiograph for simulation and testing.
    - Rib cage and thoracic spine
    - Bilateral lung fields (radiolucent / dark)
    - Mediastinum, cardiac silhouette, diaphragm arches
    - Pathological opacities/consolidation for pneumonia
    """
    np.random.seed(42 if condition == "normal" else 101)
    
    # Background soft tissue
    img = np.full((height, width), 25, dtype=np.float32)
    
    # Thoracic cage ellipse
    y, x = np.ogrid[:height, :width]
    
    # Body contour
    body_mask = ((x - width/2)**2 / (width * 0.44)**2 + (y - height/2)**2 / (height * 0.48)**2) <= 1
    img[body_mask] += 35
    
    # Rib contours
    for rib_idx in range(9):
        ry = int(height * (0.15 + rib_idx * 0.08))
        curve = 35 * np.sin(np.linspace(0, np.pi, width))
        for xi in range(int(width * 0.15), int(width * 0.85)):
            yi = int(ry + curve[xi])
            if 0 <= yi < height:
                img[max(0, yi-4):min(height, yi+4), xi] += 40
                
    # Spine & Mediastinum
    spine_mask = (abs(x - width/2) < 22) & (y < height * 0.88)
    img[spine_mask] += 120
    
    # Cardiac silhouette (oriented left)
    cardiac_mask = ((x - (width/2 + 25))**2 / (65)**2 + (y - (height * 0.62))**2 / (55)**2) <= 1
    img[cardiac_mask] += 140
    
    # Diaphragm domes
    left_diaphragm = (y > (height * 0.78 - 30 * np.cos((x - width*0.75)/50))) & (x > width/2)
    right_diaphragm = (y > (height * 0.75 - 28 * np.cos((x - width*0.25)/50))) & (x <= width/2)
    img[left_diaphragm] += 130
    img[right_diaphragm] += 135

    # Bilateral Lung Fields (darker radiolucent regions)
    left_lung = ((x - (width * 0.28))**2 / (width * 0.16)**2 + (y - (height * 0.48))**2 / (height * 0.25)**2) <= 1
    right_lung = ((x - (width * 0.72))**2 / (width * 0.16)**2 + (y - (height * 0.48))**2 / (height * 0.25)**2) <= 1
    
    img[left_lung] = np.maximum(img[left_lung] - 50, 15)
    img[right_lung] = np.maximum(img[right_lung] - 45, 18)
    
    # Infiltrates / Consolidation if Pneumonia
    if "bacterial" in condition.lower() or condition.lower() == "pneumonia":
        # Dense lobar consolidation in right lower lobe
        consolidation = ((x - (width * 0.70))**2 / 55**2 + (y - (height * 0.58))**2 / 45**2) <= 1
        img[consolidation] += 135
        # Peribronchial cuffing
        patch_noise = np.random.normal(30, 15, img.shape)
        img[consolidation] += patch_noise[consolidation]
        
    elif "viral" in condition.lower():
        # Diffuse interstitial reticular markings
        diffuse = (left_lung | right_lung) & (np.random.rand(*img.shape) > 0.65)
        img[diffuse] += 80

    # Add realistic radiographic grain / sensor noise
    noise = np.random.normal(0, 7, img.shape)
    img = np.clip(img + noise, 0, 255).astype(np.uint8)
    
    pil_img = Image.fromarray(img)
    # Smooth slight transitions
    pil_img = pil_img.filter(ImageFilter.GaussianBlur(radius=1.2))
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    pil_img.save(output_path, "JPEG", quality=95)
    return output_path

if __name__ == "__main__":
    out_dir = os.path.dirname(os.path.abspath(__file__))
    generate_chest_xray("normal", os.path.join(out_dir, "sample_normal_cxr_1.jpg"))
    generate_chest_xray("normal", os.path.join(out_dir, "sample_normal_cxr_2.jpg"))
    generate_chest_xray("bacterial_pneumonia", os.path.join(out_dir, "sample_bacterial_pneumonia.jpg"))
    generate_chest_xray("viral_pneumonia", os.path.join(out_dir, "sample_viral_pneumonia.jpg"))
    print("Sample X-ray images successfully generated in", out_dir)
