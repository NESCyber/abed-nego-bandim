// Check saved theme and apply it immediately to prevent light flash
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
  document.body.classList.add('dark-theme');
}

const API = '/api';

/* ── Auth guard ─────────────────────────────────────────────── */
function getToken() {
  return localStorage.getItem('admin_token');
}
function getUser() {
  try { return JSON.parse(localStorage.getItem('admin_user')) || {}; } catch { return {}; }
}
function requireAuth() {
  if (!getToken()) window.location.href = 'admin-login.html';
}
function logout() {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_user');
  window.location.href = 'admin-login.html';
}

/* ── Authenticated fetch ─────────────────────────────────────── */
async function authFetch(endpoint, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;

  try {
    const res  = await fetch(API + endpoint, { ...options, headers });
    if (res.status === 401 || res.status === 403) { logout(); return; }
    return await res.json();
  } catch (err) {
    console.error('Admin API error:', err);
    return { success: false, message: 'Network error.' };
  }
}

/* ── Multipart (file upload) fetch ─────────────────────────── */
async function authUpload(endpoint, formData) {
  const token = getToken();
  const headers = {};
  if (token) headers['Authorization'] = 'Bearer ' + token;
  try {
    const res  = await fetch(API + endpoint, { method: 'POST', headers, body: formData });
    return await res.json();
  } catch (err) {
    return { success: false, message: 'Upload failed.' };
  }
}

/* ── Inject sidebar & topbar ─────────────────────────────────── */
function injectAdminShell(activePage) {
  requireAuth();
  const user = getUser();

  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    sidebar.innerHTML = `
      <div class="sidebar__brand">
        <div class="sidebar__brand-name">MP Admin Panel</div>
        <div class="sidebar__brand-sub">Dr. A.L. Bandim, MP</div>
      </div>
      <nav class="sidebar__nav">
        <div class="sidebar__section-label">Overview</div>
        <a href="dashboard.html"  class="sidebar__link ${activePage==='dashboard'?'active':''}">Dashboard</a>
        <div class="sidebar__section-label">Content</div>
        <a href="admin-posts.html"    class="sidebar__link ${activePage==='posts'?'active':''}">Posts</a>
        <a href="admin-projects.html" class="sidebar__link ${activePage==='projects'?'active':''}">Projects</a>
        <a href="admin-media.html"    class="sidebar__link ${activePage==='media'?'active':''}">Media</a>
        <div class="sidebar__section-label">Engagement</div>
        <a href="admin-messages.html" class="sidebar__link ${activePage==='messages'?'active':''}">Messages <span class="sidebar__badge" id="pendingBadge" style="display:none"></span></a>
        <div class="sidebar__section-label">Settings</div>
        <a href="admin-users.html"    class="sidebar__link ${activePage==='users'?'active':''}">Admin Users</a>
      </nav>
      <div class="sidebar__footer">
        <div>${user.name || 'Admin'}</div>
        <button class="sidebar__logout" onclick="logout()">Sign Out</button>
      </div>
    `;
  }

  const topbar = document.getElementById('topbar');
  if (topbar) {
    const initials = (user.name || 'A').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
    topbar.innerHTML = `
      <div class="topbar__title" id="topbarTitle"></div>
      <div style="display:flex; align-items:center; gap:20px;">
        <button id="themeToggleBtn" aria-label="Toggle Theme" style="background:none; border:none; color:var(--text-dark); cursor:pointer; padding:6px; display:inline-flex; align-items:center;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        </button>
        <div class="topbar__user">
          <span>${user.name || 'Admin'}</span>
          <div class="topbar__avatar">${initials}</div>
        </div>
      </div>
    `;

    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
      });
    }
  }

  // Load pending badge
  loadPendingCount();
}

async function loadPendingCount() {
  const data = await authFetch('/dashboard/stats');
  const badge = document.getElementById('pendingBadge');
  if (badge && data?.stats?.pendingMessages > 0) {
    badge.textContent    = data.stats.pendingMessages;
    badge.style.display  = 'inline';
  }
}

/* ── Helpers ─────────────────────────────────────────────────── */
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-GH', { year:'numeric', month:'short', day:'numeric' });
}

function showAlert(el, type, msg) {
  el.className = `alert alert-${type}`;
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => el.style.display = 'none', 4000);
}

function truncate(text, len=100) {
  return text && text.length > len ? text.slice(0,len)+'…' : text;
}

function stripHtml(html) {
  const d = document.createElement('div'); d.innerHTML = html; return d.textContent || '';
}

function confirmDelete(name) {
  return confirm(`Are you sure you want to delete "${name}"?\nThis action cannot be undone.`);
}
