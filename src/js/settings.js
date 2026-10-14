const me = PG.requireAuth();
const priv = document.getElementById('privateProfile'), hide = document.getElementById('hideLikes');
priv.checked = me.privateProfile; hide.checked = me.hideLikes;

[priv, hide].forEach(box => box.addEventListener('change', () => {
  const users = PG.users(), u = users.find(x => x.username === me.username);
  u.privateProfile = priv.checked; u.hideLikes = hide.checked; PG.saveUsers(users);
}));

document.getElementById('export').onclick = () => {
  const { passHash, salt, ...profile } = me;
  const data = { profile, posts: PG.posts().filter(p => p.author === me.username) };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  a.download = 'my-data.json'; a.click();
};

document.getElementById('delete').onclick = () => {
  if (!confirm('Permanently delete your account and all your posts?')) return;
  PG.saveUsers(PG.users().filter(u => u.username !== me.username));
  PG.savePosts(PG.posts().filter(p => p.author !== me.username));
  PG.logout();
};

document.getElementById('logout-btn').onclick = () => PG.logout();
