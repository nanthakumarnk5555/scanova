from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.entities import Study, AIPrediction, RadiologistRead, ReviewQueueItem, ModelRegistry
from app.schemas.schemas import StudyIngest, AIPredictionIngest, RadiologistReadIngest, BatchIngestionPayload
from app.services.audit_service import AuditService

class IngestionService:
    @staticmethod
    def ingest_study(db: Session, tenant_id: str, study_in: StudyIngest) -> Study:
        existing = db.query(Study).filter(Study.study_uid == study_in.study_uid).first()
        if existing:
            # Idempotent return
            return existing

        study = Study(
            tenant_id=tenant_id,
            study_uid=study_in.study_uid,
            accession_number=study_in.accession_number,
            patient_id_hash=study_in.patient_id_hash,
            modality=study_in.modality,
            body_part=study_in.body_part,
            study_datetime=study_in.study_datetime,
            site_id=study_in.site_id,
            scanner_manufacturer=study_in.scanner_manufacturer,
            scanner_model=study_in.scanner_model,
            subgroup_attrs=study_in.subgroup_attrs.model_dump()
        )
        db.add(study)
        db.commit()
        db.refresh(study)

        AuditService.log_event(
            db=db,
            tenant_id=tenant_id,
            event_type="study_ingested",
            entity_type="study",
            entity_id=study.id,
            action_summary=f"Ingested de-identified study {study.accession_number} ({study.modality})",
            payload={"study_uid": study.study_uid, "site": study.site_id}
        )
        return study

    @staticmethod
    def ingest_prediction(db: Session, tenant_id: str, pred_in: AIPredictionIngest) -> AIPrediction:
        # Find study
        study = db.query(Study).filter(Study.study_uid == pred_in.study_uid).first()
        if not study:
            raise ValueError(f"Study UID {pred_in.study_uid} not found. Ingest study metadata first.")

        # Ensure model exists
        model = db.query(ModelRegistry).filter(ModelRegistry.id == pred_in.model_id).first()
        if not model:
            # Check by slug
            model = db.query(ModelRegistry).filter(ModelRegistry.slug == pred_in.model_id).first()
            if not model:
                raise ValueError(f"Model ID or Slug '{pred_in.model_id}' not registered in Scanova.")

        prediction = AIPrediction(
            study_id=study.id,
            model_id=model.id,
            model_version=pred_in.model_version,
            prediction_datetime=pred_in.prediction_datetime,
            primary_finding=pred_in.primary_finding,
            probability=pred_in.probability,
            threshold_applied=pred_in.threshold_applied,
            classification=pred_in.classification,
            raw_findings=pred_in.raw_findings or {}
        )
        db.add(prediction)
        db.commit()
        db.refresh(prediction)

        # Check if radiologist read already exists to evaluate discordance
        rad_read = db.query(RadiologistRead).filter(RadiologistRead.study_id == study.id).first()
        if rad_read:
            IngestionService._evaluate_discordance(db, study, prediction, rad_read, model)

        AuditService.log_event(
            db=db,
            tenant_id=tenant_id,
            event_type="ai_prediction_ingested",
            entity_type="ai_prediction",
            entity_id=prediction.id,
            action_summary=f"Ingested external AI prediction for {study.accession_number} ({model.name} v{pred_in.model_version})",
            payload={"probability": prediction.probability, "classification": prediction.classification}
        )
        return prediction

    @staticmethod
    def ingest_radiologist_read(db: Session, tenant_id: str, read_in: RadiologistReadIngest) -> RadiologistRead:
        study = db.query(Study).filter(Study.study_uid == read_in.study_uid).first()
        if not study:
            raise ValueError(f"Study UID {read_in.study_uid} not found. Ingest study metadata first.")

        read = RadiologistRead(
            study_id=study.id,
            radiologist_id=read_in.radiologist_id,
            read_datetime=read_in.read_datetime,
            ground_truth_finding=read_in.ground_truth_finding,
            ground_truth_classification=read_in.ground_truth_classification,
            confidence_level=read_in.confidence_level or "high",
            clinical_notes=read_in.clinical_notes or ""
        )
        db.add(read)
        db.commit()
        db.refresh(read)

        # Check for any predictions on this study to evaluate discordance
        preds = db.query(AIPrediction).filter(AIPrediction.study_id == study.id).all()
        for p in preds:
            model = db.query(ModelRegistry).filter(ModelRegistry.id == p.model_id).first()
            if model:
                IngestionService._evaluate_discordance(db, study, p, read, model)

        AuditService.log_event(
            db=db,
            tenant_id=tenant_id,
            event_type="radiologist_read_ingested",
            entity_type="radiologist_read",
            entity_id=read.id,
            action_summary=f"Ingested radiologist signed read for {study.accession_number} by {read.radiologist_id}",
            payload={"ground_truth": read.ground_truth_classification}
        )
        return read

    @staticmethod
    def _evaluate_discordance(
        db: Session,
        study: Study,
        prediction: AIPrediction,
        read: RadiologistRead,
        model: ModelRegistry
    ):
        pred_pos = (prediction.classification.lower() == "positive" or prediction.probability >= prediction.threshold_applied)
        rad_pos = (read.ground_truth_classification.lower() == "positive")

        is_discordant = (pred_pos != rad_pos)
        read.is_discordant = is_discordant

        if is_discordant:
            discordance_type = "false_positive_ai" if pred_pos and not rad_pos else "false_negative_ai"
            
            # Check if review queue item already exists
            existing_queue = db.query(ReviewQueueItem).filter(
                ReviewQueueItem.study_id == study.id,
                ReviewQueueItem.model_id == model.id
            ).first()

            if not existing_queue:
                queue_item = ReviewQueueItem(
                    study_id=study.id,
                    model_id=model.id,
                    model_version=prediction.model_version,
                    discordance_type=discordance_type,
                    adjudication_status="pending",
                    created_at=datetime.now(timezone.utc)
                )
                db.add(queue_item)
        
        db.commit()

    @staticmethod
    def ingest_batch(db: Session, tenant_id: str, batch: BatchIngestionPayload) -> Dict[str, int]:
        study_count = 0
        pred_count = 0
        read_count = 0

        for s in batch.studies:
            IngestionService.ingest_study(db, tenant_id, s)
            study_count += 1

        for p in batch.predictions:
            IngestionService.ingest_prediction(db, tenant_id, p)
            pred_count += 1

        for r in batch.radiologist_reads:
            IngestionService.ingest_radiologist_read(db, tenant_id, r)
            read_count += 1

        return {
            "studies_ingested": study_count,
            "predictions_ingested": pred_count,
            "reads_ingested": read_count
        }
