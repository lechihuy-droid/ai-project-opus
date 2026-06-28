#!/usr/bin/env node
// One-time setup: get a Google OAuth refresh token for GitHub Actions.
// Run: node scripts/get-refresh-token.js
// Requires: node 18+, a browser.
'use strict';

const http = require('http');
const { exec } = require('child_process');

// ── Điền client credentials ở đây (chỉ chạy local, không commit) ──
const CLIENT_ID     = process.env.GOOGLE_CLIENT_ID     || 'PASTE_CLIENT_ID_HERE';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'PASTE_CLIENT_SECRET_HERE';
const REDIRECT_URI  = 'http://localhost:3000/callback';

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/tasks',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/drive.file'
].join(' ');

const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + new URLSearchParams({
  client_id:     CLIENT_ID,
  redirect_uri:  REDIRECT_URI,
  response_type: 'code',
  scope:         SCOPES,
  access_type:   'offline',
  prompt:        'consent'   // force refresh_token even if already authorized
}).toString();

console.log('\n── Nexus: Get Refresh Token ──────────────────────────────');
console.log('Trước khi chạy, thêm URI này vào Google Console → OAuth client → Authorized redirect URIs:');
console.log(`  ${REDIRECT_URI}\n`);

// Start local server to catch callback
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost:3000');
  if (url.pathname !== '/callback') { res.end('Not found'); return; }

  const code = url.searchParams.get('code');
  if (!code) {
    res.end('No code in callback. Try again.');
    server.close();
    return;
  }

  res.end('<h2>✓ Done — check your terminal for the refresh token.</h2>');
  server.close();

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    new URLSearchParams({
      code,
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri:  REDIRECT_URI,
      grant_type:    'authorization_code'
    })
  });
  const tokens = await tokenRes.json();

  if (!tokens.refresh_token) {
    console.error('\n✗ No refresh_token returned. Make sure prompt=consent is set.');
    console.error('Full response:', JSON.stringify(tokens, null, 2));
    return;
  }

  console.log('\n✓ Refresh token obtained!\n');
  console.log('Chạy 3 lệnh sau để lưu vào GitHub Secrets:');
  console.log('─────────────────────────────────────────────────────────');
  console.log(`gh secret set GOOGLE_CLIENT_ID     --body "${CLIENT_ID}"`);
  console.log(`gh secret set GOOGLE_CLIENT_SECRET --body "${CLIENT_SECRET}"`);
  console.log(`gh secret set GOOGLE_REFRESH_TOKEN --body "${tokens.refresh_token}"`);
  console.log('─────────────────────────────────────────────────────────');
  console.log('\n⚠  Đừng commit refresh token này vào repo.\n');
});

server.listen(3000, () => {
  console.log('Mở URL sau trong trình duyệt (hoặc để script tự mở):');
  console.log(`\n  ${authUrl}\n`);
  // Try to open browser automatically
  const cmd = process.platform === 'win32' ? `start "${authUrl}"` : `open "${authUrl}"`;
  exec(cmd, err => { if (err) console.log('(Tự mở trình duyệt thất bại — copy URL ở trên)'); });
  console.log('Đang chờ callback trên http://localhost:3000...\n');
});
