# Högalid F15 – Sommarlovet 2026

## Setup

### 1. Netlify Environment Variables
Lägg till dessa i Netlify → Site settings → Environment variables:

```
TURSO_URL = libsql://hogalid-fotboll-emilbacklund.aws-eu-west-1.turso.io
TURSO_TOKEN = [din token från Turso]
```

### 2. GitHub → Netlify
- Pusha repot till GitHub
- Koppla till Netlify (New site → Import from GitHub)
- Netlify bygger automatiskt vid varje push

### 3. Admin-inlogg
- Alias: `admin`
- Lösenord: `HögalidF15`
