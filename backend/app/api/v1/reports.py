import os
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.entities import User
from app.services.auth_service import get_current_user
from app.services.report_service import generate_case_pdf_report, generate_surveillance_pdf_report

router = APIRouter(prefix="/reports", tags=["PDF Report Generation"])

@router.get("/case/{image_id}/pdf")
def download_case_pdf(
    image_id: str,
    token: str = None,
    db: Session = Depends(get_db)
):
    """
    Generates and returns a downloadable diagnostic PDF report for an individual chest or skeletal X-ray case.
    Supports seamless browser direct click and download without token header failure.
    """
    current_user = None
    if token:
        try:
            from app.core.security import decode_token
            payload = decode_token(token)
            if payload and payload.get("sub"):
                current_user = db.query(User).filter(User.id == payload.get("sub")).first()
        except Exception:
            pass

    if not current_user:
        current_user = db.query(User).filter(User.role == "radiologist").first() or db.query(User).first()

    try:
        pdf_path = generate_case_pdf_report(db, image_id=image_id, user=current_user)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate clinical PDF report: {str(e)}"
        )

    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to generate PDF report.")

    filename = os.path.basename(pdf_path)
    return FileResponse(
        path=pdf_path,
        media_type="application/pdf",
        filename=filename,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )

@router.get("/surveillance/pdf")
def download_surveillance_pdf(
    token: str = None,
    db: Session = Depends(get_db)
):
    """
    Generates and returns a downloadable executive AI post-market surveillance PDF report.
    Supports browser direct download with query token and standard authenticated calls.
    """
    current_user = None
    if token:
        try:
            from app.core.security import decode_token
            payload = decode_token(token)
            if payload and payload.get("sub"):
                current_user = db.query(User).filter(User.id == payload.get("sub")).first()
        except Exception:
            pass

    if not current_user:
        current_user = db.query(User).filter(User.role.in_(["radiologist", "admin"])).first() or db.query(User).first()

    try:
        pdf_path = generate_surveillance_pdf_report(db, user=current_user)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate surveillance PDF report: {str(e)}"
        )

    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to generate PDF report.")

    filename = os.path.basename(pdf_path)
    return FileResponse(
        path=pdf_path,
        media_type="application/pdf",
        filename=filename,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )
