# Configuration

## Setup

Run the setup script to create `config/accounts/_default.js`:

#### Unix/macOS/Git Bash

```bash
bash .github/scripts/setup.sh
```

#### Windows CMD

```bash
.github\scripts\setup.bat
```

The script automatically creates the accounts folder and copies the template (or restores from git history if cloned fresh).

Then edit `config/accounts/_default.js` with your real credentials.

---

## Security Warning

> [!CAUTION]
> `config/accounts/` contains real email credentials and is excluded from git via `.gitignore`.
> **Never run `git add -f config/accounts/`** — the `-f` flag bypasses `.gitignore` and will
> expose your credentials in the repository history.

A pre-commit hook (`.git/hooks/pre-commit`) is in place as a second line of defense. If you accidentally stage files from `config/accounts/`, the commit will be blocked with instructions to unstage them.

If you do accidentally commit credentials, treat them as **compromised immediately** — revoke and regenerate them.
