# Termux AI CLI

AI-powered CLI for Termux with **Llama 3.3 70B** integration, authentication via Supabase, and full Termux system access.

## Features

- 🔐 **Authentication System** - Login/Signup with Supabase database
- 🤖 **AI Chat** - Powered by Llama 3.3 70B (Groq API)
- 💬 **Interactive Chat** - Real-time conversation with AI
- 📱 **Termux Integration** - Execute Termux commands directly from chat
- 👤 **User Profiles** - View your profile and other users
- 🔑 **API Key System** - 1 user = 1 unique API key
- 📊 **Statistics** - Track usage (sessions, messages, commands)

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Termux CLI │────▶│  Vercel API  │────▶│   Supabase  │
│   (Node.js) │     │  (Serverless)│     │  (Database) │
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  Groq API    │
                    │ (Llama 3.3)  │
                    └──────────────┘
```

## Setup

### 1. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the schema:

```bash
# Copy the schema from supabase/schema.sql
# Paste into Supabase SQL Editor and run
```

3. Get your credentials:
   - Project URL
   - Anon Key (public)
   - Service Role Key (secret)

### 2. Groq API Setup

1. Get API key from [console.groq.com](https://console.groq.com)
2. Llama 3.3 70B is available as `llama-3.3-70b-versatile`

### 3. Vercel Deployment

```bash
cd vercel

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your credentials:
# SUPABASE_URL=your_project_url
# SUPABASE_ANON_KEY=your_anon_key
# SUPABASE_SERVICE_ROLE_KEY=your_service_key
# GROQ_API_KEY=your_groq_key
# JWT_SECRET=your_secret_key

# Deploy to Vercel
npm install -g vercel
vercel --prod
```

### 4. CLI Installation

```bash
cd ai-cli

# Install dependencies
npm install

# Link CLI globally
npm link

# Or run directly
node src/cli.js
```

## Usage

### First Time Setup

```bash
# Check status
ai-cli status

# Login or Signup
ai-cli login
```

### Chat Commands

```bash
# Start interactive chat
ai-cli chat

# Ask single question
ai-cli ask "What is Termux?"

# Execute Termux command
ai-cli exec "pkg update"

# View profile
ai-cli profile

# View another user
ai-cli user username
```

### In-Chat Commands

```
/exit          - Exit chat
/clear         - Clear session
/session       - Show session ID
/help          - Show help
/termux <cmd>  - Execute Termux command
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout

### Chat
- `POST /api/chat` - Send message (non-streaming)
- `POST /api/chat/stream` - Send message (streaming)

### Profile
- `GET /api/profile` - Get current user profile
- `PUT /api/profile/update` - Update profile
- `GET /api/profile/users?username=X` - Get other user

### Termux
- `POST /api/termux/execute` - Execute command

## Database Schema

### Tables
- `users` - User accounts
- `api_keys` - API keys (1 per user, unused only)
- `chat_sessions` - Chat sessions
- `chat_messages` - Chat message history
- `termux_command_logs` - Command execution logs

## Security

- JWT tokens for authentication (7 day expiry)
- Password hashing with bcrypt
- Command whitelist for Termux execution
- Row Level Security (RLS) on Supabase tables
- Blocked dangerous commands (rm -rf /, etc.)

## Allowed Termux Commands

```
pkg, apt, apt-get, ls, cd, pwd, cat, echo, mkdir, rm, cp, mv, touch,
chmod, chown, grep, find, head, tail, wc, git, node, npm, npx,
python, python3, pip, pip3, java, javac, curl, wget, termux-setup-storage,
am, pm, logcat, neofetch, htop, top, ps, kill, uname, whoami, id, date,
uptime, ping, netstat, ifconfig, vim, nano, emacs, tar, zip, unzip, gzip,
ssh, scp, termux-info
```

## Environment Variables

```env
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Groq
GROQ_API_KEY=gsk_...

# JWT
JWT_SECRET=your_super_secret_key_change_this

# Node
NODE_ENV=production
```

## Development

```bash
# Run Vercel dev server
cd vercel
npm run dev

# Run CLI
cd ai-cli
npm start
```

## Troubleshooting

### "Not authenticated"
Run `ai-cli login` first.

### "API key already used"
Each user gets 1 API key. Contact admin if you need a new one.

### "Command not allowed"
Check the allowed commands list above for security reasons.

## License

MIT License - TermuxGX
