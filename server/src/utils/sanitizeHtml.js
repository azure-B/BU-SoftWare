function stripScripts(html) {
  return String(html).replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
}

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
  return stripScripts(String(html ?? '')).trim();
}

module.exports = {
  sanitizePostContent,
  isEmptyHtml,
  plainTextFromHtml,
};
