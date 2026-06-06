const HASHTAG_REGEX = /#([가-힣A-Za-z0-9_]+)/g;

function extractHashtags(text) {
  if (!text) return [];
  const seen = new Set();
  const tags = [];

  for (const match of String(text).matchAll(HASHTAG_REGEX)) {
    const tag = match[1];
    if (!seen.has(tag)) {
      seen.add(tag);
      tags.push(tag);
    }
  }

  return tags;
}

function extractHashtagsFromPost(post) {
  return extractHashtags(`${post.title ?? ''} ${post.content ?? ''}`);
}

function isRecruitPost(title = '') {
  return String(title).trim().startsWith('[같이밥]');
}

function aggregateTagCounts(posts) {
  const global = {};
  const byBoard = {};

  for (const post of posts) {
    const tags = extractHashtagsFromPost(post);
    const boardId = post.board_id;

    if (!byBoard[boardId]) byBoard[boardId] = {};

    for (const tag of tags) {
      global[tag] = (global[tag] ?? 0) + 1;
      byBoard[boardId][tag] = (byBoard[boardId][tag] ?? 0) + 1;
    }
  }

  return { global, byBoard };
}

function pickTopTags(globalCounts, limit = 7) {
  return Object.entries(globalCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag]) => tag);
}

module.exports = {
  HASHTAG_REGEX,
  extractHashtags,
  extractHashtagsFromPost,
  isRecruitPost,
  aggregateTagCounts,
  pickTopTags,
};
