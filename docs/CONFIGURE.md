# sendEmail Configuration Reference

<!-- {% raw %} -->

How to configure email templates in `config/emails/` and reusable global elements in `config/globals/`.

`Ctrl + click` to view [docs](https://isocialpractice.github.io/sendEmail/index.htm?configure)

---

## Overview

Configuration lives in two places:

| Folder | Purpose |
|--------|---------|
| `config/emails/<name>/` | Per-email templates: JSON config, JS attachments, HTML, text, and data files |
| `config/globals/<name>/` | Reusable content blocks: shared HTML footers, signatures, and inline image attachments |

---

## Email Templates — `config/emails/<name>/`

Each named email template is a folder under `config/emails/`. The folder name is what you pass to `--config-email`.

### Folder Structure

```
config/emails/
  billing/
    email.json          ← required: email properties and metadata
    email.js            ← required: attachment array
    html/
      billingStatement.htm    ← HTML body file(s)
    data/
      message.txt             ← optional plain-text body
```

### Files at a Glance

| File | Required | Purpose |
|------|----------|---------|
| `email.json` | Yes | Email properties: to, from, subject, html, attachments, globals, etc. |
| `email.js` | Yes | Exports `emailAttachments` array — attachment definitions |
| `html/<file>` | No | HTML body file(s). Any filename accepted in the `html/` subfolder |
| `data/<file>` | No | Plain-text body file(s). Any filename accepted in the `data/` subfolder |

---

## Configuring `email.json`

`email.json` is the primary configuration file for a templated email. All properties listed below correspond directly to nodemailer message fields — except for `globals`, `emailList`, `email-list`, `sendAll`, and `log`, which control sendEmail-specific behaviour.

### Complete Property Reference

| Property | Type | Description |
|----------|------|-------------|
| `to` | `string` | Recipient address(es). Single address, semicolon-separated list, or pass-through placeholder. |
| `cc` | `string` | CC address(es). Semicolon-separated for multiple. |
| `bcc` | `string` | BCC address(es). Semicolon-separated for multiple. |
| `from` | `string` | Account name (e.g. `"_default"`) or an explicit `display name <email>` string. |
| `replyTo` | `string` | Reply-to address. Account name or explicit address. |
| `subject` | `string` | Subject line. Supports `{{template}}` variables and `{{dates.*}}` variables. |
| `html` | `string \| string[]` | HTML file reference. String: resolved from `html/` folder. Array: catalog of files selectable via `--message-html`. |
| `text` | `string` | Plain-text body file path, resolved from `data/` folder. |
| `attachments` | `string` | Reference to `emailAttachments` export in `email.js`. Use `"{email.emailAttachments}"`. |
| `globals` | `string[]` | Global template names to include (e.g. `["footer"]`). Merges their HTML/text and attachments. |
| `emailList` | `string` | List file name from `lists/` (e.g. `"billing"`). Triggers bulk send. |
| `email-list` | `object[]` | Inline contact list: `[{"email": "...", "name": "..."}, ...]`. |
| `sendAll` | `boolean` | Send one email to all list contacts instead of individual emails. Requires `emailList` or `email-list`. |
| `dsn` | `object` | Delivery Status Notification config. See [DSN section](#dsn-delivery-status-notifications). |
| `log` | `boolean` | Set `true` to log send results to `logs/`. |

---

### `to`, `cc`, `bcc`, `replyTo` — Address Fields

#### Single address

```json
{
  "to": "jane@example.com"
}
```

#### Multiple addresses (semicolon-separated string)

Use a semicolon (`;`) to separate multiple addresses in a single string. This is the raw data form for sending to multiple recipients without using an email list.

```json
{
  "to": "jane@example.com; john@example.com; team@example.com"
}
```

This sends **one email** with all addresses visible in the `To:` field — equivalent to nodemailer's multiple `to` recipients.

```json
{
  "to": "jane@example.com; john@example.com",
  "cc": "manager@company.com; assistant@company.com",
  "bcc": "archive@company.com"
}
```

> Use an email list with `emailList` or `email-list` when you need per-contact personalization (one email per recipient). Use semicolon-separated raw strings when all recipients should receive the same email at once and all addresses may be visible to each other.

#### Pass-through placeholder

`CHANGE_SEND_TO` is a legacy placeholder that signals "provide this at send time via `--send-to`". The CLI flag overrides whatever is in `email.json`.

```json
{
  "to": "CHANGE_SEND_TO"
}
```

#### Account reference

`"_default"` (or any account name from `config/accounts/`) can be used for `from` and `replyTo` to pull the address from the account config:

```json
{
  "from": "_default",
  "replyTo": "_default"
}
```

---

### `subject` — Template Syntax

The `subject` field supports the full template variable syntax. Variables are wrapped in `{{ }}`.

#### Using contact variables (bulk send)

```json
{
  "subject": "Invoice for {{contact.name}} — {{date.formatted}}"
}
```

#### Using date helper variables

```json
{
  "subject": "{{dates.lastMonth}} {{dates.year}} - Revenue Summary"
}
```

Result when sent in February 2026: `"January 2026 - Revenue Summary"`

#### Combining variables

```json
{
  "subject": "Q{{dates.lastQuarter}} {{dates.lastYear}} Report — {{contact.name}}"
}
```

---

### `html` — HTML Body Files

#### String — single file

Provide the filename (without path prefix) and sendEmail resolves it from the `html/` subfolder of the email's folder.

```json
{
  "html": "billingStatement"
}
```

Resolves to `config/emails/billing/html/billingStatement.htm`.

You can also provide a full path:

```json
{
  "html": "config/emails/billing/html/billingStatement.htm"
}
```

#### Array — selectable catalog

When you have multiple HTML variants, list them as an array. Use `--message-html` on the CLI to select which one to send.

```json
{
  "html": ["html_a", "html_b", "html_c"]
}
```

```bash
# Select by 0-based index
sendEmail --config-email example --message-html 1

# Select by filename
sendEmail --config-email example --message-html html_b

# Use html.htm as the default (if present and not listed in array)
sendEmail --config-email example --message-html
```

---

### `text` — Plain-Text Body

Point to a text file in the `data/` subfolder:

```json
{
  "text": "message"
}
```

Resolves to `config/emails/<name>/data/message.txt`.

---

### `attachments` — Referencing `email.js`

The `attachments` field is a string reference to the `emailAttachments` export in the paired `email.js` file.

**Recommended notation:**

```json
{
  "attachments": "{email.emailAttachments}"
}
```

**Legacy shorthand (still accepted):**

```json
{
  "attachments": "emailAttachments"
}
```

Both resolve to `config/emails/<name>/email.js` → `export const emailAttachments`.

---

### `globals` — Including Global Templates

List global folder names to include. Their attachments are merged into the email, and their HTML/text content replaces any matching `{% global 'name' %}` tags in your template files.

```json
{
  "globals": ["footer"]
}
```

Multiple globals:

```json
{
  "globals": ["footer", "header"]
}
```

Nested global:

```json
{
  "globals": ["footer/billing"]
}
```

---

### Email List Properties — `emailList` and `email-list`

Use `emailList` to reference a list file from `lists/`:

```json
{
  "to": "CHANGE_SEND_TO",
  "from": "_default",
  "subject": "Invoice for {{contact.name}}",
  "html": "invoice",
  "emailList": "billing"
}
```

This loads `lists/billing.json` and sends one email per contact (repetitive mode).

Use `email-list` for an inline contact list:

```json
{
  "to": "CHANGE_SEND_TO",
  "from": "_default",
  "subject": "Invoice for {{contact.name}}",
  "html": "invoice",
  "email-list": [
    { "email": "alice@example.com", "name": "Alice" },
    { "email": "bob@example.com", "name": "Bob" }
  ]
}
```

**Custom contact fields** — add any extra field and reference it as `{{contact.<field>}}`:

```json
{
  "email-list": [
    { "email": "alice@example.com", "name": "Alice", "company": "Acme Corp", "invoiceNo": "INV-001" },
    { "email": "bob@example.com", "name": "Bob", "company": "Globex", "invoiceNo": "INV-002" }
  ]
}
```

In the HTML template:

```html
<p>Dear {{contact.name}} of {{contact.company}},</p>
<p>Invoice #{{contact.invoiceNo}} is attached.</p>
```

---

### `sendAll` — One Email to All Contacts

Combine `sendAll: true` with an email list to send a single email addressed to all contacts, rather than one email per contact:

```json
{
  "to": "CHANGE_SEND_TO",
  "from": "_default",
  "subject": "Company Announcement",
  "html": "announcement",
  "sendAll": true,
  "emailList": "staff"
}
```

All recipient addresses are placed in the `To:` field of one email. Per-contact template variables (`{{contact.name}}`, `{{contact.email}}`) are not substituted in `sendAll` mode.

---

### DSN — Delivery Status Notifications

Request delivery status feedback from the receiving server:

```json
{
  "dsn": {
    "id": "my-message-id",
    "return": "headers",
    "notify": ["success", "delay", "failure"],
    "recipient": "_default"
  }
}
```

| Field | Values | Description |
|-------|--------|-------------|
| `id` | any string | Message identifier for DSN reporting |
| `return` | `"headers"` \| `"full"` | Return headers only or the full message body |
| `notify` | array of `"success"`, `"delay"`, `"failure"` | When to receive a notification |
| `recipient` | account name or email | Where DSN reports are sent |

---

## Configuring `email.js`

`email.js` lives alongside `email.json` and exports the `emailAttachments` array. This is where all attachment definitions live — regular file attachments and inline images.

### Basic Structure

```javascript
export const emailAttachments = [
  {
    filename: 'Invoice.pdf',
    path: 'attachments/Invoice.pdf',
  },
];
```

### Attachment Object Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `filename` | `string` | Yes | Display name shown in the email client |
| `path` | `string` | Yes | File path, relative to the sendEmail root or absolute |
| `contentDisposition` | `'attachment' \| 'inline'` | No | Default: `'attachment'`. Use `'inline'` for images embedded in HTML. |
| `cid` | `string` | No | Content-ID for inline images. Referenced in HTML as `<img src="cid:...">`. Required when `contentDisposition` is `'inline'`. |

### Regular File Attachment

```javascript
export const emailAttachments = [
  {
    filename: 'Billing Statement.pdf',
    path: 'attachments/Billing Statement.pdf',
  },
];
```

### Inline Image Attachment

```javascript
export const emailAttachments = [
  {
    filename: 'logo.jpg',
    path: 'img/logo.jpg',
    contentDisposition: 'inline',
    cid: 'logo@company.com',
  },
];
```

In the HTML template, reference with the `cid:` URI:

```html
<img src="cid:logo@company.com" alt="Company Logo">
```

### Mixed Attachments and Inline Images

```javascript
export const emailAttachments = [
  {
    filename: 'Monthly Report.pdf',
    path: 'attachments/Monthly Report.pdf',
  },
  {
    filename: 'logo.jpg',
    path: 'img/logo.jpg',
    contentDisposition: 'inline',
    cid: 'logo@billing.local',
  },
  {
    filename: 'signature-banner.jpg',
    path: 'img/banner.jpg',
    contentDisposition: 'inline',
    cid: 'banner@billing.local',
  },
];
```

### Importing and Merging Global Attachments

Import a global's attachment array and spread it into `emailAttachments`:

```javascript
import { globalAttachments as footerAttachments } from '../../globals/footer/global.js';

export const emailAttachments = [
  {
    filename: 'Invoice.pdf',
    path: 'attachments/Invoice.pdf',
  },
  // Merges footer's inline images (logo, map, etc.)
  ...footerAttachments,
];
```

### Attachments Without `email.js` (CLI raw data)

When you need to send attachments without creating an `email.js` file, use the CLI attachment flags directly. Pass `--attach-file` and `--attach-path` in matching order:

```bash
sendEmail \
  --send-to client@example.com \
  --subject "Your Report" \
  --message-html ./report.html \
  --attach-file "Report.pdf" \
  --attach-path "./attachments/Report.pdf"
```

For inline images via CLI:

```bash
sendEmail \
  --send-to client@example.com \
  --subject "Branded Email" \
  --message-html ./branded.html \
  --attach-file "logo.png" \
  --attach-path "./img/logo.png" \
  --attach-cid "logo@company.com" \
  --attach-content-disp "inline"
```

Multiple inline images — each flag set corresponds positionally:

```bash
sendEmail \
  --send-to client@example.com \
  --subject "Visual Report" \
  --message-html ./visual.html \
  --attach-file "logo.png"    --attach-path "./img/logo.png" \
    --attach-cid "logo@co.com"  --attach-content-disp "inline" \
  --attach-file "chart.png"   --attach-path "./img/chart.png" \
    --attach-cid "chart@co.com" --attach-content-disp "inline"
```

---

## HTML Files — `html/`

HTML body files go in the `html/` subfolder. Any filename is accepted.

### Template Variable Syntax

Use `{{variable}}` for dynamic substitution:

```html
<p>Hello {{contact.name}},</p>
<p>Your statement for {{dates.lastMonth}} {{dates.year}} is attached.</p>
<p>Sent to: {{contact.email}} on {{date.formatted}}</p>
```

### Global Tag Syntax

Embed a reusable global block with the `{% global %}` tag:

```html
<h1>Your Invoice</h1>
<p>Dear {{contact.name}}, please find your invoice attached.</p>

{% global 'footer' %}
```

The tag is replaced at send time with the global's HTML content, and the global's attachments are automatically merged.

Nested global path:

```html
{% global 'footer/billing' %}
```

### Inline Image References

Reference inline images using the `cid:` URI — the CID must match the value defined in `email.js` or a global's `global.js`:

```html
<img src="cid:logo@company.com" alt="Logo">
<img src="cid:map@company.com" alt="Office Map">
```

---

## Text Files — `data/`

Plain-text body files go in the `data/` subfolder. Template variables and global tags work the same way as in HTML files.

```text
Hello {{contact.name}},

Your billing statement for {{dates.lastMonth}} {{dates.year}} is attached.

For assistance, reply to this email.

Thanks, and have a great day!
```

---

## Data Files (JSON) — `data/`

JSON files in the `data/` subfolder can serve as text-format data files. They are loaded as plain-text content (not parsed as structured data) unless used by a custom workflow.

---

## Template Variable Reference

These variables are available in subject lines, HTML files, and text files.

### Contact Variables

| Variable | Description | Source |
|----------|-------------|--------|
| `{{contact.name}}` | Recipient's display name | Email list |
| `{{contact.email}}` | Recipient's email address | Email list |
| `{{contact.<field>}}` | Any custom field | Email list |

### Date Variables

| Variable | Format | Example |
|----------|--------|---------|
| `{{date}}` | ISO 8601 | `2026-02-26` |
| `{{date.formatted}}` | Full English | `February 26, 2026` |
| `{{date.short}}` | Short locale | `2/26/2026` |

### Extended Date Variables (`dates.*`)

Powered by [`@jhauga/getdate`](https://github.com/jhauga/getDate).

| Variable | Description | Example |
|----------|-------------|---------|
| `{{dates.date}}` | MM-DD-YY | `02-26-26` |
| `{{dates.fullDate}}` | MM-DD-YYYY | `02-26-2026` |
| `{{dates.slashDate}}` | MM/DD/YY | `02/26/26` |
| `{{dates.terminalDate}}` | MM/DD/YYYY | `02/26/2026` |
| `{{dates.isoDate}}` | YYYY-MM-DD | `2026-02-26` |
| `{{dates.day}}` | Day (two digits) | `26` |
| `{{dates.monthNumber}}` | Month number (two digits) | `02` |
| `{{dates.month}}` | Full month name | `February` |
| `{{dates.monthShort}}` | Abbreviated month | `Feb` |
| `{{dates.lastMonth}}` | Previous month name | `January` |
| `{{dates.lastMonthShort}}` | Previous month abbreviated | `Jan` |
| `{{dates.quarter}}` | Current fiscal quarter | `1` |
| `{{dates.lastQuarter}}` | Previous fiscal quarter | `4` |
| `{{dates.season}}` | Season name | `Winter` |
| `{{dates.year}}` | Four-digit year | `2026` |
| `{{dates.twoDigitYear}}` | Two-digit year | `26` |
| `{{dates.lastYear}}` | Previous year | `2025` |
| `{{dates.nextYear}}` | Next year | `2027` |
| `{{dates.isLeapYear}}` | Leap year (1 or 0) | `0` |

#### Date syntax examples

Monthly report subject:

```json
{
  "subject": "{{dates.lastMonth}} {{dates.year}} - Monthly Summary"
}
```

Quarterly report subject:

```json
{
  "subject": "Q{{dates.lastQuarter}} {{dates.lastYear}} Financial Report"
}
```

Date range in HTML:

```html
<h1>Q{{dates.quarter}} {{dates.year}} Report</h1>
<p>Covering {{dates.lastMonth}} through {{dates.month}}</p>
<p>Generated on {{dates.fullDate}}</p>
```

### Bulk Send Variables

Available only during repetitive (bulk) sends:

| Variable | Description |
|----------|-------------|
| `{{list.index}}` | Current recipient index (0-based) |
| `{{list.count}}` | Total recipient count |

### Legacy Placeholders

| Placeholder | Equivalent |
|-------------|------------|
| `CH-EMAILONLIST` | `{{contact.name}}` |
| `CHANGE_SEND_TO` | `{{contact.email}}` |
| `CH-EMAILTO` | `{{contact.email}}` |
| `CH-SUBJECT` | `{{subject}}` |
| `CH-DATE` | `{{date}}` |
| `CHANGE_MESSAGE_HEADER` | Subject line placeholder |
| `CHANGE_BCC` | BCC placeholder |

---

## Global Email Elements — `config/globals/<name>/`

Globals are reusable building blocks: shared footers, signatures, and inline image sets that can be injected into any email template.

### Folder Structure

```
config/globals/
  footer/
    global.js           ← required: attachment declarations
    html.htm            ← optional: HTML content (strict naming at root)
    text.txt            ← optional: text content (strict naming at root)
  example/
    global.js
    html/
      footer.htm        ← optional: HTML content (relaxed naming in subfolder)
    data/
      footer.txt        ← optional: text content (relaxed naming in subfolder)
```

### Files at a Glance

| File / Folder | Required | Purpose |
|---------------|----------|---------|
| `global.js` | Yes | Declares `globalAttachments` array |
| `html.htm` or `html.html` | No | HTML content (root — must be named exactly this) |
| `text.txt` | No | Text content (root — must be named exactly this) |
| `html/<any>` | No | HTML content (subfolder — any filename accepted) |
| `data/<any>` | No | Text content (subfolder — any filename accepted) |

---

### `global.js` — Attachment Declarations

Every global folder must have a `global.js` that exports a `globalAttachments` array:

```javascript
export const globalAttachments = [
  {
    filename: 'Logo',
    path: 'img/logo.jpg',
    contentDisposition: 'inline',
    cid: 'logo@footer.local',
  },
];
```

No attachments (HTML/text-only global):

```javascript
export const globalAttachments = [];
```

Multiple attachments:

```javascript
export const globalAttachments = [
  {
    filename: 'Logo',
    path: 'img/logo.jpg',
    contentDisposition: 'inline',
    cid: 'logo@footer.local',
  },
  {
    filename: 'Map',
    path: 'img/map.jpg',
    contentDisposition: 'inline',
    cid: 'map@footer.local',
  },
];
```

> Attachment paths in `global.js` are resolved relative to the sendEmail root (or the CWD when using a `--copy` instance), not relative to the `global.js` file itself.

---

### HTML Files in Globals

#### Root-level — strict naming

At the root of the global folder, the HTML file **must** be named `html.htm` or `html.html`:

```
config/globals/footer/
  global.js
  html.htm        ← must use this exact name at root level
```

#### Subfolder — relaxed naming

In an `html/` subfolder, any filename is accepted:

```
config/globals/footer/
  global.js
  html/
    footer.htm    ← any name works in html/ subfolder
```

When both exist, the subfolder (`html/<file>`) takes precedence.

#### Example HTML global

```html
<div style="border-top: 1px solid #ddd; margin-top: 20px; padding-top: 10px;">
  <p>Best regards,</p>
  <p><strong>The Team</strong></p>
  <img src="cid:logo@footer.local" alt="Company Logo" style="height: 40px;">
</div>
```

Template variables work inside global HTML too:

```html
<p>Sent to {{contact.email}} on {{dates.fullDate}}</p>
```

---

### Text Files in Globals

#### Root-level — strict naming

Must be named `text.txt` at the root:

```
config/globals/footer/
  global.js
  text.txt        ← must use this exact name
```

#### Subfolder — relaxed naming

In a `data/` subfolder, any filename:

```
config/globals/footer/
  global.js
  data/
    footer.txt
```

#### Example text global

```text
Thanks, and have a great day!

The Team
company@example.com | https://example.com
```

---

### JS Files in Globals

Only `global.js` is a recognized JS file in a global folder. It must export a `globalAttachments` constant:

```javascript
// global.js — the only JS file used by sendEmail in a global folder
export const globalAttachments = [ /* attachment objects */ ];
```

---

### Nested Globals

A global folder can contain nested sub-globals. Each nested folder is an independent global with its own `global.js`:

```
config/globals/
  footer/
    billing/
      global.js         ← nested global: 'footer/billing'
      html.htm
    marketing/
      global.js         ← nested global: 'footer/marketing'
      html/
        footer.htm
    global.js           ← parent global: 'footer'
    html.htm
```

> A folder that contains `global.js` cannot also serve as a namespace for further nesting. Only folders **without** `global.js` can act as namespace containers.

Reference nested globals in templates:

```html
{% global 'footer/billing' %}
{% global 'footer/marketing' %}
```

Or in `email.json`:

```json
{
  "globals": ["footer/billing"]
}
```

---

## Complete `email.json` Examples

### Minimal — quick structured send

```json
{
  "from": "_default",
  "subject": "Hello from sendEmail",
  "html": "body"
}
```

### Standard billing template

```json
{
  "to": "CHANGE_SEND_TO",
  "bcc": "CHANGE_BCC",
  "from": "_default",
  "replyTo": "_default",
  "subject": "Billing Statement - {{contact.name}}",
  "html": "billingStatement",
  "attachments": "{email.emailAttachments}",
  "globals": ["footer"],
  "log": false
}
```

### Monthly report with date helper syntax

```json
{
  "to": "CHANGE_SEND_TO",
  "from": "_default",
  "subject": "{{dates.lastMonth}} {{dates.year}} - Monthly Report",
  "html": "monthlyReport",
  "attachments": "{email.emailAttachments}",
  "globals": ["footer"],
  "log": true
}
```

### Multiple recipients — raw string (no list)

```json
{
  "to": "alice@example.com; bob@example.com; carol@example.com",
  "from": "_default",
  "subject": "Team Announcement",
  "html": "announcement"
}
```

### Bulk send to a list file

```json
{
  "to": "CHANGE_SEND_TO",
  "from": "_default",
  "subject": "Invoice for {{contact.name}}",
  "html": "invoice",
  "attachments": "{email.emailAttachments}",
  "globals": ["footer"],
  "emailList": "clients",
  "log": true
}
```

### Inline contact list with custom fields

```json
{
  "to": "CHANGE_SEND_TO",
  "from": "_default",
  "subject": "Invoice #{{contact.invoiceNo}} for {{contact.name}}",
  "html": "invoice",
  "attachments": "{email.emailAttachments}",
  "globals": ["footer"],
  "email-list": [
    { "email": "alice@example.com", "name": "Alice", "invoiceNo": "INV-001" },
    { "email": "bob@example.com", "name": "Bob", "invoiceNo": "INV-002" }
  ]
}
```

### Send-all to a list

```json
{
  "to": "CHANGE_SEND_TO",
  "from": "_default",
  "subject": "Team Update — {{dates.month}} {{dates.year}}",
  "html": "announcement",
  "sendAll": true,
  "emailList": "staff"
}
```

### Multiple HTML variants (selectable)

```json
{
  "to": "CHANGE_SEND_TO",
  "from": "_default",
  "subject": "CHANGE_MESSAGE_HEADER",
  "html": ["html_a", "html_b", "html_c"],
  "attachments": "{email.emailAttachments}",
  "globals": ["footer"],
  "log": false
}
```

### With DSN (delivery status notification)

```json
{
  "to": "CHANGE_SEND_TO",
  "bcc": "CHANGE_BCC",
  "from": "_default",
  "replyTo": "_default",
  "subject": "CHANGE_MESSAGE_HEADER",
  "html": ["html_a", "html_b"],
  "attachments": "{email.emailAttachments}",
  "globals": ["footer"],
  "log": false,
  "dsn": {
    "id": "DSN_ID",
    "return": "headers",
    "notify": ["success", "delay"],
    "recipient": "_default"
  }
}
```

---

## See Also

- [TEMPLATING.md](TEMPLATING.md) — Full template variable reference and global tag details
- [CLI-OPTIONS.md](CLI-OPTIONS.md) — `--config-email`, `--email-list`, `--global-config`, and all configurable options
- [EXAMPLES.md](EXAMPLES.md) — Real-world usage examples including bulk send and inline globals
- [API.md](API.md) — Engine API for library usage

<!-- {% endraw %} -->
