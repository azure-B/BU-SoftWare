// 실제 프로젝트에서는 DB 연결 로직이 들어오는 레이어
const HomeModel = {
  getGreeting: () => {
    return {
      message: 'Hello, World!',
      timestamp: new Date().toISOString(),
    };
  },
};

module.exports = HomeModel;
