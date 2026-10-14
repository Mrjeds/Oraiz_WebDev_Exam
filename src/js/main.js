const PG = (() => {
  const root = document.body.dataset.root || '';
  const pagesDir = root ? '' : 'pages/';
  const get = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  const set = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  const api = {
    root, pagesDir,
    users: () => get('pg_users', []),
    saveUsers: u => set('pg_users', u),
    posts: () => get('pg_posts', []),
    savePosts: p => set('pg_posts', p),
    currentUser() {
      const name = sessionStorage.getItem('pg_session');
      return api.users().find(u => u.username === name) || null;
    },
    login: name => sessionStorage.setItem('pg_session', name),
    logout() { sessionStorage.removeItem('pg_session'); location.href = pagesDir + 'login.html'; },
    requireAuth() { const u = api.currentUser(); if (!u) location.href = pagesDir + 'login.html'; return u; },
    async hash(pw, salt) {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + pw));
      return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
    },
    salt: () => [...crypto.getRandomValues(new Uint8Array(16))].map(b => b.toString(16).padStart(2, '0')).join(''),
    esc: s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),
    avatar: u => (u && u.avatar) || root + 'assets/img/default-avatar.svg',
        readImage(file) {
      return new Promise((res, rej) => {
        if (!file || !file.type.startsWith('image/')) return rej('Please choose an image file.');
        if (file.size > 500 * 1024) return rej('Image must be under 500 KB.');
        const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej('Could not read file.'); r.readAsDataURL(file);
      });
    },
        compressImage(file, max = 900) {
      return new Promise((res, rej) => {
        if (!file || !file.type.startsWith('image/')) return rej('Please choose an image file.');
        if (file.size > 8 * 1024 * 1024) return rej('Image must be under 8 MB.');
        const img = new Image(), url = URL.createObjectURL(file);
        img.onload = () => {
          const k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas');
          c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
          res(c.toDataURL('image/jpeg', 0.75));
        };
        img.onerror = () => rej('Could not read image.'); img.src = url;
      });
    },
    messages: () => get('pg_messages', []),
    saveMessages: m => set('pg_messages', m),
    msg(el, text, ok) { el.textContent = text; el.className = 'msg' + (ok ? ' ok' : ''); }
  };

  document.addEventListener('DOMContentLoaded', () => {
    const nav = document.getElementById('nav'), p = pagesDir, me = api.currentUser();
    const here = location.pathname.split('/').pop();
    if (document.body.hasAttribute('data-guest') && me) { location.replace(p + 'feed.html'); return; }
    if (me) document.body.classList.add('app');
    const links = `<span class="top-links"><a href="${p}about.html">About</a><a href="${p}privacy.html">Privacy</a></span>`;
    if (nav) nav.innerHTML = `<a class="brand" href="${me ? p + 'feed.html' : root + 'index.html'}"><svg class="logo" viewBox="0 0 32 32" width="32" height="32"><defs><linearGradient id="jg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7de0c3"/><stop offset="1" stop-color="#1fa37f"/></linearGradient></defs><path d="M16 2l12 8-12 20L4 10z" fill="url(#jg)"/><path d="M4 10h24M16 2l-5 8 5 20 5-20z" fill="none" stroke="#14172b" stroke-opacity=".35" stroke-width="1.2" stroke-linejoin="round"/></svg> Jade</a>` + links + (me
      ? `<a href="${p}profile.html" title="My profile"><img class="avatar sm" src="${api.avatar(me)}" alt="me"></a>`
      : `<a class="btn-link" href="${p}login.html">Log in</a><a class="btn-link primary" href="${p}signup.html">Sign up</a>`);
    if (me) {
      const ic = d => `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
      const tabs = [
        ['feed', ic('<path d="M3 11l9-8 9 8v10h-6v-6H9v6H3z"/>'), 'Feed'],
        ['people', ic('<circle cx="9" cy="8" r="4"/><path d="M1 21c0-4 3.5-7 8-7s8 3 8 7"/><path d="M17 4a4 4 0 010 8"/><path d="M23 21c0-3-2-5.500-5-6.500"/>'), 'People'],
        ['messages', ic('<path d="M21 12a8 8 0 01-11.500 7.200L3 21l1.800-5.500A8 8 0 1121 12z"/>'), 'Chat'],
        ['profile', ic('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.500 3.500-7 8-7s8 2.500 8 7"/>'), 'Profile'],
        ['settings', ic('<path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>'), 'Settings']];
      const t = document.createElement('nav'); t.id = 'tabs';
      t.innerHTML = tabs.map(([n, i, l]) => `<a href="${p}${n}.html" class="${here === n + '.html' ? 'active' : ''}"><span>${i}</span>${l}</a>`).join('');
      document.body.appendChild(t);
    }
    const f = document.getElementById('footer');
    if (f) f.innerHTML = 'Jade prototype &middot; no backend, no tracking, no cookies. Data lives only in your browser.';
  });
  return api;
})();
