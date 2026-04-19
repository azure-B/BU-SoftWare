// In-memory 유저 저장소 (실제 프로젝트에서는 DB로 교체)
let users = [
  { id: 1, name: '홍길동', email: 'hong@example.com' },
  { id: 2, name: '김철수', email: 'kim@example.com'  },
];
let nextId = 3;

const UserModel = {
  findAll: () => [...users],

  findById: (id) => users.find(u => u.id === id),

  create: ({ name, email }) => {
    const user = { id: nextId++, name, email };
    users.push(user);
    return user;
  },

  delete: (id) => {
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) return false;
    users.splice(idx, 1);
    return true;
  },
};

module.exports = UserModel;
