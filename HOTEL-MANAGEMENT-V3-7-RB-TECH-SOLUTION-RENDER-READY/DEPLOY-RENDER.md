# Render Deployment - RB Tech Solution License Server

## 1. Push this project to a PRIVATE GitHub repository

Keep the repository structure exactly like this:

- `admin.html`
- `index.html`
- `renewal.html`
- `js/`
- `css/`
- `assets/`
- `server/`
- `render.yaml`

Do NOT upload a real `.env` file or passwords/tokens to GitHub.

## 2. Deploy on Render

Create a **Web Service** from the GitHub repository.

Recommended settings:

- Runtime: Node
- Root Directory: `server`
- Build Command: `npm install`
- Start Command: `node server.js`

If Render reads `render.yaml` as a Blueprint, these settings are already defined there.

## 3. Add Environment Variables

In Render Dashboard -> Environment:

- `ADMIN_USERNAME` = `owner`
- `ADMIN_PASSWORD` = a strong private owner password
- `ADMIN_TOKEN` = a long random secret token

Do not publish these values in GitHub, SPCK, screenshots, or chat.

## 4. Test the deployed server

After deployment, open:

`https://YOUR-SERVICE.onrender.com/`

Expected response contains:

`RB Tech Solution License API is running`

Then open:

`https://YOUR-SERVICE.onrender.com/api/health`

Expected:

`{"success":true,"status":"online",...}`

## 5. Owner Admin

Open:

`https://YOUR-SERVICE.onrender.com/admin.html`

Use the Render `ADMIN_USERNAME` and `ADMIN_PASSWORD`.

## 6. Same-origin deployment

When the complete project is served by the same Render service, `js/license-config.js` can remain unchanged because it uses:

`window.location.origin`

This is the easiest deployment method.

## 7. If the hotel app stays on SPCK/static hosting

Then edit `js/license-config.js` after you receive the Render URL:

```js
window.LICENSE_SERVER_URL = "https://YOUR-SERVICE.onrender.com";
```

Do not put `ADMIN_PASSWORD` or `ADMIN_TOKEN` in this file.

## 8. Important production note

The current server stores license/customer records in JSON files under `server/data/`. This is suitable for initial testing. For a commercial production system, move these records to a persistent database (for example PostgreSQL/Supabase) before relying on the service for permanent customer/license records.
