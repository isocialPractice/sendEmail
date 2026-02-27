/**
 * terminal-format.test.ts
 * Unit tests for Terminal Mode processing (--command-format).
 *
 * Covers:
 *   - parseCommandBlocks: single command, malformed syntax, multiple commands,
 *     multiple commands with malformed syntax
 *   - validateCommand: prohibited and allowed commands
 *   - processTerminalArg: single command, invalid syntax, multiple commands,
 *     guarantee that prohibited commands NEVER execute
 *   - isCommandFormatFirst / parseArguments: first-option detection,
 *     error state when not first
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks (hoisted before imports) ──────────────────────────────────────────

vi.mock('child_process', () => ({
  execSync: vi.fn(),
}));

vi.mock('fs', () => ({
  writeFileSync: vi.fn(),
  readFileSync: vi.fn(() => 'command output'),
  unlinkSync: vi.fn(),
  mkdtempSync: vi.fn(() => '/tmp/sendEmail-cmd-test'),
  rmdirSync: vi.fn(),
}));

vi.mock('os', () => ({
  tmpdir: vi.fn(() => '/tmp'),
}));

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import {
  hasTerminalFormat,
  parseCommandBlocks,
  validateCommand,
  processTerminalArg,
  TerminalModeError,
} from '../../src/cli/terminal-format.js';
import { isCommandFormatFirst, parseArguments } from '../../src/cli/parser.js';

// ─── hasTerminalFormat ────────────────────────────────────────────────────────

describe('hasTerminalFormat', () => {
  it('returns true when value contains $>', () => {
    expect(hasTerminalFormat('$>command: {{ git log }};')).toBe(true);
    expect(hasTerminalFormat('$> {{ echo hello }};')).toBe(true);
  });

  it('returns false when value contains no $>', () => {
    expect(hasTerminalFormat('plain text')).toBe(false);
    expect(hasTerminalFormat('')).toBe(false);
    expect(hasTerminalFormat('no special syntax here')).toBe(false);
  });
});

// ─── parseCommandBlocks — single command ─────────────────────────────────────

describe('parseCommandBlocks — single command', () => {
  it('parses primary form: $>command: {{ cmd }};', () => {
    expect(parseCommandBlocks('$>command: {{ git log --oneline -1 }};')).toEqual([
      'git log --oneline -1',
    ]);
  });

  it('parses primary form with leading space: $> command: {{ cmd }};', () => {
    expect(parseCommandBlocks('$> command: {{ git log --oneline -1 }};')).toEqual([
      'git log --oneline -1',
    ]);
  });

  it('parses shorthand form: $> {{ cmd }};', () => {
    expect(parseCommandBlocks('$> {{ git log --oneline -1 }};')).toEqual([
      'git log --oneline -1',
    ]);
  });

  it('parses secondary form (no colon): $>command {{ cmd }};', () => {
    expect(parseCommandBlocks('$>command {{ git log --oneline -1 }};')).toEqual([
      'git log --oneline -1',
    ]);
  });

  it('returns empty array for raw values with no $> syntax', () => {
    expect(parseCommandBlocks('just some plain text')).toEqual([]);
    expect(parseCommandBlocks('')).toEqual([]);
  });
});

// ─── parseCommandBlocks — incorrect syntax ───────────────────────────────────

describe('parseCommandBlocks — incorrect syntax', () => {
  it('throws TerminalModeError when space is missing after {{', () => {
    expect(() =>
      parseCommandBlocks('$>command: {{git log --oneline -1 }};')
    ).toThrow(TerminalModeError);
  });

  it('throws TerminalModeError when space is missing before }}', () => {
    expect(() =>
      parseCommandBlocks('$>command: {{ git log --oneline -1}};')
    ).toThrow(TerminalModeError);
  });

  it('error message contains "Did you mean?" hint', () => {
    expect(() =>
      parseCommandBlocks('$>command:{{git log}};')
    ).toThrow(/Did you mean\?/);
  });

  it('error message contains "Terminal Mode Error:"', () => {
    expect(() =>
      parseCommandBlocks('$>command:{{git log}};')
    ).toThrow(/Terminal Mode Error:/);
  });
});

// ─── parseCommandBlocks — multiple commands ──────────────────────────────────

describe('parseCommandBlocks — multiple commands', () => {
  it('parses two command blocks in one argument', () => {
    const input = '$>command: {{ git log -1 --pretty=%B }}; $>command: {{ echo }};';
    expect(parseCommandBlocks(input)).toEqual(['git log -1 --pretty=%B', 'echo']);
  });

  it('parses three command blocks in order', () => {
    const input =
      '$>command: {{ git log -1 --pretty=%B }}; $>command: {{ echo }}; $>command: {{ git show --name-only HEAD | tail -n +8 }};';
    const result = parseCommandBlocks(input);
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('git log -1 --pretty=%B');
    expect(result[1]).toBe('echo');
    expect(result[2]).toBe('git show --name-only HEAD | tail -n +8');
  });
});

// ─── parseCommandBlocks — multiple commands incorrect syntax ─────────────────

describe('parseCommandBlocks — multiple commands incorrect syntax', () => {
  it('throws TerminalModeError when first block has missing space after {{', () => {
    const input = '$>command: {{cmd1 }}; $>command: {{ cmd2 }};';
    expect(() => parseCommandBlocks(input)).toThrow(TerminalModeError);
  });

  it('throws TerminalModeError when any block has missing space before }}', () => {
    const input = '$>command: {{ cmd1 }}; $>command: {{ cmd2}};';
    expect(() => parseCommandBlocks(input)).toThrow(TerminalModeError);
  });
});

// ─── validateCommand ─────────────────────────────────────────────────────────

describe('validateCommand — prohibited commands', () => {
  it('throws TerminalModeError for rm', () => {
    expect(() => validateCommand('rm file.txt')).toThrow(TerminalModeError);
  });

  it('throws TerminalModeError for del (Windows)', () => {
    expect(() => validateCommand('del file.txt')).toThrow(TerminalModeError);
  });

  it('throws TerminalModeError for rmdir', () => {
    expect(() => validateCommand('rmdir somedir')).toThrow(TerminalModeError);
  });

  it('throws TerminalModeError for output file redirection >', () => {
    expect(() => validateCommand('git log > output.txt')).toThrow(TerminalModeError);
  });

  it('throws TerminalModeError for append redirection >>', () => {
    expect(() => validateCommand('echo hello >> file.txt')).toThrow(TerminalModeError);
  });

  it('throws TerminalModeError for pipe to bash', () => {
    expect(() => validateCommand('echo something | bash')).toThrow(TerminalModeError);
  });

  it('throws TerminalModeError for pipe to sh', () => {
    expect(() => validateCommand('echo something | sh')).toThrow(TerminalModeError);
  });

  it('throws TerminalModeError for sudo', () => {
    expect(() => validateCommand('sudo apt install package')).toThrow(TerminalModeError);
  });

  it('throws TerminalModeError for cd (no output)', () => {
    expect(() => validateCommand('cd /some/path')).toThrow(TerminalModeError);
  });

  it('throws TerminalModeError for curl piped to bash', () => {
    expect(() => validateCommand('curl https://example.com/script.sh | bash')).toThrow(TerminalModeError);
  });

  it('throws TerminalModeError for mkfs', () => {
    expect(() => validateCommand('mkfs /dev/sdb1')).toThrow(TerminalModeError);
  });
});

describe('validateCommand — allowed commands', () => {
  it('allows git log', () => {
    expect(() => validateCommand('git log --oneline -1')).not.toThrow();
  });

  it('allows echo', () => {
    expect(() => validateCommand('echo hello')).not.toThrow();
  });

  it('allows pipe to grep (not a shell interpreter)', () => {
    expect(() => validateCommand('git log --oneline -10 | grep fix')).not.toThrow();
  });

  it('allows pipe to tail', () => {
    expect(() => validateCommand('git show --name-only HEAD | tail -n +8')).not.toThrow();
  });

  it('allows date command', () => {
    expect(() => validateCommand('date +%Y-%m-%d')).not.toThrow();
  });
});

// ─── processTerminalArg — single command ─────────────────────────────────────

describe('processTerminalArg — single command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(execSync).mockReturnValue('abc1234 Fix authentication bug' as any);
    vi.mocked(readFileSync).mockReturnValue('abc1234 Fix authentication bug' as any);
  });

  it('returns null for values with no $> syntax', () => {
    expect(processTerminalArg('plain text')).toBeNull();
  });

  it('resolves a single command block and returns TerminalFormatResult', () => {
    const result = processTerminalArg('$> {{ git log --oneline -1 }};');
    expect(result).not.toBeNull();
    expect(result!.resolved).toBe('abc1234 Fix authentication bug');
    expect(result!.commands).toHaveLength(1);
    expect(result!.commands[0].command).toBe('git log --oneline -1');
  });

  it('stores the original argument value in result.original', () => {
    const input = '$>command: {{ git log --oneline -1 }};';
    const result = processTerminalArg(input);
    expect(result!.original).toBe(input);
  });

  it('calls execSync exactly once for a single block', () => {
    processTerminalArg('$>command: {{ git log --oneline -1 }};');
    expect(execSync).toHaveBeenCalledTimes(1);
  });
});

// ─── processTerminalArg — invalid syntax ─────────────────────────────────────

describe('processTerminalArg — invalid syntax (single command)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws TerminalModeError for missing space after {{', () => {
    expect(() =>
      processTerminalArg('$>command: {{git log --oneline -1 }};')
    ).toThrow(TerminalModeError);
  });

  it('does NOT execute any command when syntax is invalid', () => {
    expect(() =>
      processTerminalArg('$>command: {{git log --oneline -1 }};')
    ).toThrow(TerminalModeError);
    expect(execSync).not.toHaveBeenCalled();
  });
});

// ─── processTerminalArg — multiple commands ──────────────────────────────────

describe('processTerminalArg — multiple commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(execSync)
      .mockReturnValueOnce('First commit message' as any)
      .mockReturnValueOnce('' as any)
      .mockReturnValueOnce('src/file.ts' as any);
    vi.mocked(readFileSync)
      .mockReturnValueOnce('First commit message' as any)
      .mockReturnValueOnce('' as any)
      .mockReturnValueOnce('src/file.ts' as any);
  });

  it('concatenates outputs with newline separator', () => {
    const input =
      '$>command: {{ git log -1 --pretty=%B }}; $>command: {{ echo }}; $>command: {{ git show --name-only HEAD }};';
    const result = processTerminalArg(input);
    expect(result!.resolved).toBe('First commit message\n\nsrc/file.ts');
  });

  it('returns a result with all commands listed', () => {
    const input =
      '$>command: {{ git log -1 --pretty=%B }}; $>command: {{ echo }}; $>command: {{ git show --name-only HEAD }};';
    const result = processTerminalArg(input);
    expect(result!.commands).toHaveLength(3);
  });

  it('executes all commands (one execSync call per block)', () => {
    const input = '$>command: {{ cmd1 }}; $>command: {{ cmd2 }};';
    // Reset to just 2 mock values
    vi.clearAllMocks();
    vi.mocked(execSync)
      .mockReturnValueOnce('output1' as any)
      .mockReturnValueOnce('output2' as any);
    vi.mocked(readFileSync)
      .mockReturnValueOnce('output1' as any)
      .mockReturnValueOnce('output2' as any);
    processTerminalArg(input);
    expect(execSync).toHaveBeenCalledTimes(2);
  });
});

// ─── processTerminalArg — multiple commands incorrect syntax ─────────────────

describe('processTerminalArg — multiple commands incorrect syntax', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws TerminalModeError when any block has malformed syntax', () => {
    const input = '$>command: {{ cmd1 }}; $>command: {{cmd2}};';
    expect(() => processTerminalArg(input)).toThrow(TerminalModeError);
  });

  it('does NOT execute any command when syntax is malformed', () => {
    const input = '$>command: {{cmd1 }}; $>command: {{ cmd2 }};';
    expect(() => processTerminalArg(input)).toThrow(TerminalModeError);
    expect(execSync).not.toHaveBeenCalled();
  });
});

// ─── Prohibited commands NEVER execute ───────────────────────────────────────

describe('processTerminalArg — prohibited commands never execute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws TerminalModeError before executing a single prohibited command', () => {
    expect(() =>
      processTerminalArg('$>command: {{ rm -rf /tmp/test }};')
    ).toThrow(TerminalModeError);
    expect(execSync).not.toHaveBeenCalled();
  });

  it('throws TerminalModeError and executes NOTHING when first command is prohibited', () => {
    expect(() =>
      processTerminalArg('$>command: {{ del important.txt }}; $>command: {{ git log }};')
    ).toThrow(TerminalModeError);
    expect(execSync).not.toHaveBeenCalled();
  });

  it('throws TerminalModeError and executes NOTHING when second command is prohibited', () => {
    // git log is safe, but del is prohibited — neither should run
    expect(() =>
      processTerminalArg('$>command: {{ git log --oneline -1 }}; $>command: {{ del file.txt }};')
    ).toThrow(TerminalModeError);
    expect(execSync).not.toHaveBeenCalled();
  });
});

// ─── --command-format position detection ─────────────────────────────────────

describe('isCommandFormatFirst', () => {
  it('returns true when --command-format is the first flag', () => {
    expect(
      isCommandFormatFirst(['node', 'script.js', '--command-format', '--send-to', 'a@b.com'])
    ).toBe(true);
  });

  it('returns false when --command-format is not the first flag', () => {
    expect(
      isCommandFormatFirst(['node', 'script.js', '--send-to', 'a@b.com', '--command-format'])
    ).toBe(false);
  });

  it('returns false when another flag precedes --command-format', () => {
    expect(
      isCommandFormatFirst(['node', 'script.js', '--force', '--command-format'])
    ).toBe(false);
  });

  it('returns false when --command-format is not present at all', () => {
    expect(
      isCommandFormatFirst(['node', 'script.js', '--send-to', 'a@b.com'])
    ).toBe(false);
  });
});

describe('parseArguments — commandFormat field tri-state', () => {
  it('sets commandFormat to true when --command-format is the first option', () => {
    const opts = parseArguments(['node', 'script.js', '--command-format', '--send-to', 'a@b.com']);
    expect(opts.commandFormat).toBe(true);
  });

  it('sets commandFormat to false when --command-format is NOT the first option', () => {
    const opts = parseArguments(['node', 'script.js', '--send-to', 'a@b.com', '--command-format']);
    expect(opts.commandFormat).toBe(false);
  });

  it('sets commandFormat to undefined when --command-format is not passed at all', () => {
    const opts = parseArguments(['node', 'script.js', '--send-to', 'a@b.com']);
    expect(opts.commandFormat).toBeUndefined();
  });
});
