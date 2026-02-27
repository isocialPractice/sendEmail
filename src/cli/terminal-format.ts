/**
 * terminal-format.ts
 * Terminal Mode processor for --command-format.
 *
 * Parses `$>command: {{ <cmd> }};` syntax from CLI argument values,
 * validates commands against a prohibited-command list, executes them,
 * and returns the captured terminal output.
 *
 * Activated ONLY when --command-format is the first option passed.
 */

import { execSync } from 'child_process';
import { writeFileSync, readFileSync, unlinkSync, mkdtempSync, rmdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import type { TerminalCommandResult, TerminalFormatResult } from '../core/types.js';

// ─── Syntax Patterns ──────────────────────────────────────────────────────────

/**
 * Matches a single terminal command block in any of the accepted forms:
 *   $>command: {{ <cmd> }};       — primary (colon after "command")
 *   $> command: {{ <cmd> }};      — primary with leading space before "command"
 *   $>command {{ <cmd> }};        — secondary (no colon)
 *   $> {{ <cmd> }};               — shorthand (no "command" keyword)
 *
 * Optional whitespace between `$>` and `command:` is allowed.
 * The `\s*` after `$>` backtracks when needed so the shorthand `\s+` alt
 * still matches `$> {{ ... }};` correctly.
 *
 * Spaces inside {{ }} are REQUIRED (at least one on each side of the command).
 * Multiple spaces are acceptable.
 */
const COMMAND_BLOCK_PATTERN = /\$>\s*(?:command:?\s+|\s+)\{\{\s+([\s\S]+?)\s+\}\};/g;

/**
 * Detects malformed blocks where `{{` immediately wraps a command without leading space,
 * or `}}` closes without a trailing space before it.
 * Used to generate helpful error messages.
 */
const MALFORMED_BLOCK_PATTERN = /\$>\s*(?:command:?\s*)?\{\{[^\s\}]|[^\s\{]\}\}/;

// ─── Prohibited Command Rules ─────────────────────────────────────────────────

/**
 * Patterns for prohibited commands.
 * Each entry includes a regex pattern and a human-readable reason.
 *
 * Prohibited categories:
 *   1. Commands that delete files
 *   2. Commands that redirect output to files (not terminal pipes)
 *   3. Commands that pipe to a shell interpreter (security risk)
 *   4. Commands that produce no terminal output (cd, export, etc.)
 *   5. Commands deemed insecure for this application
 */
const PROHIBITED_RULES: Array<{ pattern: RegExp; reason: string }> = [
  // ── Delete commands ──
  { pattern: /(?:^|\s)rm\s/i,    reason: 'deletes files (rm)' },
  { pattern: /(?:^|\s)del\s/i,   reason: 'deletes files (del)' },
  { pattern: /(?:^|\s)rmdir\s/i, reason: 'deletes directories (rmdir)' },
  { pattern: /(?:^|\s)rd\s/i,    reason: 'deletes directories (rd)' },
  { pattern: /(?:^|\s)unlink\s/i,reason: 'deletes files (unlink)' },
  { pattern: /(?:^|\s)shred\s/i, reason: 'securely deletes files (shred)' },
  { pattern: /(?:^|\s)trash\s/i, reason: 'moves files to trash (trash)' },
  { pattern: /(?:^|\s)erase\s/i, reason: 'deletes files (erase)' },
  // ── Output redirection to files ──
  // Matches `>` that is not `>=`, `>>`, `>&` (i.e. actual file redirection)
  { pattern: /(?<![=!<>&])>(?![>=&])\s*\S/, reason: 'redirects output to a file (use pipes | instead)' },
  { pattern: />>/,                reason: 'appends output to a file (use pipes | instead)' },
  // ── Pipe to shell interpreter ──
  { pattern: /\|\s*(bash|sh|zsh|fish|csh|ksh|tcsh|dash|cmd|powershell|pwsh)\b/i, reason: 'pipes output to a shell interpreter (security risk)' },
  // ── Commands with no terminal output ──
  { pattern: /^cd(\s|$)/i,       reason: 'does not produce terminal output (cd)' },
  { pattern: /^export\s/i,       reason: 'does not produce terminal output (export)' },
  { pattern: /^source\s/i,       reason: 'does not produce terminal output (source)' },
  { pattern: /^set\s/i,          reason: 'does not produce terminal output (set)' },
  { pattern: /^exit(\s|$)/i,     reason: 'does not produce terminal output (exit)' },
  // ── Privilege escalation ──
  { pattern: /(?:^|\s)sudo\s/i,  reason: 'escalates privileges (sudo)' },
  { pattern: /(?:^|\s)su\s/i,    reason: 'switches user (su)' },
  // ── Destructive system commands ──
  { pattern: /(?:^|\s)dd\s.*\bof=/i,     reason: 'writes raw data to a device or file (dd with of=)' },
  { pattern: /(?:^|\s)mkfs\b/i,          reason: 'creates a filesystem (mkfs)' },
  { pattern: /(?:^|\s)format\s+[a-z]:/i, reason: 'formats a drive (format)' },
  // ── Network fetch piped to execution ──
  { pattern: /(?:curl|wget)\s.*\|\s*(bash|sh|python|node|ruby|perl)/i, reason: 'fetches and executes remote code (security risk)' },
];

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Check whether an argument value contains any `$>` terminal format syntax.
 */
export function hasTerminalFormat(value: string): boolean {
  return value.includes('$>');
}

/**
 * Validate that a command string does not match any prohibited patterns.
 * Throws a `TerminalModeError` if prohibited.
 *
 * @param command - Raw command string (content inside `{{ }}`).
 */
export function validateCommand(command: string): void {
  const trimmed = command.trim();
  for (const rule of PROHIBITED_RULES) {
    if (rule.pattern.test(trimmed)) {
      throw new TerminalModeError(
        `Prohibited command: the command "${trimmed}" ${rule.reason}.`,
        trimmed,
        `Remove or replace the prohibited operation. See docs/TERMINAL-FORMAT.md for the full list of prohibited commands.`
      );
    }
  }
}

/**
 * Parse all `$>command: {{ ... }};` blocks from an argument value.
 * Returns an array of command strings extracted from the blocks.
 * Returns an empty array if no blocks are found.
 *
 * Validates for malformed syntax and throws `TerminalModeError` on violations.
 *
 * @param argValue - The raw CLI argument value to parse.
 */
export function parseCommandBlocks(argValue: string): string[] {
  // Check for malformed syntax (missing spaces inside {{ }})
  if (MALFORMED_BLOCK_PATTERN.test(argValue)) {
    const malformedMatch = argValue.match(/\$>(?:command:?\s*)?\{\{[\s\S]*?\}\};?/);
    const malformedSegment = malformedMatch ? malformedMatch[0] : argValue;
    throw new TerminalModeError(
      `Incorrect syntax \`${malformedSegment}\`. Did you mean? "$>command: {{ <full call> }};"`,
      argValue,
      `Ensure there is at least one space after {{ and before }} in every command block.`
    );
  }

  if (!hasTerminalFormat(argValue)) {
    return [];
  }

  const commands: string[] = [];
  const re = new RegExp(COMMAND_BLOCK_PATTERN.source, 'g');
  let match: RegExpExecArray | null;

  while ((match = re.exec(argValue)) !== null) {
    commands.push(match[1].trim());
  }

  return commands;
}

/**
 * Execute a single terminal command and capture its stdout output.
 * Output is written to a temporary file for verification (per spec), then read back.
 * The temporary file is deleted after reading.
 *
 * @param command - The shell command to execute.
 * @returns TerminalCommandResult with captured output.
 * @throws TerminalModeError if the command fails with no output.
 */
export function executeCommand(command: string): TerminalCommandResult {
  // Create a temp directory and output file for command-check verification
  const tempDir = mkdtempSync(join(tmpdir(), 'sendEmail-cmd-'));
  const tempFile = join(tempDir, 'output.txt');

  let exitCode = 0;
  let rawOutput = '';

  try {
    rawOutput = execSync(command, {
      encoding: 'utf8',
      shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/sh',
    }) as string;
  } catch (err: unknown) {
    const execErr = err as { status?: number; stdout?: string };
    exitCode = execErr?.status ?? 1;
    rawOutput = execErr?.stdout ?? '';
  }

  // Write to temp file for the command-check verification step
  const outputContent = rawOutput.trimEnd();
  writeFileSync(tempFile, outputContent, 'utf8');

  // Read back from temp file (command-check verification)
  let verified: string;
  try {
    verified = readFileSync(tempFile, 'utf8');
  } catch {
    verified = '';
  }

  // Clean up temp file and directory
  try { unlinkSync(tempFile); } catch { /* ignore */ }
  try { rmdirSync(tempDir); } catch { /* ignore */ }

  if (!verified && exitCode !== 0) {
    throw new TerminalModeError(
      `Command failed with exit code ${exitCode} and produced no output: "${command}"`,
      command,
      `Ensure the command is valid and produces terminal output when run standalone.`
    );
  }

  return { command, output: verified, exitCode };
}

/**
 * Process a single CLI argument value through terminal format:
 * 1. Parse all `$>command: {{ ... }};` blocks.
 * 2. Validate each command against the prohibited list.
 * 3. Execute each command and capture output.
 * 4. Concatenate outputs (in order) to form the resolved value.
 *
 * Returns null if the argument contains no terminal format syntax (pass-through).
 *
 * @param argValue - Raw CLI argument string.
 * @returns TerminalFormatResult, or null if no terminal format found.
 */
export function processTerminalArg(argValue: string): TerminalFormatResult | null {
  if (!hasTerminalFormat(argValue)) return null;

  const commands = parseCommandBlocks(argValue);
  if (commands.length === 0) return null;

  // Validate all commands before executing any
  for (const cmd of commands) {
    validateCommand(cmd);
  }

  const results: TerminalCommandResult[] = commands.map(cmd => executeCommand(cmd));
  const resolved = results.map(r => r.output).join('\n');

  return { original: argValue, resolved, commands: results };
}

/**
 * Apply terminal format processing to all processable CLI option strings.
 * Called from index.ts when commandFormat is active (was the first option).
 *
 * Mutates opts in-place, replacing any argument value containing `$>command:`
 * syntax with the resolved command output.
 *
 * @param opts - Parsed CLI options object (CLIOptions cast to record for mutation).
 */
export function applyTerminalFormat(opts: Record<string, unknown>): void {
  // Single-value string fields
  for (const field of ['subject', 'messageText', 'messageFile', 'fromAddress']) {
    const value = opts[field];
    if (typeof value === 'string' && hasTerminalFormat(value)) {
      const result = processTerminalArg(value);
      if (result) opts[field] = result.resolved;
    }
  }

  // Array string fields
  for (const field of ['sendTo', 'replyTo', 'cc', 'bcc']) {
    const value = opts[field];
    if (Array.isArray(value)) {
      opts[field] = (value as unknown[]).map(item => {
        if (typeof item === 'string' && hasTerminalFormat(item)) {
          const result = processTerminalArg(item);
          return result ? result.resolved : item;
        }
        return item;
      });
    }
  }
}

// ─── Error Class ──────────────────────────────────────────────────────────────

/**
 * Error thrown for terminal mode syntax violations or prohibited commands.
 */
export class TerminalModeError extends Error {
  readonly command: string;
  readonly suggestion: string;

  constructor(message: string, command: string, suggestion: string) {
    super(`Terminal Mode Error: ${message}`);
    this.name = 'TerminalModeError';
    this.command = command;
    this.suggestion = suggestion;
  }
}
