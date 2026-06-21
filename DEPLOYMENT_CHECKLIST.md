# Wise EventFlow — Deployment Checklist

A step-by-step, copy-paste friendly guide for a **non-developer** to deploy the
app from scratch. Tick each box as you go. Detailed reference: [DEPLOY.md](DEPLOY.md).

> You need: a Google account, the GitHub repository, and a phone.

---

## 1. Create the Google Sheet
- [ ] Go to <https://sheets.google.com> and create a **blank** spreadsheet.
- [ ] Rename it (e.g. "Wise EventFlow — <event name>").

## 2. Open Apps Script and add the code
- [ ] In the Sheet menu: **Extensions → Apps Script**.
- [ ] Delete the default `Code.gs` file.
- [ ] For each file in the repo's `apps-script/` folder, create a matching
      script file and paste its contents: `Code.gs`, `Setup.gs`, `Auth.gs`,
      `Settings.gs`, `Groups.gs`, `Categories.gs`, `Requests.gs`, `Sync.gs`,
      `Utils.gs` (and optionally `Dev.gs` for test data).
- [ ] Click **Save** (disk icon).

## 3. Run setupSheets()
- [ ] In the toolbar function dropdown choose **`setupSheets`** → click **Run**.
- [ ] Approve the Google permission prompt (Advanced → Go to project → Allow).
- [ ] A dialog appears showing the **shared API key** — this also creates the six
      sheets and a default Settings row.

## 4. Confirm the Script Property (API key) was created
- [ ] **Project Settings (gear) → Script Properties**.
- [ ] Confirm a property named **`API_KEY`** exists. (setupSheets created it.)
- [ ] **Copy the API key** value (also shown in the dialog from step 3).

## 5. Deploy the Apps Script web app
- [ ] **Deploy → New deployment → (gear) Web app**.
- [ ] **Execute as:** Me. **Who has access:** **Anyone**.
- [ ] Click **Deploy** and approve if prompted.

## 6. Copy the Web App URL
- [ ] Copy the **Web app URL** (ends in `/exec`).
- [ ] Quick test: open `<THAT_URL>?action=ping` in a browser → you should see
      `{"pong":true,...,"ok":true}`.

## 7. Update config.js
- [ ] Edit `docs/js/config.js` in the repo.
- [ ] Set `API_URL` to the `/exec` URL (step 6).
- [ ] Set `API_KEY` to the key (step 4).

## 8. Push to GitHub
- [ ] Commit the `config.js` change and push to your branch (or `main`).

## 9. Enable GitHub Pages
- [ ] Repo **Settings → Pages**.
- [ ] **Source:** Deploy from a branch. **Branch:** your branch, **Folder:** `/docs`.
- [ ] Save and wait for the green check; note the published URL.

## 10. Install the PWA on a phone
- [ ] Open the published URL on the phone's browser.
- [ ] Use **Add to Home Screen / Install app**.
- [ ] Launch from the home-screen icon — it opens full-screen (standalone).

---

## Done — verify
- [ ] Add a group on one phone; it appears on another within ~5 seconds.
- [ ] (Optional) load test data: in Apps Script run `enableDevMode()` then
      `seedData()` (50 groups) or `seedLargeDataset(100)` / `seedLargeDataset(200)`
      for stress testing; remove later with `clearSeedData()` then
      `disableDevMode()`.

> Re-deploying the backend later: **Manage deployments → edit → Version: New
> version** keeps the same `/exec` URL. Changing `docs/` later: bump
> `CACHE_VERSION` in `docs/sw.js` before pushing.
