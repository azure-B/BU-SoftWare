// 서버 사이드 카운터 (상태 유지)
let count = 0;

const CounterModel = {
  get:    ()      => count,
  adjust: (delta) => { count += delta; return count; },
  reset:  ()      => { count = 0;      return count; },
};

module.exports = CounterModel;
