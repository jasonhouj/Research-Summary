// n8n Webhook Service for Paper Summary Generation (Gemini Workflow)

const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || '';

// Extract paper title and authors from PDF text
// This handles both line-separated and continuous text formats
export function extractPaperMetadata(pdfText: string): { title: string; authors: string[] } {
  console.log('=== PDF Text Analysis ===');
  console.log('Total text length:', pdfText.length);
  console.log('First 1000 chars:', pdfText.substring(0, 1000));

  let title = '';
  let authors: string[] = [];

  // Get the first portion of text (where title and authors usually are)
  const headerText = pdfText.substring(0, 3000);

  // Strategy 1: Look for text before "Abstract" keyword
  // The title is almost always before the abstract
  const abstractMatch = headerText.match(/^([\s\S]*?)(?:\n\s*)?(?:Abstract|ABSTRACT|A\s*B\s*S\s*T\s*R\s*A\s*C\s*T)\b/i);

  if (abstractMatch) {
    const beforeAbstract = abstractMatch[1].trim();
    console.log('Text before Abstract:', beforeAbstract.substring(0, 500));

    // Split by newlines or double spaces to find distinct elements
    const parts = beforeAbstract
      .split(/\n+|\s{2,}/)
      .map(p => p.trim())
      .filter(p => p.length > 0);

    console.log('Parts found before abstract:', parts.length);
    parts.slice(0, 10).forEach((p, i) => console.log(`Part ${i}:`, p.substring(0, 100)));

    // Find the title - look for the longest meaningful text that isn't author names
    // Title characteristics: longer text, no commas separating short phrases, not all caps names
    for (const part of parts) {
      // Skip if too short or too long
      if (part.length < 15 || part.length > 300) continue;

      // Skip journal headers, dates, DOIs
      if (/^(Vol\.|Volume|Issue|DOI:|http|www\.|©|Copyright|\d{4}|January|February|March|April|May|June|July|August|September|October|November|December)/i.test(part)) continue;

      // Skip if it looks like author names (multiple capitalized short words with commas)
      const commaCount = (part.match(/,/g) || []).length;
      const words = part.split(/\s+/);

      // Author lines typically have many commas and short capitalized words
      const looksLikeAuthors = commaCount >= 2 &&
        words.filter(w => /^[A-Z][a-z]*\.?$/.test(w)).length > words.length * 0.3;

      if (looksLikeAuthors) {
        console.log('Skipping as potential author line:', part.substring(0, 80));
        continue;
      }

      // This is likely the title
      title = part;
      console.log('Selected as title:', title);
      break;
    }

    // Now find authors - look for patterns after the title
    const titleIndex = beforeAbstract.indexOf(title);
    if (titleIndex >= 0 && title) {
      const afterTitle = beforeAbstract.substring(titleIndex + title.length).trim();
      console.log('Text after title:', afterTitle.substring(0, 300));

      // Extract author names using common patterns
      authors = extractAuthorsFromText(afterTitle);
    }
  }

  // Strategy 2: If no abstract found, try to find title from first substantial text
  if (!title) {
    console.log('No abstract marker found, using fallback strategy');

    // Split text and find first substantial line
    const lines = pdfText.split(/\n/).map(l => l.trim()).filter(l => l.length > 0);

    for (let i = 0; i < Math.min(20, lines.length); i++) {
      const line = lines[i];

      // Skip metadata lines
      if (line.length < 15 || line.length > 300) continue;
      if (/^(Vol\.|Volume|Issue|DOI:|http|www\.|©|Copyright|\d{4}$)/i.test(line)) continue;

      // Skip journal names and article type headers
      if (/journal|clinical investigation|research\s*article|original\s*article|review\s*article|J\s*Clin\s*Invest/i.test(line)) continue;
      if (/https?:\/\/|doi\.org/i.test(line)) continue;

      // Skip lines that are mostly formatting/spacing
      if (/^[A-Z\s]{10,}$/.test(line) && line.includes('  ')) continue;

      // Found potential title
      title = line;
      console.log('Fallback title:', title);

      // Look for authors in subsequent lines
      for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
        const authorLine = lines[j];
        if (/^(Abstract|ABSTRACT|Introduction|INTRODUCTION)/i.test(authorLine)) break;

        const foundAuthors = extractAuthorsFromText(authorLine);
        if (foundAuthors.length > 0) {
          authors = foundAuthors;
          break;
        }
      }
      break;
    }
  }

  // Clean up title - remove any trailing author info that might have been included
  if (title) {
    // If title contains author-like patterns at the end, trim them
    const authorPatternInTitle = title.match(/^(.+?)(?:\s+(?:by\s+)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s*,\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)+\s*)$/);
    if (authorPatternInTitle) {
      title = authorPatternInTitle[1].trim();
    }

    title = title
      .replace(/\s+/g, ' ')
      .replace(/^["']|["']$/g, '')
      .trim();
  }

  console.log('=== Final Extraction Results ===');
  console.log('Title:', title);
  console.log('Authors:', authors);

  return {
    title: title || 'Title not found',
    authors: authors
  };
}

// Helper function to extract author names from a text segment
function extractAuthorsFromText(text: string): string[] {
  const authors: string[] = [];

  // Clean up the text
  let cleanText = text
    .replace(/\d+/g, '')  // Remove numbers (affiliations, superscripts)
    .replace(/[*†‡§¶∗]/g, '') // Remove academic symbols
    .replace(/\([^)]*\)/g, '') // Remove parenthetical content
    .replace(/@\S+/g, '') // Remove email addresses
    .trim();

  // Skip if it contains affiliation keywords
  if (/university|department|institute|college|school of|faculty|laboratory|center for/i.test(cleanText)) {
    return [];
  }

  // Try to split by common separators
  let candidates: string[] = [];

  // Pattern 1: "Name1, Name2, Name3" or "Name1, Name2 and Name3"
  if (cleanText.includes(',')) {
    candidates = cleanText.split(/,\s*(?:and\s+)?/i).map(s => s.trim());
  }
  // Pattern 2: "Name1 and Name2"
  else if (/\band\b/i.test(cleanText)) {
    candidates = cleanText.split(/\s+and\s+/i).map(s => s.trim());
  }
  // Pattern 3: Single author
  else {
    candidates = [cleanText];
  }

  // Validate each candidate as a potential author name
  for (let candidate of candidates) {
    candidate = candidate.trim();

    // Skip empty or too short
    if (candidate.length < 2 || candidate.length > 50) continue;

    // Skip section headers
    if (/^(Abstract|Introduction|Method|Result|Discussion|Conclusion|Keywords|Acknowledgment)/i.test(candidate)) continue;

    // Author name pattern: 1-4 words, mostly capitalized
    const words = candidate.split(/\s+/).filter(w => w.length > 0);
    if (words.length < 1 || words.length > 5) continue;

    // Check if words look like names (capitalized)
    const capitalizedCount = words.filter(w => /^[A-Z]/.test(w)).length;
    if (capitalizedCount < words.length * 0.5) continue;

    // Check it's not a common non-name word
    if (/^(the|and|or|for|from|with|this|that|these|those)$/i.test(candidate)) continue;

    authors.push(candidate);
  }

  return authors;
}

// Use Vite proxy in development to avoid CORS issues
const getWebhookUrl = () => {
  // In development, use the Vite proxy to avoid CORS
  if (import.meta.env.DEV) {
    return '/api/n8n';
  }
  // In production, call the webhook directly
  return N8N_WEBHOOK_URL;
};

// Response format from PDF Summarizer workflow (7 AI agents)
export interface PDFSummarizerResponse {
  // Aggregated data from all AI agents
  data: Array<{
    // From hypothesis & conflict_of_interest node
    main_theme?: string;
    conflict_of_interest?: string;
    Conflict_of_interest?: string; // Alternative casing from n8n
    // From document_summary1 node
    document_summary?: Array<{
      section_title: string;
      subsection_title?: string;
      content: string;
    }>;
    // From key_takeaways node
    key_takeaways?: Array<{
      point: string;
      context: string;
    }>;
    // From gaps_and_limitations node
    gaps_and_limitations?: Array<{
      issue: string;
      reason: string;
    }>;
    // From terminology_to_clarify node
    terminology_to_clarify?: Array<{
      term: string;
      explanation: string;
    }>;
    // From method and materials node
    method_and_materials?: Array<{
      subsection_title: string;
      description: string;
    }>;
    // From title & author node
    document_basic_info?: Array<{
      title?: string;
      authors?: string;
    }>;
    // Legacy fields
    follow_up_questions?: string[];
    structural_observations?: string[];
  }>;
}

// Normalized response format for our app
export interface N8nGeminiResponse {
  success: boolean;
  paper: {
    title: string;
    authors: string[];
    abstract: string;
  };
  summaries: {
    introduction: string;
    methods: string;
    results: string;
    discussion: string;
    conclusion: string;
    conflictOfInterest: string;
  };
  sectionsFound: {
    introduction: boolean;
    methods: boolean;
    results: boolean;
    discussion: boolean;
    conclusion: boolean;
    conflictOfInterest: boolean;
  };
  metadata: {
    generatedAt: string;
    sectionsProcessed: number;
    sectionsSuccessfullyFound: number;
    fullTextLength: number;
    aiModel: string;
  };
  // Extended fields from n8n workflow nodes
  keyTakeaways?: Array<{ point: string; context: string }>;
  terminologyToClarify?: Array<{ term: string; explanation: string }>;
  gapsAndLimitations?: Array<{ issue: string; reason: string }>;
  methodSections?: Array<{ subsection_title: string; description: string }>;
  documentSections?: Array<{ section_title: string; subsection_title?: string; content: string }>;
}

export async function triggerPaperSummary(
  pdfText: string,
  fileName: string,
  onProgress?: (stage: string) => void
): Promise<N8nGeminiResponse> {
  if (!N8N_WEBHOOK_URL) {
    throw new Error('N8N_WEBHOOK_URL is not configured. Add VITE_N8N_WEBHOOK_URL to your .env file.');
  }

  // Extract title and authors from PDF text before sending to n8n
  onProgress?.('Extracting paper metadata...');
  const metadata = extractPaperMetadata(pdfText);
  console.log('Extracted metadata:', metadata);

  onProgress?.('Sending paper to AI for analysis...');

  const webhookUrl = getWebhookUrl();
  console.log('Calling n8n webhook:', webhookUrl);
  console.log('Text length:', pdfText.length, 'chars, file:', fileName);

  // Send extracted text as JSON
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: pdfText,
      fileName: fileName,
    }),
  });

  console.log('n8n response status:', response.status, response.statusText);
  console.log('n8n response headers:', Object.fromEntries(response.headers.entries()));

  if (!response.ok) {
    const errorText = await response.text();
    console.error('n8n webhook error:', response.status, errorText);
    throw new Error(`n8n webhook failed (${response.status}): ${errorText}`);
  }

  const responseText = await response.text();
  console.log('n8n response received, length:', responseText.length);
  console.log('n8n response preview:', responseText.substring(0, 500));

  let rawResult: PDFSummarizerResponse | N8nGeminiResponse;
  try {
    rawResult = JSON.parse(responseText);
  } catch (parseError) {
    console.error('Failed to parse n8n response:', responseText.substring(0, 500));
    throw new Error('Invalid JSON response from n8n workflow');
  }

  // Check if this is from PDF Summarizer workflow (has data array) or standard format
  if ('data' in rawResult && Array.isArray(rawResult.data)) {
    console.log('Detected PDF Summarizer workflow response, converting...');
    return convertPDFSummarizerResponse(rawResult as PDFSummarizerResponse, fileName, metadata);
  }

  // Standard format response
  const result = rawResult as N8nGeminiResponse;
  if (!result.success) {
    console.error('n8n workflow returned success: false', result);
    throw new Error('Paper summary generation failed');
  }

  return result;
}

// Convert PDF Summarizer workflow response to our normalized format
function convertPDFSummarizerResponse(
  response: PDFSummarizerResponse,
  fileName: string,
  extractedMetadata: { title: string; authors: string[] }
): N8nGeminiResponse {
  const data = response.data || [];

  console.log('Converting PDF Summarizer response, data items:', data.length);

  // Extract data from each AI agent's output
  // Note: n8n wraps each agent's output in an "output" object
  let mainTheme = '';
  let conflictOfInterest = '';
  let documentSummary: Array<{ section_title: string; subsection_title?: string; content: string }> = [];
  let keyTakeaways: Array<{ point: string; context: string }> = [];
  let terminologyToClarify: Array<{ term: string; explanation: string }> = [];
  let gapsAndLimitations: Array<{ issue: string; reason: string }> = [];
  let methodAndMaterials: Array<{ subsection_title: string; description: string }> = [];
  let documentBasicInfo: Array<{ title?: string; authors?: string }> = [];

  for (const item of data) {
    // Handle both direct properties and nested "output" wrapper
    const output = (item as { output?: Record<string, unknown> }).output || item;

    console.log('Processing item keys:', Object.keys(output));

    if (output.main_theme) {
      mainTheme = output.main_theme as string;
      console.log('Found main_theme:', mainTheme.substring(0, 100));
    }
    // Extract conflict_of_interest from hypothesis & conflict_of_interest node
    // Note: The n8n node outputs it as "Conflict_of_interest" (capital C)
    if (output.conflict_of_interest || output.Conflict_of_interest) {
      conflictOfInterest = (output.conflict_of_interest || output.Conflict_of_interest) as string;
      console.log('Found conflict_of_interest:', conflictOfInterest.substring(0, 100));
    }
    if (output.document_summary) {
      documentSummary = output.document_summary as Array<{ section_title: string; subsection_title?: string; content: string }>;
      console.log('Found document_summary sections:', documentSummary.length);
    }
    if (output.key_takeaways) {
      keyTakeaways = output.key_takeaways as Array<{ point: string; context: string }>;
      console.log('Found key_takeaways:', keyTakeaways.length);
    }
    if (output.terminology_to_clarify) {
      terminologyToClarify = output.terminology_to_clarify as Array<{ term: string; explanation: string }>;
      console.log('Found terminology_to_clarify:', terminologyToClarify.length);
    }
    if (output.gaps_and_limitations) {
      gapsAndLimitations = output.gaps_and_limitations as Array<{ issue: string; reason: string }>;
      console.log('Found gaps_and_limitations:', gapsAndLimitations.length);
    }
    if (output.method_and_materials) {
      methodAndMaterials = output.method_and_materials as Array<{ subsection_title: string; description: string }>;
      console.log('Found method_and_materials:', methodAndMaterials.length);
    }
    if (output.document_basic_info) {
      documentBasicInfo = output.document_basic_info as Array<{ title?: string; authors?: string }>;
      console.log('Found document_basic_info:', documentBasicInfo);
    }
  }

  // Log all section titles for debugging
  console.log('Document summary sections:', documentSummary.map(s => s.section_title));

  // Map document_summary sections to our format
  const findSection = (names: string[]): string => {
    for (const section of documentSummary) {
      const title = section.section_title?.toLowerCase() || '';
      if (names.some(name => title.includes(name))) {
        console.log(`Found section "${section.section_title}" matching ${names}`);
        return section.content;
      }
    }
    return 'Section not found in document.';
  };

  // If we have document_summary but no specific sections found, use all content
  let introduction = findSection(['introduction', 'background', 'overview', 'abstract']);
  let methods = findSection(['method', 'methodology', 'materials', 'procedure', 'experimental', 'design']);
  let results = findSection(['result', 'finding', 'outcome', 'key finding']);
  let discussion = findSection(['discussion', 'interpretation', 'implication', 'analysis']);
  let conclusion = findSection(['conclusion', 'summary', 'final', 'concluding']);

  // If sections weren't found but we have document_summary, use the first sections as fallback
  if (documentSummary.length > 0) {
    if (introduction === 'Section not found in document.' && documentSummary[0]) {
      introduction = documentSummary[0].content;
      console.log('Using first section as introduction fallback');
    }
    if (conclusion === 'Section not found in document.' && documentSummary.length > 1) {
      conclusion = documentSummary[documentSummary.length - 1].content;
      console.log('Using last section as conclusion fallback');
    }
  }

  // Extract key findings from key_takeaways
  const keyFindingsFromTakeaways = keyTakeaways.map(t => t.point).slice(0, 5);
  console.log('Key findings extracted:', keyFindingsFromTakeaways);

  // Extract title and authors from title & author node output (priority)
  // Then fall back to extractedMetadata from PDF text parsing
  let paperTitle = fileName.replace('.pdf', '').replace(/[_-]/g, ' ');
  let paperAuthors: string[] = [];

  // First try the title & author node output
  if (documentBasicInfo.length > 0) {
    for (const info of documentBasicInfo) {
      if (info.title && info.title.trim()) {
        paperTitle = info.title.trim();
        console.log('Using title from title & author node:', paperTitle);
      }
      if (info.authors && info.authors.trim()) {
        // Parse authors string into array
        const authorsStr = info.authors.trim();
        paperAuthors = authorsStr
          .split(/,\s*(?:and\s+)?|(?:\s+and\s+)/i)
          .map(a => a.trim())
          .filter(a => a.length > 0);
        console.log('Using authors from title & author node:', paperAuthors);
      }
    }
  }

  // Fallback to extractedMetadata if no title/authors from n8n
  if (paperTitle === fileName.replace('.pdf', '').replace(/[_-]/g, ' ') && extractedMetadata.title !== 'Title not found') {
    paperTitle = extractedMetadata.title;
    console.log('Fallback to extracted metadata title:', paperTitle);
  }
  if (paperAuthors.length === 0 && extractedMetadata.authors.length > 0) {
    paperAuthors = extractedMetadata.authors;
    console.log('Fallback to extracted metadata authors:', paperAuthors);
  }

  console.log('Final paper title:', paperTitle);
  console.log('Final paper authors:', paperAuthors);

  const result: N8nGeminiResponse = {
    success: true,
    paper: {
      title: paperTitle,
      authors: paperAuthors,
      abstract: mainTheme || 'Abstract not found',
    },
    summaries: {
      introduction,
      methods,
      results,
      discussion,
      conclusion,
      conflictOfInterest: conflictOfInterest || '',
    },
    sectionsFound: {
      introduction: introduction !== 'Section not found in document.',
      methods: methods !== 'Section not found in document.',
      results: results !== 'Section not found in document.',
      discussion: discussion !== 'Section not found in document.',
      conclusion: conclusion !== 'Section not found in document.',
      conflictOfInterest: !!conflictOfInterest,
    },
    metadata: {
      generatedAt: new Date().toISOString(),
      sectionsProcessed: documentSummary.length,
      sectionsSuccessfullyFound: documentSummary.length,
      fullTextLength: 0,
      aiModel: 'OpenAI GPT-4.1-mini (via n8n PDF Summarizer)',
    },
    // Extended fields from all n8n nodes
    keyTakeaways: keyTakeaways,
    terminologyToClarify: terminologyToClarify,
    gapsAndLimitations: gapsAndLimitations,
    methodSections: methodAndMaterials,
    documentSections: documentSummary,
  };

  console.log('Converted response:', JSON.stringify(result, null, 2).substring(0, 1000));
  return result;
}

export function isN8nConfigured(): boolean {
  return !!N8N_WEBHOOK_URL;
}

// Convert n8n response to our database format
export function convertToSummaryFormat(n8nResponse: N8nGeminiResponse) {
  // Create results array from the discussion section (legacy format)
  const results = [];

  if (n8nResponse.sectionsFound.results) {
    results.push({
      label: 'Key Results',
      content: n8nResponse.summaries.results,
      discussion: n8nResponse.sectionsFound.discussion
        ? n8nResponse.summaries.discussion
        : 'Discussion not available'
    });
  }

  // Extract key findings from key_takeaways if available, otherwise from conclusion
  let keyFindings: string[] = [];
  if (n8nResponse.keyTakeaways && n8nResponse.keyTakeaways.length > 0) {
    keyFindings = n8nResponse.keyTakeaways.map(t => t.point).slice(0, 5);
    console.log('Using key_takeaways for key_findings:', keyFindings);
  } else {
    keyFindings = extractKeyFindings(n8nResponse);
  }

  // Filter document sections for Results and Discussion separately
  const documentSections = n8nResponse.documentSections || [];

  const resultsSections = documentSections.filter(s => {
    const title = s.section_title?.toLowerCase() || '';
    return title.includes('result') || title.includes('finding') || title.includes('outcome');
  });

  const discussionSections = documentSections.filter(s => {
    const title = s.section_title?.toLowerCase() || '';
    return title.includes('discussion') || title.includes('interpretation') || title.includes('implication');
  });

  // Build summary data with all fields
  const summaryData = {
    hypothesis: extractHypothesis(n8nResponse),
    introduction: n8nResponse.summaries.introduction,
    methodology: n8nResponse.summaries.methods,
    method_sections: n8nResponse.methodSections || [],
    results: results,
    results_sections: resultsSections,
    discussion_sections: discussionSections,
    conclusion: n8nResponse.summaries.conclusion,
    key_findings: keyFindings,
    terminology_to_clarify: n8nResponse.terminologyToClarify || [],
    gaps_and_limitations: n8nResponse.gapsAndLimitations || [],
    conflict_of_interest: n8nResponse.summaries.conflictOfInterest || ''
  };

  console.log('Final summary data for database:', summaryData);
  return summaryData;
}

// Extract hypothesis from abstract or introduction
function extractHypothesis(response: N8nGeminiResponse): string {
  // Use abstract if available, otherwise use first part of introduction
  if (response.paper.abstract && response.paper.abstract !== 'Abstract not found') {
    // Take first 2-3 sentences as hypothesis
    const sentences = response.paper.abstract.split(/[.!?]+/).filter(s => s.trim().length > 0);
    return sentences.slice(0, 2).join('. ').trim() + '.';
  }
  return 'Hypothesis extracted from paper analysis.';
}

// Extract key findings from conclusion
function extractKeyFindings(response: N8nGeminiResponse): string[] {
  const findings: string[] = [];

  // Try to extract bullet points or key phrases from conclusion
  const conclusion = response.summaries.conclusion;
  if (conclusion && conclusion !== 'Not available') {
    // Split by common separators and take meaningful phrases
    const sentences = conclusion.split(/[.!?]+/).filter(s => s.trim().length > 10);
    sentences.slice(0, 4).forEach(s => {
      const trimmed = s.trim();
      if (trimmed.length > 10 && trimmed.length < 100) {
        findings.push(trimmed);
      }
    });
  }

  // Ensure we have at least some findings
  if (findings.length === 0) {
    findings.push('See full summary for details');
  }

  return findings.slice(0, 5); // Max 5 findings
}
