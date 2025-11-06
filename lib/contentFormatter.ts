/**
 * Utility function to beautify article content by intelligently breaking
 * long paragraphs into smaller, more readable paragraphs.
 * 
 * This function:
 * - Preserves existing paragraph breaks
 * - Splits long text blocks into smaller paragraphs (max ~150 words or ~1000 chars per paragraph)
 * - Handles both HTML and plain text content
 * - Maintains readability by breaking at sentence boundaries
 */

const MAX_PARAGRAPH_LENGTH = 1000; // characters
const MAX_WORDS_PER_PARAGRAPH = 150;
const MIN_PARAGRAPH_LENGTH = 200; // Don't split if paragraph is already short

/**
 * Formats plain text content into well-structured paragraphs
 */
export function formatPlainText(text: string): string {
  if (!text || text.trim().length === 0) {
    return text;
  }

  // First, split by existing paragraph breaks (double newlines)
  const existingParagraphs = text.split(/\n\s*\n/);
  const formattedParagraphs: string[] = [];

  for (const paragraph of existingParagraphs) {
    const trimmed = paragraph.trim();
    if (!trimmed) continue;

    // If paragraph is already short, keep it as is
    if (trimmed.length <= MIN_PARAGRAPH_LENGTH) {
      formattedParagraphs.push(trimmed);
      continue;
    }

    // Split into sentences (basic sentence detection)
    // Look for sentence endings followed by space and capital letter
    const sentences = trimmed.match(/[^.!?]+[.!?]+(?:\s+|$)/g) || [trimmed];
    
    let currentParagraph = '';
    let currentWordCount = 0;

    for (const sentence of sentences) {
      const sentenceWords = sentence.trim().split(/\s+/).length;
      
      // If adding this sentence would exceed limits, start a new paragraph
      if (currentParagraph && 
          (currentParagraph.length + sentence.length > MAX_PARAGRAPH_LENGTH ||
           currentWordCount + sentenceWords > MAX_WORDS_PER_PARAGRAPH)) {
        formattedParagraphs.push(currentParagraph.trim());
        currentParagraph = sentence.trim();
        currentWordCount = sentenceWords;
      } else {
        currentParagraph += (currentParagraph ? ' ' : '') + sentence.trim();
        currentWordCount += sentenceWords;
      }
    }

    // Add the last paragraph if it exists
    if (currentParagraph.trim()) {
      formattedParagraphs.push(currentParagraph.trim());
    }
  }

  return formattedParagraphs.join('\n\n');
}

/**
 * Formats HTML content into well-structured paragraphs
 * Preserves HTML tags while improving paragraph structure
 */
export function formatHtmlContent(html: string): string {
  if (!html || html.trim().length === 0) {
    return html;
  }

  // First, check if content already has well-structured paragraphs
  const existingParagraphs = html.match(/<p[^>]*>[\s\S]*?<\/p>/gi);
  if (existingParagraphs && existingParagraphs.length > 1) {
    // Content already has multiple paragraphs, check if they need splitting
    const needsReformatting = existingParagraphs.some(p => {
      const text = p.replace(/<[^>]*>/g, '').trim();
      return text.length > MAX_PARAGRAPH_LENGTH;
    });

    if (!needsReformatting) {
      // Paragraphs are already well-sized, return as-is
      return html;
    }
  }

  // Remove existing <p> tags but preserve their content
  let text = html.replace(/<\/p>\s*<p[^>]*>/gi, '\n\n');
  text = text.replace(/<p[^>]*>/gi, '');
  text = text.replace(/<\/p>/gi, '');
  
  // Remove other block-level tags but keep their content
  text = text.replace(/<\/?(div|section|article)[^>]*>/gi, '');
  
  // Preserve other inline HTML tags (like <strong>, <em>, <a>, etc.)
  // We'll strip them temporarily for formatting, then restore structure
  const tagPlaceholders: { [key: string]: string } = {};
  let placeholderIndex = 0;
  
  // Store inline tags temporarily
  text = text.replace(/<(\/?)([a-z]+)[^>]*>/gi, (match, closing, tagName) => {
    const placeholder = `__TAG_${placeholderIndex}__`;
    tagPlaceholders[placeholder] = match;
    placeholderIndex++;
    return placeholder;
  });
  
  // Now format the plain text
  const formattedText = formatPlainText(text);
  
  // Restore HTML tags
  let restoredText = formattedText;
  Object.keys(tagPlaceholders).forEach(placeholder => {
    restoredText = restoredText.replace(placeholder, tagPlaceholders[placeholder]);
  });
  
  // Wrap each paragraph in <p> tags
  const paragraphs = restoredText.split(/\n\s*\n/).filter(p => p.trim());
  return paragraphs.map(p => `<p>${p.trim()}</p>`).join('\n');
}

/**
 * Main function to beautify content - automatically detects HTML vs plain text
 */
export function beautifyContent(content: string): string {
  if (!content || content.trim().length === 0) {
    return content;
  }

  // Check if content contains HTML tags
  const hasHtml = /<[a-z][\s\S]*>/i.test(content);
  
  if (hasHtml) {
    return formatHtmlContent(content);
  } else {
    return formatPlainText(content);
  }
}

