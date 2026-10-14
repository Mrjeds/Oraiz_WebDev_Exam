const me = PG.requireAuth();
const list = document.getElementById('posts'), form = document.getElementById('post-form');
const $ = id => document.getElementById(id);
const open = new Set();
let image = '';
let menuOpen = null;
let editing = null;
const ADJ = ['Silent', 'Misty', 'Quiet', 'Hidden', 'Shy', 'Calm', 'Swift', 'Sleepy'];
const ANI = ['Fox', 'Owl', 'Panda', 'Otter', 'Lynx', 'Heron', 'Koala', 'Falcon'];
const pick = a => a[Math.floor(Math.random() * a.length)];
const imgTag = p => p.image && p.image.startsWith('data:image/') ? `<img class="post-img" src="${p.image}" alt="Post image">` : '';

const DOTS = '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>';

const menuHtml = p => `<div class="menu"><button class="dots" data-menu="${p.id}" aria-label="Post options">${DOTS}</button>
  <div class="menu-list ${menuOpen === p.id ? '' : 'hidden'}"><button data-edit="${p.id}">Edit post</button><button data-del="${p.id}">Delete post</button></div></div>`;

const editHtml = p => `<form class="edit-form" data-post="${p.id}"><textarea name="text" rows="3" maxlength="500">${PG.esc(p.text)}</textarea>
  <div class="row"><button type="submit">Save</button><button type="button" class="secondary" data-cancel="1">Cancel</button></div></form>`;

const headHtml = (p, au) => p.secret
  ? `<div class="post-head"><img class="avatar" src="${PG.avatar(null)}" alt=""><div><strong>${PG.esc(p.alias)}</strong><span class="tag">secret</span>${p.author === me.username ? ' (you)' : ''}
    <div class="post-meta">${new Date(p.time).toLocaleString()}${p.edited ? ' - edited' : ''}</div></div></div>`
  : `<a class="post-head" href="profile.html?u=${encodeURIComponent(p.author)}"><img class="avatar" src="${PG.avatar(au)}" alt="">
    <div><strong>${PG.esc(au ? au.displayName : p.author)}</strong>
    <div class="post-meta">@${PG.esc(p.author)} - ${new Date(p.time).toLocaleString()}${p.edited ? ' - edited' : ''}</div></div></a>`;

function commentsHtml(p, users) {
  const cs = p.comments || [];
  const items = cs.map(c => {
    const au = users.find(u => u.username === c.author);
    const who = c.secret
      ? `<strong>${PG.esc(c.alias)}</strong><span class="tag">secret</span>${c.author === me.username ? ' (you)' : ''}`
      : `<a href="profile.html?u=${encodeURIComponent(c.author)}"><strong>${PG.esc(au ? au.displayName : c.author)}</strong></a>`;
    const del = c.author === me.username ? ` <button class="mini danger" data-cdel="${p.id}|${c.id}">x</button>` : '';
    return `<div class="comment"><div>${who}${del}</div><div>${PG.esc(c.text)}</div></div>`;
  }).join('');
  return `<div class="comments ${open.has(p.id) ? '' : 'hidden'}">${items || '<p class="hint">No comments yet.</p>'}
    <form class="comment-form" data-post="${p.id}">
      <div class="row"><input name="text" maxlength="300" placeholder="Write a comment..." autocomplete="off" required>
      <button type="submit">Send</button></div>
      <label class="check"><input type="checkbox" name="secret"> Comment secretly (hide my real name)</label>
    </form></div>`;
}

function render() {
  const users = PG.users();
  const posts = PG.posts().sort((a, b) => b.time - a.time);
  list.innerHTML = posts.length ? '' : '<p class="hint">No posts yet. Say something!</p>';
  posts.forEach(p => {
    const au = users.find(u => u.username === p.author);
    const el = document.createElement('article'); el.className = 'card';
    el.innerHTML = `<div class="post-top">${headHtml(p, au)}${p.author === me.username ? menuHtml(p) : ''}</div>
      ${editing === p.id ? editHtml(p) : (p.text ? `<p>${PG.esc(p.text)}</p>` : '')}${imgTag(p)}
      <div class="post-actions"><button class="secondary" data-like="${p.id}">Like${me.hideLikes ? '' : ' (' + p.likes.length + ')'}</button>
      <button class="secondary" data-toggle="${p.id}">Comments (${(p.comments || []).length})</button>
      </div>
      ${commentsHtml(p, users)}`;
    list.appendChild(el);
  });
}

$('image').addEventListener('change', async () => {
  try { image = await PG.compressImage($('image').files[0]); $('img-preview').src = image;
        $('img-preview').classList.remove('hidden'); $('img-clear').classList.remove('hidden'); PG.msg($('post-msg'), ''); }
  catch (err) { PG.msg($('post-msg'), err); }
});
$('img-clear').onclick = () => { image = ''; $('image').value = ''; $('img-preview').classList.add('hidden'); $('img-clear').classList.add('hidden'); };

form.addEventListener('submit', e => {
  e.preventDefault();
  const text = form.elements.text.value.trim(), secret = form.elements.secret.checked;
  if (!text && !image) return;
  const posts = PG.posts();
  posts.push({ id: crypto.randomUUID(), author: me.username, text: text.slice(0, 500), image, time: Date.now(), likes: [], comments: [], secret, alias: secret ? pick(ADJ) + ' ' + pick(ANI) : '' });
  try { PG.savePosts(posts); } catch { return PG.msg($('post-msg'), 'Storage is full. Delete some posts or photos.'); }
  form.reset(); $('img-clear').onclick(); render();
});

list.addEventListener('submit', e => {
  if (!e.target.matches('.comment-form')) return;
  e.preventDefault();
  const posts = PG.posts(), p = posts.find(x => x.id === e.target.dataset.post);
  const text = e.target.elements.text.value.trim(), secret = e.target.elements.secret.checked;
  if (!p || !text) return;
  p.comments = p.comments || [];
  const prev = p.comments.find(c => c.secret && c.author === me.username);
  p.comments.push({ id: crypto.randomUUID(), author: me.username, text, time: Date.now(), secret,
                    alias: secret ? (prev ? prev.alias : pick(ADJ) + ' ' + pick(ANI)) : '' });
  open.add(p.id); PG.savePosts(posts); render();
});

list.addEventListener('submit', e => {
  if (!e.target.matches('.edit-form')) return;
  e.preventDefault();
  const posts = PG.posts(), p = posts.find(x => x.id === e.target.dataset.post && x.author === me.username);
  const text = e.target.elements.text.value.trim();
  if (!p || (!text && !p.image)) return;
  if (text !== p.text) { p.text = text; p.edited = true; }
  editing = null; PG.savePosts(posts); render();
});

document.addEventListener('click', e => {
  if (menuOpen && !e.target.closest('.menu')) { menuOpen = null; render(); }
});

list.addEventListener('click', e => {
  const b = e.target.closest('button'), d = b ? b.dataset : {};
  if (d.menu) { menuOpen = menuOpen === d.menu ? null : d.menu; return render(); }
  if (d.edit) { editing = d.edit; menuOpen = null; return render(); }
  if (d.cancel) { editing = null; return render(); }
  if (d.del) { menuOpen = null; if (!confirm('Delete this post?')) return render(); }
  if (d.toggle) { open.has(d.toggle) ? open.delete(d.toggle) : open.add(d.toggle); return render(); }
  const posts = PG.posts();
  if (d.like) { const p = posts.find(x => x.id === d.like), i = p.likes.indexOf(me.username); i < 0 ? p.likes.push(me.username) : p.likes.splice(i, 1); }
  if (d.del) posts.splice(posts.findIndex(x => x.id === d.del && x.author === me.username), 1);
  if (d.cdel) {
    const [pid, cid] = d.cdel.split('|'), p = posts.find(x => x.id === pid);
    p.comments = (p.comments || []).filter(c => !(c.id === cid && c.author === me.username));
  }
  if (!d.like && !d.del && !d.cdel) return;
  PG.savePosts(posts); render();
});
render();
