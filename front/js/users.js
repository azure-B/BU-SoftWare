async function loadUsers() {
  const tbody = document.getElementById('user-list');
  try {
    const users = await api('GET', '/api/users');
    if (!users.length) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--muted)">유저가 없습니다.</td></tr>`;
      return;
    }
    tbody.innerHTML = users.map(u => `
      <tr>
        <td style="color:var(--muted); font-size:0.8rem">#${u.id}</td>
        <td>${u.name}</td>
        <td>${u.email}</td>
        <td><span class="badge badge-green">active</span></td>
        <td>
          <button class="btn btn-danger" style="padding:4px 12px" onclick="deleteUser(${u.id})">삭제</button>
        </td>
      </tr>
    `).join('');
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="5" style="color:var(--danger)">${e.message}</td></tr>`;
  }
}

async function addUser() {
  const name  = document.getElementById('inp-name').value.trim();
  const email = document.getElementById('inp-email').value.trim();
  if (!name || !email) return showToast('이름과 이메일을 입력해주세요.');
  try {
    await api('POST', '/api/users', { name, email });
    document.getElementById('inp-name').value  = '';
    document.getElementById('inp-email').value = '';
    showToast(`✓ ${name} 추가 완료`);
    loadUsers();
  } catch (e) {
    showToast(`✗ ${e.message}`);
  }
}

async function deleteUser(id) {
  try {
    await api('DELETE', `/api/users/${id}`);
    showToast('삭제 완료');
    loadUsers();
  } catch (e) {
    showToast(`✗ ${e.message}`);
  }
}

loadUsers();
