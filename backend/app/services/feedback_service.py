from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.entities import ReaderFeedback, FleetModel

def submit_reader_feedback(
    db: Session,
    model_name: str,
    sentiment: str, # "thumbs_up" or "thumbs_down"
    image_id: str = None,
    pushback_category: str = "Approved",
    reader_notes: str = "",
    reader_role: str = "radiologist"
):
    feedback = ReaderFeedback(
        image_id=image_id,
        model_name=model_name,
        sentiment=sentiment,
        pushback_category=pushback_category,
        reader_notes=reader_notes,
        reader_role=reader_role,
        created_at=datetime.now(timezone.utc)
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)

    # Recalculate model pushback percentage in fleet
    total_feedbacks = db.query(ReaderFeedback).filter(ReaderFeedback.model_name == model_name).count()
    thumbs_down = db.query(ReaderFeedback).filter(
        ReaderFeedback.model_name == model_name,
        ReaderFeedback.sentiment == "thumbs_down"
    ).count()

    pushback_pct = round((thumbs_down / total_feedbacks) * 100, 1) if total_feedbacks > 0 else 2.5

    model = db.query(FleetModel).filter(FleetModel.model_name == model_name).first()
    if model:
        model.reader_pushback_pct = pushback_pct
        db.commit()

    return {
        "status": "success",
        "message": f"Reader sentiment recorded for '{model_name}'.",
        "feedback_id": feedback.id,
        "current_pushback_pct": pushback_pct
    }

def get_reader_sentiment_rollup(db: Session):
    feedbacks = db.query(ReaderFeedback).order_by(ReaderFeedback.created_at.desc()).limit(100).all()
    total = len(feedbacks)
    thumbs_up = sum(1 for f in feedbacks if f.sentiment == "thumbs_up")
    thumbs_down = sum(1 for f in feedbacks if f.sentiment == "thumbs_down")

    pushback_by_category = {}
    for f in feedbacks:
        if f.sentiment == "thumbs_down":
            cat = f.pushback_category or "Clinical Disagreement"
            pushback_by_category[cat] = pushback_by_category.get(cat, 0) + 1

    return {
        "total_feedbacks": total,
        "thumbs_up_count": thumbs_up,
        "thumbs_down_count": thumbs_down,
        "overall_approval_pct": round((thumbs_up / total) * 100, 1) if total > 0 else 96.5,
        "pushback_by_category": pushback_by_category,
        "recent_feedbacks": feedbacks[:15]
    }
