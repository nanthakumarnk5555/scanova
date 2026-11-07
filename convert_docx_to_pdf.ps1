$wdFormatPDF = 17
$word = New-Object -ComObject Word.Application
$word.Visible = $false

$docxPath = "C:\Users\ADMIN\.gemini\antigravity-ide\scratch\SCANOVA_Project_Report_Enhanced.docx"
$pdfPath = "C:\Users\ADMIN\.gemini\antigravity-ide\scratch\SCANOVA_Project_Report_Enhanced.pdf"
$dlPdf = "$HOME\Downloads\SCANOVA_Project_Report_Enhanced.pdf"
$dtPdf = "$HOME\Desktop\SCANOVA_Project_Report_Enhanced.pdf"

Write-Host "Opening $docxPath in Word..."
$doc = $word.Documents.Open($docxPath)
Write-Host "Saving to $pdfPath as PDF..."
$doc.SaveAs([ref]$pdfPath, [ref]$wdFormatPDF)
$doc.Close()
$word.Quit()

Write-Host "Copying to Downloads and Desktop..."
Copy-Item -Path $pdfPath -Destination $dlPdf -Force
Copy-Item -Path $pdfPath -Destination $dtPdf -Force

# Also copy as SCANOVA_IEEE_Journal_Paper_2Column.pdf
$pdfPath2 = "C:\Users\ADMIN\.gemini\antigravity-ide\scratch\SCANOVA_IEEE_Journal_Paper_2Column.pdf"
Copy-Item -Path $pdfPath -Destination $pdfPath2 -Force
Copy-Item -Path $pdfPath -Destination "$HOME\Downloads\SCANOVA_IEEE_Journal_Paper_2Column.pdf" -Force
Copy-Item -Path $pdfPath -Destination "$HOME\Desktop\SCANOVA_IEEE_Journal_Paper_2Column.pdf" -Force

Write-Host "PDF export complete! Output size: $( (Get-Item $pdfPath).Length ) bytes"
