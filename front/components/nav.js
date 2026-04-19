// ==========================================
// components/nav.js — 공통 네비게이션 주입
// ==========================================

function renderNav() {
  const links = [
    { href: '../pages/home.html',    label: 'Home'    },
    { href: '../pages/users.html',   label: 'Users'   },
    { href: '../pages/posts.html',   label: 'Posts'   },
    { href: '../pages/counter.html', label: 'Counter' },
  ];

  const current = window.location.pathname;

  const html = `
    <nav>
      <div class="container nav-inner">
        <span class="logo">⚡ express-app</span>
        ${links.map(l => `
          <a href="${l.href}" class="${current.endsWith(l.href.split('/').pop()) ? 'active' : ''}">
            ${l.label}
          </a>
        `).join('')}
      </div>
    </nav>
  `;

  document.body.insertAdjacentHTML('afterbegin', html);
}

// ==========================================
// Toast 유틸
// ==========================================
function showToast(msg, duration = 2500) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), duration);
}

// ==========================================
// API 헬퍼
// Live Server(5500) → Express(3000) 크로스 오리진 요청
// ==========================================
const API_BASE = 'http://localhost:3000';

async function api(method, path, body) {
  const url  = `${API_BASE}${path}`;
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);
  const res  = await fetch(url, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}
