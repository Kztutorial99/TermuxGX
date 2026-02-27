# AI Sidebar Integration - TermuxGX

## Overview

AI Sidebar adalah fitur asisten AI yang terintegrasi langsung di sidebar kanan aplikasi Termux. Menggunakan **Llama 3.3 70B** melalui Groq API, sidebar ini memungkinkan Anda untuk:

- **Chat dengan AI** - Tanya jawab tentang coding, command Termux, dll
- **Execute Commands** - Jalankan command Termux langsung dari chat
- **Login/Signup** - Authentication dengan Supabase
- **View Profile** - Lihat statistik penggunaan
- **Full Termux Access** - AI dapat membantu dengan command Termux

## Architecture

```
Termux App (Android)
    │
    ├── AI Sidebar Activity (Java)
    │   ├── Login/Signup UI
    │   ├── Chat Interface
    │   └── Termux Command Execution
    │
    └── Vercel API (Backend)
        ├── Supabase (Database)
        │   ├── users
        │   ├── api_keys
        │   ├── chat_sessions
        │   ├── chat_messages
        │   └── termux_command_logs
        │
        └── Groq API (Llama 3.3 70B)
```

## Files Created

### Android (Termux App)
```
app/src/main/
├── java/com/termux/app/ai/
│   ├── AISidebarActivity.java       # Main activity
│   ├── adapters/
│   │   └── ChatMessageAdapter.java  # RecyclerView adapter
│   ├── models/
│   │   ├── ChatMessage.java
│   │   ├── ChatRequest.java
│   │   ├── ChatResponse.java
│   │   ├── CommandRequest.java
│   │   ├── CommandResponse.java
│   │   ├── LoginRequest.java
│   │   ├── LoginResponse.java
│   │   ├── ProfileResponse.java
│   │   ├── SignupRequest.java
│   │   ├── SignupResponse.java
│   │   ├── User.java
│   │   └── UserStats.java
│   └── services/
│       ├── AIApiService.java        # Retrofit interface
│       └── ServiceGenerator.java    # Service factory
│
├── res/
│   ├── layout/
│   │   ├── activity_ai_sidebar.xml  # Main layout
│   │   └── item_chat_message.xml    # Chat item layout
│   ├── drawable/
│   │   ├── ic_ai_logo.xml
│   │   └── bg_code_block.xml
│   └── values/
│       ├── strings.xml              # AI strings
│       └── colors.xml               # AI colors
│
└── AndroidManifest.xml              # Activity registration
```

### Backend (Vercel API)
```
ai-cli/vercel/
├── api/
│   ├── auth/
│   │   ├── login.ts
│   │   ├── signup.ts
│   │   └── logout.ts
│   ├── chat/
│   │   ├── index.ts
│   │   └── stream.ts
│   ├── profile/
│   │   ├── index.ts
│   │   ├── update.ts
│   │   └── users.ts
│   └── termux/
│       └── execute.ts
├── lib/
│   ├── auth.ts
│   ├── groq.ts
│   ├── middleware.ts
│   └── supabase.ts
└── vercel.json
```

### Database (Supabase)
```
ai-cli/supabase/
└── schema.sql  # Complete database schema
```

## Setup

### 1. Backend Setup (Vercel + Supabase)

```bash
cd ai-cli/vercel

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env dengan credentials Anda:
# - SUPABASE_URL
# - SUPABASE_SERVICE_ROLE_KEY
# - GROQ_API_KEY
# - JWT_SECRET

# Deploy ke Vercel
vercel --prod
```

### 2. Supabase Database

1. Buka https://supabase.com
2. Buat project baru
3. SQL Editor → Run `ai-cli/supabase/schema.sql`

### 3. Android App Setup

Edit `AISidebarActivity.java` line 77:
```java
String baseUrl = prefs.getString(PREF_API_BASE_URL, 
    "https://YOUR-VERCEL-URL.vercel.app/api");
```

Atau setup via UI setelah login pertama kali.

### 4. Build & Run

```bash
cd /workspaces/TermuxGX
./gradlew assembleDebug
```

## Usage

### First Time Use

1. Buka Termux app
2. Klik tombol **AI Assistant** di sidebar kiri (icon biru)
3. Login atau Signup
4. API key akan ditampilkan (simpan baik-baik!)

### Chat Commands

- **Type message** - Chat biasa dengan AI
- **/termux <command>** - Execute command (via button)
- **Profile button** - Lihat statistik
- **Logout button** - Logout

### Features

#### 1. Login/Signup
- Email/username + password
- Auto-generate API key (1 user = 1 key)
- JWT token (7 days expiry)

#### 2. AI Chat
- Llama 3.3 70B model
- Conversation history
- Session management

#### 3. Termux Commands
- Whitelist commands untuk security
- Output ditampilkan di chat
- Execution time tracking
- Command logging

#### 4. Profile
- User info
- API key status
- Usage statistics

## Security

### Allowed Commands
```
pkg, apt, ls, cd, pwd, cat, echo, mkdir, rm, cp, mv, touch,
chmod, chown, grep, find, head, tail, wc, git, node, npm,
python, pip, curl, wget, neofetch, htop, top, ps, kill,
uname, whoami, date, ping, vim, nano, tar, zip, unzip, ssh
```

### Blocked Commands
```
rm -rf /, mkfs, dd, chmod 777 /, su, sudo, reboot, poweroff
```

### Authentication
- Password hashing (bcrypt)
- JWT tokens
- Row Level Security (RLS) di Supabase
- API key validation

## API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| /auth/signup | POST | No | Register new user |
| /auth/login | POST | No | Login |
| /auth/logout | POST | Yes | Logout |
| /chat | POST | Yes | Send message |
| /termux/execute | POST | Yes | Execute command |
| /profile | GET | Yes | Get user profile |
| /profile/update | PUT | Yes | Update profile |
| /profile/users | GET | Yes | View other user |

## Troubleshooting

### "Not authenticated"
- Pastikan sudah login
- Token expired (7 days) → login ulang

### "API key already used"
- Setiap user hanya dapat 1 API key
- Hubungi admin untuk reset

### "Command not allowed"
- Command tidak ada di whitelist
- Untuk keamanan, beberapa command diblokir

### Build Error
```bash
# Clean and rebuild
./gradlew clean
./gradlew assembleDebug
```

### Connection Error
- Cek internet connection
- Pastikan Vercel API URL benar
- Cek Vercel deployment logs

## Future Improvements

- [ ] Streaming chat response
- [ ] Voice input
- [ ] Image recognition
- [ ] Code syntax highlighting
- [ ] Command suggestions
- [ ] Offline mode
- [ ] Multi-language support
- [ ] Custom command whitelist
- [ ] Admin dashboard

## Credits

- **Llama 3.3 70B** - Groq API
- **Supabase** - Database & Auth
- **Vercel** - Serverless API
- **Termux** - Terminal emulator

## License

MIT License - TermuxGX
