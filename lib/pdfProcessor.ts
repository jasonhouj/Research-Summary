import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker - use unpkg which mirrors npm packages directly
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

// Maximum characters to send to AI (prevents timeout on large documents)
// ~50k chars is roughly 12-15k tokens, safe for gpt-4.1-mini context
const MAX_TEXT_LENGTH = 50000;

/**
 * Extract text content from a PDF file
 * Automatically truncates to MAX_TEXT_LENGTH to prevent API timeouts
 */
export async function extractPDFText(
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const textParts: string[] = [];
  const totalPages = pdf.numPages;
  let totalLength = 0;

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: unknown) => (item as { str: string }).str)
      .join(' ');

    // Check if adding this page would exceed limit
    if (totalLength + pageText.length > MAX_TEXT_LENGTH) {
      // Add partial page text to reach limit, then stop
      const remaining = MAX_TEXT_LENGTH - totalLength;
      if (remaining > 0) {
        textParts.push(pageText.substring(0, remaining));
      }
      console.log(`PDF truncated at page ${i}/${totalPages} (${MAX_TEXT_LENGTH} char limit)`);
      break;
    }

    textParts.push(pageText);
    totalLength += pageText.length;

    if (onProgress) {
      onProgress(i, totalPages);
    }
  }

  return textParts.join('\n\n');
}
