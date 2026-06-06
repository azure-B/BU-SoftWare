export const NEW_POST_CATEGORIES = [
  { value: 'mentoring', label: '멘토링' },
  { value: 'team', label: '팀프로젝트' },
];

export const NEW_POST_GUIDELINES = [
  '비방·모욕 글은 삭제될 수 있습니다.',
  '저작권 침해 자료 업로드 금지',
  '홍보·스팸 게시물은 제재 대상',
  '개인정보 포함 작성 금지',
];

export const EDITOR_TOOLBAR = [
  { icon: 'format_bold', label: 'Bold', command: 'bold' },
  { icon: 'format_italic', label: 'Italic', command: 'italic' },
  { icon: 'format_underlined', label: 'Underline', command: 'underline' },
  { divider: true },
  { icon: 'format_list_bulleted', label: 'Bullet list', command: 'insertUnorderedList' },
  { icon: 'format_list_numbered', label: 'Numbered list', command: 'insertOrderedList' },
];

export function defaultCategoryForBoard(boardSlug) {
  if (boardSlug === 'team') return 'team';
  return 'mentoring';
}
