const {
  sanitizePostContent,
  isEmptyHtml,
  plainTextFromHtml,
} = require('../src/utils/sanitizeHtml');

describe('sanitizeHtml', () => {
  it('removes script tags from post content', () => {
    const input = '<p>hello</p><script>alert(1)</script>';
    expect(sanitizePostContent(input)).toBe('<p>hello</p>');
  });

  it('detects empty editor html', () => {
    expect(isEmptyHtml('<p><br></p>')).toBe(true);
    expect(isEmptyHtml('<p>hello</p>')).toBe(false);
  });

  it('extracts plain text from html', () => {
    expect(plainTextFromHtml('<p><strong>hi</strong></p>')).toBe('hi');
  });
});
