# sendEmail Type Reference

Comprehensive documentation for all type systems used in the `sendEmail` project.

---

## Option Types

Every CLI option is tagged with an `OptionType` that describes its behavior and role in the system.

```typescript
type OptionType =
  | 'mixed'
  | 'normal'
  | 'raw'
  | 'repetitive'
  | 'null'
  | 'null:reproductive'
  | 'null:reproductive <config>'
  | 'null:reproductive <tools>'
  | 'null:productive'
  | 'boolean'
  | 'aggressive'
  | 'passive';
```

### `mixed`

The option can appear in both the CLI and config files (e.g. `email.json`). CLI values always override config values.

**Examples:** `--send-to`, `--subject`, `--message-file`, `--global-config`, `--attach-file`

---

### `normal`

Triggers **Normal** send mode when provided.

**Examples:** `--config-email` (when used without an email list)

---

### `raw`

Triggers **Raw** send mode. Sends a quick text email with minimal options.

**Examples:** `-t, --text`

---

### `repetitive`

Triggers **Repetitive** (bulk) send mode. Requires `--config-email`.

**Examples:** `--email-list`

---

### `null`

A boolean toggle that modifies default behaviour. Does not trigger a send mode on its own.

**Examples:** `-f, --force` (skip confirmation prompt)

---

### `null:reproductive`

Produces a reusable instance or runs a process. Disables email sending.

**Examples:** `--test` (run the test suite)

---

### `null:reproductive <tools>`

**Full tool copy** — copies the entire `sendEmail` tool to a new location and runs setup to create `config/accounts/_default.js`. Only `.github/scripts/` is included from `.github/`; other subdirectories (instructions, prompts, skills) are excluded.

**Mapped by:** `-c, --copy` / `--copy:tool`

```bash
sendEmail --copy ./my-project         # copy to CWD/sendEmail/
sendEmail --copy ./my-project         # copy to specified path
sendEmail --copy:tool ./my-project    # explicit (same as --copy)
```

---

### `null:reproductive <config>`

**Config-only copy** — copies configuration and support types only. Does not copy tool files (`src/`, `bin/`, etc.). Useful for creating a local config override alongside an npm-linked `sendEmail` installation.

Copies: `config/emails/`, `config/globals/`, `attachments/`, `img/`

Setup process:
1. Copies `.github/scripts/` temporarily to the destination
2. Detects OS (Unix / macOS / Cygwin / Git Bash → `setup.sh`; Windows CMD → `setup.bat`)
3. Runs the appropriate setup script to create `config/accounts/_default.js`
4. Removes `.github/` from the destination (was temporary)

**Mapped by:** `--copy:config`, `-c:config`

```bash
sendEmail --copy:config ./my-project
sendEmail -c:config ./my-project
```

When `sendEmail` is invoked from a directory containing a `sendEmail/config/emails/` folder (created via `--copy:config`), those config types take precedence over the sendEmail root config.

---

### `null:productive`

Documentation or maintenance — displays output but does not send email or produce a new instance.

**Examples:** `-h, --help`

---

### `boolean`

A boolean flag that can be configured in `email.json` as well as passed on the CLI.

**Examples:** `--log`, `--send-all`

---

### `aggressive`

Activates a tool mode that completely disables email sending. Tool options.

**Examples:** `--new-list`

---

### `passive`

Requires an `aggressive` option to have effect. Provides an argument to the aggressive option.

**Examples:** `--list-tool-path` (requires `--new-list`)

---

## Send Modes

```typescript
enum SendMode {
  RAW = 'raw',
  NORMAL = 'normal',
  REPETITIVE = 'repetitive'
}
```

### `RAW`

Quick text email. Triggered by `-t, --text`. No config files required.

```bash
sendEmail -t someone@example.com "Hello"
```

### `NORMAL`

Structured email with full options. Triggered by `--send-to`, `--config-email`, `--message-file`, or `--message-html`.

```bash
sendEmail --config-email billing --send-to client@example.com
sendEmail --send-to john@example.com --subject "Report" --message-html ./body.html
```

### `REPETITIVE`

Bulk send to a contact list. Triggered by `--email-list`. Requires `--config-email`.

```bash
sendEmail --config-email newsletter --email-list subscribers --force
```

---

## Config Categories

```typescript
type ConfigCategory = 'accounts' | 'globals' | 'emails' | 'support';
```

| Category | Location | Description |
|----------|----------|-------------|
| `accounts` | `config/accounts/` | Email account credentials |
| `globals` | `config/globals/` | Reusable global templates and attachments |
| `emails` | `config/emails/` | Configured email templates |
| `support` | `attachments/`, `img/` | Support folders (attachments, images) |

---

## Config Item Types

Every file and folder inside `config/` (and the support folders `attachments/`, `img/`) is classified by a `ConfigItemType`.

```typescript
type ConfigItemType = AccountConfigType | GlobalConfigType | EmailConfigType | SupportConfigType;
```

---

### Account Config Types

Parent category: `accounts`

```typescript
type AccountConfigType =
  | 'account'          // any config/accounts/* entry
  | 'account:default'  // config/accounts/_default.js
  | 'account:named';   // config/accounts/<name>.js (not _default)
```

| Type | Path |
|------|------|
| `account` | `config/accounts/*` |
| `account:default` | `config/accounts/_default.js` |
| `account:named` | `config/accounts/<fileName>.js` (not `_default`) |

---

### Global Config Types

Parent category: `globals`

```typescript
type GlobalConfigType =
  | 'global'                  // config/globals/<folderName>/
  | 'global:nested'           // config/globals/<folderName>/<unrecognizedItem>
  | 'global:configuration'    // config/globals/<folderName>/global.js
  | 'global:data:html'        // config/globals/<folderName>/html.htm[l]  (root-level)
  | 'global:data:text'        // config/globals/<folderName>/text.txt     (root-level)
  | 'global:data:folder'      // config/globals/<folderName>/html/ or data/ subfolder
  | 'global:data:folder:html' // config/globals/<folderName>/html/ subfolder
  | 'global:data:folder:data';// config/globals/<folderName>/data/ subfolder
```

| Type | Path |
|------|------|
| `global` | `config/globals/<folderName>/` |
| `global:nested` | `config/globals/<folderName>/<unrecognizedItem>` |
| `global:configuration` | `config/globals/<folderName>/global.js` |
| `global:data:html` | `config/globals/<folderName>/html.htm[l]` |
| `global:data:text` | `config/globals/<folderName>/text.txt` |
| `global:data:folder` | `config/globals/<folderName>/html/` or `data/` |
| `global:data:folder:html` | `config/globals/<folderName>/html/` |
| `global:data:folder:data` | `config/globals/<folderName>/data/` |

---

### Email Config Types

Parent category: `emails`

```typescript
type EmailConfigType =
  | 'email'                     // config/emails/<folderName>/
  | 'email:nested'              // config/emails/<folderName>/<unrecognizedItem>
  | 'email:configuration:js'    // config/emails/<folderName>/email.js
  | 'email:configuration:json'  // config/emails/<folderName>/email.json
  | 'email:data:folder'         // config/emails/<folderName>/html/ or data/
  | 'email:data:folder:html'    // config/emails/<folderName>/html/
  | 'email:data:folder:data'    // config/emails/<folderName>/data/
  | 'email:data:html'           // config/emails/<folderName>/html/<file.ext>
  | 'email:data:text'           // config/emails/<folderName>/data/<file.ext>
  | 'email:message:file:html'   // html file usable as email message body
  | 'email:message:file:text';  // text file usable as email message body
```

| Type | Path |
|------|------|
| `email` | `config/emails/<folderName>/` |
| `email:nested` | `config/emails/<folderName>/<unrecognizedItem>` |
| `email:configuration:js` | `config/emails/<folderName>/email.js` |
| `email:configuration:json` | `config/emails/<folderName>/email.json` |
| `email:data:folder` | `config/emails/<folderName>/html/` or `data/` (either) |
| `email:data:folder:html` | `config/emails/<folderName>/html/` |
| `email:data:folder:data` | `config/emails/<folderName>/data/` |
| `email:data:html` | `config/emails/<folderName>/html/<file.ext>` |
| `email:data:text` | `config/emails/<folderName>/data/<file.ext>` |
| `email:message:file:html` | html file usable as message body (sub-type of `email:data:html`) |
| `email:message:file:text` | text file usable as message body (sub-type of `email:data:text`) |

---

### Support Config Types

Parent category: `support`

Root-level support folders used by all email templates. Copied as part of a `--copy:config` operation.

```typescript
type SupportConfigType =
  | 'support'               // generic support entry
  | 'support <img>'         // img/ folder (embedded images)
  | 'support <attachment>'; // attachments/ folder
```

| Type | Path | Description |
|------|------|-------------|
| `support` | — | Generic support entry |
| `support <img>` | `img/` | Embedded images used in email HTML via `cid:` |
| `support <attachment>` | `attachments/` | File attachments included in emails |

Support types are included in `--copy:config` (`null:reproductive <config>`) operations but not classified under any `config/` subdirectory.

---

## `null:reproductive` Variants

The `null:reproductive` family produces reusable instances or runs processes. The `<tools>` and `<config>` qualifiers distinguish between full tool copies and config-only copies.

| Type | Option | What is copied | Runs setup |
|------|--------|---------------|------------|
| `null:reproductive` | `--test` | n/a (runs tests) | no |
| `null:reproductive <tools>` | `-c`, `--copy`, `--copy:tool` | Full tool (src, bin, config/*, .github/scripts/, ...) | inline (Node.js) |
| `null:reproductive <config>` | `--copy:config`, `-c:config` | config/emails/, config/globals/, attachments/, img/ | OS script then `.github/` removed |

**Setup** for `<tools>`: creates `config/accounts/` and copies `_default.js` from `.github/scripts/accounts/` directly in Node.js.

**Setup** for `<config>`: copies `.github/scripts/` temporarily, runs `setup.sh` (Unix/Cygwin/Git Bash) or `setup.bat` (Windows CMD), then removes `.github/` from the destination.
