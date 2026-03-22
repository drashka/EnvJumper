<p align="center">
  <img src="icons/logo-envjumper.png" alt="EnvJumper" width="200">
</p>

<p align="center">
  <strong>Jump between your web environments in one click.</strong>
</p>

<p align="center">
  🇫🇷 <a href="README.fr.md">Version française</a>
</p>

---

EnvJumper is a Chrome extension that lets you instantly switch between environments of a web project (production, staging, dev…) while keeping the current page path. A colored border permanently shows you which environment you're on.

---

## Features

- **One-click switch** — Go from `prod.example.com/my-page` to `staging.example.com/my-page` without retyping the URL
- **Colored border** — Visually identify the active environment with a border around the page (6 colors available)
- **Multi-project** — Manage multiple projects, each with its own environments
- **Auto-detection** — Create a project from the active tab: EnvJumper detects the URL, the CMS, and any related open tabs to pre-fill your environments
- **Multi-CMS** — Built-in quick links for WordPress, Joomla, Drupal, PrestaShop, Magento and Shopify, with automatic CMS detection on the current page
- **WordPress Multisite** — Open a permalink on all network sites at once, access Network Admin and plugins (subdomain and subdirectory modes), with automatic detection of network sites
- **Basic Auth** — Store HTTP Basic Auth credentials per environment, synced across your devices
- **Right-click menu** — Jump to any environment directly from the browser context menu
- **Customizable display** — Independently toggle the colored border and the badge from the Settings tab
- **Export / Import** — Share your configuration with teammates via a JSON file
- **Keyboard shortcut** — Open the popup without leaving your keyboard (configurable in Chrome settings)
- **Light / Dark theme** — Automatic detection via system preference
- **Synced settings** — Display preferences (border, badge, position) sync across your Chrome devices via `chrome.storage.sync`

## Who is it for?

EnvJumper is designed for anyone working on multi-environment web projects: developers, designers, project managers, QA engineers, integrators…

---

## Installation

### From source (developer mode)

1. Clone this repository:
   ```bash
   git clone https://github.com/drashka/EnvJumper.git
   ```
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked**
5. Select the `envjumper/` folder

The EnvJumper icon will appear in your extensions bar.

---

## Usage

### Add a project and its environments

Two ways to create a project:

- **Manually** — Projects tab → **+ Add a project**: creates a blank project ready to fill in
- **From your tabs** — On a page of your project, open EnvJumper → **New project** (or use the **Detect from my tabs** button on first launch): EnvJumper automatically detects the domain, CMS, and other open tabs from the same project to pre-fill your environments

Example configuration:
- Production → `example.com` → 🔴 Red
- Staging → `staging.example.com` → 🟠 Orange
- Dev → `dev.example.com` → 🟢 Green

### Navigate between environments

1. Go to a page on a configured environment (e.g. `staging.example.com/my-article`)
2. Click the EnvJumper icon
3. The **Jumper** tab shows your current environment and the alternatives
4. Click an environment to switch:
   - **Same tab** button — replaces the URL in the current tab
   - **New tab** button — opens in a new tab

The colored border around the page confirms the active environment.

### CMS quick links

Enable a CMS on a project to get predefined quick links (login, dashboard, media, settings…):
- **WordPress** — including Multisite support (subdomain & subdirectory)
- **Joomla, Drupal, PrestaShop, Magento, Shopify**

When editing a project with no CMS configured, EnvJumper automatically analyzes the active page and offers to enable the detected CMS in one click.

### Basic Auth

In the environment settings, enable Basic Auth and enter your credentials. EnvJumper will automatically handle HTTP authentication challenges for that domain.

### WordPress Multisite

1. Enable **WordPress** then **WordPress Multisite** in a project's CMS tab
2. Choose the multisite type (subdomains or subdirectories) and add your sites (FR, EN, DE…)
3. Quick actions appear in the popup:
   - Open the current permalink on all sites
   - Access Network Admin, Network Plugins, Themes, Sites, Users and Settings

EnvJumper can also automatically detect network sites from the WordPress admin bar and offer to add them directly.

### Share your configuration

- **Export**: Settings tab → export all or a single group → downloads a JSON file (optionally includes Basic Auth credentials)
- **Import**: Settings tab → import → select a JSON file → choose to merge or replace

---

## Tech stack

- **Manifest V3**
- **Vanilla JS** — no framework, ES Modules natively
- **Custom CSS** — clean and professional design, no framework
- **Lucide Icons** — lightweight SVG icon set
- **chrome.storage.sync** — configuration synced across devices

---

## Development

### Setup

```bash
git clone https://github.com/drashka/EnvJumper.git
cd EnvJumper
npm install
npx playwright install chromium
```

### Run the test suite

```bash
npm test
```

The test suite uses [Playwright](https://playwright.dev/) to run end-to-end tests against a real Chrome instance with the extension loaded. 59 tests cover the Jumper panel, environment editing, CMS configuration, auto-detection, settings, and export/import.

---

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a branch for your feature (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m "Add my feature"`)
4. Push the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

---

## License

This project is distributed under the **GNU General Public License v3 (GPL-3.0)**.

You are free to use, modify and redistribute this software, provided that any derivative version is also distributed under GPL v3. See the [LICENSE](LICENSE) file for the full text.

---

## Author

Vibe coded with ❤️ by [Drashka](https://github.com/drashka) and Claude Code to simplify the daily life of web teams.
