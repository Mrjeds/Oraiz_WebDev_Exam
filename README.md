# Jade

A privacy-first social media **prototype** built with only HTML, CSS and vanilla JavaScript.
No backend, no database, no API, no trackers. All data stays in the browser.

## Run it
Open `index.html` in a browser, or (recommended) serve the folder, e.g. VS Code "Live Server" or `python -m http.server`.
Web Crypto (password hashing) needs `https://`, `localhost` or a `file://` page in most browsers.

## Structure
```
.
├── index.html            Landing page
├── pages/
│   ├── login.html        Log in form                 (auth.js)
│   ├── signup.html       Create account form         (auth.js)
│   ├── feed.html         Post, like, delete posts    (feed.js)
│   ├── messages.html     Chat list + 1-to-1 chat (messages.js)
│   ├── people.html       Search/browse users -> opens their profile (people.js)
│   ├── profile.html      Own profile (editable) or ?u=name (read-only view) (profile.js)
│   ├── settings.html     Privacy toggles, export, delete (settings.js)
│   ├── about.html        About us (static)
│   └── privacy.html      Privacy policy (static)
├── src/
│   ├── css/style.css     Aesthetic theme: powder-blue gradient page, navy flexbox frame, soft pastel boxes with 10px margins (same layout format as the CSS practice reference)
│   └── js/
│       ├── main.js       Shared core: storage, session, hashing, nav/footer (loaded on every page)
│       ├── auth.js       Signup + login logic
│       ├── feed.js       Feed logic
│       ├── messages.js   Direct messages
│       ├── people.js     People search
│       ├── profile.js    Profile view/edit + password change logic
│       └── settings.js   Settings, data export, account deletion
└── assets/img/default-avatar.svg   Fallback profile picture
```

## Code format
The HTML and CSS follow the style of the CSS practice reference: tab indentation, single-quoted attributes, plain `div` containers (the black frame is `<div id='bg'>`), and CSS with one declaration per line.

## Navigation map (how pages connect)
- Logged out: `index` -> `signup` / `login` / `about` / `privacy`. Success sends you to `feed`.
- Logged in: bottom tab bar (left sidebar on desktop) = Feed, People, Profile, Settings. Top-right avatar -> your profile.
- Feed: tap any author -> their profile (`profile.html?u=username`). People: tap a card -> their profile.
- Profile (someone else's): Message button -> `messages.html?u=name`. Chat tab -> conversation list -> thread.
- Settings: Log out -> `login`; Delete account -> `login`.
- Guest pages (`index`, `login`, `signup`) redirect logged-in users to `feed`; private pages redirect guests to `login`.

## Secret posts
Tick "Post secretly" in the Feed composer to post under a random alias (e.g. "Silent Owl") with a `secret` tag. The post shows no name, avatar or profile link, and is hidden from your public profile (only you see it on your own profile). You can still edit or delete it from the three-dot menu. Like secret comments, this is local-only anonymity.

## Comments and secret comments
Each post has a Comments button. Ticking "Comment secretly" shows a random alias (e.g. "Quiet Fox") plus a `secret` tag instead of your name or profile link. The same alias is reused for you on that post. Only you see "(you)" and can delete your own comment. This is local-only: the real author is still saved in the browser data so you can delete your own comment, and a real service would need server-side anonymity.

Code comments were removed from the source files on request; this README is the documentation.

## How it works
| Topic | Detail |
|---|---|
| Accounts | Stored in `localStorage` key `pg_users` |
| Posts | `localStorage` key `pg_posts` -> `{id, author, text, image, time, likes[], comments[], secret, alias}; comment = `{id, author, text, time, secret, alias}`` |
| Messages | `localStorage` key `pg_messages` -> `{id, from, to, text, time}`. Open two tabs with two accounts to chat live |
| Photo posts | Photo is resized to max 900px JPEG via canvas (also strips EXIF/GPS) and saved in the post as `image` |
| Session | `sessionStorage` key `pg_session` (logs out when tab closes) |
| Passwords | Random 16-byte salt + SHA-256 (Web Crypto). Never stored in plain text |
| Auth guard | Private pages call `PG.requireAuth()`, which redirects to login |
| XSS safety | All user text goes through `PG.esc()` before rendering |
| Avatars | Image -> data URL (max 500 KB) saved in the user record |
| Nav/footer | Built by `main.js`, so edit them in ONE place |

User object: `{username, salt, passHash, displayName, bio, location, website, avatar, privateProfile, hideLikes, createdAt}`

## Customising
- **Colors/fonts:** edit the color variables at the top of `style.css`.
- **Profile page:** inputs have `id`/`name` hooks used by `profile.js`. Restyle freely, but keep the ids (`avatar`, `displayName`, `bio`, `location`, `website`, `current`, `next`, `avatar-preview`, `p-name`, `p-bio`, `p-meta`, `user-posts`, `edit-area`).
- **New page:** copy `pages/about.html`, set `data-root="../"`, add a link in `main.js`.

## Limitations (honest notes)
- Data is per-browser and per-device; users cannot see each other across devices.
- Client-side hashing is a prototype measure, not real security. A production app needs a server, TLS and end-to-end encryption.
- `localStorage` is ~5 MB, so large images are rejected.
- `private profile` is stored but only meaningful once multiple users share a backend.

## Ideas / TODO
Follow system, comments, photos in chat, unread badges, dark-mode toggle, image posts, search, 404 page, light/dark theme.
