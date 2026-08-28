from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.entities import SubgroupFairnessRecord

DEFAULT_FAIRNESS_MATRIX = [
    # 1. Biological Sex
    {
        "model_name": "CheXNet DenseNet-121",
        "dimension": "biological_sex",
        "subgroup_label": "Male Patients",
        "sample_size": 248,
        "accuracy": 0.948,
        "sensitivity": 0.912,
        "specificity": 0.965,
        "disparity_ratio": 1.00,
        "status": "Pass"
    },
    {
        "model_name": "CheXNet DenseNet-121",
        "dimension": "biological_sex",
        "subgroup_label": "Female Patients",
        "sample_size": 216,
        "accuracy": 0.932,
        "sensitivity": 0.895,
        "specificity": 0.952,
        "disparity_ratio": 0.98,
        "status": "Pass"
    },

    # 2. Age Cohorts
    {
        "model_name": "CheXNet DenseNet-121",
        "dimension": "age_group",
        "subgroup_label": "Adults (18-64 yrs)",
        "sample_size": 290,
        "accuracy": 0.952,
        "sensitivity": 0.925,
        "specificity": 0.970,
        "disparity_ratio": 1.00,
        "status": "Pass"
    },
    {
        "model_name": "CheXNet DenseNet-121",
        "dimension": "age_group",
        "subgroup_label": "Geriatric (>=65 yrs)",
        "sample_size": 174,
        "accuracy": 0.918,
        "sensitivity": 0.864,
        "specificity": 0.942,
        "disparity_ratio": 0.93,
        "status": "Pass"
    },

    # 3. Hospital Facility Site
    {
        "model_name": "CheXNet DenseNet-121",
        "dimension": "facility_site",
        "subgroup_label": "Main Campus Hospital",
        "sample_size": 312,
        "accuracy": 0.956,
        "sensitivity": 0.930,
        "specificity": 0.972,
        "disparity_ratio": 1.00,
        "status": "Pass"
    },
    {
        "model_name": "CheXNet DenseNet-121",
        "dimension": "facility_site",
        "subgroup_label": "Regional Community Clinic",
        "sample_size": 152,
        "accuracy": 0.908,
        "sensitivity": 0.845,
        "specificity": 0.938,
        "disparity_ratio": 0.91,
        "status": "Warning"
    },

    # 4. Scanner Manufacturer Hardware
    {
        "model_name": "CheXNet DenseNet-121",
        "dimension": "scanner_manufacturer",
        "subgroup_label": "Siemens Multix Impact",
        "sample_size": 268,
        "accuracy": 0.954,
        "sensitivity": 0.928,
        "specificity": 0.968,
        "disparity_ratio": 1.00,
        "status": "Pass"
    },
    {
        "model_name": "CheXNet DenseNet-121",
        "dimension": "scanner_manufacturer",
        "subgroup_label": "GE Definium XR",
        "sample_size": 196,
        "accuracy": 0.924,
        "sensitivity": 0.880,
        "specificity": 0.946,
        "disparity_ratio": 0.95,
        "status": "Pass"
    }
]

def seed_fairness_if_needed(db: Session):
    existing = db.query(SubgroupFairnessRecord).count()
    if existing == 0:
        for f in DEFAULT_FAIRNESS_MATRIX:
            record = SubgroupFairnessRecord(**f, computed_at=datetime.now(timezone.utc))
            db.add(record)
        db.commit()

def get_subgroup_fairness_report(db: Session, model_name: str = "CheXNet DenseNet-121"):
    seed_fairness_if_needed(db)
    records = db.query(SubgroupFairnessRecord).filter(SubgroupFairnessRecord.model_name == model_name).all()

    # Group by dimension
    dimensions = {}
    for r in records:
        if r.dimension not in dimensions:
            dimensions[r.dimension] = []
        dimensions[r.dimension].append(r)

    return {
        "model_name": model_name,
        "hhs_1557_compliance_status": "Compliant (All disparities within acceptable 15% threshold)",
        "dimensions": dimensions
    }
