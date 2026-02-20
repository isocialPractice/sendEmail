# Configuration

## Setup

The repo ships with `config/_accounts/` as a safe template directory (the underscore prefix keeps it in version control). You must rename it to `config/accounts/` to activate it:

```bash
# Unix/macOS/Cygwin
mv config/_accounts config/accounts

# Windows CMD
rename config\_accounts config\accounts
```

Then edit `config/accounts/_default.js` with your real credentials.

---

## Security Warning

> [!CAUTION]
> `config/accounts/` contains real email credentials and is excluded from git via `.gitignore`.
> **Never run `git add -f config/accounts/`** — the `-f` flag bypasses `.gitignore` and will
> expose your credentials in the repository history.

A pre-commit hook (`.git/hooks/pre-commit`) is in place as a second line of defense. If you accidentally stage files from `config/accounts/`, the commit will be blocked with instructions to unstage them.

If you do accidentally commit credentials, treat them as **compromised immediately** — revoke and regenerate them.
