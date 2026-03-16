# Privacy Policy — EnvJumper

🇫🇷 [Version française](PRIVACY.fr.md)

**Last updated:** March 2026

---

EnvJumper is an open-source Chrome extension developed independently. This policy explains clearly and simply what data the extension handles and why.

---

## What data is stored

EnvJumper stores the following data **locally on your device**, using Chrome's built-in storage APIs:

- **Project and environment names** — the names you give to your projects and environments
- **Environment domains** — the domains you configure (e.g. `staging.example.com`)
- **CMS configuration** — CMS type, login path, admin path
- **Basic Auth credentials** — username and password for environments where you enable HTTP Basic Auth
- **User preferences** — badge position, stealth mode state
- **Favicon cache** — cached favicons of configured sites, stored locally

---

## How data is stored

| Storage | What | Scope |
|---|---|---|
| `chrome.storage.sync` | Projects, environments, CMS config, Basic Auth credentials, preferences | Synced across Chrome devices on the same Google account |
| `chrome.storage.local` | Stealth mode state, favicon cache | Local device only |

**No data is ever sent to an external server.** EnvJumper operates entirely locally. There is no backend, no API call, no analytics, no telemetry.

---

## Basic Auth credentials

Basic Auth usernames and passwords are stored in `chrome.storage.sync`. This means they may be synced across your Chrome devices if you are signed into Chrome. They are:

- **Never transmitted to any third party**
- **Never sent outside of Chrome's own sync infrastructure** (Google's encrypted sync)
- **Not included in JSON exports by default** — you must explicitly opt in when exporting

---

## No tracking

EnvJumper collects **no usage data** of any kind:

- No analytics
- No cookies
- No advertising identifiers
- No crash reports sent externally
- No telemetry

---

## Permissions explained

| Permission | Why it is needed |
|---|---|
| `storage` | Store your project and environment configuration |
| `tabs` | Read the current tab URL to match it against configured environments |
| `activeTab` | Detect the CMS type on the current page and inject the colored border |
| `webRequest` | Automatically respond to HTTP Basic Auth challenges on configured domains |
| `contextMenus` | Add a right-click menu for quick environment switching |
| `<all_urls>` (host permissions) | Inject the colored border and badge on all pages matching configured environments, and respond to Basic Auth challenges across all domains |

---

## Deleting your data

You can delete all data stored by EnvJumper at any time by:

- Removing individual projects in the **Projects** tab
- Uninstalling the extension (this clears all local storage)
- Clearing Chrome's synced extension data from your Google account settings

---

## Open source

EnvJumper is open source under the **GNU General Public License v3 (GPL-3.0)**. The full source code is available and auditable on GitHub:

👉 [https://github.com/drashka/EnvJumper](https://github.com/drashka/EnvJumper)

---

## Contact

For any question regarding this privacy policy, you can open an issue on the GitHub repository.

---

*This extension is an independent project, not a company product.*
