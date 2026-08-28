from datetime import datetime, timedelta, timezone
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.entities import ModelRegistry, AIPrediction, RadiologistRead, Study, SubgroupMetric, ConcordanceResult
from app.services.audit_service import AuditService
from app.core.config import settings

class SubgroupService:
    @staticmethod
    def compute_subgroups_for_model(
        db: Session,
        model_id: str,
        min_sample_size: int = settings.MIN_SAMPLE_SIZE_GUARDRAIL
    ) -> List[SubgroupMetric]:
        """
        Stratifies model concordance performance across patient demographic and technical subgroups.
        Applies a strict minimum-sample-size guardrail (N < 30 suppresses sensitive performance stats).
        """
        model = db.query(ModelRegistry).filter(ModelRegistry.id == model_id).first()
        if not model:
            return []

        # Find latest overall sensitivity to compute disparity deltas
        latest_concordance = db.query(ConcordanceResult).filter(
            ConcordanceResult.model_id == model_id
        ).order_by(ConcordanceResult.computed_at.desc()).first()
        overall_sensitivity = latest_concordance.sensitivity if latest_concordance else 0.90

        # Query all paired predictions + reads + studies
        records = db.query(AIPrediction, RadiologistRead, Study).join(
            Study, AIPrediction.study_id == Study.id
        ).join(
            RadiologistRead, RadiologistRead.study_id == Study.id
        ).filter(
            AIPrediction.model_id == model.id
        ).all()

        if not records:
            return []

        model_version = model.current_version

        # Group data into categories
        subgroup_buckets: Dict[str, Dict[str, List[Tuple[bool, bool]]]] = {
            "age_band": {},
            "sex": {},
            "site": {},
            "scanner_manufacturer": {}
        }

        for pred, rad, study in records:
            ai_pos = (pred.classification.lower() == "positive" or pred.probability >= pred.threshold_applied)
            rad_pos = (rad.ground_truth_classification.lower() == "positive")
            pair = (ai_pos, rad_pos)

            attrs = study.subgroup_attrs or {}
            
            # Age band
            age_band = attrs.get("age_band", "41-65")
            subgroup_buckets["age_band"].setdefault(age_band, []).append(pair)

            # Sex
            sex = attrs.get("sex", "Unknown")
            subgroup_buckets["sex"].setdefault(sex, []).append(pair)

            # Site
            site = study.site_id
            subgroup_buckets["site"].setdefault(site, []).append(pair)

            # Scanner Manufacturer
            mfg = study.scanner_manufacturer
            subgroup_buckets["scanner_manufacturer"].setdefault(mfg, []).append(pair)

        # Clear existing subgroup metrics for this model to keep fresh
        db.query(SubgroupMetric).filter(SubgroupMetric.model_id == model.id).delete()
        db.commit()

        generated_metrics = []
        now = datetime.now(timezone.utc)

        for category, cohorts in subgroup_buckets.items():
            for cohort_val, pair_list in cohorts.items():
                sample_size = len(pair_list)
                
                # Check Guardrail
                is_suppressed = (sample_size < min_sample_size)
                
                if is_suppressed:
                    # Suppress stats to prevent statistically misleading conclusions
                    sub_metric = SubgroupMetric(
                        model_id=model.id,
                        model_version=model_version,
                        subgroup_category=category,
                        subgroup_value=cohort_val,
                        sample_size=sample_size,
                        min_sample_size_threshold=min_sample_size,
                        is_suppressed=True,
                        sensitivity=None,
                        specificity=None,
                        ppv=None,
                        npv=None,
                        cohen_kappa=None,
                        disparity_delta_vs_overall=None,
                        computed_at=now
                    )
                else:
                    tp = sum(1 for ai, rad in pair_list if ai and rad)
                    fp = sum(1 for ai, rad in pair_list if ai and not rad)
                    tn = sum(1 for ai, rad in pair_list if not ai and not rad)
                    fn = sum(1 for ai, rad in pair_list if not ai and rad)

                    sens = tp / (tp + fn) if (tp + fn) > 0 else 0.0
                    spec = tn / (tn + fp) if (tn + fp) > 0 else 0.0
                    ppv = tp / (tp + fp) if (tp + fp) > 0 else 0.0
                    npv = tn / (tn + fn) if (tn + fn) > 0 else 0.0
                    acc = (tp + tn) / sample_size

                    po = acc
                    pe = (((tp + fp) * (tp + fn)) + ((fn + tn) * (fp + tn))) / (sample_size ** 2) if sample_size > 0 else 0
                    kappa = (po - pe) / (1 - pe) if (1 - pe) != 0 else 0.0
                    disparity = sens - overall_sensitivity

                    sub_metric = SubgroupMetric(
                        model_id=model.id,
                        model_version=model_version,
                        subgroup_category=category,
                        subgroup_value=cohort_val,
                        sample_size=sample_size,
                        min_sample_size_threshold=min_sample_size,
                        is_suppressed=False,
                        sensitivity=float(sens),
                        specificity=float(spec),
                        ppv=float(ppv),
                        npv=float(npv),
                        cohen_kappa=float(kappa),
                        disparity_delta_vs_overall=float(disparity),
                        computed_at=now
                    )

                db.add(sub_metric)
                generated_metrics.append(sub_metric)

        db.commit()

        AuditService.log_event(
            db=db,
            tenant_id=model.tenant_id,
            event_type="subgroup_metrics_computed",
            entity_type="subgroup",
            entity_id=model.id,
            action_summary=f"Subgroup breakdown computed for {model.name} across {len(generated_metrics)} cohorts with guardrails (N<{min_sample_size})",
            payload={"cohort_count": len(generated_metrics), "model_id": model.id}
        )

        return generated_metrics

    @staticmethod
    def get_subgroups_for_model(
        db: Session,
        model_id: str,
        category: Optional[str] = None
    ) -> List[SubgroupMetric]:
        query = db.query(SubgroupMetric).filter(SubgroupMetric.model_id == model_id)
        if category:
            query = query.filter(SubgroupMetric.subgroup_category == category)
        return query.order_by(SubgroupMetric.subgroup_category, SubgroupMetric.subgroup_value).all()
