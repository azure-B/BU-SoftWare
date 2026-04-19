async function loadPosts() {
  const container = document.getElementById('post-list');
  try {
    const posts = await api('GET', '/api/posts');
    if (!posts.length) {
      container.innerHTML = `<div class="card" style="color:var(--muted); text-align:center">게시글이 없습니다.</div>`;
      return;
    }
    container.innerHTML = posts.slice().reverse().map(p => `
      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:flex-start">
          <div>
            <div style="font-weight:600; margin-bottom:6px">${p.title}</div>
            <div style="color:var(--muted); font-size:0.9rem">${p.body}</div>
            <div style="color:var(--muted); font-size:0.75rem; margin-top:10px">#${p.id} · ${new Date(p.createdAt).toLocaleString('ko-KR')}</div>
          </div>
          <button class="btn btn-danger" style="padding:4px 12px; flex-shrink:0; margin-left:16px" onclick="deletePost(${p.id})">삭제</button>
        </div>
      </div>
    `).join('');
  } catch (e) {
    container.innerHTML = `<div class="card" style="color:var(--danger)">${e.message}</div>`;
  }
}

async function addPost() {
  const title = document.getElementById('inp-title').value.trim();
  const body  = document.getElementById('inp-body').value.trim();
  if (!title || !body) return showToast('제목과 내용을 입력해주세요.');
  try {
    await api('POST', '/api/posts', { title, body });
    document.getElementById('inp-title').value = '';
    document.getElementById('inp-body').value  = '';
    showToast('✓ 게시글 작성 완료');
    loadPosts();
  } catch (e) {
    showToast(`✗ ${e.message}`);
  }
}

async function deletePost(id) {
  try {
    await api('DELETE', `/api/posts/${id}`);
    showToast('삭제 완료');
    loadPosts();
  } catch (e) {
    showToast(`✗ ${e.message}`);
  }
}

loadPosts();
