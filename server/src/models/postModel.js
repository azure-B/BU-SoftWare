// In-memory 게시글 저장소
let posts = [
  { id: 1, title: '첫 번째 게시글', body: 'Express MVC 예제입니다.', createdAt: new Date().toISOString() },
];
let nextId = 2;

const PostModel = {
  findAll: () => [...posts],

  findById: (id) => posts.find(p => p.id === id),

  create: ({ title, body }) => {
    const post = { id: nextId++, title, body, createdAt: new Date().toISOString() };
    posts.push(post);
    return post;
  },

  delete: (id) => {
    const idx = posts.findIndex(p => p.id === id);
    if (idx === -1) return false;
    posts.splice(idx, 1);
    return true;
  },
};

module.exports = PostModel;
