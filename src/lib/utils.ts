/**
 * utils.ts
 * Implements frontend Zero Trust guidelines: Input sanitization, HTML sanitization, 
 * file upload validation, and secure handling of data inputs.
 */

/**
 * Sanitizes arbitrary HTML strings safely by parsing and removing forbidden tags,
 * scripts, iframes, inline event handlers (on*), and "javascript:" URI protocols.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const body = doc.body;

    // Allowed tags list (whitelist)
    const allowedTags = new Set([
      'p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'span', 'div', 
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'img', 'b', 'i', 
      'pre', 'code', 'blockquote', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td'
    ]);

    // Allowed attributes per tag
    const allowedAttributes: Record<string, string[]> = {
      'a': ['href', 'target', 'rel', 'class', 'id'],
      'img': ['src', 'alt', 'title', 'class', 'id', 'width', 'height'],
      'span': ['class', 'id'],
      'div': ['class', 'id'],
      'p': ['class', 'id'],
      'h1': ['class', 'id'],
      'h2': ['class', 'id'],
      'h3': ['class', 'id'],
      'h4': ['class', 'id'],
      'h5': ['class', 'id'],
      'h6': ['class', 'id'],
      'ol': ['class', 'id'],
      'ul': ['class', 'id'],
      'li': ['class', 'id'],
      'pre': ['class', 'id'],
      'code': ['class', 'id']
    };

    // Recursive cleaner function
    const cleanElement = (node: Node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const tagName = el.tagName.toLowerCase();

        // 1. Remove blacklisted/not whitelisted tags
        if (!allowedTags.has(tagName)) {
          // Replace node with its text contents, or remove it entirely if harmful
          if (['script', 'iframe', 'style', 'object', 'embed', 'form', 'input', 'button', 'textarea', 'svg', 'meta', 'link'].includes(tagName)) {
            el.parentNode?.removeChild(el);
            return;
          } else {
            // Un-wrap other unknown elements
            while (el.firstChild) {
              el.parentNode?.insertBefore(el.firstChild, el);
            }
            el.parentNode?.removeChild(el);
            return;
          }
        }

        // 2. Filter attributes
        const attrs = Array.from(el.attributes);
        const allowedAttrs = allowedAttributes[tagName] || ['class', 'id'];

        for (const attr of attrs) {
          const attrName = attr.name.toLowerCase();

          // Block all inline event handlers (onerror, onload, onclick, etc.)
          if (attrName.startsWith('on')) {
            el.removeAttribute(attr.name);
            continue;
          }

          // Whitelist attributes
          if (!allowedAttrs.includes(attrName)) {
            el.removeAttribute(attr.name);
            continue;
          }

          // Specific validation for URLs
          if (attrName === 'href') {
            const hrefVal = attr.value.trim().toLowerCase();
            // Block javascript:, data: (except safe image data URIs if applicable, but href shouldn't be image data), vbscript:, etc.
            if (hrefVal.startsWith('javascript:') || hrefVal.startsWith('data:') || hrefVal.startsWith('vbscript:')) {
              el.removeAttribute(attr.name);
            } else {
              // Standard secure overrides
              el.setAttribute('target', '_blank');
              el.setAttribute('rel', 'noopener noreferrer');
            }
          }

          if (attrName === 'src') {
            const srcVal = attr.value.trim().toLowerCase();
            // Block executable scripts, javascript protocols in img src
            if (srcVal.startsWith('javascript:') || srcVal.startsWith('vbscript:')) {
              el.removeAttribute(attr.name);
            }
          }
        }

        // Clean all children
        const children = Array.from(el.childNodes);
        children.forEach(cleanElement);
      } else if (node.nodeType === Node.TEXT_NODE) {
        // Text nodes are inherently safe
      } else {
        // Remove comments or other non-text nodes
        node.parentNode?.removeChild(node);
      }
    };

    // Clean all child nodes of body
    const rootNodes = Array.from(body.childNodes);
    rootNodes.forEach(cleanElement);

    return body.innerHTML;
  } catch (error) {
    console.error('HTML Sanitization error, returning plain text:', error);
    // Fallback: strip all tags
    return html.replace(/<[^>]*>?/gm, '');
  }
}

/**
 * Sanitizes file names to prevent directory traversal (../../) or illegal payload characters.
 * Replaces spaces with underscores and keeps only alphanumeric, dots, hyphens, and underscores.
 */
export function sanitizeFileName(name: string): string {
  if (!name) return `submission_${Date.now()}`;

  // Remove directory traversals or Windows/Linux path prefixes
  let baseName = name.replace(/^.*[\\\/]/, '');

  // Split extension
  const dotIndex = baseName.lastIndexOf('.');
  let label = dotIndex !== -1 ? baseName.substring(0, dotIndex) : baseName;
  let ext = dotIndex !== -1 ? baseName.substring(dotIndex + 1) : '';

  // Clean label and ext (allow standard characters only)
  label = label.replace(/[^a-zA-Z0-9_\-]/g, '_');
  ext = ext.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

  // Reconstruct filename
  let sanitized = ext ? `${label}.${ext}` : label;

  // Final length sanity limit
  if (sanitized.length > 120) {
    sanitized = sanitized.substring(0, 120);
  }

  // Prevent dot-only files or empty names
  if (!sanitized || sanitized.startsWith('.') || sanitized === '..' || sanitized === '.') {
    return `hw_file_${Date.now()}`;
  }

  return sanitized;
}

/**
 * Checks if a file extension is in the safe whitelist.
 * Absolutely blocks script executors or active pages (.html, .js, .exe, .sh, .bat, etc.)
 */
export function isSafeFileExtension(fileName: string): boolean {
  if (!fileName || !fileName.includes('.')) return false;
  
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  
  // Explicit whitelist of secure course materials and student formats
  const safeExtensions = new Set([
    // Documents
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'rtf', 'odt', 'ods', 'odp',
    // Images
    'png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg', 'tiff', 'webp',
    // Archives (compressed submissions)
    'zip', 'rar', '7z', 'tar', 'gz',
    // Media / Audio / Video (if students record voice notes/explanations)
    'mp3', 'wav', 'm4a', 'ogg', 'mp4', 'mov', 'avi', 'mkv', 'webm'
  ]);

  return safeExtensions.has(ext);
}

/**
 * Sanitizes student names against HTML injection, excessive whitespaces, and symbols.
 */
export function sanitizeStudentName(name: string): string {
  if (!name) return '';
  
  // 1. Strip any HTML markup
  const textOnly = name.replace(/<[^>]*>?/gm, '');
  
  // 2. Keep only human name characters (Unicode letters, space, dot, apostrophe, hyphen)
  // Support Indonesian names with typical characters
  const cleaned = textOnly.replace(/[^a-zA-Z0-9\s.\-']/g, '');
  
  // 3. Remove excessive spaces and limit size
  return cleaned.replace(/\s+/g, ' ').trim().substring(0, 70);
}

/**
 * Parses out potential hidden youtube links stored within text descriptions or contents.
 */
export function parseYoutubeLink(text: string): { cleanText: string; youtubeLink: string } {
  if (!text) return { cleanText: '', youtubeLink: '' };
  const match = text.match(/\|\|YT_LINK:(.*?)\|\|/);
  if (match) {
    return {
      cleanText: text.replace(/\|\|YT_LINK:(.*?)\|\|/, '').trim(),
      youtubeLink: match[1].trim()
    };
  }
  return { cleanText: text, youtubeLink: '' };
}

/**
 * Converts standard YouTube URLs into embeddable player links.
 */
export function getYoutubeEmbedUrl(url: string): string {
  if (!url) return '';
  let videoId = '';
  try {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      videoId = match[2];
    }
  } catch (e) {
    console.error('Failed to parse youtube link', e);
  }
  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}`;
  }
  return '';
}

/**
 * Encodes a student-submitted link inside a safe filename.
 */
export function encodeSubmissionLink(url: string, studentName: string): string {
  if (!url) return '';
  // Convert URL to Base64 and make it safe for file systems by substituting '/' and '+'
  const safeBase64 = btoa(url).replace(/\//g, '_').replace(/\+/g, '-').replace(/=/g, '');
  const safeName = studentName.replace(/[^a-zA-Z0-9]/g, '_');
  return `LINK_SUB_${safeBase64}_${safeName}.docx`;
}

/**
 * Decodes the original URL from a safe filename.
 */
export function decodeSubmissionLink(filename: string): string {
  if (!filename || !filename.startsWith('LINK_SUB_')) return '';
  const parts = filename.split('_');
  if (parts.length < 3) return '';
  const safeBase64 = parts[2];
  // Restore base64 padding and characters
  let base64 = safeBase64.replace(/_/g, '/').replace(/-/g, '+');
  while (base64.length % 4) {
    base64 += '=';
  }
  try {
    return atob(base64);
  } catch (e) {
    console.error('Failed to decode link from filename:', e);
    return '';
  }
}


