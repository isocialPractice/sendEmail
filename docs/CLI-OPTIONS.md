# sendEmail CLI Options Reference

Complete documentation for all `sendEmail` command-line options.

`Ctrl + click` to view [docs](https://isocialpractice.github.io/sendEmail/index.html?cli-options)

---

## Terminology

| Term | Description |
|------|-------------|
| **Non-configurable Option** | Passed to CLI only; not stored in config files |
| **Configurable Option** | Can be passed to CLI or set in `config/emails/*/email.json` |
| **Tool Option** | Disables email sending; used for scripting/maintenance |
| **Aggressive** | Tool option that activates tool mode |
| **Passive** | Tool option that requires an aggressive option |

---

## Non-configurable Options

These options are passed on the command line only and do not appear in config files.

### `--account <name>`

**Type:** `mixed`

Specify a configured email account from `config/accounts/`. The `<name>` is the filename without extension.

```bash
sendEmail --account jane --send-to someone@example.com --subject "Hello"
```

- If omitted, uses `config/accounts/_default.js`
- The default account **must** exist at `config/accounts/_default.js`

---

### `--config-email <name>`

**Type:** `normal` | `repetitive`

Use a pre-configured email template from `config/emails/<name>/`. The `<name>` is the folder name.

```bash
sendEmail --config-email billing --send-to client@example.com
sendEmail --config-email newsletter --email-list subscribers --force
```

- Loads `email.json` for metadata (to, subject, html, etc.)
- Loads `email.js` for attachment configuration
- CLI options override values from `email.json`

---

### `-c, --copy [path]`

**Type:** `null:reproductive <tools>`

Copy the sendEmail tool to a specified path (or a new `sendEmail/` directory in the current working directory if `[path]` is omitted). Default behaviour — alias for `--copy:tool`.

```bash
sendEmail --copy ./my-project
sendEmail -c /var/tools/sendEmail
sendEmail -c                          # copies to CWD/sendEmail/
```

> **Important:** `config/accounts/` is **never** copied — it contains sensitive credentials.
> Setup runs automatically after copying to create `config/accounts/_default.js` from the template.

> **Local override (npm link):** If `sendEmail` is invoked via `npm link` from a directory
> that contains a sendEmail copy (`sendEmail/config/emails/` or `./config/emails/`), that
> local copy is used as the config root instead of the linked package.

**Switch parameters** — specify `-c:<switch>` or `--copy:<switch>` to change copy behaviour:

#### `-c:tool [path]` / `--copy:tool [path]`

**Type:** `null:reproductive <tools>`

Explicit full tool copy — identical to `-c` / `--copy`. Copies the entire sendEmail tool and runs setup.

```bash
sendEmail --copy:tool ./my-project
sendEmail -c:tool /var/tools/sendEmail
```

#### `-c:config [path]` / `--copy:config [path]`

**Type:** `null:reproductive <config>`

Copy only configuration and support types. Does **not** copy tool files (`src/`, `bin/`, etc.).

Copies:
- `config/emails/` — email templates
- `config/globals/` — global templates
- `attachments/` — email attachments (`support <attachment>`)
- `img/` — embedded images (`support <img>`)

After copying, `.github/scripts/` is copied temporarily and the OS-appropriate setup script is run
to create `config/accounts/_default.js`. The `.github/` folder is then removed from the destination.

```bash
sendEmail --copy:config ./my-project
sendEmail -c:config /path/to/project
```

> **Local config override:** When `sendEmail` is invoked from a directory that contains a
> `sendEmail/config/emails/` folder (created via `--copy:config`), those config types
> take precedence over the sendEmail root config.

#### `-c:config-no-account [path]` / `--copy:config-no-account [path]`

**Type:** `null:reproductive <config:no-account>`
**Inverse (default):** `null:reproductive <config:account>` (i.e. `--copy:config`)

Copy only configuration and support types **without** running account setup. No `config/accounts/`
folder or `_default.js` is created at the destination.

Copies:
- `config/emails/` — email templates
- `config/globals/` — global templates
- `attachments/` — email attachments (`support <attachment>`)
- `img/` — embedded images (`support <img>`)

```bash
sendEmail --copy:config-no-account ./my-project
sendEmail -c:config-no-account /path/to/project
```

When `--config-email` is used from a directory that contains this config copy, account resolution
falls back automatically to the sendEmail root `_default.js` (since no local `config/accounts/`
exists). If the user later adds a `config/accounts/` folder to the copy, it will be used instead.

> Use `--copy:config` (with account setup) if you want a pre-configured `_default.js` template
> created at the destination. Use `--copy:config-no-account` when the destination project will
> always rely on the sendEmail root account credentials.

---

### `-h, --help [section]`

**Type:** `null:productive`

Display help documentation. Without an argument, shows full help.

```bash
sendEmail -h
sendEmail -h options
sendEmail -h options:configurable
sendEmail -h options:non-configurable
sendEmail -h options:tool
sendEmail -h arguments
sendEmail -h arguments:configurable
sendEmail -h arguments:non-configurable
```

---

### `-f, --force`

**Type:** `null`

Skip the confirmation prompt before sending. Useful for scripting and automation.

```bash
sendEmail --config-email newsletter --email-list subscribers --force
```

---

### `--test [unitTest]`

**Type:** `null:reproductive`

Run the test suite. Without an argument, runs all tests. With an argument, runs a specific unit test by name.

```bash
sendEmail --test                    # run all tests
sendEmail --test engine             # run tests matching "engine"
sendEmail --test template-engine    # run tests matching "template-engine"
```

---

### `-t, --text <address> [message]`

**Type:** `raw`

Send a quick text email directly without configuration files.

```bash
sendEmail -t someone@example.com "Quick message here"
sendEmail --text john@example.com "Meeting at 3pm"
```

- Uses the default account from `config/accounts/_default.js`
- Message is sent as plain text

---

### `--command-format`

**Type:** `terminal`

Activate **Terminal Mode** — argument values may contain `$>command: {{ <cmd> }};` blocks whose output is evaluated and substituted before sending.

**Must be the first option.** If passed in any other position, `sendEmail` throws an error and terminates — no email is sent.

```bash
# Correct — --command-format is first
sendEmail --command-format \
  --send-to dev@example.com \
  --subject "$> {{ git log --oneline -1 }};" \
  --message-text "$>command: {{ git log -1 --pretty=%B }};"
```

#### Terminal Mode Syntax

```
$>command: {{ <full command> }};    # primary form
$> command: {{ <full command> }};   # primary with leading space (equivalent)
$>command {{ <full command> }};     # secondary form (no colon)
$> {{ <full command> }};            # shorthand form (single command)
```

**Syntax rules:**

| Rule | Detail |
|------|--------|
| `$>` prefix | Every block must start with `$>` |
| `command:` keyword | Optional whitespace between `$>` and `command:` is allowed — `$>command:` and `$> command:` are equivalent |
| Space inside `{{ }}` | At least one space after `{{` and before `}}` is required (always enforced) |
| Multiple spaces inside `{{ }}` OK | `{{  git log  }}` is acceptable |
| Semicolon after `}}` | The closing `}};` is mandatory |
| Multiple blocks | Multiple `$>command: {{ ... }};` blocks in one argument are allowed and concatenated |

Raw argument values (no `$>` syntax) are passed through unchanged. Terminal Mode does **not** disable raw data usage. Can only be used as arguments — not in email template config files (`email.json` / `.htm` / `.html`).

#### Prohibited Commands

The following are prohibited and will throw a `TerminalModeError`:

- Commands that delete files: `rm`, `del`, `rmdir`, `rd`, `unlink`, `shred`, `trash`, `erase`
- Commands that redirect output to files: `> file` or `>> file`
- Pipes to shell interpreters: `| bash`, `| sh`, `| cmd`, `| powershell`, etc.
- Commands with no output: `cd`, `export`, `source`, `set`, `exit`
- Privilege escalation: `sudo`, `su`
- Destructive commands: `dd ... of=`, `mkfs`, `format <drive>:`
- Network fetch-and-execute: `curl ... | bash`, `wget ... | python`, etc.

> See [TERMINAL-FORMAT.md](TERMINAL-FORMAT.md) for the full reference.

---

## Configurable Options

These options can be passed on the CLI or set as properties in `config/emails/*/email.json`.
CLI values always override config file values.

### `--send-to <address...>`

**Type:** `mixed`

Specify one or more recipient email addresses.

```bash
sendEmail --send-to john@example.com
sendEmail --send-to alice@example.com bob@example.com carol@example.com
```

- Accepts multiple addresses (space-separated)
- Overrides `"to"` in `email.json`

---

### `--subject <text>`

**Type:** `mixed`

Set the email subject line. Supports template variables.

```bash
sendEmail --subject "Monthly Newsletter"
sendEmail --subject "Invoice for {{contact.name}}"
```

---

### `--message-file <path>`

**Type:** `mixed`

Set the email message body from a file. The file extension determines the content type:

| Extension | Type |
|-----------|------|
| `.html`, `.htm` | HTML |
| `.txt` | Plain text |
| `.md` | Markdown (converted to HTML) |

```bash
sendEmail --message-file ./message.html
sendEmail --message-file ./newsletter.md
sendEmail --message-file ./announcement.txt
```

- Relative paths are resolved from your current working directory first (if the file exists there)
- If not found in CWD, `sendEmail` falls back to the tool/config root path

---

### `--message-html [path]`

**Type:** `mixed`

Set the HTML message file. The `[path]` argument is optional; exact behaviour depends on whether `--config-email` is in use and the type of the `"html"` property in `email.json`.

#### Without `--config-email` — direct path

```bash
sendEmail --send-to john@example.com --subject "Hello" --message-html ./newsletter.html
```

- Relative paths are resolved from CWD first, then the sendEmail root

#### With `--config-email` — `"html"` is an array or object

When `email.json` has `"html": ["html_a", "html_b"]` (array or object), `--message-html` selects one file from that catalog:

```bash
# Use the default html.htm[l] file in the email's html/ folder (flag only — no argument)
sendEmail --config-email example --message-html

# Select by 0-based index
sendEmail --config-email example --message-html 1

# Select by filename (without extension)
sendEmail --config-email example --message-html html_b
```

| Argument | Behaviour |
|----------|-----------|
| *(omitted)* | Resolves `html.htm` or `html.html` in the email's `html/` folder as the default; throws if not found |
| *(flag only, no value)* | Same as omitted — resolves default `html.htm[l]`; throws if not found |
| Numeric (e.g. `1`) | Uses the file at that index in the `"html"` array; throws if out of range |
| String match (e.g. `html_b`) | Uses the file with that name from the `"html"` array; throws if not in the array |
| String with extension (e.g. `./custom.htm`) | Resolved from CWD (see below) |

> The default `html.htm[l]` file is **not required** to be listed in the `"html"` array.

#### With `--config-email` — `"html"` is a string

When `email.json` has `"html": "html_a"`, the file is resolved automatically from the email's `html/` folder. `--message-html` is not needed for this case. If an argument with an extension is supplied, it is treated as a CWD path (see below).

#### With `--config-email` — argument with file extension (any `"html"` type)

When the argument contains an extension, it overrides resolution entirely and is resolved relative to CWD:

```bash
sendEmail --config-email example --message-html ./overrides/custom.htm
```

- Throws if the file does not exist at the CWD-relative path
- If the argument has **no extension** and does not match a value in `"html"`, a configuration error is thrown

---

### `--message-text <path>`

**Type:** `mixed`

Explicitly set a plain text message file (regardless of extension).

```bash
sendEmail --message-text ./message.txt
```

- Relative paths are resolved from your current working directory first (if the file exists there)
- If not found in CWD, `sendEmail` falls back to the tool/config root path

---

### `--from-address <email>`

**Type:** `mixed`

Override the from address. If not specified, uses the account's configured user address.

```bash
sendEmail --from-address noreply@company.com --send-to client@example.com
```

---

### `--reply-to <email...>`

**Type:** `mixed`

Set the reply-to address(es).

```bash
sendEmail --reply-to support@company.com
sendEmail --reply-to alice@company.com bob@company.com
```

---

### `--cc <address...>`

**Type:** `mixed`

Carbon copy recipient(s).

```bash
sendEmail --cc manager@company.com --send-to client@example.com
```

---

### `--bcc <address...>`

**Type:** `mixed`

Blind carbon copy recipient(s).

```bash
sendEmail --bcc archive@company.com
```

---

### `--attach-file <filename...>`

**Type:** `mixed`

Attachment filename(s). Paired positionally with `--attach-path`.

```bash
sendEmail --attach-file "report.pdf" --attach-path "./attachments/report.pdf"
```

---

### `--attach-path <path...>`

**Type:** `mixed`

Attachment file path(s). Paired positionally with `--attach-file`.

```bash
sendEmail \
  --attach-file "Invoice.pdf" \
  --attach-path "./attachments/Invoice.pdf" \
  --attach-file "logo.png" \
  --attach-path "./img/logo.png" \
  --attach-cid "logo@company.com" \
  --attach-content-disp "inline"
```

---

### `--attach-cid <cid...>`

**Type:** `mixed`

Content ID(s) for inline images. Corresponds positionally with `--attach-path`.
Used in HTML with `<img src="cid:logo@company.com">`.

```bash
sendEmail --attach-cid "logo@company.com" --attach-path "./img/logo.png" --attach-content-disp "inline"
```

---

### `--attach-content-disp <value...>`

**Type:** `mixed`

Content disposition(s) for attachments. Values: `attachment` (default) or `inline`.

```bash
sendEmail --attach-content-disp "inline" --attach-path "./img/logo.png" --attach-cid "logo@company.com"
```

---

### `--global-config <args...>`

**Type:** `mixed`

Load one or more global attachment config files by name or path and merge their
attachments into the current email. Multiple names can be space-separated.

```bash
sendEmail --config-email billing --global-config footer --send-to client@example.com
sendEmail --config-email newsletter --global-config footer banner --send-to list@example.com
sendEmail --send-to client@example.com --global-config ./myGlobals.js
sendEmail --send-to client@example.com --global-config myGlobalsFolder/
```

**Resolution order** (applied per argument, first match wins):

| Priority | Checks | Asset base path |
|----------|--------|-----------------|
| 1 | `<CWD>/config/globals/<arg>/global.js` (copy-location globals) | `<CWD>/` |
| 2 | `<sendEmailRoot>/config/globals/<arg>/global.js` (sendEmail root globals) | `<sendEmailRoot>/` |
| 3 | `<CWD>/<arg>/global.js` (directory relative to CWD) | `<CWD>/` |
| 4 | `<CWD>/<arg>` (file relative to CWD) | `<CWD>/` |

> **Asset paths:** Attachment paths in the config file (e.g. `img/logo.jpg`) are resolved
> relative to the root of whatever location the config was found in — the CWD for
> copy-location and CWD-relative lookups, or the sendEmail root for root globals.

The global config file must export a `globalAttachments` array:

```js
// config/globals/footer/global.js
export const globalAttachments = [
  {
    filename: 'Logo',
    path: 'img/logo.jpg',          // relative to this file's directory
    contentDisposition: 'inline',
    cid: 'logo@footer.local',
  },
];
```

**Switch parameters** — specify `--global-config:<switch>` to restrict resolution:

#### `--global-config:root <args...>`

Only resolve from sendEmail root globals (copy-location or sendEmail root `config/globals/`).
Does **not** fall back to CWD directories or files.

```bash
sendEmail --config-email billing --global-config:root footer --send-to client@example.com
```

- Resolves `CWD/config/globals/<arg>/global.js` first (copy-location priority)
- Falls back to `<sendEmailRoot>/config/globals/<arg>/global.js`
- Throws an error if not found in either location; no CWD fallback

#### `--global-config:path <args...>`

Only resolve relative to the current working directory.
Does **not** search sendEmail root globals.

```bash
sendEmail --send-to client@example.com --global-config:path ./footerAssets/
sendEmail --send-to client@example.com --global-config:path fileName.js
```

- Checks `<CWD>/<arg>/global.js` if `<arg>` is a directory
- Checks `<CWD>/<arg>` if `<arg>` is a file
- Throws an error if not found; no sendEmail globals fallback

---

### `--email-list <listName>`

**Type:** `repetitive`

Use an email list for bulk sending. The `<listName>` refers to a file in `lists/<listName>.json`.
Triggers **repetitive mode** — requires `--config-email`.

```bash
sendEmail --config-email newsletter --email-list subscribers
sendEmail --config-email billing --email-list clients --force
```

---

### `--send-all`

**Type:** `configurable`

Send one email to all contacts on the list at once, instead of sending individual
emails to each contact. All recipients appear in the `To:` field of a single email.

Requires a list source: `--email-list` on CLI, or `emailList` / `email-list` in `email.json`.

```bash
sendEmail --config-email billing --email-list clients --send-all
sendEmail --config-email billing --email-list clients --send-all --force
```

- The `CH-EMAILONLIST` placeholder is stripped (replaced with empty string) since
  per-contact personalization does not apply in send-all mode
- Can also be configured in `email.json` with `"sendAll": true`
- When `sendAll` is set in `email.json`, the list source can also come from
  `"emailList"` or `"email-list"` in the same config file

---

### `--log`

**Type:** `boolean`  
**Configurable:** yes

Log each sent email to a sequentially numbered file in the `logs/` folder at the sendEmail root:

```
logs/1.log
logs/2.log
logs/3.log
...
```

The next log number is determined by scanning for the highest existing `N.log` file and incrementing by 1. The `logs/` directory is created automatically if it does not exist.

```bash
sendEmail --config-email billing --email-list clients --log
sendEmail --config-email billing --email-list clients --log --force
```

Each log file captures:
- Log number and timestamp
- From, To, CC, BCC, Reply-To, Subject
- `--config-email` and `--email-list` used
- Account used
- Send result (success/failure, Message-ID)
- Bulk summary (total/sent/failed + per-recipient results) for repetitive mode
- Attachment list (filename, path, content disposition, CID)
- All active CLI options

Can also be configured in `email.json` with `"log": true` (boolean) or `"log": "true"` (string).

---

## Tool Options

Tool options disable email sending. They are used for list management and maintenance.

### `--new-list <listName>`

**Type:** `aggressive`

Create a new email list from tool files. Looks for:
- `__sendEmail__<listName>-emails.txt` — one email per line
- `__sendEmail__<listName>-names.txt` — one name per line

```bash
# With tool files in CWD:
sendEmail --new-list clients

# With tool files in a specific path:
sendEmail --new-list clients --list-tool-path ./data/
```

Output: `lists/<listName>.json`

---

### `--list-tool-path <path>`

**Type:** `passive`

Specify the directory containing tool files for `--new-list`.
Default: current working directory.

```bash
sendEmail --new-list clients --list-tool-path /data/email-lists/
```

---

## Template Variables

Use these variables in subject lines, HTML templates, and other configurable text:

| Variable | Value |
|----------|-------|
| `{{contact.name}}` | Contact's name from email list |
| `{{contact.email}}` | Contact's email from email list |
| `{{contact.<field>}}` | Any custom field from email list |
| `{{date}}` | Current date: `2026-02-19` |
| `{{date.formatted}}` | Formatted date: `February 19, 2026` |
| `{{date.short}}` | Short date: `2/19/2026` |
| `{{subject}}` | Email subject |
| `{{list.index}}` | Current index (0-based) in bulk send |
| `{{list.count}}` | Total recipients in bulk send |

**Legacy placeholders** (from old batch scripts) are also supported:
- `CH-EMAILONLIST` → contact name
- `CHANGE_SEND_TO` → contact email
- `CHANGE_MESSAGE_HEADER` → email subject

---

## Config File: email.json

Properties available in `config/emails/<name>/email.json`:

| Property | Type | Description |
|----------|------|-------------|
| `to` | `string \| string[]` | Recipient address(es). Use `CHANGE_SEND_TO` as a placeholder. |
| `bcc` | `string \| string[]` | BCC address(es). Use `CHANGE_BCC` as a placeholder. |
| `from` | `string` | Account name (e.g. `"_default"`) or an explicit email address. |
| `replyTo` | `string \| string[]` | Reply-to address(es). |
| `subject` | `string` | Subject line. Supports template variables (e.g. `{{contact.name}}`). |
| `html` | `string \| string[]` | **String:** HTML filename resolved automatically from the email's `html/` folder. **Array/object:** catalog of available HTML files selectable via `--message-html`; omitting `--message-html` (or passing it as a flag) resolves the default `html.htm[l]`. |
| `text` | `string` | Plain-text message file path. |
| `attachments` | `string` | Reference to the `emailAttachments` export in the paired `email.js`. |
| `globals` | `string[]` | Global attachment group names to include (e.g. `["footer"]`). |
| `dsn` | `object` | Delivery Status Notification config (`id`, `return`, `notify`, `recipient`). |
| `sendAll` | `boolean` | Send one email to all contacts on the list. Requires `emailList` or `email-list`. |
| `emailList` | `string` | List file name from `lists/` (e.g. `"billing"`). |
| `email-list` | `object[]` | Inline contact list: `[{"email": "...", "name": "..."}, ...]`. |

### `attachments` — syntax

The `attachments` property is a reference to the `emailAttachments` export
from the paired `email.js` in the same folder.

**Explicit reference notation (current):**
```json
"attachments": "{email.emailAttachments}"
```
- `email` — refers to `email.js` in the same config folder
- `emailAttachments` — the named export in that file

**Legacy shorthand (still accepted):**
```json
"attachments": "emailAttachments"
```

Both forms have the same effect. The explicit `{email.emailAttachments}` notation
is preferred because it clearly indicates the source file and export name.

The `emailAttachments` array in `email.js` is the authoritative list of attachments.
Example (`config/emails/billing/email.js`):

```js
import { globalAttachments as footerAttachments } from '../../globals/footer/global.js';

export const emailAttachments = [
  {
    filename: 'Billing Statement.pdf',
    path: 'attachments/Billing Statement.pdf',
  },
  {
    filename: 'img.jpg',
    path: 'img/img.jpg',
    contentDisposition: 'inline',
    cid: 'img@billing.local',
  },
  // Include footer global attachments (logo, map)
  ...footerAttachments,
];
```

> Each `config/emails/<folderName>/` must contain both `email.js` and `email.json`.

### `sendAll` — configuration

The `sendAll` property enables sending one email addressed to all contacts on a list,
instead of sending a separate email to each contact.

**Requirements:**
- `sendAll` must be `true`
- A list source must be available: either `emailList` (file reference) or `email-list` (inline)
- If `emailList` or `email-list` is present without `sendAll`, default behaviour applies (one email per contact)

**Using `emailList` (reference to a list file):**
```json
{
  "to": "CHANGE_SEND_TO",
  "from": "_default",
  "subject": "Team Update",
  "html": "html_a",
  "sendAll": true,
  "emailList": "billing"
}
```
This loads `lists/billing.json` and sends one email to all contacts.

**Using `email-list` (inline contacts):**
```json
{
  "to": "CHANGE_SEND_TO",
  "from": "_default",
  "subject": "Team Update",
  "html": "html_a",
  "sendAll": true,
  "email-list": [
    { "email": "john_a@site.com", "name": "John Apple" },
    { "email": "jane_a@site.com", "name": "Jane Apple" }
  ]
}
```

**Without `sendAll` (default behaviour):**
```json
{
  "to": "CHANGE_SEND_TO",
  "from": "_default",
  "subject": "Invoice for {{contact.name}}",
  "html": "html_a",
  "emailList": "billing"
}
```
This sends one email per contact (repetitive mode) using the `billing` list.
