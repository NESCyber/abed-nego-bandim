// Check saved theme and apply it immediately to prevent light flash
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
  document.body.classList.add('dark-theme');
}

const API = '/api';

/* ── Navbar active link ────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.navbar__links a, .navbar__mobile-menu a').forEach(a => {
    if (a.getAttribute('href') === path) a.classList.add('active');
  });

  /* Mobile hamburger */
  const ham  = document.getElementById('hamburger');
  const menu = document.getElementById('mobileMenu');
  if (ham && menu) {
    ham.addEventListener('click', () => menu.classList.toggle('open'));
  }
});

/* ── API helper ────────────────────────────────────────────── */
async function apiFetch(endpoint, options = {}) {
  try {
    const res  = await fetch(API + endpoint, options);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('API error:', err);
    return { success: false, message: 'Network error. Please try again.' };
  }
}

/* ── Format date ───────────────────────────────────────────── */
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-GH', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
}

/* ── Truncate text ─────────────────────────────────────────── */
function truncate(text, len = 160) {
  return text && text.length > len ? text.slice(0, len).trimEnd() + '…' : text;
}

/* ── Strip HTML tags ───────────────────────────────────────── */
function stripHtml(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

/* ── Spinner HTML ──────────────────────────────────────────── */
function spinnerHtml() {
  return '<div class="loading-wrap"><div class="spinner"></div></div>';
}

/* ── Category tag HTML ─────────────────────────────────────── */
function categoryTag(cat) {
  const labels = { health:'Health', education:'Education', infrastructure:'Infrastructure', ict:'ICT', other:'Other' };
  return `<span class="card__tag tag-${cat}">${labels[cat] || cat}</span>`;
}

/* ── Status badge HTML ─────────────────────────────────────── */
function statusBadge(status) {
  const labels = { ongoing:'Ongoing', completed:'Completed', planned:'Planned' };
  return `<span class="status-badge status-${status}">${labels[status] || status}</span>`;
}

/* ── Navbar HTML (reused) ──────────────────────────────────── */
function injectNavbar() {
  const nav = document.getElementById('navbar');
  if (!nav) return;
  // Force background colour directly on element - cannot be overridden
  nav.setAttribute('style', 'background:#0d2b1a !important;background-color:#0d2b1a;position:sticky;top:0;z-index:1000;box-shadow:0 2px 16px rgba(0,0,0,0.5);');
  nav.innerHTML = `
    <div class="navbar__inner" style="display:flex;align-items:center;justify-content:space-between;height:70px;max-width:1140px;margin:0 auto;padding:0 20px;">
      <div class="navbar__brand">
        <div class="navbar__logo">AB</div>
        <div class="navbar__site-name">
          Dr. A.L. Bandim
          <span>MP — Bunkpurugu Constituency</span>
        </div>
      </div>
      <nav class="navbar__links">
        <a href="index.html">Home</a>
        <a href="about.html">About</a>
        <a href="projects.html">Projects</a>
        <a href="news.html">News</a>
        <a href="gallery.html">Gallery</a>
        <a href="contact.html">Contact</a>
        <button id="themeToggleBtn" aria-label="Toggle Theme" style="background:none; border:none; color:rgba(255,255,255,0.85); padding:8px; display:inline-flex; align-items:center; cursor:pointer; transition:var(--transition); margin-right:8px;" onmouseover="this.style.color='var(--gold)'" onmouseout="this.style.color='rgba(255,255,255,0.85)'">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        </button>
        <a href="portal.html" class="navbar__cta">Constituency Portal</a>
      </nav>
      <button class="navbar__hamburger" id="hamburger" aria-label="Menu">
        <span></span><span></span><span></span>
      </button>
    </div>
    <nav class="navbar__mobile-menu" id="mobileMenu">
      <a href="index.html">Home</a>
      <a href="about.html">About</a>
      <a href="projects.html">Projects</a>
      <a href="news.html">News</a>
      <a href="gallery.html">Gallery</a>
      <a href="contact.html">Contact</a>
      <a href="portal.html">Constituency Portal</a>
      <button id="themeToggleBtnMobile" style="color:white; background:rgba(255,255,255,0.1); border-radius:var(--radius); padding:10px; margin-top:10px; font-weight:600; font-size:0.88rem; display:flex; align-items:center; justify-content:center; gap:8px; width:100%; cursor:pointer;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg> Toggle Theme
      </button>
    </nav>
  `;
}

/* ── Footer HTML ───────────────────────────────────────────── */
function injectFooter() {
  const footer = document.getElementById('footer');
  if (!footer) return;
  footer.innerHTML = `
    <div class="footer__grid">
      <div class="footer__brand">
        <div style="font-family:var(--font-head);font-size:1.2rem;color:var(--gold);font-weight:900;">Dr. Abed&#8209;Nego Lamangin Bandim</div>
        <p>Member of Parliament for Bunkpurugu Constituency, committed to transforming lives through transparent governance and sustainable development.</p>
      </div>
      <div class="footer__col">
        <h4>Quick Links</h4>
        <a href="index.html">Home</a>
        <a href="about.html">About</a>
        <a href="projects.html">Projects</a>
        <a href="news.html">News &amp; Updates</a>
      </div>
      <div class="footer__col">
        <h4>Engage</h4>
        <a href="portal.html">Report an Issue</a>
        <a href="portal.html">Request Support</a>
        <a href="portal.html">Suggest an Idea</a>
        <a href="gallery.html">Media Gallery</a>
      </div>
      <div class="footer__col">
        <h4>Contact</h4>
        <a href="tel:+233302633030">+233 302 633 030 Ext 4124</a>
        <a href="mailto:baazumah@parliament.gh">baazumah@parliament.gh</a>
        <a href="contact.html">Office Address</a>
      </div>
    </div>
    <hr class="footer__divider">
    <div class="footer__bottom">
      <span>&copy; ${new Date().getFullYear()} Office of Dr. Abed&#8209;Nego Lamangin Bandim, MP</span>
      <span>Bunkpurugu Constituency, Northern Ghana</span>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  injectNavbar();
  injectFooter();
  loadAnnouncementBanner();

  /* Theme Switcher Toggle Event Listeners */
  const toggleTheme = () => {
    const isDark = document.body.classList.toggle('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  };

  const btnDesktop = document.getElementById('themeToggleBtn');
  const btnMobile = document.getElementById('themeToggleBtnMobile');
  if (btnDesktop) btnDesktop.addEventListener('click', toggleTheme);
  if (btnMobile) btnMobile.addEventListener('click', toggleTheme);
});

/* ── Announcement Banner ────────────────────────────────────── */
async function loadAnnouncementBanner() {
  const res = await apiFetch('/settings');
  if (res?.success && res.data) {
    const active = res.data.announcement_banner_active;
    const text = res.data.announcement_banner_text;
    
    if (active === 'true' && text) {
      const banner = document.createElement('div');
      banner.id = 'announcementBanner';
      banner.style.cssText = `
        background: var(--gold);
        color: var(--green-dark);
        padding: 10px 24px;
        text-align: center;
        font-weight: 700;
        font-size: 0.92rem;
        font-family: var(--font-head);
        position: relative;
        z-index: 1001;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        transition: var(--transition);
      `;
      banner.innerHTML = `<span><strong>ANNOUNCEMENT:</strong> ${text}</span>`;
      
      // Insert at the very top of body
      document.body.insertBefore(banner, document.body.firstChild);
    }
  }
}
