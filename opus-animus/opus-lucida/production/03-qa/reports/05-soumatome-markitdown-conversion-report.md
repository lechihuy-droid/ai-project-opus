# Soumatome N2 MarkItDown Conversion Report
**Status:** MarkItDown run completed, OCR still needed
**Date:** 2026-04-30

---

## Source

Original PDF:

```text
C:\Users\HUY\AI\OPUS ANIMUS\opus-fabrica\markitdown-agent\input\【N2文法】日本語総まとめ.pdf
```

ASCII copy used for conversion:

```text
C:\Users\HUY\AI\OPUS ANIMUS\opus-fabrica\markitdown-agent\input\n2-soumatome-grammar.pdf
```

Reason for ASCII copy:

```text
PowerShell/Python path handling converted the Japanese filename to ? characters during the first run.
```

---

## MarkItDown Output

Output file:

```text
C:\Users\HUY\AI\OPUS ANIMUS\opus-fabrica\markitdown-agent\output\n2-soumatome-grammar.md
```

Result:

```text
0 bytes
```

Interpretation:

```text
MarkItDown completed but could not extract text content.
```

---

## Text Layer Check

Checked with `pdfplumber`.

Result:

```text
PDF pages: 150
Text extracted from sampled pages: 0 characters
```

Sampled pages:

```text
1, 2, 3, 4, 5, 11, 21
```

Interpretation:

```text
The PDF appears to be image-only / scan-based, or at least has no accessible text layer for normal PDF extraction.
```

---

## Preview

Rendered preview:

```text
production/03-qa/reports/soumatome-preview/page-001-preview.png
```

Renderer used:

```text
pypdfium2
```

---

## Current Limitation

The current local environment has:

```text
pypdfium2: available
PIL: available
pdfplumber: available
markitdown: available
```

But does not have:

```text
tesseract
ocrmypdf
pytesseract
pdf2image
easyocr
paddleocr
```

So we can render pages to images locally, but cannot OCR Japanese text yet.

---

## Recommendation

To use this book as input for Lucida, the next step is OCR, not MarkItDown-only conversion.

Recommended options:

1. Install a local OCR path:

```text
Tesseract + Japanese language data
```

or:

```text
OCRmyPDF + Tesseract
```

2. Use external OCR once:

```text
Adobe OCR / Google Drive OCR / Gemini OCR / other OCR tool
```

3. Use page-image workflow:

```text
render pages -> OCR selected pages/weeks -> extract grammar list -> feed Lucida topic backlog
```

---

## Decision

For now:

```text
MarkItDown has been run.
Direct Markdown extraction is not usable.
OCR is required before this source can become reliable input.
```
