# Privacy Policy — EnvJumper

🇫🇷 [Version française](PRIVACY.fr.md) · 🇪🇸 [Versión en español](PRIVACY.es.md)

**Last updated:** November 2026

---

EnvJumper is an open-source Chrome extension developed independently. This policy explains clearly and simply what data the extension handles and why.

---

## What data is stored

EnvJumper stores the following data using Chrome's built-in storage APIs:

- **Project and environment names** — the names you give to your projects and environments
- **Environment domains** — the domains you configure (e.g. `staging.example.com`)
- **CMS configuration and quick links** — CMS type, admin path, WordPress Multisite sites, custom links
- **Basic Auth credentials** — username and password for environments where you enable HTTP Basic Auth
- **Display preferences** — border and badge visibility, badge position and size, theme
- **Favicon cache** — the favicon address of each project, kept for 24 hours

---

## How data is stored

| Storage | What | Scope |
|---|---|---|
| `chrome.storage.local` | Projects, environments, CMS config, links, Basic Auth credentials, favicon cache | Local device only |
| `chrome.storage.sync` | Display preferences | Synced across your Chrome devices if you are signed into Chrome |

Your projects and credentials **are not synced**: they stay on the device where you entered them. Use the JSON export to move them.

---

## Network requests

EnvJumper has no backend, no analytics and no telemetry. The only requests made by the extension itself are used to display your project icons:

- **Your configured domains** — EnvJumper tries to fetch `/favicon.ico` from your environments' domains.
- **Google's favicon service** — if no favicon is found, EnvJumper loads the icon from `https://www.google.com/s2/favicons`. The **domain name** of the project's first environment is sent to Google. No other data (path, credentials, project name) is sent.

---

## Page content

When you create a project from a website, EnvJumper analyzes the current page **locally** to detect its CMS (WordPress, Joomla, Drupal…). On configured WordPress sites, it also checks whether you are logged in, to adapt the admin links. This information is not stored outside the project configuration and is never sent to anyone.

---

## Basic Auth credentials

Basic Auth usernames and passwords are stored in `chrome.storage.local`, on your device only. They are:

- **Sent only to the domain you configured them for**, in response to an authentication challenge from that domain
- **Never transmitted to any third party**
- **Included in JSON exports by default** — a checkbox lets you exclude them before exporting. If you include them, the exported file contains the passwords in plain text: share it with care.

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
| `storage` | Store your project, environment and preference configuration |
| `tabs` | Read the current tab URL to match it against configured environments, and open an environment in a new tab |
| `activeTab` | Access the current tab when you use the extension |
| `scripting` | Detect the CMS of the current page when creating a project |
| `webRequest`, `webRequestAuthProvider` | Automatically respond to HTTP Basic Auth challenges on configured domains |
| `contextMenus` | Add a right-click menu to open a link in another environment |
| `<all_urls>` (host permissions) | Display the colored border and badge on pages matching your environments, whatever their domain, and handle Basic Auth there |

---

## Deleting your data

You can delete all data stored by EnvJumper at any time by:

- Removing individual projects in the **Projects** tab
- Uninstalling the extension (this clears all local storage)
- Clearing Chrome's synced data from your Google account settings (display preferences only)

---

## Open source

EnvJumper is open source under the **GNU General Public License v3 (GPL-3.0)**. The full source code is available and auditable on GitHub:

👉 [https://github.com/drashka/EnvJumper](https://github.com/drashka/EnvJumper)

---

## Contact

For any question regarding this privacy policy, you can open an issue on the GitHub repository.

---

*This extension is an independent project, not a company product.*
