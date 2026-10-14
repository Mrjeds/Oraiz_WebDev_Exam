const me = PG.requireAuth();
const other = new URLSearchParams(location.search).get('u');
const $ = id => document.getElementById(id);
const mine = m => m.from === me.username || m.to === me.username;
const peer = m => (m.from === me.username ? m.to : m.from);

function renderList() {
  const users = PG.users(), last = {};
  PG.messages().filter(mine).sort((a, b) => a.time - b.time).forEach(m => last[peer(m)] = m);
  const rows = Object.entries(last).sort((a, b) => b[1].time - a[1].time);
  $('conv-list').innerHTML = rows.length ? rows.map(([name, m]) => {
    const u = users.find(x => x.username === name);
    return `<a class="card person" href="messages.html?u=${encodeURIComponent(name)}"><img class="avatar" src="${PG.avatar(u)}" alt="">
      <div><strong>${PG.esc(u ? u.displayName : name)}</strong><div class="muted">${m.from === me.username ? 'You: ' : ''}${PG.esc(m.text.slice(0, 60))}</div></div></a>`;
  }).join('') : '<p class="card muted">No conversations yet.</p>';
}

function renderThread() {
  const u = PG.users().find(x => x.username === other);
  const msgs = PG.messages().filter(m => mine(m) && peer(m) === other).sort((a, b) => a.time - b.time);
  $('chat').innerHTML = msgs.length ? msgs.map(m => `<div class="bubble ${m.from === me.username ? 'me' : 'them'}">${PG.esc(m.text)}
    <span>${new Date(m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>`).join('')
    : '<p class="hint" style="text-align:center">Say hi!</p>';
  $('chat').scrollTop = $('chat').scrollHeight;
}

if (!other) renderList();
else {
  const u = PG.users().find(x => x.username === other);
  if (!u || other === me.username) location.replace('messages.html');
  $('conv-view').classList.add('hidden'); $('thread-view').classList.remove('hidden');
  $('thread-who').href = 'profile.html?u=' + encodeURIComponent(other);
  $('thread-who').innerHTML = `<img class="avatar" src="${PG.avatar(u)}" alt=""><strong>${PG.esc(u.displayName)}</strong>`;
  $('chat-form').addEventListener('submit', e => {
    e.preventDefault();
    const text = e.target.elements.text.value.trim(); if (!text) return;
    const all = PG.messages(); all.push({ id: crypto.randomUUID(), from: me.username, to: other, text, time: Date.now() });
    PG.saveMessages(all); e.target.reset(); renderThread();
  });
  $('clear-chat').onclick = () => {
    if (!confirm('Delete this conversation for both of you?')) return;
    PG.saveMessages(PG.messages().filter(m => !(mine(m) && peer(m) === other))); renderThread();
  };
  renderThread();
}
window.addEventListener('storage', () => other ? renderThread() : renderList());
