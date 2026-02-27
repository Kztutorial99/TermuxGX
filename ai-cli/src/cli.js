#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const figlet = require('figlet');
const inquirer = require('inquirer');
const ora = require('ora');
const axios = require('axios');
const Conf = require('conf');
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

const program = new Command();

// Configuration
const config = new Conf({
  projectName: 'termux-ai-cli',
  schema: {
    token: { type: 'string' },
    apiBaseUrl: { type: 'string', default: process.env.API_BASE_URL || 'http://localhost:3000/api' },
    userId: { type: 'string' },
    username: { type: 'string' },
    sessionId: { type: 'string' },
  }
});

// API client
const api = axios.create({
  baseURL: config.get('apiBaseUrl'),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth interceptor
api.interceptors.request.use((cfg) => {
  const token = config.get('token');
  if (token) {
    cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

// Helper functions
function showBanner() {
  console.log(
    chalk.cyan(
      figlet.textSync('TermuxAI', {
        font: 'ANSI Shadow',
        horizontalLayout: 'default',
      })
    )
  );
  console.log(chalk.gray('Powered by Llama 3.3 70B | TermuxGX\n'));
}

async function ensureAuth() {
  const token = config.get('token');
  if (!token) {
    console.log(chalk.yellow('Not authenticated. Please login first.'));
    console.log(chalk.gray('Run: ai-cli login\n'));
    process.exit(1);
  }
  return token;
}

// Commands
program
  .name('ai-cli')
  .description('AI CLI for Termux with Llama 3.3 70B')
  .version('1.0.0');

// Login command
program
  .command('login')
  .description('Login to AI CLI')
  .action(async () => {
    showBanner();
    
    try {
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'Choose action:',
          choices: ['Login', 'Signup', 'Exit'],
        }
      ]);

      if (action === 'Exit') {
        console.log(chalk.gray('Goodbye!'));
        process.exit(0);
      }

      if (action === 'Signup') {
        const { email, username, password, confirmPassword, full_name } = await inquirer.prompt([
          {
            type: 'input',
            name: 'email',
            message: 'Email:',
            validate: (v) => v.includes('@') || 'Please enter a valid email',
          },
          {
            type: 'input',
            name: 'username',
            message: 'Username:',
            validate: (v) => v.length >= 3 || 'Username must be at least 3 characters',
          },
          {
            type: 'password',
            name: 'password',
            message: 'Password:',
            validate: (v) => v.length >= 6 || 'Password must be at least 6 characters',
          },
          {
            type: 'password',
            name: 'confirmPassword',
            message: 'Confirm Password:',
            validate: (v, answers) => v === answers.password || 'Passwords do not match',
          },
          {
            type: 'input',
            name: 'full_name',
            message: 'Full Name (optional):',
          }
        ]);

        const spinner = ora('Creating account...').start();
        
        const response = await api.post('/auth/signup', {
          email,
          username,
          password,
          full_name: full_name || undefined,
        });

        spinner.succeed(chalk.green('Account created successfully!'));
        
        console.log('\n' + chalk.cyan('=== Your API Key ==='));
        console.log(chalk.yellow(response.data.api_key));
        console.log(chalk.gray('Save this key! It will be shown only once.\n'));

        // Auto login
        config.set('token', response.data.token);
        config.set('userId', response.data.user.id);
        config.set('username', response.data.user.username);

        console.log(chalk.green('✓ Logged in as ') + chalk.cyan(response.data.user.username));
        
      } else if (action === 'Login') {
        const { credential, password } = await inquirer.prompt([
          {
            type: 'input',
            name: 'credential',
            message: 'Email or Username:',
          },
          {
            type: 'password',
            name: 'password',
            message: 'Password:',
          }
        ]);

        const spinner = ora('Logging in...').start();
        
        const isEmail = credential.includes('@');
        const response = await api.post('/auth/login', {
          [isEmail ? 'email' : 'username']: credential,
          password,
        });

        spinner.succeed(chalk.green('Login successful!'));

        config.set('token', response.data.token);
        config.set('userId', response.data.user.id);
        config.set('username', response.data.user.username);

        console.log('\n' + chalk.green('✓ Logged in as ') + chalk.cyan(response.data.user.username));
        console.log(chalk.gray('Role: ') + chalk.cyan(response.data.user.role));
        
        if (!response.data.api_key_status.is_available) {
          console.log(chalk.yellow('\n⚠ Warning: Your API key has already been used or is inactive.'));
          console.log(chalk.gray('Some features may be limited.'));
        }
      }
    } catch (error) {
      console.error('\n' + chalk.red('Error:'), error.response?.data?.error || error.message);
      process.exit(1);
    }
  });

// Logout command
program
  .command('logout')
  .description('Logout from AI CLI')
  .action(() => {
    config.clear();
    console.log(chalk.green('✓ Logged out successfully'));
  });

// Chat command
program
  .command('chat')
  .description('Start interactive chat with AI')
  .option('-s, --session <id>', 'Session ID to continue')
  .action(async (options) => {
    ensureAuth();
    showBanner();

    if (options.session) {
      config.set('sessionId', options.session);
      console.log(chalk.gray(`Continuing session: ${options.session}\n`));
    }

    console.log(chalk.cyan('=== AI Chat (Llama 3.3 70B) ==='));
    console.log(chalk.gray('Type your message and press Enter'));
    console.log(chalk.gray('Commands: /exit, /clear, /session, /help\n'));

    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    function ask() {
      readline.question(chalk.green('You: '), async (message) => {
        const trimmed = message.trim();

        if (trimmed === '/exit' || trimmed === '/quit') {
          console.log(chalk.gray('Goodbye!'));
          readline.close();
          process.exit(0);
        }

        if (trimmed === '/clear') {
          config.set('sessionId', '');
          console.log(chalk.gray('Session cleared. Starting new chat.\n'));
          ask();
          return;
        }

        if (trimmed === '/session') {
          console.log(chalk.gray(`Current Session: ${config.get('sessionId') || 'none'}\n`));
          ask();
          return;
        }

        if (trimmed === '/help') {
          console.log(chalk.cyan('\n=== Commands ==='));
          console.log('/exit, /quit  - Exit chat');
          console.log('/clear        - Clear session and start new chat');
          console.log('/session      - Show current session ID');
          console.log('/help         - Show this help');
          console.log('/termux <cmd> - Execute Termux command\n');
          ask();
          return;
        }

        if (trimmed.startsWith('/termux')) {
          const cmd = trimmed.replace('/termux', '').trim();
          if (!cmd) {
            console.log(chalk.yellow('Usage: /termux <command>\n'));
            ask();
            return;
          }
          
          try {
            const spinner = ora('Executing...').start();
            const response = await api.post('/termux/execute', { command: cmd });
            spinner.stop();
            
            console.log(chalk.gray('Command:'), chalk.cyan(cmd));
            console.log(chalk.gray('Output:'));
            console.log(chalk.white(response.data.output || '(no output)'));
            console.log(chalk.gray(`Exit Code: ${response.data.exitCode} | Time: ${response.data.executionTime}ms\n`));
          } catch (error) {
            console.log(chalk.red('Error:'), error.response?.data?.error || error.message);
            if (error.response?.data?.reason) {
              console.log(chalk.gray(`Reason: ${error.response.data.reason}`));
            }
          }
          ask();
          return;
        }

        if (!trimmed) {
          ask();
          return;
        }

        try {
          const spinner = ora('AI is thinking...').start();
          
          const response = await api.post('/chat', {
            message: trimmed,
            sessionId: config.get('sessionId') || undefined,
          });

          spinner.stop();

          if (response.data.sessionId) {
            config.set('sessionId', response.data.sessionId);
          }

          console.log(chalk.cyan('\nAI: ') + chalk.white(response.data.message) + '\n');
          
          if (response.data.usage) {
            console.log(chalk.gray(`Tokens: ${response.data.usage.total_tokens}\n`));
          }
        } catch (error) {
          console.log(chalk.red('Error:'), error.response?.data?.error || error.message);
        }

        ask();
      });
    }

    ask();
  });

// Ask command (single question)
program
  .command('ask <question...>')
  .description('Ask a single question')
  .action(async (question) => {
    ensureAuth();
    
    try {
      const spinner = ora('AI is thinking...').start();
      
      const response = await api.post('/chat', {
        message: question.join(' '),
      });

      spinner.stop();
      console.log(chalk.cyan('\nAI: ') + chalk.white(response.data.message) + '\n');
    } catch (error) {
      console.log(chalk.red('Error:'), error.response?.data?.error || error.message);
      process.exit(1);
    }
  });

// Profile command
program
  .command('profile')
  .description('Show user profile')
  .action(async () => {
    ensureAuth();
    
    try {
      const spinner = ora('Loading profile...').start();
      const response = await api.get('/profile');
      spinner.stop();

      const { user, api_key, stats } = response.data;

      console.log('\n' + chalk.cyan('=== User Profile ==='));
      console.log(chalk.gray('Username: ') + chalk.white(user.username));
      console.log(chalk.gray('Email: ') + chalk.white(user.email));
      console.log(chalk.gray('Full Name: ') + chalk.white(user.full_name || 'Not set'));
      console.log(chalk.gray('Role: ') + chalk.cyan(user.role));
      console.log(chalk.gray('Member Since: ') + chalk.white(new Date(user.created_at).toLocaleDateString()));
      console.log(chalk.gray('Last Login: ') + chalk.white(new Date(user.last_login).toLocaleString()));

      console.log('\n' + chalk.cyan('=== API Key Status ==='));
      if (api_key) {
        console.log(chalk.gray('Key Name: ') + chalk.white(api_key.key_name));
        console.log(chalk.gray('Status: ') + (api_key.is_used ? chalk.yellow('Used') : chalk.green('Active')));
        console.log(chalk.gray('Created: ') + chalk.white(new Date(api_key.created_at).toLocaleDateString()));
        if (api_key.last_used_at) {
          console.log(chalk.gray('Last Used: ') + chalk.white(new Date(api_key.last_used_at).toLocaleString()));
        }
      } else {
        console.log(chalk.yellow('No active API key found'));
      }

      console.log('\n' + chalk.cyan('=== Statistics ==='));
      console.log(chalk.gray('Total Chat Sessions: ') + chalk.white(stats.total_sessions));
      console.log(chalk.gray('Total Messages: ') + chalk.white(stats.total_messages));
      console.log(chalk.gray('Total Commands Executed: ') + chalk.white(stats.total_commands));
      console.log('');
    } catch (error) {
      console.log(chalk.red('Error:'), error.response?.data?.error || error.message);
      process.exit(1);
    }
  });

// View user command
program
  .command('user <username>')
  .description('View another user\'s profile')
  .action(async (username) => {
    ensureAuth();
    
    try {
      const spinner = ora('Loading user...').start();
      const response = await api.get(`/profile/users?username=${encodeURIComponent(username)}`);
      spinner.stop();

      const { user } = response.data;

      console.log('\n' + chalk.cyan('=== User: ' + user.username + ' ==='));
      console.log(chalk.gray('Full Name: ') + chalk.white(user.full_name || 'Not set'));
      console.log(chalk.gray('Bio: ') + chalk.white(user.bio || 'No bio'));
      console.log(chalk.gray('Role: ') + chalk.cyan(user.role));
      console.log(chalk.gray('Member Since: ') + chalk.white(new Date(user.created_at).toLocaleDateString()));
      console.log('');
    } catch (error) {
      console.log(chalk.red('Error:'), error.response?.data?.error || error.message);
      process.exit(1);
    }
  });

// Termux execute command
program
  .command('exec <command...>')
  .description('Execute a Termux command')
  .action(async (command) => {
    ensureAuth();
    
    try {
      const spinner = ora('Executing...').start();
      const response = await api.post('/termux/execute', {
        command: command.join(' '),
      });
      spinner.stop();

      console.log(chalk.gray('Command: ') + chalk.cyan(command.join(' ')));
      console.log(chalk.gray('Output:'));
      console.log(chalk.white(response.data.output || '(no output)'));
      console.log(chalk.gray(`Exit Code: ${response.data.exitCode} | Time: ${response.data.executionTime}ms`));
    } catch (error) {
      console.log(chalk.red('Error:'), error.response?.data?.error || error.message);
      if (error.response?.data?.reason) {
        console.log(chalk.gray(`Reason: ${error.response.data.reason}`));
      }
      process.exit(1);
    }
  });

// Status command
program
  .command('status')
  .description('Show CLI status')
  .action(() => {
    showBanner();
    
    const token = config.get('token');
    const username = config.get('username');
    const apiBaseUrl = config.get('apiBaseUrl');

    console.log(chalk.cyan('=== CLI Status ==='));
    console.log(chalk.gray('API URL: ') + chalk.white(apiBaseUrl));
    console.log(chalk.gray('Auth Status: ') + (token ? chalk.green('Logged in') : chalk.yellow('Not logged in')));
    if (username) {
      console.log(chalk.gray('Username: ') + chalk.cyan(username));
    }
    console.log('');
  });

program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  showBanner();
  program.outputHelp();
}
