from datetime import datetime, timedelta, timezone
from typing import List, Optional, Dict, Any, Tuple
import numpy as np
from sqlalchemy.orm import Session
from app.models.entities import ModelRegistry, AIPrediction, RadiologistRead, Study, ConcordanceResult
from app.services.audit_service import AuditService

class MetricsService:
    @staticmethod
    def compute_concordance_for_model(
        db: Session,
        model_id: str,
        site_id: str = "all",
        window_days: int = 30,
        window_type: str = "rolling_30d"
    ) -> Optional[ConcordanceResult]:
        """
        Computes clinical concordance metrics (Sensitivity, Specificity, PPV, NPV, Cohen's Kappa, Confusion Matrix)
        between external AI predictions and radiologist ground-truth reads.
        """
        model = db.query(ModelRegistry).filter(ModelRegistry.id == model_id).first()
        if not model:
            return None

        now = datetime.now(timezone.utc)
        start_time = now - timedelta(days=window_days)

        # Query matching pairs of AIPrediction + RadiologistRead on Study
        query = db.query(AIPrediction, RadiologistRead, Study).join(
            Study, AIPrediction.study_id == Study.id
        ).join(
            RadiologistRead, RadiologistRead.study_id == Study.id
        ).filter(
            AIPrediction.model_id == model.id,
            Study.study_datetime >= start_time
        )

        if site_id != "all":
            query = query.filter(Study.site_id == site_id)

        paired_records = query.all()
        if not paired_records:
            return None

        tp, fp, tn, fn = 0, 0, 0, 0
        y_true = []
        y_pred_probs = []
        model_version = model.current_version

        for pred, rad, study in paired_records:
            model_version = pred.model_version
            ai_pos = (pred.classification.lower() == "positive" or pred.probability >= pred.threshold_applied)
            rad_pos = (rad.ground_truth_classification.lower() == "positive")

            y_true.append(1 if rad_pos else 0)
            y_pred_probs.append(pred.probability)

            if ai_pos and rad_pos:
                tp += 1
            elif ai_pos and not rad_pos:
                fp += 1
            elif not ai_pos and not rad_pos:
                tn += 1
            elif not ai_pos and rad_pos:
                fn += 1

        sample_size = tp + fp + tn + fn
        if sample_size == 0:
            return None

        # Metrics calculation
        sensitivity = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        specificity = tn / (tn + fp) if (tn + fp) > 0 else 0.0
        ppv = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        npv = tn / (tn + fn) if (tn + fn) > 0 else 0.0
        accuracy = (tp + tn) / sample_size

        # Cohen's Kappa
        po = accuracy
        pe = (((tp + fp) * (tp + fn)) + ((fn + tn) * (fp + tn))) / (sample_size ** 2) if sample_size > 0 else 0
        cohen_kappa = (po - pe) / (1 - pe) if (1 - pe) != 0 else 0.0

        # F1 Score
        f1 = (2 * ppv * sensitivity) / (ppv + sensitivity) if (ppv + sensitivity) > 0 else 0.0

        # Approximate ROC AUC
        try:
            from sklearn.metrics import roc_auc_score
            if len(set(y_true)) > 1:
                roc_auc = float(roc_auc_score(y_true, y_pred_probs))
            else:
                roc_auc = 0.50
        except Exception:
            roc_auc = 0.50

        confusion_matrix = [
            [tp, fn],
            [fp, tn]
        ]

        result = ConcordanceResult(
            model_id=model.id,
            model_version=model_version,
            site_id=site_id,
            window_type=window_type,
            window_start=start_time,
            window_end=now,
            sample_size=sample_size,
            true_positives=tp,
            false_positives=fp,
            true_negatives=tn,
            false_negatives=fn,
            sensitivity=float(sensitivity),
            specificity=float(specificity),
            ppv=float(ppv),
            npv=float(npv),
            accuracy=float(accuracy),
            cohen_kappa=float(cohen_kappa),
            f1_score=float(f1),
            roc_auc=float(roc_auc),
            confusion_matrix=confusion_matrix,
            computed_at=now
        )
        db.add(result)
        db.commit()
        db.refresh(result)

        AuditService.log_event(
            db=db,
            tenant_id=model.tenant_id,
            event_type="concordance_computed",
            entity_type="concordance",
            entity_id=result.id,
            action_summary=f"Concordance computed for {model.name} (v{model_version}) - Sensitivity: {sensitivity:.1%}, Kappa: {cohen_kappa:.3f}",
            payload={
                "model_id": model.id,
                "version": model_version,
                "sensitivity": sensitivity,
                "specificity": specificity,
                "sample_size": sample_size
            }
        )

        return result

    @staticmethod
    def get_concordance_timeline(
        db: Session,
        model_id: str,
        site_id: str = "all",
        limit: int = 30
    ) -> List[ConcordanceResult]:
        query = db.query(ConcordanceResult).filter(ConcordanceResult.model_id == model_id)
        if site_id != "all":
            query = query.filter(ConcordanceResult.site_id == site_id)
        return query.order_by(ConcordanceResult.window_end.asc()).limit(limit).all()
