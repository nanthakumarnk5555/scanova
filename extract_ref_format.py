import docx
from docx.shared import Pt, Inches
from docx.oxml.ns import qn

doc = docx.Document(r'C:/Users/ADMIN/.gemini/antigravity/brain/5fd123dc-5331-4560-80e9-31aea82cb9b5/.user_uploaded/media_1793802520071_11e58694.docx')

# Page layout
print("=== PAGE LAYOUT ===")
for i, section in enumerate(doc.sections):
    print(f"Section {i}:")
    print(f"  Page width: {section.page_width.inches:.3f} in")
    print(f"  Page height: {section.page_height.inches:.3f} in")
    print(f"  Left margin: {section.left_margin.inches:.3f} in")
    print(f"  Right margin: {section.right_margin.inches:.3f} in")
    print(f"  Top margin: {section.top_margin.inches:.3f} in")
    print(f"  Bottom margin: {section.bottom_margin.inches:.3f} in")

# Styles
print("\n=== STYLES ===")
for style_name in ['Normal', 'Heading 1', 'Heading 2', 'Heading 3', 'Heading 4', 'Title']:
    try:
        s = doc.styles[style_name]
        print(f"\n--- {style_name} ---")
        f = s.font
        pf = s.paragraph_format
        print(f"  Font name: {f.name}")
        print(f"  Font size: {f.size.pt if f.size else 'None'}")
        print(f"  Bold: {f.bold}")
        print(f"  Italic: {f.italic}")
        try:
            print(f"  Color: {f.color.rgb}")
        except:
            print("  Color: None")
        print(f"  Alignment: {pf.alignment}")
        print(f"  Space before: {pf.space_before.pt if pf.space_before else 'None'}")
        print(f"  Space after: {pf.space_after.pt if pf.space_after else 'None'}")
        print(f"  Line spacing: {pf.line_spacing}")
        print(f"  First line indent: {pf.first_line_indent.inches if pf.first_line_indent else 'None'}")
    except Exception as e:
        print(f"  ERROR: {e}")

# Paragraphs
print("\n=== FIRST 80 PARAGRAPHS ===")
for i, para in enumerate(doc.paragraphs[:80]):
    text = para.text.strip()
    if not text:
        continue
    style_name = para.style.name if para.style else 'None'
    align = para.alignment
    sb = para.paragraph_format.space_before
    sa = para.paragraph_format.space_after
    ls = para.paragraph_format.line_spacing

    fn, fs, fb, fi = None, None, None, None
    for run in para.runs:
        if run.font.name and not fn: fn = run.font.name
        if run.font.size and not fs: fs = run.font.size.pt
        if run.font.bold is not None and fb is None: fb = run.font.bold
        if run.font.italic is not None and fi is None: fi = run.font.italic

    sb_pt = sb.pt if sb else None
    sa_pt = sa.pt if sa else None
    print(f"[{i:03d}] style={style_name!r:25} align={str(align):<6} sb={str(sb_pt):<6} sa={str(sa_pt):<6} ls={str(ls):<8} font={fn}/{fs}/B={fb}/I={fi} | {text[:55]!r}")

# Tables
print(f"\n=== TABLES: {len(doc.tables)} ===")
for ti, table in enumerate(doc.tables[:3]):
    print(f"\nTable {ti}: {len(table.rows)} rows x {len(table.columns)} cols")
    for ri, row in enumerate(table.rows[:3]):
        for ci, cell in enumerate(row.cells[:3]):
            print(f"  [{ri},{ci}]: {cell.text[:40]!r}")
