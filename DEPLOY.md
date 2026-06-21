# Wise EventFlow — Deployment

A volunteer opens the GitHub Pages URL on a phone, installs the PWA, and works
the event: add groups, run the photography and food queues, and raise/resolve
requests — all kept in sync across phones every ~5 seconds. Follow these steps
in order.

## 1. Create the Google Sheet + Apps Script backend

1. Create a new Google Sheet (this is the database).
2. In the Sheet: **Extensions → Apps Script**.
3. Delete the default `Code.gs`, then create one script file per `.gs` file in
   [`apps-script/`](apps-script/) and paste the matching contents:
   `Code.gs`, `Setup.gs`, `Auth.gs`, `Settings.gs`, `Groups.gs`, `Categories.gs`,
   `Requests.gs`, `Sync.gs`, `Utils.gs`. (Apps Script concatenates all files, so
   the split is just for readability.)
4. Optional but recommended: set the project manifest to match
   [`apps-script/appsscript.json`](apps-script/appsscript.json)
   (**Project Settings → Show "appsscript.json"**).
5. Run the **`setupSheets`** function once (**Run → setupSheets**). Approve the
   permission prompt. It creates the six sheets with the exact blueprint §6
   headers, seeds a default `Settings` row, and generates the **shared API key**
   (stored in Script Properties). A dialog shows the key — **copy it**.

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
3. Set `API_KEY` to the shared key from step 1.
4. Commit and push.

## 4. Publish with GitHub Pages

1. Repo **Settings → Pages**.
2. **Source:** Deploy from a branch.
3. **Branch:** your working branch (or `main` after merge), **folder:** `/docs`.
4. Save. Wait for the green check, then open the published URL.

## 5. Test on real devices

1. Open the published URL on phone A. **Add to Home Screen** to install the PWA.
2. **Add Group** → it appears immediately (optimistic UI) and on phone B within
   ~5 seconds.
3. **Photo** tab → **Photo Done** → the group leaves the photo queue and enters
   the **Food** queue on every phone.
4. **Food** tab → **Food Done** → the group is completed.
5. **Requests** tab → pick a group → **Send request**. A banner appears at the
   top of every phone. Tap **Resolve** on any phone and it clears everywhere.

The shared API key in `config.js` authorizes every request — there is no login.
All 5–10 volunteers use the same published URL.

## Troubleshooting

- **`ping` works but app says "not configured":** `API_URL` still holds the
  placeholder — re-check step 3.
- **`Invalid API key`:** `API_KEY` in `config.js` does not match the key shown by
  `setupSheets()` (re-run it to view the stored key).
- **Writes fail / nothing appears:** confirm access is **Anyone** and the client
  still sends `text/plain` (never `application/json`, which triggers a preflight
  Apps Script cannot answer).
