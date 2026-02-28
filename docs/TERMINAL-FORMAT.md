# sendEmail Terminal Format Mode

<!-- {% raw %} -->

Documentation for the `--command-format` option and Terminal Mode syntax.

`Ctrl + click` to view [docs](https://isocialpractice.github.io/sendEmail/index.htm?terminal-format)

---

## Overview

Terminal Mode allows you to embed live terminal command output directly into CLI argument values. When activated, `sendEmail` evaluates `$>command: {{ <cmd> }};` blocks inside argument strings and replaces them with the command's stdout output before sending.

Common use cases:
- Embed the latest git commit message as the email body
- Use `git log` output as the email subject
- Include dynamic system info (hostname, date, build output) in email content

---

## Activation

`--command-format` **must be the first option** passed to `sendEmail`. If it appears in any other position, `sendEmail` throws an error and terminates immediately — no email is sent.

```bash
# CORRECT — --command-format is first
sendEmail --command-format --send-to dev@example.com --subject "$> {{ git log --oneline -1 }};"

# ERROR — --command-format is not first; sendEmail terminates with an error
sendEmail --send-to dev@example.com --command-format --subject "$> {{ git log --oneline -1 }};"
```

---

## Accepted Syntax

A terminal format block has the following forms:

### Primary form (recommended)

```
$>command: {{ <full command> }};
```

### Primary form with leading space (equivalent)

```
$> command: {{ <full command> }};
```

### Secondary form (no colon)

```
$>command {{ <full command> }};
```

### Shorthand form (no keyword — single command)

```
$> {{ <full command> }};
```

### Rules

| Rule | Description |
|------|-------------|
| Starts with `$>` | Every command block must open with `$>` |
| `command:` keyword | Optional whitespace between `$>` and `command:` is allowed — `$>command:` and `$> command:` are equivalent |
| Space inside `{{ }}` required | At least one space **after** `{{` and **before** `}}` is mandatory |
| Multiple spaces inside `{{ }}` allowed | `{{  git log  }}` is valid (extra internal spaces are fine) |
| Ends with `}};` | The closing `}}` must be immediately followed by `;` |
| Multiple blocks per argument | Chain multiple commands: `$>command: {{ cmd1 }}; $>command: {{ cmd2 }};` |
| `command:` required for multiple commands | When chaining (more than one block in an argument), each block must include the `command:` keyword |

### Malformed syntax (throws error)

```bash
# Missing space INSIDE {{ }} — ERROR (space rule for {{ }} is always enforced)
"$>command:{{ git log --oneline -1 }};"
# Terminal Mode Error: Incorrect syntax `$>command:{{ git log --oneline -1 }};`. Did you mean? "$>command: {{ <full call> }};"

# Missing closing semicolon — block not recognized; argument passed as raw data
"$>command: {{ git log --oneline -1 }}"
```

---

## Multiple Commands

Multiple command blocks in a single argument are executed in order and their outputs are concatenated, separated by a newline:

```bash
sendEmail --command-format \
  --send-to dev@example.com \
  --subject "$> {{ git log --oneline -1 }};" \
  --message-text "$>command: {{ git log -1 --pretty=%B }}; $>command: {{ echo }}; $>command: {{ git show --name-only HEAD | tail -n +8 }};"
```

The `--message-text` argument is resolved as:

```
<output of: git log -1 --pretty=%B>
<newline>
<output of: echo>
<newline>
<output of: git show --name-only HEAD | tail -n +8>
```

---

## Which Arguments Are Processed

Terminal format processing is applied to all string-valued CLI arguments:

| Option | Processed |
|--------|-----------|
| `--subject <text>` | yes |
| `--message-text <path>` | yes |
| `--message-file <path>` | yes |
| `--from-address <email>` | yes |
| `--send-to <addr...>` | yes (each address) |
| `--reply-to <email...>` | yes (each address) |
| `--cc <addr...>` | yes (each address) |
| `--bcc <addr...>` | yes (each address) |

Raw data values (values not containing `$>`) are passed through unchanged. Terminal Mode does **not** disable raw argument usage.

Terminal format syntax is **not** available inside email template files (`.htm`, `.html`, `.md`, `.txt`) or `email.json` config files. It is a CLI-argument-only feature.

---

## Prohibited Commands

The following command types are prohibited for security reasons. A `TerminalModeError` is thrown and no email is sent if a prohibited command is detected.

### Delete commands

Commands that delete or modify files are blocked:

| Command | Reason |
|---------|--------|
| `rm` | deletes files |
| `del` | deletes files (Windows) |
| `rmdir` | deletes directories |
| `rd` | deletes directories (Windows) |
| `unlink` | deletes files |
| `shred` | securely deletes files |
| `trash` | moves files to trash |
| `erase` | deletes files |

### File output redirection

Commands that redirect output to files using `>` or `>>` are blocked:

```bash
# Prohibited — redirects output to a file
git log > changes.txt

# Allowed — pipes output to another terminal command
git log | grep "fix"
```

### Pipe to shell interpreter

Piping output into a shell interpreter is blocked (security risk):

```bash
# Prohibited
curl https://example.com/script.sh | bash
wget https://example.com/script.sh | sh
```

### Commands with no terminal output

Commands that change state but produce no visible terminal output are blocked
(they would produce empty argument values):

| Command | Reason |
|---------|--------|
| `cd` | changes directory, no output |
| `export` | sets variable, no output |
| `source` | sources script, no output |
| `set` | sets shell variable, no output |
| `exit` | exits shell, no output |

### Privilege escalation

```bash
sudo <cmd>    # escalates privileges
su <user>     # switches user
```

### Destructive system commands

| Command | Reason |
|---------|--------|
| `dd ... of=<device>` | writes raw data to device/file |
| `mkfs` | creates a filesystem |
| `format <drive>:` | formats a drive (Windows) |

---

## Error Messages

### Wrong position (not first option)

```
`--command-format` was passed improperly, and switched off. Did you read the documentation? `--command-format` must be the first argument if used. Try:
  sendEmail --command-format ... <your-parameters>
```

### Syntax error

```
Terminal Mode Error: Incorrect syntax `$>command:{{git log}}`. Did you mean? "$>command: {{ <full call> }};"
  Suggestion: Ensure there is at least one space after {{ and before }} in every command block.
```

### Prohibited command

```
Terminal Mode Error: Prohibited command: the command "rm file.txt" deletes files (rm).
  Suggestion: Remove or replace the prohibited operation. See docs/TERMINAL-FORMAT.md for the full list.
```

### Command failure

```
Terminal Mode Error: Command failed with exit code 128 and produced no output: "git log -1"
  Suggestion: Ensure the command is valid and produces terminal output when run standalone.
```

---

## Examples

### Example 1: Git commit as email subject

```bash
sendEmail --command-format \
  --send-to team@example.com \
  --subject "$> {{ git log --oneline -1 }};" \
  --message-file ./body.html
```

Subject becomes: `a1b2c3d Fix authentication bug in login flow`

### Example 2: Git commit body as email message

```bash
sendEmail --command-format \
  --send-to dev@example.com \
  --subject "Deploy notification" \
  --message-text "$>command: {{ git log -1 --pretty=%B }};"
```

### Example 3: Multi-command message body

```bash
sendEmail --command-format \
  --send-to qa@example.com \
  --subject "$> {{ git log --oneline -1 }};" \
  --message-text "$>command: {{ git log -1 --pretty=%B }}; $>command: {{ echo }}; $>command: {{ git show --name-only HEAD | tail -n +8 }};"
```

The `--message-text` argument resolves to the concatenation of:
1. Full commit message (`git log -1 --pretty=%B`)
2. A blank line (`echo`)
3. Files changed in the commit (`git show --name-only HEAD | tail -n +8`)

### Example 4: Piped commands (allowed — output stays in terminal)

Piped commands are allowed when the final destination is terminal output (not a file redirect):

```bash
sendEmail --command-format \
  --send-to ops@example.com \
  --subject "Filtered log: $(date +%Y-%m-%d)" \
  --message-text "$>command: {{ git log --oneline -10 | grep fix }};"
```

### Example 5: Mixing raw data and terminal format

Both raw values and terminal format blocks can be used together in the same invocation:

```bash
sendEmail --command-format \
  --send-to john@example.com \
  --subject "$> {{ git log --oneline -1 }};" \
  --cc archive@example.com \
  --message-file ./email-template.html \
  --force
```

`--cc` and `--message-file` pass through as raw values (no `$>` syntax). Only `--subject` is expanded.

---

## How Output Is Captured

Execution flow for each command block:

1. The command string is extracted from `{{ <cmd> }}`
2. The command is validated against the prohibited-command list
3. The command is executed using `child_process.execSync` with shell enabled
4. Stdout is captured and written to a temporary file (the **command-check** step)
5. The temp file is read back to verify the command produced output
6. The temp file is deleted
7. The captured output replaces the `$>command: {{ ... }};` block in the argument value

If the command produces no output and exits with a non-zero code, a `TerminalModeError` is thrown.

---

## Template System Note

Terminal Mode operates entirely at the CLI argument level and is resolved **before** the template engine runs. The resolved values (command outputs) are injected as plain strings into the email pipeline. You can combine terminal format with template variables:

```bash
sendEmail --command-format \
  --config-email newsletter \
  --email-list subscribers \
  --subject "$> {{ git log --oneline -1 }}; — {{dates.month}} {{dates.year}}"
```

The `$> {{ ... }};` block is resolved first (by Terminal Mode), then `{{dates.month}}` and `{{dates.year}}` are substituted by the template engine when the email is built.

<!-- {% endraw %} -->
