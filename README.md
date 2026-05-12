[README.md](https://github.com/user-attachments/files/27620541/README.md)
# Simple Supabase Appointment Site

This is the easiest testing version.

No npm.
No build.
No terminal.
No extra SQL.

Just upload these files to GitHub.

## Files

- `index.html` - public appointment form
- `admin.html` - admin login and dashboard
- `style.css` - design
- `config.js` - Supabase keys
- `app.js` - form and admin logic

## Step 1: Add your Supabase keys

Open `config.js` and replace:

```js
url: "PASTE_YOUR_SUPABASE_PROJECT_URL_HERE",
anonKey: "PASTE_YOUR_SUPABASE_ANON_KEY_HERE"
```

with your real Supabase Project URL and anon key.

Do not use service role key.

## Step 2: Upload to GitHub

Create a new GitHub repository and upload all files.

## Step 3: Enable GitHub Pages

GitHub repo:

Settings -> Pages -> Source -> Deploy from a branch

Choose:

Branch: main
Folder: /root

Save.

## Step 4: Open your site

Your website will be like:

```text
https://yourusername.github.io/your-repo-name/
```

Admin panel:

```text
https://yourusername.github.io/your-repo-name/admin.html
```

## Admin login

Use the admin email and password you created in Supabase.

## Important

Your Supabase RLS policies must already be created.

Normal user can submit.
Admin can login and manage requests.
