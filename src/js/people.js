PG.requireAuth();
const box = document.getElementById('people'), search = document.getElementById('search');
function render() {
  const q = search.value.trim().toLowerCase();
  const list = PG.users().filter(u => !q || u.username.includes(q.replace('@', '')) || u.displayName.toLowerCase().includes(q));
  box.innerHTML = list.length ? list.map(u => `<a class="card person" href="profile.html?u=${encodeURIComponent(u.username)}">
    <img class="avatar" src="${PG.avatar(u)}" alt=""><div><strong>${PG.esc(u.displayName)}</strong>
    <div class="post-meta">@${PG.esc(u.username)}${u.privateProfile ? ' &#128274;' : ''}</div>
    <div class="muted">${PG.esc(u.bio || '')}</div></div></a>`).join('') : '<p class="hint">No one found.</p>';
}
search.addEventListener('input', render); render();
