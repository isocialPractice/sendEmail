# sendEmail ![icon](icon.png)

Command-line tool to send an email, or automate repetitive emails.

Built with TypeScript and [nodemailer](https://nodemailer.com/). Engine-like design — can be embedded in VS Code extensions, GUIs, or any Node.js application.

`Ctrl + click` to view [docs](https://isocialpractice.github.io/sendEmail/index.html)

---

## Quick Start

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Send a quick text email
sendEmail -t someone@example.com "Hello from sendEmail"

# Show full help
sendEmail -h
```

---

## Setup

### 1. Configure Your Email Account

Run the setup script to create `config/accounts/_default.js` from the template:

#### Unix/macOS/Git Bash

```bash
bash .github/scripts/setup.sh
```

#### Windows CMD

```bash
.github\scripts\setup.bat
```

Then edit `config/accounts/_default.js` with your credentials.

For **Gmail**, use an [App Password](https://support.google.com/accounts/answer/185833) (requires 2FA).

> [!CAUTION]
> `config/accounts/` is excluded from git — it contains real credentials.
> **Never run `git add -f config/accounts/`** — this bypasses `.gitignore` and will expose your credentials.
> See [config/README.md](config/README.md) for full details.

### 2. Build

```bash
npm run build
```

### 3. (Optional) Add to PATH

```bash
# Unix/macOS
chmod +x bin/sendEmail.sh
ln -s $(pwd)/bin/sendEmail.sh /usr/local/bin/sendEmail

# Windows: add the bin/ directory to your PATH
```

---

## Usage

```text
sendEmail [options] [arguments]
```

### Send Modes

| Mode | Example |
| ---- | ------- |
| **Raw** (quick text) | `sendEmail -t user@example.com "Message"` |
| **Normal** (structured) | `sendEmail --send-to user@example.com --subject "Hello" --message-html body.html` |
| **Repetitive** (bulk) | `sendEmail --config-email newsletter --email-list subscribers --force` |

### Common Examples

```bash
# Quick text email
sendEmail -t someone@example.com "Quick message"

# HTML email
sendEmail --send-to john@example.com --subject "Report" --message-html ./report.html

# Markdown email (auto-converted to HTML)
sendEmail --send-to team@company.com --subject "Update" --message-file ./update.md

# Configured email template
sendEmail --config-email billing --send-to client@example.com

# Bulk send to list
sendEmail --config-email newsletter --email-list subscribers --force

# Terminal Format Mode — embed live command output in argument values (--command-format first)
sendEmail --command-format \
  --send-to dev@example.com \
  --subject "$> {{ git log --oneline -1 }};"

# Copy tool to a project (auto-creates config/accounts/_default.js via setup)
sendEmail --copy ./my-project           # full tool [null:reproductive <tools>]
sendEmail --copy:config ./my-project    # config/support types only [null:reproductive <config>]

# Show help
sendEmail -h
sendEmail -h options
sendEmail -h options:configurable
```

Relative paths for `--message-file`, `--message-html`, and `--message-text` are resolved from your current working directory first; if no match is found, sendEmail falls back to its config/tool root.

---

## Project Structure

```text
sendEmail/
├── src/
│   ├── core/                  # Core engine (interface-agnostic)
│   │   ├── engine.ts          # EmailEngine class
│   │   ├── types.ts           # All TypeScript interfaces
│   │   ├── config-loader.ts   # Load configurations
│   │   ├── template-engine.ts # Template variable substitution
│   │   ├── list-processor.ts  # Email list iteration
│   │   ├── attachment-loader.ts
│   │   └── validator.ts
│   ├── cli/                   # CLI entry point
│   │   ├── index.ts           # Main CLI runner
│   │   ├── parser.ts          # Argument parsing
│   │   ├── help.ts            # Help documentation
│   │   ├── prompts.ts         # Confirmation prompts
│   │   └── terminal-format.ts # --command-format terminal mode processor
│   ├── utils/                 # Utilities
│   │   ├── file-utils.ts
│   │   ├── logger.ts
│   │   ├── error-handler.ts
│   │   └── markdown-html.ts
│   └── tools/                 # Tool scripts
│       ├── list-generator.ts  # --new-list
│       ├── copy-tool.ts       # --copy
│       └── test-runner.ts     # --test
├── bin/
│   ├── sendEmail.js           # Node.js entry (npm bin)
│   ├── sendEmail.sh           # Unix/macOS wrapper
│   ├── sendEmail.cmd          # Windows CMD wrapper
│   └── sendEmail.ps1          # PowerShell wrapper
├── config/
│   ├── _accounts/             # Template (versioned) — rename to accounts/ to activate
│   ├── accounts/              # !! git-ignored !! — your real credentials live here
│   │   ├── _default.js        # REQUIRED default account
│   │   └── example.js
│   ├── emails/                # Configured email templates
│   │   ├── billing/
│   │   └── example/
│   └── globals/               # Reusable global templates
│       ├── footer/            # Global: 'footer'
│       │   └── billing/       # Nested global: 'footer/billing'
│       └── example/
├── lists/                     # Email lists (.json)
├── attachments/               # Email attachments
├── img/                       # Embedded images
├── tests/
│   ├── unit/                  # Unit tests (vitest)
│   ├── mock/server/           # Mock SMTP server
│   └── logs/                  # Test logs
└── docs/
    ├── CONFIGURE.md           # Email template and global configuration
    ├── CLI-OPTIONS.md         # Full options reference
    ├── CLI-CHEATSHEET.md      # Quick reference
    ├── API.md                 # Engine API documentation
    ├── EXAMPLES.md            # Real-world examples
    ├── TEMPLATING.md          # Template variables and global tags
    ├── TERMINAL-FORMAT.md     # Terminal Mode (--command-format)
    └── TYPES.md               # Type reference
```

---

## Configuration

### Account Config (`config/accounts/*.js`)

```javascript
// New-style (recommended):
export const account = {
  service: 'gmail',
  auth: { user: 'your@gmail.com', pass: 'app-password' },
};

// Or with custom SMTP:
export const account = {
  host: 'smtp.example.com',
  port: 587,
  secure: false,
  auth: { user: 'user@example.com', pass: 'password' },
};
```

### Email Config (`config/emails/<name>/email.json`)

```json
{
  "from": "_default",
  "subject": "Billing Statement - {{contact.name}}",
  "html": "billingStatement",
  "globals": ["footer"]
}
```

### Email List (`lists/<name>.json`)

```json
{
  "email-list": [
    { "email": "alice@example.com", "name": "Alice" },
    { "email": "bob@example.com", "name": "Bob" }
  ]
}
```

---

## Template Variables

Use in subject lines, HTML templates, and configurable text:

| Variable | Value |
| -------- | ----- |
| `{{contact.name}}` | Contact's name |
| `{{contact.email}}` | Contact's email |
| `{{contact.<field>}}` | Any custom field |
| `{{date}}` | `2026-02-19` |
| `{{date.formatted}}` | `February 19, 2026` |
| `{{list.index}}` | Current index (bulk send) |
| `{{list.count}}` | Total recipients |

### Date Formatting (dates.*)

Extended date formatting powered by [`@jhauga/getdate`](https://github.com/jhauga/getDate):

| Variable | Value |
| -------- | ----- |
| `{{dates.lastMonth}}` | Previous month name (`January`) |
| `{{dates.month}}` | Current month name (`February`) |
| `{{dates.quarter}}` | Current fiscal quarter (`1`) |
| `{{dates.lastQuarter}}` | Previous fiscal quarter (`4`) |
| `{{dates.year}}` | Four-digit year (`2026`) |
| `{{dates.lastYear}}` | Previous year (`2025`) |
| `{{dates.nextYear}}` | Next year (`2027`) |
| `{{dates.fullDate}}` | Full date MM-DD-YYYY (`02-26-2026`) |
| `{{dates.isoDate}}` | ISO date YYYY-MM-DD (`2026-02-26`) |

**Example — monthly report subject:**

```json
{
  "subject": "{{dates.lastMonth}} {{dates.year}} - Revenue Summary"
}
```

Result: `"January 2026 - Revenue Summary"` (when sent in February)

See [TEMPLATING.md](docs/TEMPLATING.md) for full variable reference.

Legacy placeholders (`CH-EMAILONLIST`, `CHANGE_SEND_TO`) are also supported.

---

## Global Templates

Reusable HTML/text snippets and attachments, stored in `config/globals/<name>/`.

### Inline Global Tags

Embed a global template inside any email HTML or text file:

```html
{% raw %}
{% global 'footer' %}
{% endraw %}
```

When `buildMessage()` processes the template, the tag is replaced with the global's HTML (or text) content, and the global's attachments (from `global.js`) are automatically merged into the email.

### Nested Globals

Global folders can contain nested sub-globals:

```
config/globals/
  footer/
    billing/
      global.js          ← 'footer/billing'
      html.htm           ← optional HTML data
    global.js            ← 'footer'
    html.htm             ← optional HTML data
```

Reference a nested global:

```html
{% raw %}
{% global 'footer/billing' %}
{% endraw %}
```

### Global Folder Structure

| File | Description |
| ---- | ----------- |
| `global.js` | Required — declares `globalAttachments` array |
| `html.htm` or `html.html` | Optional — HTML content (root, strict naming) |
| `text.txt` | Optional — text content (root, strict naming) |
| `html/<anyFile>` | Optional — HTML content (subfolder, relaxed naming) |
| `data/<anyFile>` | Optional — text content (subfolder, relaxed naming) |

See [docs/TEMPLATING.md](docs/TEMPLATING.md) for the full templating reference.

---

## Using as a Library

```typescript
import { EmailEngine, createEngineConfig } from './dist/core/engine.js';

const engine = new EmailEngine(createEngineConfig(process.cwd()));
await engine.initialize();

const result = await engine.sendEmail({
  from: 'sender@example.com',
  to: 'recipient@example.com',
  subject: 'Hello',
  html: '<p>Hello, World!</p>',
});
```

See [docs/API.md](docs/API.md) for full API documentation.

---

## Scripts

| Command | Description |
| ------- | ----------- |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run build:watch` | Watch mode compilation |
| `npm run dev` | Run CLI directly with tsx (no build needed) |
| `npm test` | Run tests in watch mode |
| `npm run test:run` | Run all tests once |
| `sendEmail --test` | Run tests via CLI |

---

## Documentation

- [CONFIGURE.md](docs/CONFIGURE.md) — How to configure email templates in `config/emails/` and global elements in `config/globals/`. Covers all `email.json` properties, `email.js` attachment definitions, HTML and text file layout, and complete examples including multiple recipients, date helper syntax, inline lists, and DSN.

- [CLI-OPTIONS.md](docs/CLI-OPTIONS.md) — Complete reference for every command-line option. Documents configurable options (usable in both CLI and `email.json`), non-configurable options, and tool options, including full syntax for `--config-email`, `--email-list`, `--global-config`, and the attachment flags.

- [CLI-CHEATSHEET.md](docs/CLI-CHEATSHEET.md) — Quick-reference card for the most common `sendEmail` patterns. Covers raw mode, normal mode, bulk send, and the most frequently used flags in a compact format.

- [API.md](docs/API.md) — Engine API documentation for embedding `EmailEngine` in TypeScript/JavaScript projects. Covers the `EmailEngine` class, all public methods, configuration interfaces, and examples for library usage.

- [EXAMPLES.md](docs/EXAMPLES.md) — Over 20 annotated real-world examples covering every send mode. Includes bulk send workflows, inline image attachments, template variable usage, terminal format mode, and account configuration patterns.

- [TEMPLATING.md](docs/TEMPLATING.md) — Full reference for template variables, the `{% global %}` tag, and global folder structure. Explains resolution rules, content preference (HTML vs text), nested globals, and the config type classification system.

- [TERMINAL-FORMAT.md](docs/TERMINAL-FORMAT.md) — Reference for Terminal Mode (`--command-format`), which lets you embed live shell command output in CLI argument values. Documents the `$>command: {{ }};` syntax, prohibited commands, and interaction with template variables.

- [TYPES.md](docs/TYPES.md) — Full type reference for `OptionType`, `ConfigItemType`, and send mode classifications. Useful for understanding how options and config files are categorized internally and for contributors extending the tool.
