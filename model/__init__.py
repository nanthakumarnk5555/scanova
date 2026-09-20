from .xray_validator import get_xray_validator, MedicalXRayValidator
from .densenet_model import get_inference_service, UnifiedInferenceRouter, PneumoniaInferenceService, BoneCrackInferenceService, DenseNet121XRayClassifier

XRayInferenceService = UnifiedInferenceRouter

__all__ = ["get_xray_validator", "MedicalXRayValidator", "get_inference_service", "UnifiedInferenceRouter", "PneumoniaInferenceService", "BoneCrackInferenceService", "XRayInferenceService", "DenseNet121XRayClassifier"]
