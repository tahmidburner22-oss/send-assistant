# SEND Assistant — Full-Stack Application

A comprehensive AI-powered tool for UK SEND educators. Fully self-contained — no external platform dependencies.

---

## Features Implemented

### Legal & Compliance
- Privacy Policy (GDPR compliant, plain English)
- Terms of Service
- Data Processing Agreement (DPA) template for schools
- DPIA documentation (available on request page)
- Cookie/PECR consent banner with granular controls
- UK data residency — all data stored in your own SQLite database

### Safeguarding
- DSL contact capture during school onboarding
- AI content filtering on all AI outputs (keyword + pattern matching)
- Safeguarding incident reporting with automatic DSL email notification
- KCSIE 2025 alignment documented in AI Governance page

### Account Management
- School Admin / SENCO role
- Multi-role hierarchy: MAT Admin → School Admin → SENCO → Teacher → TA
- MAT admin role with multi-school management
- Domain-restricted registration (per school)
- Account deactivation / reactivation (offboarding)

### Security
- Email-based login (not username-only)
- Password reset ("Forgot password") flow with secure tokens
- Multi-Factor Authentication (TOTP/Authenticator app)
- Google Workspace SSO
- Session timeout / auto-logout (8-hour sessions, configurable)
- Full audit logs for all actions

### Accessibility
- WCAG 2.2 Level AA — semantic HTML, ARIA labels, focus management
- Accessibility Statement page published
- Keyboard navigation throughout
- Screen reader compatible

### School Operations
- School onboarding wizard (URN, DSL details, admin setup)
- Pupil profile management with full audit trail
- Bulk CSV import
- Pricing page with licence types
- Free trial option documented

### AI Governance
- AI model disclosed (Groq/Gemini/OpenRouter/OpenAI — user's own keys)
- No anthropomorphisation — clearly labelled as AI tool
- No pupil data used for model training (user's own API keys only)
- Clear "AI-generated" labelling on all outputs
- DfE AI Safety Standards alignment documented

### UX / Product
- Branded 404 page
- Forgot password visible on login page
- Onboarding tour for first-time users
- Help Centre with searchable documentation
- Mobile/tablet responsive throughout
- Worksheet history with full manual + AI editing
- AI-generated SVG diagrams in worksheets
- Year-group-calibrated worksheet difficulty and vocabulary
- Parent Portal with child timetable view

---

## Quick Start (Local Development)

```bash
# 1. Install dependencies
pnpm install

# 2. Copy environment file
cp .env.example .env
# Edit .env — set JWT_SECRET to a long random string

# 3. Start development server
pnpm dev
# Frontend: http://localhost:5173
# Backend API: http://localhost:3001

# Default admin credentials (auto-created on first run):
# Email: admin@sendassistant.app
# Password: Admin1234!
```

---

## Production Deployment

### Option 1: VPS / Self-Hosted (Recommended)

```bash
# 1. Build the project
pnpm build

# 2. Set environment variables (see .env.example)
export JWT_SECRET="your-long-random-secret"
export NODE_ENV="production"
export PORT="3001"
export APP_URL="https://yourdomain.com"
# Optional: SMTP settings for email
# Optional: VITE_GOOGLE_CLIENT_ID for Google SSO

# 3. Start the server
node dist/server/index.js

# The server serves both the API and the built frontend from dist/
```

**Using PM2 (recommended for production):**
```bash
npm install -g pm2
pm2 start dist/server/index.js --name send-assistant
pm2 save
pm2 startup
```

**Nginx reverse proxy config:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Option 2: Railway / Render / Fly.io

1. Connect your Git repository
2. Set environment variables from `.env.example`
3. Build command: `pnpm build`
4. Start command: `node dist/server/index.js`
5. The `data/` directory needs a persistent volume for the SQLite database

### Option 3: Netlify (Frontend Only — Limited)

If deploying frontend-only to Netlify, the backend must be hosted separately (e.g., Railway for the API):

1. Set `VITE_API_URL` to your backend URL
2. Build: `pnpm build`
3. Deploy the `dist/` folder to Netlify
4. Add `netlify.toml`:
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## Environment Variables

See `.env.example` for the full list. Key variables:

| Variable | Required | Description |
|---|---|---|
| `JWT_SECRET` | **Yes** | Long random string for JWT signing |
| `NODE_ENV` | Yes | `production` or `development` |
| `PORT` | No | API port (default: 3001) |
| `APP_URL` | Yes | Your public domain URL |
| `DB_PATH` | No | SQLite file path (default: `./data/send-assistant.db`) |
| `SMTP_HOST` | No | Email server (emails logged to console if not set) |
| `VITE_GOOGLE_CLIENT_ID` | No | For Google Sign-In |
| `VITE_API_URL` | No | Backend URL (for separate frontend/backend deploy) |

---

## Database

The app uses **SQLite** via `better-sqlite3`. The database file is created automatically at `./data/send-assistant.db` on first run.

**Backup:** Simply copy the `.db` file. For production, set up a cron job:
```bash
# Daily backup
0 2 * * * cp /app/data/send-assistant.db /backups/send-assistant-$(date +%Y%m%d).db
```

---

## AI Configuration

Users configure their own AI API keys in **Settings → AI Settings**. Supported providers:
- **Groq** (free tier available — recommended for getting started)
- **Google Gemini** (free tier available)
- **OpenRouter** (access to many models)
- **OpenAI** (GPT-4o etc.)

No AI API keys are required at the server level — each user brings their own.

---

## Security Notes

1. **Change the default admin password** immediately after first login
2. **Set a strong `JWT_SECRET`** — generate with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
3. **Enable HTTPS** in production (use Nginx + Let's Encrypt / Certbot)
4. **Set `ALLOWED_ORIGINS`** to your domain to restrict CORS
5. **Configure SMTP** for password reset and safeguarding alert emails

---

## Architecture

```
send-assistant/
├── client/src/          # React + TypeScript frontend
│   ├── pages/           # All page components
│   ├── components/      # Shared UI components
│   ├── contexts/        # AppContext (state management)
│   └── lib/             # AI utilities, API client
├── server/              # Express.js backend
│   ├── routes/          # API route handlers
│   ├── middleware/       # Auth, audit logging
│   ├── db/              # SQLite schema + initialisation
│   └── email/           # Email utilities (nodemailer)
├── shared/              # Shared TypeScript types
├── dist/                # Built output (after pnpm build)
│   ├── index.html       # Frontend entry point
│   ├── assets/          # Compiled JS/CSS
│   └── server/index.js  # Compiled backend
└── .env.example         # Environment variable template
```

---

## Support

For technical issues, check the server logs. The app logs all errors to stdout.

In development, emails are logged to the console (no SMTP needed).
