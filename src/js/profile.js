const me = PG.requireAuth();
const target = new URLSearchParams(location.search).get('u') || me.username;
const user = PG.users().find(u => u.username === target);
const own = !!user && user.username === me.username;
const $ = id => document.getElementById(id);
let newAvatar = me.avatar;

function renderHeader(u) {
  $('avatar-preview').src = PG.avatar(u);
  $('p-name').textContent = u.displayName;
  $('profile-username').textContent = '@' + u.username;
  $('p-bio').textContent = u.bio || (own ? 'Add a bio below.' : '');
  const site = /^https?:\/\//.test(u.website) ? ` &middot; <a href="${PG.esc(u.website)}" rel="noopener noreferrer" target="_blank">${PG.esc(u.website)}</a>` : '';
  $('p-meta').innerHTML = (u.location ? PG.esc(u.location) + ' &middot; ' : '') + 'Joined ' + new Date(u.createdAt).toLocaleDateString() + site;
}

function renderPosts(u) {
  const posts = PG.posts().filter(p => p.author === u.username && (!p.secret || own)).sort((a, b) => b.time - a.time);
  $('posts-title').textContent = `Posts (${posts.length})`;
  $('user-posts').innerHTML = posts.length ? posts.map(p =>
    `<article class="card"><div class="post-meta">${new Date(p.time).toLocaleString()}${p.secret ? ' <span class="tag">secret</span>' : ''}</div>${p.text ? `<p>${PG.esc(p.text)}</p>` : ''}${p.image && p.image.startsWith('data:image/') ? `<img class="post-img" src="${p.image}" alt="Post image">` : ''}</article>`).join('')
    : '<p class="hint">No posts yet.</p>';
}

if (!user) {
  $('edit-area').classList.add('hidden'); $('posts-title').classList.add('hidden');
  document.querySelector('.profile-head').classList.add('hidden');
  Object.assign($('p-note'), { textContent: 'User not found.', className: 'card' });
} else {
  renderHeader(user);
  if (!own) {
    $('edit-area').classList.add('hidden');
    $('msg-btn').href = 'messages.html?u=' + encodeURIComponent(user.username); $('msg-btn').classList.remove('hidden');
    if (user.privateProfile) {
      $('posts-title').classList.add('hidden');
      Object.assign($('p-note'), { textContent: 'This profile is private.', className: 'card' });
    } else renderPosts(user);
  } else {
    renderPosts(user);
    const f = $('profile-form').elements, pw = $('password-form'), out = $('profile-msg');
    f.displayName.value = me.displayName; f.bio.value = me.bio; f.location.value = me.location; f.website.value = me.website;

    f.avatar.addEventListener('change', async () => {
      try { newAvatar = await PG.readImage(f.avatar.files[0]); $('avatar-preview').src = newAvatar; PG.msg(out, ''); }
      catch (err) { PG.msg(out, err); }
    });
    $('avatar-remove').onclick = () => { newAvatar = ''; $('avatar-preview').src = PG.avatar(null); };

    $('profile-form').addEventListener('submit', e => {
      e.preventDefault();
      const users = PG.users(), u = users.find(x => x.username === me.username);
      Object.assign(u, { displayName: f.displayName.value.trim() || u.username, bio: f.bio.value.trim(),
                         location: f.location.value.trim(), website: f.website.value.trim(), avatar: newAvatar });
      PG.saveUsers(users); renderHeader(u); PG.msg(out, 'Profile saved.', true);
    });

    pw.addEventListener('submit', async e => {
      e.preventDefault();
      const o = $('password-msg'), p = pw.elements;
      if (await PG.hash(p.current.value, me.salt) !== me.passHash) return PG.msg(o, 'Current password is wrong.');
      if (p.next.value.length < 8) return PG.msg(o, 'New password must be at least 8 characters.');
      const users = PG.users(), u = users.find(x => x.username === me.username);
      u.salt = PG.salt(); u.passHash = await PG.hash(p.next.value, u.salt);
      PG.saveUsers(users); pw.reset(); PG.msg(o, 'Password updated.', true);
    });
  }
}
