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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generates and returns a downloadable diagnostic PDF report for an individual chest X-ray case.
    """
    pdf_path = generate_case_pdf_report(db, image_id=image_id, user=current_user)
    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to generate PDF report.")

    filename = os.path.basename(pdf_path)
    return FileResponse(
        path=pdf_path,
        media_type="application/pdf",
        filename=filename
    )

@router.get("/surveillance/pdf")
def download_surveillance_pdf(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generates and returns a downloadable executive AI post-market surveillance PDF report.
    """
    pdf_path = generate_surveillance_pdf_report(db, user=current_user)
    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to generate PDF report.")

    filename = os.path.basename(pdf_path)
    return FileResponse(
        path=pdf_path,
        media_type="application/pdf",
        filename=filename
    )
