"""
Generate YMER Journal Copyright Form for SCANOVA - Exact form text format without any tables/boxes.
Matches the exact line-by-line template supplied by YMER Journal, filling in only the values.
"""

import os
import shutil
import docx
from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

def create_plain_copyright_form():
    doc = Document()
    
    section = doc.sections[0]
    section.page_width = Inches(8.5)
    section.page_height = Inches(11.0)
    section.left_margin = Inches(0.8)
    section.right_margin = Inches(0.8)
    section.top_margin = Inches(0.8)
    section.bottom_margin = Inches(0.8)
    
    # Remove header/footer
    section.header.is_linked_to_previous = False
    section.footer.is_linked_to_previous = False
    for p in section.header.paragraphs: p.clear()
    for p in section.footer.paragraphs: p.clear()

    def add_run(p, text, size=Pt(10), bold=False, italic=False, font_name="Times New Roman"):
        r = p.add_run(text)
        r.font.name = font_name
        r.font.size = size
        r.font.bold = bold
        r.font.italic = italic
        r.font.color.rgb = RGBColor(0, 0, 0)
        return r

    # 1. Title Header
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(0)
    p_title.paragraph_format.space_after = Pt(2)
    add_run(p_title, "Copyright Form\n", Pt(14), bold=True)
    add_run(p_title, "YMER Journal", Pt(12), bold=True)

    p_sp = doc.add_paragraph()
    p_sp.paragraph_format.space_before = Pt(0)
    p_sp.paragraph_format.space_after = Pt(8)

    # 2. Form Fields (Lines with values filled, NO BOXES / NO TABLES)
    fields = [
        ("Title of Article/Paper/Manuscript:  ", 
         "SCANOVA : An AI-Powered Clinical Diagnostic & Surveillance System for Automated Radiological Analysis"),
        ("Corresponding Author’s Name, Address with Pin/Zip Code, and Affiliation:  ", 
         "Mrs. M. Yogadharani, Assistant Professor, Department of Computer Science and Engineering, SNS College of Engineering, SNS Kalvi Nagar, Sathy Main Road, Kurumbapalayam (Po), Coimbatore - 641107, Tamil Nadu, India."),
        ("Supporting Author(s) Name(s):  ", 
         "M. Nanthakumar, A. Risikash, N. Yashwanth, E. Sanjith"),
        ("E-mail (Corresponding Author):  ", 
         "yogadharani.m.cse@snsce.ac.in"),
        ("Contact Number (Corresponding Author):  ", 
         "8072893074")
    ]

    for label, val in fields:
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(3)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = Pt(12)
        add_run(p, label, Pt(10), bold=True)
        add_run(p, val, Pt(10), bold=False)

    # Space
    p_gap = doc.add_paragraph()
    p_gap.paragraph_format.space_before = Pt(4)
    p_gap.paragraph_format.space_after = Pt(4)

    # 3. LICENCE AGREEMENT
    p_lic = doc.add_paragraph()
    p_lic.paragraph_format.space_before = Pt(4)
    p_lic.paragraph_format.space_after = Pt(3)
    add_run(p_lic, "LICENCE AGREEMENT:", Pt(10.5), bold=True)

    agreement_paragraphs = [
        "I hereby declare and agree, on behalf of myself and my co-authors (if any), that:",
        "The article submitted is an original work and has neither been published in any other peer-reviewed journal nor is under consideration for publication by any other journal. In addition to it, the article does not contravene any existing copyright or any other third party rights.",
        "This transfer of copyright gives YMER Journal the right to develop, promote, distribute, and archive a body of scientific works throughout the world. I certify that the article title mentioned above is already peer reviewed by my friend, colleague or any peer reviewer.",
        "The Author hereby grants and assigns to YMER Journal all rights in and to Author’s work in and contributions to the Work. In connection with this assignment, the Author acknowledges that YMER Journal will have the right to print, publish, and create derivative works throughout the world, all rights in and to all revisions or versions or subsequent editions of the Work in all languages and media throughout the world.",
        "The author(s), reserve the following rights:",
        "All proprietary rights other than copyrights, such as patent rights,",
        "The right to use all or part of this article, including tables and figures in future works of their own, provided that the proper acknowledgment is made to the Publisher as copyright holder, and",
        "The right to make copies of this article for his/her own use, but not for sale.",
        "The article contains no such material that may be unlawful, infringe any proprietary or personal rights of others (including, without limitation, any copyrights or privacy rights); that the Work is factually accurate and contains no matter libelous or otherwise unlawful; that I/We have substantially participated in the creation of the Work and that it represents my original work adequate for me/us to claim the authorship.",
        "I/We certify that I/We have no financial interest in the subject matter of the Work or any affiliation with an organization or entity with a financial interest in the subject matter of the Work, other than as previously disclosed to the Association.",
        "If any plagiarism found in my camera-ready article after Publication, I am the solely responsible not YMER Journal or YMER Journal Board members.",
        "The article, the final version of which I enclose, is not substantially the same as any that I/we have already published elsewhere.",
        "No responsibility is undertaken by YMER Journal, its staff or members of the editorial board for any injury and/or damage to persons or property as a matter of products liability, negligence or otherwise, or from any use or operation of any methods, products instruction, advertisements or ideas contained in a publication by YMER Journal.",
        "If any dispute arises, final decision shall take by YMER Journal.",
        "I, the undersigned corresponding author, also certify that I have the consent of each author to transfer and assign any and all rights, title, and interest, including copyright of the article referred above. I hereby assign and transfer to the YMER Journal copyright and all rights under it in the event that such work is published by the YMER Journal. I further confirm that this article has not been published elsewhere, nor is it under consideration by any other publisher."
    ]

    for para_text in agreement_paragraphs:
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.space_before = Pt(1)
        p.paragraph_format.space_after = Pt(2.5)
        p.paragraph_format.line_spacing = Pt(11)
        add_run(p, para_text, Pt(9))

    # 4. COPYRIGHT TRANSFER
    p_ct = doc.add_paragraph()
    p_ct.paragraph_format.space_before = Pt(5)
    p_ct.paragraph_format.space_after = Pt(2)
    add_run(p_ct, "COPYRIGHT TRANSFER:", Pt(10.5), bold=True)

    p_ct_body = doc.add_paragraph()
    p_ct_body.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_ct_body.paragraph_format.space_before = Pt(1)
    p_ct_body.paragraph_format.space_after = Pt(8)
    p_ct_body.paragraph_format.line_spacing = Pt(11)
    add_run(p_ct_body,
        "Copyright to the above work (including without limitation, the right to publish the work in whole, or in part, "
        "in any and all forms) is hereby transferred to YMER Journal, to ensure widest dissemination and protection against "
        "infringement of it. I hereby certify that I am authorized to sign this Copyright Form either in my own right or as an "
        "agent of my employer, and have made no changes to this current valid document supplied by YMER Journal. I have carefully "
        "read, understand and agree with all above written agreement with YMER Journal.", Pt(9))

    # 5. Bottom Signatures & Details (NO BOXES, NO TABLES - PLAIN TEXT MATCHING FORM)
    p_s1 = doc.add_paragraph()
    p_s1.paragraph_format.space_before = Pt(6)
    p_s1.paragraph_format.space_after = Pt(3)
    add_run(p_s1, "Signature:  \t\t\t\tAuthorized Name (Corresponding Author):  ", Pt(9.5), bold=True)
    add_run(p_s1, "Mrs. M. Yogadharani", Pt(9.5))

    p_s2 = doc.add_paragraph()
    p_s2.paragraph_format.space_before = Pt(3)
    p_s2.paragraph_format.space_after = Pt(3)
    add_run(p_s2, "Date:  ", Pt(9.5), bold=True)
    add_run(p_s2, "06-11-2026\t\t\t\tPlace:  ", Pt(9.5))
    add_run(p_s2, "Coimbatore", Pt(9.5))

    p_foot = doc.add_paragraph()
    p_foot.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p_foot.paragraph_format.space_before = Pt(8)
    p_foot.paragraph_format.space_after = Pt(0)
    add_run(p_foot, "All rights are reserved @ www.ymerdigital.eu", Pt(9), italic=True)

    return doc

if __name__ == '__main__':
    out_path = r"c:\Users\ADMIN\.gemini\antigravity-ide\scratch\YMER_Journal_Copyright_Form_SCANOVA.docx"
    print("Generating Plain YMER Journal Copyright Form (No Boxes/Tables)...")
    doc = create_plain_copyright_form()
    doc.save(out_path)
    sz = os.path.getsize(out_path)
    print(f"Saved: {out_path} ({sz:,} bytes)")
    
    downloads = os.path.expanduser(r"~\Downloads\YMER_Journal_Copyright_Form_SCANOVA.docx")
    desktop = os.path.expanduser(r"~\Desktop\YMER_Journal_Copyright_Form_SCANOVA.docx")
    
    try:
        shutil.copy2(out_path, downloads)
        print("Copied to Downloads:", downloads)
    except Exception as e:
        print("Downloads copy error:", e)
        
    try:
        shutil.copy2(out_path, desktop)
        print("Copied to Desktop:", desktop)
    except Exception as e:
        print("Desktop copy error:", e)
        
    print("Done!")
