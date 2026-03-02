# sendEmail Templating Reference

<!-- {% raw %} -->

Template features for email HTML and text content: variable substitution, global template tags, and how to wire them to reusable global configs. Template variables are also supported in attachment filenames and paths.

`Ctrl + click` to view [docs](https://isocialpractice.github.io/sendEmail/index.html?templating)

---

## Template Variables

Use `{{variable}}` syntax in subject lines, HTML templates, text files, and attachment properties to substitute dynamic values at send time.

### Built-in Variables

| Variable | Description | Example Value |
|---|---|---|
| `{{contact.name}}` | Recipient's display name | `Alice Johnson` |
| `{{contact.email}}` | Recipient's email address | `alice@example.com` |
| `{{contact.<field>}}` | Any additional field from the email list | `{{contact.company}}` |
| `{{date}}` | Current date (ISO 8601) | `2026-02-24` |
| `{{date.formatted}}` | Full English date | `February 24, 2026` |
| `{{date.short}}` | Short locale date | `2/24/2026` |
| `{{list.index}}` | Current recipient index (bulk send) | `3` |
| `{{list.count}}` | Total recipient count (bulk send) | `150` |

### Date Format Variables (dates.*)

The `dates.*` variables provide flexible date formatting powered by [`@jhauga/getdate`](https://github.com/jhauga/getDate). These are ideal for reports, summaries, and any email that references time periods.

| Variable | Description | Example Value |
|---|---|---|
| `{{dates.date}}` | Date in MM-DD-YY format | `02-26-26` |
| `{{dates.fullDate}}` | Date in MM-DD-YYYY format | `02-26-2026` |
| `{{dates.slashDate}}` | Date with slash separator MM/DD/YY | `02/26/26` |
| `{{dates.terminalDate}}` | Terminal format MM/DD/YYYY | `02/26/2026` |
| `{{dates.isoDate}}` | ISO format YYYY-MM-DD | `2026-02-26` |
| `{{dates.day}}` | Day of month (two digits) | `26` |
| `{{dates.monthNumber}}` | Month number (two digits) | `02` |
| `{{dates.month}}` | Full month name | `February` |
| `{{dates.monthShort}}` | Abbreviated month name | `Feb` |
| `{{dates.lastMonth}}` | Full previous month name | `January` |
| `{{dates.lastMonthShort}}` | Abbreviated previous month name | `Jan` |
| `{{dates.quarter}}` | Current fiscal quarter (1-4) | `1` |
| `{{dates.lastQuarter}}` | Previous fiscal quarter (1-4) | `4` |
| `{{dates.season}}` | Current season name | `Winter` |
| `{{dates.year}}` | Four-digit current year | `2026` |
| `{{dates.twoDigitYear}}` | Two-digit year | `26` |
| `{{dates.lastYear}}` | Four-digit previous year | `2025` |
| `{{dates.nextYear}}` | Four-digit next year | `2027` |
| `{{dates.isLeapYear}}` | Leap year indicator (1 or 0) | `0` |

#### Using dates.* in Subject Lines

```json
{
  "subject": "{{dates.lastMonth}} - Revenue Summary"
}
```

Result: `"January - Revenue Summary"` (when sent in February)

#### Using dates.* in HTML Templates

```html
<h1>Quarterly Report - Q{{dates.quarter}} {{dates.year}}</h1>
<p>Covering {{dates.lastMonth}} through {{dates.month}}</p>
<p>Generated on {{dates.fullDate}}</p>
```

#### Common Use Cases

**Monthly reports:**
```json
{
  "subject": "{{dates.lastMonth}} {{dates.year}} - Monthly Summary"
}
```

**Quarterly reports:**
```json
{
  "subject": "Q{{dates.lastQuarter}} {{dates.lastYear}} Financial Report"
}
```

**Year-end reports:**
```json
{
  "subject": "{{dates.lastYear}} Annual Review"
}
```

#### Using dates.* in Attachment Filenames and Paths

Template variables can be used in attachment filenames and paths defined in `email.js`:

```javascript
export const emailAttachments = [
  {
    filename: 'Monthly Report - {{dates.lastMonth}} {{dates.year}}.pdf',
    path: 'attachments/reports/{{dates.year}}/{{dates.month}}-report.pdf',
  },
  {
    filename: 'Q{{dates.quarter}} Summary - {{dates.year}}.pdf',
    path: 'attachments/quarterly/Q{{dates.quarter}}-{{dates.year}}.pdf',
  },
];
```

For complex date logic (e.g., conditional year calculation), use a function export:

```javascript
export const emailAttachments = (dates) => {
  // Use previous year for January reports
  const theYear = dates.lastMonth === "January" ? dates.lastYear : dates.year;

  return [
    {
      filename: `Report - ${dates.lastMonth} ${theYear}.pdf`,
      path: `reports/${theYear}/${dates.lastMonth}/report.pdf`,
    },
  ];
};
```

See [CONFIGURE.md](CONFIGURE.md#dynamic-attachments-with-date-variables) for complete attachment templating documentation.

### Legacy Placeholders

The following legacy placeholders are supported for backward compatibility:

| Legacy placeholder | Equivalent variable |
|---|---|
| `CH-EMAILONLIST` | `{{contact.name}}` |
| `CHANGE_SEND_TO` | `{{contact.email}}` |
| `CH-EMAILTO` | `{{contact.email}}` |
| `CH-SUBJECT` | `{{subject}}` |
| `CH-DATE` | `{{date}}` |

### Using Variables in HTML

```html
<p>Hello {{contact.name}},</p>
<p>Your invoice for {{date.formatted}} is attached.</p>
<p>Sent to: {{contact.email}}</p>
```

### Using Variables in Subject Lines

In `config/emails/<name>/email.json`:

```json
{
  "subject": "Invoice for {{contact.name}} — {{date.formatted}}"
}
```

### Custom Contact Fields

Add any extra fields to your email list and reference them with `{{contact.<field>}}`:

```json
{
  "email-list": [
    { "email": "alice@example.com", "name": "Alice", "company": "Acme Corp", "invoiceNo": "INV-001" }
  ]
}
```

```html
<p>Dear {{contact.name}} of {{contact.company}},</p>
<p>Invoice #{{contact.invoiceNo}} is ready.</p>
```

---

## Custom Variables from email.js

Variables defined in `email.js` can be used as template variables in the sibling `email.json` file. This allows you to compute dynamic values (such as conditional logic) and use them throughout your email configuration.

### Exporting Custom Variables

In `config/emails/<name>/email.js`, export an `emailVars` object:

```javascript
export const emailVars = {
  reportType: 'Monthly',
  fiscalYear: '2026',
  customField: 'value'
};
```

### Using Custom Variables in email.json

Reference exported variables using `{{variableName}}` syntax in your email configuration:

```json
{
  "subject": "{{reportType}} Report for Fiscal Year {{fiscalYear}}",
  "to": "reports@example.com"
}
```

### Conditional Logic Example

Compute variables based on conditions (e.g., use previous year for January reports):

```javascript
// config/emails/billing/email.js

// Compute the appropriate year based on current month
var theYear;
var date = new Date();
var monthCheck = date.getMonth();
if (monthCheck === 0) {
  // January: use previous year for last month's report
  theYear = '{{dates.lastYear}}';
} else {
  theYear = '{{dates.year}}';
}

export const emailAttachments = [
  {
    filename: 'Report - {{dates.lastMonth}} ' + theYear + '.pdf',
    path: 'reports/' + theYear + '/{{dates.lastMonth}}-inventory.pdf',
  }
];

// Export for use in email.json
export const emailVars = {
  theYear,
  reportType: 'Monthly'
};
```

```json
// config/emails/billing/email.json
{
  "subject": "Report {{dates.lastMonth}} {{theYear}}",
  "to": "billing@example.com",
  "attachments": "{email.emailAttachments}"
}
```

### Variable Resolution Order

When `email.json` is loaded:

1. Custom variables are loaded from `email.js` (if it exists and exports `emailVars`)
2. Built-in `dates.*` variables are generated
3. All variables are merged into the template context
4. Template substitution is applied to the JSON content
5. The substituted JSON is parsed

### Notes

- Custom variables can contain template syntax themselves (e.g., `theYear = '{{dates.lastYear}}'`)
- Template substitution happens once: custom variables and built-in variables are substituted together
- If a custom variable has the same name as a built-in variable, the custom variable takes precedence
- Custom variables are only available in the sibling `email.json` file, not in HTML templates or other email configs

---

## Global Template Tags

Embed a reusable global template inside an email HTML or text file using the `{% global %}` tag.

### Syntax

```html
{% global 'globalName' %}
```

Single or double quotes are both accepted:

```html
{% global "footer" %}
```

### Nested Global Paths

To target a nested global (a subfolder inside a global folder), use a slash-separated path:

```html
{% global 'footer/billing' %}
```

This resolves to `config/globals/footer/billing/`.

### How It Works

When `buildMessage()` processes an email template containing `{% global 'name' %}` tags:

1. The tag name is extracted from the HTML or text content.
2. The engine resolves `config/globals/<name>/` using the **same 3-step lookup as `--global-config`**:
   - CWD/config/globals/<name>/ — a `-c, --copy` instance in the current working directory
   - ROOT/config/globals/<name>/ — the installed sendEmail root
   - CWD/<name>/ — a plain directory relative to the current working directory
3. The global's data file (HTML or text) is loaded as the replacement content.
4. Attachments declared in `global.js` are resolved relative to the **same root that the global was found in** (`assetBasePath`), then merged into the email automatically.
5. The `{% global %}` tag is replaced in-place with the loaded content.

If a tag cannot be resolved, a warning is emitted and the tag is replaced with an empty string.

### Example

`config/emails/example/html/html_a.htm`:

```html
<p>Hello {{contact.name}},</p>
<p>Attached is the annual report.</p>
<p>Thanks, and have a great week!</p>

{% global 'footer' %}
```

`config/globals/footer/html.htm`:

```html
<div>
  <p>Best regards,</p>
  <p>The Team</p>
  <img src="cid:logo@company.com" alt="Logo" />
</div>
```

`config/globals/footer/global.js`:

```javascript
export const globalAttachments = [
  {
    filename: 'logo.png',
    path: 'img/logo.png',
    contentDisposition: 'inline',
    cid: 'logo@company.com',
  },
];
```

The final rendered HTML will have the `{% global 'footer' %}` tag replaced by the footer HTML, and the logo attachment automatically included.

---

## Global Folder Structure

Each global lives in `config/globals/<folderName>/`.

### Required

| File | Purpose |
|---|---|
| `global.js` | Declares attachments via `export const globalAttachments = [...]` |

> `global.js` is **required** for nested global folders and for any global that provides attachments.
> At minimum a global folder with only data files still needs `global.js` (which can export an empty array).

### Optional Data Files

A global folder may include HTML and/or text data files. These are the content injected when a `{% global 'name' %}` tag is encountered.

#### Root-level data files (strict naming)

When data files are placed directly in the global folder root, they **must** use these exact names:

| File | Description |
|---|---|
| `html.htm` or `html.html` | HTML content for the global |
| `text.txt` | Plain-text content for the global |

#### Subfolder data files (relaxed naming)

When data files are placed in `html/` or `data/` subfolders, **any filename is accepted**:

| Subfolder | Content type |
|---|---|
| `html/<anyFile>` | HTML content (explicit HTML email context) |
| `data/<anyFile>` | Text content (explicit text email context) |

When a `html/` or `data/` subfolder is present, it takes precedence over a root-level file of the same type.

### Resolution Priority

For HTML data:

1. `html/<firstFile>` (subfolder, relaxed naming)
2. `html.htm` (root, strict naming)
3. `html.html` (root, strict naming)

For text data:

1. `data/<firstFile>` (subfolder, relaxed naming)
2. `text.txt` (root, strict naming)

### Content Preference

- In **HTML email** context: HTML content is preferred; falls back to text if no HTML data.
- In **text email** context: text content is preferred; falls back to HTML if no text data.

---

## Nested Global Folders

A global folder can contain nested sub-globals. Each nested folder is an independent global with its own `global.js`.

```
config/globals/
  footer/
    billing/
      global.js          ← nested global: 'footer/billing'
      html.htm           ← optional HTML data
    marketing/
      global.js          ← nested global: 'footer/marketing'
      html/
        footer.htm       ← HTML data (subfolder, relaxed naming)
    global.js            ← parent global: 'footer' (still works independently)
    html.htm             ← optional HTML data for 'footer'
```

Referencing nested globals:

```html
{% global 'footer/billing' %}
{% global 'footer/marketing' %}
```

#### Rules for Nested Globals

| Rule | Value |
|---|---|
| `global.js` formatting retained | Yes |
| Nested folders required | No (optional) |
| Nested folder treated as global when `global.js` found | Yes |
| Folder with `global.js` can contain nested global sub-folders | No |
| Folder with `global.js` can contain `html/` or `data/` subfolders | Yes |

> A folder that contains `global.js` cannot also be a namespace for further nested globals.
> It is a leaf global. Only folders **without** `global.js` can serve as namespace containers.

---

## `--global-config` Option vs. Inline Tags

Two different mechanisms apply global configs to an email:

| Mechanism | How it works | When to use |
|---|---|---|
| `{% global 'name' %}` inline tag | Injects HTML/text content + attachments directly into a template file | Reusable HTML/text content blocks (headers, footers, signatures) |
| `--global-config name` / `globals: [...]` in email.json | Adds attachments from `global.js` only; no HTML injection | Shared attachments (inline images, logos) used globally without HTML substitution |

Both mechanisms load and merge attachments. The inline tag additionally performs content injection.

---

## Config Type System

Each configuration file in `config/` is classified by a `ConfigItemType`. Types are used internally by the engine for error reporting, validation, and resolution routing.

### Category: `accounts`

| Type | Path |
|---|---|
| `account` | `config/accounts/*.js` |
| `account:default` | `config/accounts/_default.js` |
| `account:named` | `config/accounts/<fileName>.js` (not `_default`) |

### Category: `globals`

| Type | Path |
|---|---|
| `global` | `config/globals/<folderName>/` |
| `global:nested` | `config/globals/<folderName>/<unrecognizedItem>` |
| `global:configuration` | `config/globals/<folderName>/global.js` |
| `global:data:html` | `config/globals/<folderName>/html.htm[l]` |
| `global:data:text` | `config/globals/<folderName>/text.txt` |
| `global:data:folder` | `config/globals/<folderName>/html/` or `data/` subfolder |
| `global:data:folder:html` | `config/globals/<folderName>/html/<file>` |
| `global:data:folder:data` | `config/globals/<folderName>/data/<file>` |

### Category: `emails`

| Type | Path |
|---|---|
| `email` | `config/emails/<folderName>/` |
| `email:nested` | `config/emails/<folderName>/<unrecognizedItem>` |
| `email:configuration:js` | `config/emails/<folderName>/email.js` |
| `email:configuration:json` | `config/emails/<folderName>/email.json` |
| `email:data:folder` | `config/emails/<folderName>/html/` or `data/` subfolder |
| `email:data:folder:html` | `config/emails/<folderName>/html/` subfolder |
| `email:data:folder:data` | `config/emails/<folderName>/data/` subfolder |
| `email:data:html` | `config/emails/<folderName>/html/<file>` (primary type) |
| `email:data:text` | `config/emails/<folderName>/data/<file>` (primary type) |
| `email:message:file:html` | `config/emails/<folderName>/html/<file>` (sub-type: message html file) |
| `email:message:file:text` | `config/emails/<folderName>/data/<file>` (sub-type: message text file) |

---

## See Also

- [API.md](API.md) — Engine API reference, including `resolveGlobalFolder()` and `loadGlobalForInline()`
- [EXAMPLES.md](EXAMPLES.md) — Real-world examples using global templates
- [CLI-OPTIONS.md](CLI-OPTIONS.md) — `--global-config` and related CLI options

<!-- {% endraw %} -->
