# Wise EventFlow — Milestone 1 Deployment

This slice proves the full stack: a volunteer opens the GitHub Pages URL on a
phone, installs the PWA, adds a group, and sees it appear on a second phone
within ~5 seconds. Follow these steps in order.

## 1. Create the Google Sheet + Apps Script backend

1. Create a new Google Sheet (this is the database).
2. In the Sheet: **Extensions → Apps Script**.
3. Delete the default `Code.gs`, then create one script file per `.gs` file in
   [`apps-script/`](apps-script/) and paste the matching contents:
   `Code.gs`, `Setup.gs`, `Auth.gs`, `Settings.gs`, `Groups.gs`, `Sync.gs`,
   `Utils.gs`. (Apps Script concatenates all files, so the split is just for
   readability.)
4. Optional but recommended: set the project manifest to match
   [`apps-script/appsscript.json`](apps-script/appsscript.json)
   (**Project Settings → Show "appsscript.json"**).
5. Run the **`setupSheets`** function once (**Run → setupSheets**). Approve the
   permission prompt. It creates the six sheets with the exact blueprint §6
   headers, seeds a default `Settings` row, and creates one **Admin** user.
   A dialog shows the **admin token** — copy it.

## 2. Deploy the web app

1. **Deploy → New deployment → Web app.**
2. Settings:
   - **Execute as:** Me
   - **Who has access:** **Anyone**
3. Deploy and **copy the Web app URL** (it ends in `/exec`).
4. Sanity check in a browser: open `<EXEC_URL>?action=ping` — you should see
   `{"pong":true,...,"ok":true}`.

> Re-deploying: use **Manage deployments → edit → Version: New version** so the
> same `/exec` URL keeps working.

## 3. Configure the frontend

1. Open [`docs/js/config.js`](docs/js/config.js).
2. Set `API_URL` to the `/exec` URL from step 2.
3. Commit and push.

## 4. Publish with GitHub Pages

1. Repo **Settings → Pages**.
2. **Source:** Deploy from a branch.
3. **Branch:** your working branch (or `main` after merge), **folder:** `/docs`.
4. Save. Wait for the green check, then open the published URL.

## 5. Sign in + test on real devices

1. Build the sign-in URL: `https://<user>.github.io/<repo>/?t=<ADMIN_TOKEN>`.
2. Open it on phone A. The token is saved and stripped from the address bar.
3. **Add to Home Screen** to install the PWA.
4. Add a group. It appears immediately (optimistic UI).
5. Open the same sign-in URL on phone B — the group appears within ~5 seconds.

## Adding more volunteers (optional)

Add a row to the **Users** sheet: `UserID`, `Name`, `Role`, a unique `Token`
(any random string), `Active` = `TRUE`. Share their personal `?t=<token>` link.

## Troubleshooting

- **`ping` works but app says "not configured":** `API_URL` still holds the
  placeholder — re-check step 3.
- **Writes fail / nothing appears:** confirm access is **Anyone** and you did
  not change the client to send `application/json` (it must stay `text/plain`).
- **"Unknown or inactive token":** the `Users` row is missing, `Active` is not
  `TRUE`, or the token in the URL does not match.
