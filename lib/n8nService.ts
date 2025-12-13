// n8n Webhook Service for Paper Summary Generation (Gemini Workflow)

const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || '';

// Try direct call first (n8n has CORS headers), fall back to proxy if needed
const getWebhookUrl = () => {
  // Direct call - n8n workflow has Access-Control-Allow-Origin: * header
  return N8N_WEBHOOK_URL;
};

// Response format from your Gemini workflow
export interface N8nGeminiResponse {
  success: boolean;
  paper: {
    title: string;
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
}

export async function triggerPaperSummary(
  pdfText: string,
  fileName: string,
  onProgress?: (stage: string) => void
): Promise<N8nGeminiResponse> {
  if (!N8N_WEBHOOK_URL) {
    throw new Error('N8N_WEBHOOK_URL is not configured. Add VITE_N8N_WEBHOOK_URL to your .env file.');
  }

  onProgress?.('Sending paper to AI for analysis...');

  const webhookUrl = getWebhookUrl();
  console.log('Calling n8n webhook:', webhookUrl);
  console.log('Text length:', pdfText.length, 'chars, file:', fileName);

  // Send extracted text as JSON instead of binary file
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
  console.log('n8n response preview:', responseText.substring(0, 200));

  let result: N8nGeminiResponse;
  try {
    result = JSON.parse(responseText);
  } catch (parseError) {
    console.error('Failed to parse n8n response:', responseText.substring(0, 500));
    throw new Error('Invalid JSON response from n8n workflow');
  }

  if (!result.success) {
    console.error('n8n workflow returned success: false', result);
    throw new Error('Paper summary generation failed');
  }

  return result;
}

export function isN8nConfigured(): boolean {
  return !!N8N_WEBHOOK_URL;
}

// Convert n8n response to our database format
export function convertToSummaryFormat(n8nResponse: N8nGeminiResponse) {
  // Create results array from the discussion section
  // Since your workflow has separate results and discussion, we combine them
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

  // Extract key findings from the abstract or conclusion
  const keyFindings = extractKeyFindings(n8nResponse);

  return {
    hypothesis: extractHypothesis(n8nResponse),
    introduction: n8nResponse.summaries.introduction,
    methodology: n8nResponse.summaries.methods,
    results: results,
    conclusion: n8nResponse.summaries.conclusion,
    conflict_of_interest: n8nResponse.summaries.conflictOfInterest,
    key_findings: keyFindings
  };
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
