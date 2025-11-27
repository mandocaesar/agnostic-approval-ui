# Google Sign-In Setup Guide

## 1. Get Google OAuth Credentials

### Step 1: Go to Google Cloud Console
Visit: https://console.cloud.google.com/

### Step 2: Create a New Project (or select existing)
1. Click on the project dropdown at the top
2. Click "New Project"
3. Name it "Approval System" (or your preferred name)
4. Click "Create"

### Step 3: Enable Google+ API
1. Go to "APIs & Services" > "Library"
2. Search for "Google+ API"
3. Click on it and press "Enable"

### Step 4: Configure OAuth Consent Screen
1. Go to "APIs & Services" > "OAuth consent screen"
2. Select "External" (or "Internal" if using Google Workspace)
3. Fill in the required fields:
   - App name: "Approval System"
   - User support email: Your email
   - Developer contact: Your email
4. Click "Save and Continue"
5. Skip "Scopes" (click "Save and Continue")
6. Add test users if using External (your email)
7. Click "Save and Continue"

### Step 5: Create OAuth Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Web application"
4. Name: "Approval System Web Client"
5. Add Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (for development)
   - `https://yourdomain.com/api/auth/callback/google` (for production)
6. Click "Create"
7. Copy the **Client ID** and **Client Secret**

## 2. Configure Environment Variables

Create a `.env.local` file in your project root:

```bash
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/approval"

# NextAuth - Generate a random secret
AUTH_SECRET="run: openssl rand -base64 32"

# Google OAuth
GOOGLE_CLIENT_ID="your-client-id-here.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret-here"
```

### Generate AUTH_SECRET
Run this command in your terminal:
```bash
openssl rand -base64 32
```

Copy the output and paste it as your `AUTH_SECRET`.

## 3. Update Database

The migration has already been applied. Your database now has:
- `Account` table (for OAuth accounts)
- `Session` table (for user sessions)
- `VerificationToken` table (for email verification)
- Updated `User` table (with auth fields)

## 4. Test the Login

1. Start your development server:
```bash
pnpm dev
```

2. Visit: `http://localhost:3000/login`

3. Click "Sign in with Google"

4. Select your Google account

5. You should be redirected to `/dashboard`

## 5. Production Deployment

When deploying to production:

1. Add your production URL to Google OAuth:
   - Authorized JavaScript origins: `https://yourdomain.com`
   - Authorized redirect URIs: `https://yourdomain.com/api/auth/callback/google`

2. Update your `.env` file with production values

3. Set environment variables in your hosting platform (Vercel, Railway, etc.)

## Troubleshooting

### "redirect_uri_mismatch" error
- Make sure the redirect URI in Google Console exactly matches: `http://localhost:3000/api/auth/callback/google`
- No trailing slashes
- Check the protocol (http vs https)

### Session not persisting
- Make sure `AUTH_SECRET` is set
- Check database connection
- Clear browser cookies and try again

### "User not found" after login
- The first time you sign in, a new user will be created automatically
- Check the `User` table in your database

## Security Notes

- Never commit `.env.local` to version control
- Keep `AUTH_SECRET` and `GOOGLE_CLIENT_SECRET` private
- Use different credentials for development and production
- Enable 2FA on your Google Cloud Console account
