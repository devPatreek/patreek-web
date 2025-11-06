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

const MAX_PARAGRAPH_LENGTH = 600; // characters - more aggressive splitting
const MAX_WORDS_PER_PARAGRAPH = 100; // words per paragraph
const MIN_PARAGRAPH_LENGTH = 150; // Don't split if paragraph is already short

/**
 * Formats plain text content into well-structured paragraphs
 */
export function formatPlainText(text: string): string {
  if (!text || text.trim().length === 0) {
    return text;
  }

  // First, split by existing paragraph breaks (double newlines, or single newline if followed by capital)
  // Also handle cases where there might be no paragraph breaks at all
  let existingParagraphs: string[] = [];
  
  // Try splitting by double newlines first
  if (text.includes('\n\n')) {
    existingParagraphs = text.split(/\n\s*\n/);
  } else if (text.includes('\n')) {
    // Single newlines - might be intentional breaks
    existingParagraphs = text.split(/\n/);
  } else {
    // No breaks at all - treat as one big paragraph
    existingParagraphs = [text];
  }
  
  const formattedParagraphs: string[] = [];

  for (const paragraph of existingParagraphs) {
    const trimmed = paragraph.trim();
    if (!trimmed) continue;

    // If paragraph is already short, keep it as is
    if (trimmed.length <= MIN_PARAGRAPH_LENGTH) {
      formattedParagraphs.push(trimmed);
      continue;
    }

    // Split into sentences - improved detection with multiple strategies
    let sentences: string[] = [];
    
    // Strategy 1: Split by sentence endings (. ! ?) followed by space and capital letter or end of string
    // This handles most normal sentences
    const sentenceEndings = trimmed.split(/([.!?]+["']?\s+)/);
    let currentSentence = '';
    
    for (let i = 0; i < sentenceEndings.length; i++) {
      const part = sentenceEndings[i];
      if (!part) continue;
      
      // If this part ends with sentence punctuation
      if (/[.!?]+["']?\s*$/.test(part)) {
        currentSentence += part;
        if (currentSentence.trim()) {
          sentences.push(currentSentence.trim());
        }
        currentSentence = '';
      } else {
        currentSentence += part;
      }
    }
    
    // Add any remaining text
    if (currentSentence.trim()) {
      sentences.push(currentSentence.trim());
    }
    
    // Strategy 2: If we didn't get good sentence splits, try simpler approach
    if (sentences.length <= 1 || sentences.some(s => s.length > MAX_PARAGRAPH_LENGTH * 2)) {
      // Split by periods, exclamation, question marks more aggressively
      sentences = trimmed.split(/([.!?]+["']?\s*)/).filter(s => s.trim().length > 0);
      
      // Recombine punctuation with preceding text
      const combined: string[] = [];
      for (let i = 0; i < sentences.length; i++) {
        if (/^[.!?]+["']?\s*$/.test(sentences[i])) {
          // This is punctuation, add to previous
          if (combined.length > 0) {
            combined[combined.length - 1] += sentences[i];
          }
        } else {
          combined.push(sentences[i]);
        }
      }
      sentences = combined.filter(s => s.trim().length > 0);
    }
    
    // Strategy 3: If still no good splits, split by commas or semicolons as fallback
    if (sentences.length <= 1 && trimmed.length > MAX_PARAGRAPH_LENGTH) {
      sentences = trimmed.split(/([.;]\s+)/).filter(s => s.trim().length > 0);
    }
    
    // Strategy 4: Final fallback - split by word count to ensure we break up huge blocks
    if (sentences.length <= 1 || sentences.some(s => s.length > MAX_PARAGRAPH_LENGTH * 1.5)) {
      const words = trimmed.split(/\s+/).filter(w => w.length > 0);
      const targetParagraphs = Math.ceil(trimmed.length / MAX_PARAGRAPH_LENGTH);
      const wordsPerChunk = Math.max(30, Math.ceil(words.length / targetParagraphs));
      
      sentences = [];
      for (let i = 0; i < words.length; i += wordsPerChunk) {
        const chunk = words.slice(i, i + wordsPerChunk).join(' ');
        if (chunk.trim()) {
          sentences.push(chunk.trim());
        }
      }
    }
    
    let currentParagraph = '';
    let currentWordCount = 0;

    for (const sentence of sentences) {
      const sentenceTrimmed = sentence.trim();
      if (!sentenceTrimmed) continue;
      
      const sentenceWords = sentenceTrimmed.split(/\s+/).filter(w => w.length > 0).length;
      const sentenceLength = sentenceTrimmed.length;
      
      // If current paragraph + this sentence would exceed limits, start a new paragraph
      if (currentParagraph && 
          (currentParagraph.length + sentenceLength + 1 > MAX_PARAGRAPH_LENGTH ||
           currentWordCount + sentenceWords > MAX_WORDS_PER_PARAGRAPH)) {
        if (currentParagraph.trim()) {
          formattedParagraphs.push(currentParagraph.trim());
        }
        currentParagraph = sentenceTrimmed;
        currentWordCount = sentenceWords;
      } else {
        currentParagraph += (currentParagraph ? ' ' : '') + sentenceTrimmed;
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

  // Always check if paragraphs need reformatting, even if they exist
  const existingParagraphs = html.match(/<p[^>]*>[\s\S]*?<\/p>/gi);
  if (existingParagraphs) {
    // Check if any paragraph is too long
    const needsReformatting = existingParagraphs.some(p => {
      const text = p.replace(/<[^>]*>/g, '').trim();
      return text.length > MAX_PARAGRAPH_LENGTH;
    });

    // If paragraphs are well-sized, return as-is
    if (!needsReformatting && existingParagraphs.length > 2) {
      return html;
    }
    
    // If we have paragraphs but they're too long, we'll reformat them below
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

