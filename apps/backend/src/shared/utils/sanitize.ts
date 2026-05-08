import sanitizeHtml from 'sanitize-html';

/**
 * Sanitize HTML/markdown content trước khi lưu DB.
 * Cho phép các tag markdown-safe, chặn script/event handlers/javascript:.
 */
export function sanitizeContent(dirty: string): string {
  return sanitizeHtml(dirty, {
    allowedTags: [
      // Block elements
      'p', 'br', 'div', 'blockquote', 'pre', 'code',
      // Headings
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      // Lists
      'ul', 'ol', 'li',
      // Inline
      'strong', 'b', 'em', 'i', 'u', 's', 'del', 'ins', 'mark', 'sup', 'sub',
      // Links & media
      'a', 'img',
      // Table
      'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
      // KaTeX renders to span/math — allow them
      'span', 'math', 'semantics', 'mrow', 'mi', 'mn', 'mo', 'msup', 'msub',
      'mfrac', 'mover', 'munder', 'msqrt', 'mroot', 'mtext', 'annotation',
    ],
    allowedAttributes: {
      'a': ['href', 'title', 'target', 'rel'],
      'img': ['src', 'alt', 'title', 'width', 'height'],
      'code': ['class'],      // highlight.js dùng class
      'pre': ['class'],
      'span': ['class', 'style'],  // KaTeX dùng class + style
      'math': ['xmlns'],
      '*': ['id'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: {
      img: ['http', 'https', 'data'],  // cho phép base64 images
    },
    // Không cho href là javascript:
    allowedSchemesAppliedToAttributes: ['href', 'src'],
    // Với tag không rõ → strip tag nhưng giữ nội dung bên trong
    nonTextTags: ['script', 'style', 'textarea', 'noscript', 'iframe', 'object', 'embed'],
    // Tự động thêm rel="noopener noreferrer" cho external links
    transformTags: {
      'a': sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }),
    },
  });
}

/**
 * Sanitize plain text — loại bỏ hoàn toàn HTML tags.
 * Dùng cho title, tên, các field không cần rich text.
 */
export function sanitizeText(dirty: string): string {
  return sanitizeHtml(dirty, { allowedTags: [], allowedAttributes: {} }).trim();
}
