import { VercelRequest, VercelResponse } from '@vercel/node';
import { exec } from 'child_process';
import { promisify } from 'util';
import cors from 'cors';
import { withAuth, AuthenticatedRequest } from '../lib/middleware';
import { supabaseAdmin } from '../lib/supabase';

const execAsync = promisify(exec);

const corsMiddleware = cors({
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  origin: '*',
});

// Allowed commands whitelist for security
const ALLOWED_COMMANDS = [
  'pkg', 'apt', 'apt-get',
  'ls', 'cd', 'pwd', 'cat', 'echo', 'mkdir', 'rm', 'cp', 'mv', 'touch',
  'chmod', 'chown',
  'grep', 'find', 'head', 'tail', 'wc',
  'git',
  'node', 'npm', 'npx', 'python', 'python3', 'pip', 'pip3',
  'java', 'javac',
  'curl', 'wget',
  'termux-setup-storage',
  'am', 'pm', 'logcat',
  'neofetch', 'htop', 'top', 'ps', 'kill',
  'uname', 'whoami', 'id', 'date', 'uptime',
  'ping', 'netstat', 'ifconfig',
  'vim', 'nano', 'emacs',
  'tar', 'zip', 'unzip', 'gzip',
  'ssh', 'scp',
  'termux-info',
];

// Dangerous commands that are blocked
const BLOCKED_COMMANDS = [
  'rm -rf /', 'rm -rf /*', 'mkfs', 'dd',
  'chmod 777 /', 'chown -R',
  'su', 'sudo',
  'reboot', 'poweroff', 'shutdown',
];

function isCommandAllowed(command: string): { allowed: boolean; reason?: string } {
  const cmd = command.trim().split(/\s+/)[0].toLowerCase();
  
  // Check blocked commands
  for (const blocked of BLOCKED_COMMANDS) {
    if (command.toLowerCase().includes(blocked)) {
      return { allowed: false, reason: `Command '${blocked}' is blocked for security` };
    }
  }
  
  // Check allowed commands
  if (ALLOWED_COMMANDS.includes(cmd)) {
    return { allowed: true };
  }
  
  return { allowed: false, reason: `Command '${cmd}' is not in the allowed list` };
}

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  corsMiddleware(req, res, async () => {
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const { command, sessionId } = req.body;

      if (!command) {
        return res.status(400).json({ error: 'Command is required' });
      }

      const userId = req.user!.userId;

      // Check if command is allowed
      const permission = isCommandAllowed(command);
      if (!permission.allowed) {
        // Log blocked command attempt
        await supabaseAdmin.from('termux_command_logs').insert({
          user_id: userId,
          session_id: sessionId || null,
          command,
          output: null,
          exit_code: -1,
          is_allowed: false,
        });

        return res.status(403).json({
          error: 'Command not allowed',
          reason: permission.reason,
        });
      }

      // Execute command with timeout
      const startTime = Date.now();
      let result;
      
      try {
        result = await execAsync(command, {
          timeout: 30000, // 30 second timeout
          maxBuffer: 1024 * 1024, // 1MB buffer
          shell: '/bin/bash',
        });
      } catch (execError: any) {
        // Command executed but returned error
        result = {
          stdout: execError.stdout || '',
          stderr: execError.stderr || '',
          code: execError.code || 1,
        };
      }

      const executionTime = Date.now() - startTime;

      // Log command execution
      await supabaseAdmin.from('termux_command_logs').insert({
        user_id: userId,
        session_id: sessionId || null,
        command,
        output: result.stdout || result.stderr,
        exit_code: result.code,
        execution_time_ms: executionTime,
        is_allowed: true,
      });

      return res.status(200).json({
        command,
        output: result.stdout || result.stderr,
        error: result.stderr || null,
        exitCode: result.code,
        executionTime: executionTime,
      });
    } catch (error: any) {
      console.error('Termux command error:', error);
      return res.status(500).json({
        error: 'Failed to execute command',
        details: error.message,
      });
    }
  });
}

export default withAuth(handler);
