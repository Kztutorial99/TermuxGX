# AI CLI Setup Guide - TermuxGX

## Quick Start

### Step 1: Setup Supabase Database

1. Buka https://supabase.com dan buat project baru
2. Masuk ke **SQL Editor**
3. Copy dan paste isi file `supabase/schema.sql`
4. Klik **Run** untuk execute schema

### Step 2: Dapatkan API Keys

#### Supabase Keys
- **Project URL**: Settings → API → Project URL
- **Anon Key**: Settings → API → Project API keys → anon public
- **Service Role Key**: Settings → API → Project API keys → service_role

#### Groq API Key
1. Buka https://console.groq.com
2. Login/Register
3. API Keys → Create API Key
4. Copy key (format: `gsk_xxx...`)

#### JWT Secret
Generate random string:
```bash
openssl rand -hex 32
```

### Step 3: Deploy ke Vercel

```bash
cd /workspaces/TermuxGX/ai-cli/vercel

# Install dependencies
npm install

# Buat file .env
cp .env.example .env

# Edit .env dengan credentials Anda
nano .env  # atau gunakan editor favorit

# Deploy
npm install -g vercel
vercel --prod
```

Catatan URL Vercel Anda (contoh: `https://termux-ai-cli.vercel.app`)

### Step 4: Install CLI

```bash
cd /workspaces/TermuxGX/ai-cli

# Install dependencies
npm install

# Set API URL environment
export API_BASE_URL="https://YOUR-VERCEL-URL.vercel.app/api"

# Test CLI
node src/cli.js status
```

### Step 5: Login/Register

```bash
# Jalankan CLI
node src/cli.js login

# Pilih Signup untuk membuat akun baru
# Atau Login jika sudah punya akun
```

## Struktur File

```
ai-cli/
├── supabase/
│   └── schema.sql          # Database schema
├── vercel/
│   ├── api/
│   │   ├── auth/           # Authentication endpoints
│   │   ├── chat/           # AI chat endpoints
│   │   ├── profile/        # User profile endpoints
│   │   └── termux/         # Termux command endpoints
│   ├── lib/
│   │   ├── auth.ts         # JWT & password utilities
│   │   ├── groq.ts         # Groq/Llama integration
│   │   ├── middleware.ts   # Auth middleware
│   │   └── supabase.ts     # Supabase client
│   ├── package.json
│   └── vercel.json
├── src/
│   └── cli.js              # Main CLI application
├── package.json
└── README.md
```

## Commands Tersedia

### CLI Commands
```bash
ai-cli status           # Cek status CLI
ai-cli login            # Login/Register
ai-cli logout           # Logout
ai-cli chat             # Interactive chat
ai-cli ask <question>   # Single question
ai-cli exec <command>   # Execute Termux command
ai-cli profile          # View profile
ai-cli user <username>  # View user lain
```

### In-Chat Commands
```
/exit          # Keluar dari chat
/clear         # Clear session
/session       # Lihat session ID
/help          # Bantuan
/termux <cmd>  # Execute command
```

## Security Notes

1. **Jangan share API Key** - Key hanya ditampilkan sekali saat signup
2. **Jangan commit .env** - File .env sudah di .gitignore
3. **JWT Token** - Auto-expire setelah 7 hari
4. **Command Whitelist** - Hanya command tertentu yang diizinkan

## Troubleshooting

### "Not authenticated"
```bash
node src/cli.js login
```

### "API key already used"
Setiap user mendapat 1 API key. Jika sudah terpakai, hubungi admin.

### "Command not allowed"
Command dibatasi untuk keamanan. Lihat daftar allowed commands di README.md.

### Build Error di Vercel
```bash
cd vercel
npm install
vercel --prod
```

## Support

Untuk bantuan lebih lanjut, buka issue di GitHub repository.
