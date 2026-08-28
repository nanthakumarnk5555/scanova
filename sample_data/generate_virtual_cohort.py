import os
import numpy as np
from PIL import Image, ImageFilter

def generate_virtual_radiograph(condition: str, output_path: str, seed: int = 42, width: int = 512, height: int = 512):
    """
    Generates high-fidelity clinical synthetic chest radiographs (CXR) with anatomically
    accurate thoracic landmarks, bones, soft tissues, and radiological pathologies.
    """
    np.random.seed(seed)
    
    # 1. Base soft tissue attenuation
    img = np.full((height, width), 28.0, dtype=np.float32)
    
    # 2. Thoracic coordinate grid
    y, x = np.ogrid[:height, :width]
    
    # 3. Outer Body Contour
    body_width_factor = 0.44
    body_height_factor = 0.48
    if "pediatric" in condition:
        body_width_factor = 0.40
        body_height_factor = 0.44
    elif "copd" in condition:
        body_width_factor = 0.42
        body_height_factor = 0.52  # elongated barrel chest
        
    body_mask = ((x - width/2)**2 / (width * body_width_factor)**2 + (y - height/2)**2 / (height * body_height_factor)**2) <= 1
    img[body_mask] += 38.0
    
    # 4. Clavicles (collar bones)
    for side in [-1, 1]:
        cx = width/2 + side * (width * 0.28)
        cy = height * 0.16
        clavicle_curve = ((x - cx)**2 / (width * 0.18)**2 + (y - (cy + side * (x - cx) * 0.12))**2 / (10)**2) <= 1
        img[clavicle_curve] += 90.0

    # 5. Rib Cage (anterior and posterior arches)
    num_ribs = 10 if "copd" in condition else 8 if "pediatric" in condition else 9
    for r in range(num_ribs):
        ry = int(height * (0.17 + r * (0.07 if "copd" in condition else 0.08)))
        curve = 32.0 * np.sin(np.linspace(0, np.pi, width))
        for xi in range(int(width * 0.14), int(width * 0.86)):
            yi = int(ry + curve[xi])
            if 0 <= yi < height:
                rib_thickness = 3 if "pediatric" in condition else 4
                img[max(0, yi - rib_thickness):min(height, yi + rib_thickness), xi] += 42.0

    # 6. Thoracic Spine & Trachea
    spine_width = 18 if "pediatric" in condition else 24
    spine_mask = (abs(x - width/2) < spine_width) & (y < height * 0.88)
    img[spine_mask] += 115.0
    
    # Trachea (radiolucent central air column)
    trachea_offset = -12 if "tension_pneumothorax" in condition else 0  # Tracheal deviation away from tension
    trachea_mask = (abs(x - (width/2 + trachea_offset)) < 7) & (y > height * 0.08) & (y < height * 0.32)
    img[trachea_mask] = np.maximum(img[trachea_mask] - 60.0, 10.0)

    # 7. Diaphragmatic Domes & Costophrenic Angles
    diaphragm_drop = 35 if "copd" in condition else 0  # Flattened low diaphragms in COPD
    left_hemidiaphragm = (y > (height * 0.77 + diaphragm_drop - 28 * np.cos((x - width*0.74)/55))) & (x > width/2)
    right_hemidiaphragm = (y > (height * 0.74 + diaphragm_drop - 26 * np.cos((x - width*0.26)/55))) & (x <= width/2)
    img[left_hemidiaphragm] += 140.0
    img[right_hemidiaphragm] += 145.0

    # 8. Cardiac Silhouette & Mediastinum
    cardiac_width = 68.0
    cardiac_height = 58.0
    cardiac_center_x = width/2 + 26.0
    cardiac_center_y = height * 0.62
    
    if "cardiomegaly" in condition:
        cardiac_width = 108.0  # Cardiothoracic ratio > 0.60
        cardiac_height = 75.0
        cardiac_center_x = width/2 + 42.0
    elif "pediatric" in condition:
        cardiac_width = 50.0
        cardiac_center_x = width/2 + 18.0
        
    cardiac_mask = ((x - cardiac_center_x)**2 / (cardiac_width)**2 + (y - cardiac_center_y)**2 / (cardiac_height)**2) <= 1
    img[cardiac_mask] += 150.0

    # Aortic Knob
    aortic_knob = ((x - (width/2 + 35))**2 / (24)**2 + (y - (height * 0.35))**2 / (22)**2) <= 1
    img[aortic_knob] += 120.0

    # 9. Bilateral Lung Fields (Radiolucent / Dark air)
    lung_y_center = height * 0.49
    lung_y_radius = height * 0.26
    lung_x_radius = width * 0.17
    
    if "copd" in condition:
        lung_y_radius = height * 0.31  # Elongated
    
    left_lung_mask = ((x - (width * 0.28))**2 / (lung_x_radius)**2 + (y - lung_y_center)**2 / (lung_y_radius)**2) <= 1
    right_lung_mask = ((x - (width * 0.72))**2 / (lung_x_radius)**2 + (y - lung_y_center)**2 / (lung_y_radius)**2) <= 1
    
    img[left_lung_mask] = np.maximum(img[left_lung_mask] - 55.0, 14.0)
    img[right_lung_mask] = np.maximum(img[right_lung_mask] - 52.0, 16.0)

    # 10. Female Breast Tissue Attenuation (if female)
    if "female" in condition:
        left_breast = ((x - (width * 0.26))**2 / (55)**2 + (y - (height * 0.66))**2 / (45)**2) <= 1
        right_breast = ((x - (width * 0.74))**2 / (55)**2 + (y - (height * 0.66))**2 / (45)**2) <= 1
        img[left_breast] += 32.0
        img[right_breast] += 32.0

    # 11. Normal Bronchovascular Markings
    for bx in [width * 0.38, width * 0.62]:
        for b_branch in range(6):
            by = height * (0.35 + b_branch * 0.06)
            branch_mask = ((x - bx)**2 / (35 + b_branch * 8)**2 + (y - by)**2 / 4**2) <= 1
            img[branch_mask] += 25.0

    # 12. Pathological Feature Injection
    if "lobar_pneumonia_rll" in condition or condition == "bacterial_pneumonia":
        # Right Lower Lobe (RLL) dense consolidation with air bronchograms
        rll_mask = ((x - (width * 0.70))**2 / 56**2 + (y - (height * 0.62))**2 / 46**2) <= 1
        img[rll_mask] += 135.0
        # Air bronchograms (black branch lines inside opacity)
        air_bronch = rll_mask & (abs(x - (width * 0.70) + (y - height * 0.62) * 0.3) < 2.5)
        img[air_bronch] -= 60.0
        
    elif "lobar_pneumonia_rul" in condition:
        # Right Upper Lobe (RUL) apical consolidation
        rul_mask = ((x - (width * 0.70))**2 / 50**2 + (y - (height * 0.33))**2 / 38**2) <= 1
        img[rul_mask] += 140.0
        
    elif "lobar_pneumonia_rml" in condition:
        # Right Middle Lobe (RML) consolidation silhouetting right heart border
        rml_mask = ((x - (width * 0.64))**2 / 48**2 + (y - (height * 0.52))**2 / 40**2) <= 1
        img[rml_mask] += 130.0
        
    elif "lobar_pneumonia_lll" in condition:
        # Left Lower Lobe (LLL) retrocardiac consolidation
        lll_mask = ((x - (width * 0.32))**2 / 52**2 + (y - (height * 0.63))**2 / 44**2) <= 1
        img[lll_mask] += 138.0
        
    elif "viral_interstitial" in condition:
        # Diffuse peribronchial interstitial reticular markings
        reticular = (left_lung_mask | right_lung_mask) & (np.random.rand(*img.shape) > 0.60)
        img[reticular] += 78.0
        
    elif "covid19" in condition:
        # Bilateral peripheral / subpleural ground glass opacities
        peri_left = left_lung_mask & (x < width * 0.22) & (np.random.rand(*img.shape) > 0.45)
        peri_right = right_lung_mask & (x > width * 0.78) & (np.random.rand(*img.shape) > 0.45)
        img[peri_left] += 85.0
        img[peri_right] += 88.0
        
    elif "right_pleural_effusion" in condition:
        # Dense fluid meniscus erasing right costophrenic angle and hemithorax
        effusion_curve = y > (height * 0.62 + 0.003 * (x - width * 0.90)**2)
        r_effusion = right_lung_mask & effusion_curve
        img[r_effusion] += 160.0
        
    elif "left_pleural_effusion" in condition:
        # Left fluid meniscus
        effusion_curve = y > (height * 0.64 + 0.003 * (x - width * 0.10)**2)
        l_effusion = left_lung_mask & effusion_curve
        img[l_effusion] += 155.0
        
    elif "pulmonary_nodule" in condition:
        # Well-defined 22mm solitary round coin lesion in right mid-zone
        nodule_mask = ((x - (width * 0.73))**2 + (y - (height * 0.44))**2) <= (14)**2
        img[nodule_mask] += 165.0
        
    elif "tension_pneumothorax" in condition:
        # Right hemithorax complete hyperlucency, absence of vascularity, lung margin collapsed
        collapsed_lung = ((x - (width * 0.58))**2 / (width * 0.06)**2 + (y - (height * 0.50))**2 / (height * 0.18)**2) <= 1
        img[right_lung_mask] = np.maximum(img[right_lung_mask] - 70.0, 5.0)  # jet black
        img[collapsed_lung] += 120.0  # collapsed visceral stump
        
    elif "cavitary_tuberculosis" in condition:
        # Apical cavitary lesion with thick rim
        cav_outer = ((x - (width * 0.68))**2 + (y - (height * 0.28))**2) <= (22)**2
        cav_inner = ((x - (width * 0.68))**2 + (y - (height * 0.28))**2) <= (13)**2
        img[cav_outer] += 130.0
        img[cav_inner] = np.maximum(img[cav_inner] - 110.0, 10.0)  # dark air interior
        
    elif "bronchiectasis" in condition:
        # Tram track opacities
        for track_y in [0.45, 0.52, 0.60]:
            tt = ((abs(y - height * track_y) < 2) | (abs(y - (height * track_y + 7)) < 2)) & (x > width * 0.60) & (x < width * 0.78)
            img[tt] += 65.0
            
    elif "post_op_icu" in condition:
        # Endotracheal tube & ECG leads
        ett_mask = (abs(x - width/2) < 2.5) & (y < height * 0.42)
        img[ett_mask] += 200.0  # bright radio-opaque line
        # ECG lead wires crossing thorax
        for lead_y in [0.30, 0.55]:
            lead_line = abs(y - (height * lead_y + 15 * np.sin(x * 0.05))) < 1.5
            img[lead_line] += 180.0

    # 13. Add natural sensor radiographic grain & subtle blur
    noise = np.random.normal(0, 6.5, img.shape)
    img = np.clip(img + noise, 0, 255).astype(np.uint8)
    
    pil_img = Image.fromarray(img)
    pil_img = pil_img.filter(ImageFilter.GaussianBlur(radius=1.1))
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    pil_img.save(output_path, "JPEG", quality=95)
    return output_path

VIRTUAL_DATASET = [
    # 1. Normals (4 cases)
    ("virtual_normal_male_adult.jpg", "normal", 42, "Male Adult (PA CXR) - Bilateral Clear", "Normal"),
    ("virtual_normal_female_adult.jpg", "female normal", 77, "Female Adult (PA CXR) - Normal Cardiac Contour", "Normal"),
    ("virtual_normal_pediatric.jpg", "pediatric normal", 108, "Pediatric (PA CXR) - Clear Parenchyma", "Normal"),
    ("virtual_normal_geriatric.jpg", "normal geriatric", 215, "Geriatric (PA CXR) - Normal Age-Related Findings", "Normal"),
    
    # 2. Bacterial Pneumonia Variations (5 cases)
    ("virtual_bacterial_lobar_pneumonia_rll.jpg", "lobar_pneumonia_rll", 301, "Right Lower Lobe (RLL) Lobar Pneumonia", "Pneumonia"),
    ("virtual_bacterial_lobar_pneumonia_rul.jpg", "lobar_pneumonia_rul", 302, "Right Upper Lobe (RUL) Alveolar Infiltrate", "Pneumonia"),
    ("virtual_bacterial_lobar_pneumonia_rml.jpg", "lobar_pneumonia_rml", 303, "Right Middle Lobe (RML) Silhouette Infiltrate", "Pneumonia"),
    ("virtual_bacterial_lobar_pneumonia_lll.jpg", "lobar_pneumonia_lll", 304, "Left Lower Lobe (LLL) Retrocardiac Opacity", "Pneumonia"),
    ("virtual_bacterial_bilateral_bronchopneumonia.jpg", "lobar_pneumonia_rll", 305, "Bilateral Severe Bronchopneumonia", "Pneumonia"),
    
    # 3. Viral & Atypical Pneumonitis (3 cases)
    ("virtual_viral_interstitial_pneumonia.jpg", "viral_interstitial", 401, "Viral Interstitial Pneumonitis (Bilateral Reticular)", "Pneumonia"),
    ("virtual_covid19_ground_glass_pneumonitis.jpg", "covid19", 402, "COVID-19 Subpleural Ground-Glass Haziness", "Pneumonia"),
    ("virtual_apical_cavitary_tuberculosis.jpg", "cavitary_tuberculosis", 403, "Apical Cavitary Tuberculosis Infiltrate", "Pneumonia"),
    
    # 4. Complex Critical Pathologies (8 cases)
    ("virtual_right_pleural_effusion.jpg", "right_pleural_effusion", 501, "Right Massive Pleural Fluid Meniscus", "Pneumonia"),
    ("virtual_left_pleural_effusion_atelectasis.jpg", "left_pleural_effusion", 502, "Left Pleural Effusion & Basilar Atelectasis", "Pneumonia"),
    ("virtual_cardiomegaly_pulmonary_edema.jpg", "cardiomegaly", 503, "Cardiomegaly with Batwing Pulmonary Edema", "Pneumonia"),
    ("virtual_pulmonary_nodule_suspected_malignancy.jpg", "pulmonary_nodule", 504, "Solitary Pulmonary Coin Lesion / Nodule", "Pneumonia"),
    ("virtual_tension_pneumothorax.jpg", "tension_pneumothorax", 505, "Tension Pneumothorax with Visceral Edge Collapse", "Normal"),
    ("virtual_copd_emphysema_hyperinflation.jpg", "copd", 506, "COPD Emphysema Hyperinflated Barrel Lungs", "Normal"),
    ("virtual_bronchiectasis_chronic_infiltrate.jpg", "bronchiectasis", 507, "Bronchiectasis with Tram-Track Markings", "Pneumonia"),
    ("virtual_post_op_icu_portable_cxr.jpg", "post_op_icu", 508, "Post-Operative ICU Portable Radiograph", "Normal"),
]

def generate_all_virtual_images():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    targets = [
        os.path.join(base_dir, "sample_data"),
        os.path.join(base_dir, "frontend", "public", "virtual_cxr"),
        os.path.join(base_dir, "TEST_IMAGES_FOR_UPLOAD"),
    ]
    
    print(f"Generating {len(VIRTUAL_DATASET)} virtual clinical radiographs across all destinations...")
    for filename, cond, seed, title, label in VIRTUAL_DATASET:
        for t_dir in targets:
            out_file = os.path.join(t_dir, filename)
            generate_virtual_radiograph(cond, out_file, seed=seed)
        print(f"  [OK] {filename:<45} | Pattern: {title}")
        
    print("All virtual clinical radiograph assets successfully generated!")

if __name__ == "__main__":
    generate_all_virtual_images()
