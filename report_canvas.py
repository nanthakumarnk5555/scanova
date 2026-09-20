import os
import sys
import re
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, Image as RLImage, Flowable
)
from reportlab.pdfgen import canvas
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT

class PageRecorder(Flowable):
    """Zero-height flowable that captures its current page number during canvas rendering."""
    def __init__(self, key, tracker):
        super().__init__()
        self.key = key
        self.tracker = tracker
        self.width = 0
        self.height = 0

    def draw(self):
        self.tracker[self.key] = self.canv._pageNumber

class DynamicAnnaUniversityCanvas(canvas.Canvas):
    """
    Two-pass canvas for Anna University / Engineering Project Report formatting.
    Preliminary pages (1 to FRONT_MATTER_COUNT) get centered Roman numerals (i, ii, iii...).
    Body pages (> FRONT_MATTER_COUNT) get running header and right-aligned Arabic numerals (1, 2, 3...).
    """
    front_matter_pages = 13  # Updated dynamically after pass 1

    def __init__(self, *args, **kwargs):
        super(DynamicAnnaUniversityCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_decorations(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def to_roman(self, n):
        val = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1]
        syb = ["m", "cm", "d", "cd", "c", "xc", "l", "xl", "x", "ix", "v", "iv", "i"]
        roman_num = ""
        i = 0
        while n > 0:
            for _ in range(n // val[i]):
                roman_num += syb[i]
                n -= val[i]
            i += 1
        return roman_num

    def draw_decorations(self, total_pages):
        page_num = self._pageNumber
        if page_num == 1:
            return  # Title page has no header or footer

        self.saveState()
        self.setFont("Times-Roman", 10)
        self.setFillColor(colors.HexColor("#334155"))

        is_front = (page_num <= DynamicAnnaUniversityCanvas.front_matter_pages)

        # No header text, no footer text, no underline shapes/lines
        # Pure clean page number at bottom center
        if is_front:
            roman_str = self.to_roman(page_num)
            self.drawCentredString(297.5, 40, roman_str)
        else:
            arabic_num = page_num - DynamicAnnaUniversityCanvas.front_matter_pages
            self.drawCentredString(297.5, 40, str(arabic_num))

        self.restoreState()

print("DynamicAnnaUniversityCanvas initialized.")
