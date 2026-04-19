async function loadCount() {
  try {
    const data = await api('GET', '/api/counter');
    setDisplay(data.count);
  } catch {
    document.getElementById('count').textContent = 'ERR';
  }
}

function setDisplay(val) {
  const el = document.getElementById('count');
  el.textContent = val;
  el.classList.add('bump');
  setTimeout(() => el.classList.remove('bump'), 150);
}

async function adjust(delta) {
  try {
    const data = await api('POST', '/api/counter/adjust', { delta });
    setDisplay(data.count);
  } catch (e) {
    showToast(`✗ ${e.message}`);
  }
}

async function reset() {
  try {
    const data = await api('POST', '/api/counter/reset');
    setDisplay(data.count);
    showToast('카운터 초기화 완료');
  } catch (e) {
    showToast(`✗ ${e.message}`);
  }
}

loadCount();
