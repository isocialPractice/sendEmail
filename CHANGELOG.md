<!-- {% raw %} -->
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1]

### Added

- **`--confirm` option**: Explicitly request confirmation before sending (default behavior)
  - Makes scripting easier by allowing dynamic flag selection without conditionals
  - Example use case: Use a variable to toggle between `--confirm` and `--force`
  
  ```bash
  # Before: Required conditional logic
  if [ "$REQUIRE_CONFIRMATION" = "true" ]; then
    sendEmail -t user@example.com "Message"
  else
    sendEmail -t user@example.com "Message" --force
  fi
  
  # After: Simple variable substitution
  CONFIRM_FLAG=$([ "$REQUIRE_CONFIRMATION" = "true" ] && echo "--confirm" || echo "--force")
  sendEmail -t user@example.com "Message" $CONFIRM_FLAG
  ```

- **Documentation updates**:
  - Added `--confirm` option to CLI-OPTIONS.md with detailed description
  - Added `--confirm` to CLI-CHEATSHEET.md quick reference table
  - Updated help system (`-h`) with new option

- **Test coverage**:
  - Created `tests/unit/parser.test.ts` with 10 comprehensive tests
  - Added tests for `--confirm`, `--force`, and their combinations
  - Verified `shouldSkipConfirmation()` helper function logic

### Changed

- Refactored confirmation logic in `src/cli/index.ts`
  - Added `shouldSkipConfirmation()` helper function for cleaner logic
  - Updated all 4 confirmation points (raw, normal, send-all, bulk modes)
  - `--force` takes precedence when both `--confirm` and `--force` are specified

## [1.0.0]

Initial release release.

#### Core Features

- **Three send modes**:
  - **Raw mode** (`-t`, `--text`): Quick text emails with minimal configuration
  - **Normal mode**: Structured emails with full customization
  - **Repetitive mode**: Bulk email sending with list processing

- **Configuration system**:
  - Account management (`config/accounts/`) for SMTP credentials
  - Email templates (`config/emails/`) with JSON configuration and JS attachments
  - Global templates (`config/globals/`) for reusable content (headers, footers, etc.)
  - Email lists (`lists/`) for bulk sending

- **Template engine**:
  - Variable substitution: `{{EMAIL}}`, `{{NAME}}`, `{{SUBJECT}}`, etc.
  - Dynamic content for personalized bulk emails
  - Contact-specific variables from email lists
  - Global template inclusion

- **File format support**:
  - HTML (`.html`, `.htm`) for rich content
  - Plain text (`.txt`) for simple messages
  - Markdown (`.md`) with automatic HTML conversion
  - Auto-detection based on file extension

- **Attachment handling**:
  - Multiple attachments via `--attach-file` and `--attach-path`
  - Inline images with Content-ID (CID) references
  - Content disposition control (`inline` or `attachment`)
  - Template support in attachment configurations

- **Email list processing**:
  - Bulk send: one email per contact with personalized content
  - Send-all mode (`--send-all`): single email to all list contacts
  - Support for inline lists (embedded in `email.json`)
  - Support for external list files (`lists/*.json`)

#### CLI Features

- **Comprehensive options**:
  - Sending options: `--send-to`, `--subject`, `--from-address`, `--reply-to`
  - Recipients: `--cc`, `--bcc` for carbon copies
  - Message sources: `--message-file`, `--message-html`, `--message-text`
  - Account selection: `--account` for multiple SMTP configurations
  - Logging: `--log` to save sent email metadata

- **Tool operations**:
  - `--copy`: Copy sendEmail to a project (full tool or config-only modes)
  - `--new-list`: Generate email lists from formatted text files
  - `--test`: Run test suite or specific unit tests
  - `-h, --help`: Comprehensive help system with section support

- **Confirmation prompts**:
  - Preview email before sending with full details
  - Bulk send confirmations with recipient count
  - `-f, --force` to skip prompts for automation

- **Terminal format mode** (`--command-format`):
  - Embed live command output in arguments
  - Syntax: `$>command: {{ <command> }};`
  - Execute shell commands and inject results into email content

#### Engine & Architecture

- **Modular design**:
  - Core engine (`src/core/`) independent of CLI
  - Can be embedded in VS Code extensions, GUIs, or Node.js applications
  - Clean separation: engine, CLI, utilities, and tools

- **EmailEngine class**:
  - Initialize with SMTP account configuration
  - Load email templates from JSON and JS files
  - Build messages with template variable substitution
  - Send emails via nodemailer with result tracking

- **Configuration loaders**:
  - `ConfigLoader`: Load email configs, lists, and accounts
  - `AttachmentLoader`: Process attachment configurations with templating
  - `TemplateEngine`: Variable substitution and content merging
  - `ListProcessor`: Iterate email lists and generate personalized messages

- **Validation and error handling**:
  - Email address validation
  - Required field checking (to, from, subject)
  - Attachment file existence verification
  - Detailed error messages with suggestions

#### Developer Experience

- **TypeScript implementation**:
  - Full type safety with comprehensive interfaces
  - Type definitions exported for library usage
  - IntelliSense support for IDE integration

- **Testing**:
  - Vitest test framework with 6 comprehensive test suites
  - Unit tests for core components (engine, validator, config-loader, etc.)
  - Integration tests with mock SMTP server
  - Test coverage for attachment templating, markdown conversion, and terminal format

- **Documentation**:
  - Comprehensive README with quick start guide
  - CLI-OPTIONS.md: Complete reference for all options
  - CLI-CHEATSHEET.md: Quick reference with common patterns
  - EXAMPLES.md: Real-world usage examples
  - CONFIGURE.md: Configuration guide
  - TEMPLATING.md: Template variable reference
  - API.md: Engine API documentation for embedding

#### Utilities

- **File utilities**: Read files with encoding detection, directory listing, existence checks
- **Logger**: Colored console output with info/success/warning/error levels
- **Email logger**: Save sent email metadata to log files
- **Error handler**: Custom error classes with context and suggestions
- **Markdown-to-HTML converter**: Email-safe HTML generation from Markdown
- **Date helpers**: Date formatting for template variables

#### Installation & Setup

- **Setup scripts**:
  - Unix/macOS/Git Bash: `setup.sh`
  - Windows: `setup.bat`, `setup.ps1`
  - Automatic account template creation

- **Multiple installation methods**:
  - npm package with bin script
  - Local copy for project-specific configs
  - Git clone for development

- **Local config override**:
  - Automatically uses local `config/` when running from a copied instance
  - Falls back to package root when no local config exists

### Security

- **Credential protection**:
  - `config/accounts/` excluded from git via `.gitignore`
  - Template-based setup prevents accidental credential commits
  - Clear warnings in documentation about credential safety

<!-- {% endraw %} -->
