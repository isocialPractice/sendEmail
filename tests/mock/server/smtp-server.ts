/**
 * smtp-server.ts
 * Disposable mock SMTP server for testing sendEmail without real credentials.
 * Uses built-in Node.js net module to simulate SMTP protocol.
 *
 * Test credentials (built-in):
 *   user: test@localhost.test
 *   pass: testpassword123
 *   host: 127.0.0.1
 *   port: 2525 (default)
 */

import net from 'net';
import { EventEmitter } from 'events';

export interface ReceivedEmail {
  from: string;
  to: string[];
  subject: string;
  body: string;
  headers: Record<string, string>;
  timestamp: Date;
}

export interface MockSmtpServerOptions {
  port?: number;
  host?: string;
  authUser?: string;
  authPass?: string;
}

const DEFAULT_OPTIONS: Required<MockSmtpServerOptions> = {
  port: 2525,
  host: '127.0.0.1',
  authUser: 'test@localhost.test',
  authPass: 'testpassword123',
};

/**
 * A simple mock SMTP server for testing.
 * Captures sent emails without any actual delivery.
 */
export class MockSmtpServer extends EventEmitter {
  private server: net.Server;
  private options: Required<MockSmtpServerOptions>;
  public emails: ReceivedEmail[] = [];

  constructor(options: MockSmtpServerOptions = {}) {
    super();
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.server = net.createServer(socket => this.handleConnection(socket));
  }

  /**
   * Start the mock SMTP server.
   */
  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.listen(this.options.port, this.options.host, () => {
        resolve();
      });
      this.server.on('error', reject);
    });
  }

  /**
   * Stop the mock SMTP server.
   */
  stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.close(err => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * Clear all captured emails.
   */
  clear(): void {
    this.emails = [];
  }

  /**
   * Get the nodemailer transporter config for connecting to this mock server.
   */
  getTransporterConfig() {
    return {
      host: this.options.host,
      port: this.options.port,
      secure: false,
      auth: {
        user: this.options.authUser,
        pass: this.options.authPass,
      },
      // Disable TLS certificate check for test server
      tls: { rejectUnauthorized: false },
    };
  }

  private handleConnection(socket: net.Socket): void {
    const state = {
      authenticated: false,
      from: '',
      to: [] as string[],
      inData: false,
      dataBuffer: '',
    };

    socket.write('220 localhost SMTP MockServer Ready\r\n');

    socket.on('data', (data: Buffer) => {
      const lines = data.toString().split('\r\n');

      for (const line of lines) {
        if (!line.trim()) continue;

        if (state.inData) {
          if (line === '.') {
            // End of DATA
            state.inData = false;
            const email = this.parseEmail(state.from, state.to, state.dataBuffer);
            this.emails.push(email);
            this.emit('email', email);
            socket.write('250 OK: Message accepted\r\n');
            state.dataBuffer = '';
            state.from = '';
            state.to = [];
          } else {
            state.dataBuffer += (line.startsWith('..') ? line.slice(1) : line) + '\n';
          }
          continue;
        }

        const upper = line.toUpperCase();

        if (upper.startsWith('EHLO') || upper.startsWith('HELO')) {
          socket.write(`250-localhost Hello\r\n`);
          socket.write(`250-AUTH LOGIN PLAIN\r\n`);
          socket.write(`250 OK\r\n`);
        } else if (upper.startsWith('AUTH')) {
          // Accept any authentication for testing
          state.authenticated = true;
          socket.write('235 Authentication successful\r\n');
        } else if (upper.startsWith('MAIL FROM:')) {
          state.from = extractAddress(line);
          socket.write('250 OK\r\n');
        } else if (upper.startsWith('RCPT TO:')) {
          state.to.push(extractAddress(line));
          socket.write('250 OK\r\n');
        } else if (upper === 'DATA') {
          state.inData = true;
          socket.write('354 Start mail input; end with <CRLF>.<CRLF>\r\n');
        } else if (upper === 'QUIT') {
          socket.write('221 Bye\r\n');
          socket.end();
        } else if (upper === 'NOOP') {
          socket.write('250 OK\r\n');
        } else if (upper === 'RSET') {
          state.from = '';
          state.to = [];
          state.dataBuffer = '';
          socket.write('250 OK\r\n');
        } else {
          socket.write(`502 Command not implemented: ${line.split(' ')[0]}\r\n`);
        }
      }
    });

    socket.on('error', () => {
      // Ignore connection errors during testing
    });
  }

  private parseEmail(from: string, to: string[], rawData: string): ReceivedEmail {
    const lines = rawData.split('\n');
    const headers: Record<string, string> = {};
    let bodyStart = 0;

    // Parse headers (header: value pairs before blank line)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (line.trim() === '') {
        bodyStart = i + 1;
        break;
      }
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0) {
        const key = line.slice(0, colonIdx).trim().toLowerCase();
        const value = line.slice(colonIdx + 1).trim();
        headers[key] = value;
      }
    }

    const body = lines.slice(bodyStart).join('\n');
    const subject = headers['subject'] ?? '(no subject)';

    return { from, to, subject, body, headers, timestamp: new Date() };
  }
}

function extractAddress(line: string): string {
  const match = line.match(/<([^>]+)>/);
  return match ? match[1]! : line.split(':')[1]?.trim() ?? '';
}

/**
 * Helper: create and start a mock SMTP server, return it and a cleanup function.
 */
export async function createMockSmtpServer(
  options?: MockSmtpServerOptions
): Promise<{ server: MockSmtpServer; cleanup: () => Promise<void> }> {
  const server = new MockSmtpServer(options);
  await server.start();

  return {
    server,
    cleanup: () => server.stop(),
  };
}
