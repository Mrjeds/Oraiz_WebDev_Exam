const signupForm = document.getElementById('signup-form');
const loginForm = document.getElementById('login-form');

if (signupForm) signupForm.addEventListener('submit', async e => {
  e.preventDefault();
  const out = document.getElementById('msg'), f = signupForm.elements;
  const username = f.username.value.trim().toLowerCase();
  if (!/^[a-z0-9_]{3,20}$/.test(username)) return PG.msg(out, 'Username: 3-20 letters, numbers or underscores.');
  if (f.password.value.length < 8) return PG.msg(out, 'Password must be at least 8 characters.');
  if (f.password.value !== f.confirm.value) return PG.msg(out, 'Passwords do not match.');
  const users = PG.users();
  if (users.some(u => u.username === username)) return PG.msg(out, 'Username already taken.');
  const salt = PG.salt();
  users.push({ username, salt, passHash: await PG.hash(f.password.value, salt), displayName: username,
               bio: '', location: '', website: '', avatar: '', privateProfile: false, hideLikes: false, createdAt: Date.now() });
  PG.saveUsers(users); PG.login(username); location.href = 'feed.html';
});

if (loginForm) loginForm.addEventListener('submit', async e => {
  e.preventDefault();
  const out = document.getElementById('msg'), f = loginForm.elements;
  const user = PG.users().find(u => u.username === f.username.value.trim().toLowerCase());
  if (!user || await PG.hash(f.password.value, user.salt) !== user.passHash) return PG.msg(out, 'Invalid username or password.');
  PG.login(user.username); location.href = 'feed.html';
});
