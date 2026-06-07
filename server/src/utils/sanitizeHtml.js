const sanitizeHtmlLib = require('sanitize-html');

const SANITIZE_OPTIONS = {
  allowedTags: [
    'p',
    'br',
    'strong',
    'em',
    'u',
    's',
    'ul',
    'ol',
    'li',
    'a',
    'h1',
    'h2',
    'h3',
    'blockquote',
    'span',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    span: ['style'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedStyles: {
    span: {
      'font-weight': [/^bold$/],
      'font-style': [/^italic$/],
      'text-decoration': [/^underline$/],
    },
  },
  transformTags: {
    a: sanitizeHtmlLib.simpleTransform('a', {
      rel: 'noopener noreferrer',
      target: '_blank',
    }),
  },
};

function plainTextFromHtml(html) {
  return String(html)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function isEmptyHtml(html) {
  return plainTextFromHtml(html).length === 0;
}

function sanitizePostContent(html) {
  return sanitizeHtmlLib(String(html ?? ''), SANITIZE_OPTIONS).trim();
}

module.exports = {
  sanitizePostContent,
  isEmptyHtml,
  plainTextFromHtml,
};
