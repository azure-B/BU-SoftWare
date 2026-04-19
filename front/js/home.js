async function checkHealth() {
  const el = document.getElementById('status');
  el.innerHTML = '<span class="loader"></span>';
  try {
    const data = await api('GET', '/api/hello');
    el.innerHTML = `<span class="badge badge-green">✓ 정상</span> &nbsp; ${data.message} &nbsp; <span style="color:var(--muted); font-size:0.8rem">${data.timestamp}</span>`;
  } catch {
    el.innerHTML = `<span class="badge badge-red">✗ 오류</span> 서버에 연결할 수 없습니다.`;
  }
}

checkHealth();
