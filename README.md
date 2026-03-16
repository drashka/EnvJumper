<p align="center">
  <img src="envjumper/icons/logo-envjumper-small.png" alt="EnvJumper" width="200">
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
- **Colored border** — Visually identify the active environment with a border around the page (12 colors available)
- **Multi-project** — Manage multiple projects, each with its own environments
- **Multi-CMS** — Built-in quick links for WordPress, Joomla, Drupal, PrestaShop, Magento and Shopify
- **WordPress Multisite** — Open a permalink on all network sites at once, access Network Admin and plugins (subdomain and subdirectory modes)
- **Basic Auth** — Store HTTP Basic Auth credentials per environment, synced across your devices
- **Right-click menu** — Jump to any environment directly from the browser context menu
- **Stealth mode** — Hide the colored border and badge when needed
- **Export / Import** — Share your configuration with teammates via a JSON file
- **Light / Dark theme** — Automatic detection via system preference
- **Synced** — Configuration syncs across your Chrome devices via `chrome.storage.sync`

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

1. Click the EnvJumper icon
2. Go to the **Projects** tab
3. Click **+ Add a project** — EnvJumper auto-detects the current tab's URL and pre-fills the project name and first environment
4. Adjust the name, domain and color, then add more environments as needed:
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

### Basic Auth

In the environment settings, enable Basic Auth and enter your credentials. EnvJumper will automatically handle HTTP authentication challenges for that domain.

### WordPress Multisite

1. Enable **WordPress** then **WordPress Multisite** in a project's CMS tab
2. Choose the multisite type (subdomains or subdirectories) and add your sites (FR, EN, DE…)
3. Quick actions appear in the popup:
   - Open the current permalink on all sites
   - Access Network Admin, Network Plugins, Themes, Sites, Users and Settings

### Share your configuration

- **Export**: Projects tab → export all or a single group → downloads a JSON file
- **Import**: Projects tab → import → select a JSON file → choose to merge or replace

---

## Tech stack

- **Manifest V3**
- **Vanilla JS** — no framework, ES Modules natively
- **Custom CSS** — clean and professional design, no framework
- **Lucide Icons** — lightweight SVG icon set
- **chrome.storage.sync** — configuration synced across devices

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

Created with ❤️ by [Drashka](https://github.com/drashka) to simplify the daily life of web teams.
