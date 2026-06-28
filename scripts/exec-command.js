#!/usr/bin/env node
// Nexus Command Executor — runs in GitHub Actions, no npm deps required (Node 18+).
// Usage: node scripts/exec-command.js nexus-commands/2026-06-01T18-00-00.json ...
'use strict';

const fs   = require('fs');
const path = require('path');

const CLIENT_ID     = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;

const ALLOWED_TYPES = new Set([
  'workout','walk','meal_prep','sleep_protection','hydration',
  'recovery','weekly_review','deep_work','study','personal_admin'
]);

const DRIVE_MIME_TYPES = {
  txt:  'text/plain',
  md:   'text/plain',
  html: 'text/html',
  csv:  'text/csv',
  json: 'application/json',
};

// ── OAuth ──────────────────────────────────────────────────────────────────
async function getAccessToken() {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'refresh_token',
      refresh_token: REFRESH_TOKEN,
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SECRET,
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Token refresh failed: ${JSON.stringify(data)}`);
  return data.access_token;
}

// ── Validation ─────────────────────────────────────────────────────────────
function validate(cmd) {
  if (!cmd.action) throw new Error('Missing "action"');

  if (cmd.action === 'add_event') {
    if (!cmd.title?.trim()) throw new Error('Missing "title"');
    if (!cmd.start) throw new Error('Missing "start"');
    if (!cmd.end)   throw new Error('Missing "end"');
    const s = new Date(cmd.start), e = new Date(cmd.end);
    if (isNaN(s)) throw new Error(`Invalid start: ${cmd.start}`);
    if (isNaN(e)) throw new Error(`Invalid end: ${cmd.end}`);
    if (s >= e)   throw new Error('start must be before end');
    const durH = (e - s) / 36e5;
    if (cmd.type !== 'sleep_protection' && durH > 3)
      throw new Error(`Duration ${durH}h exceeds 3h limit`);
    if (cmd.type && !ALLOWED_TYPES.has(cmd.type))
      throw new Error(`Unknown type: ${cmd.type}`);
    return;
  }

  if (cmd.action === 'add_task') {
    if (!cmd.title?.trim()) throw new Error('Missing "title"');
    if (cmd.due && !/^\d{4}-\d{2}-\d{2}$/.test(cmd.due))
      throw new Error(`Invalid due date: ${cmd.due}`);
    return;
  }

  if (cmd.action === 'send_email') {
    if (!cmd.to?.trim())      throw new Error('Missing "to"');
    if (!cmd.subject?.trim()) throw new Error('Missing "subject"');
    if (!cmd.body?.trim())    throw new Error('Missing "body"');
    return;
  }

  if (cmd.action === 'save_to_drive') {
    if (!cmd.filename?.trim()) throw new Error('Missing "filename"');
    if (!cmd.content?.trim())  throw new Error('Missing "content"');
    return;
  }

  throw new Error(`Unknown action: ${cmd.action}`);
}

// ── Google Calendar ────────────────────────────────────────────────────────
async function addEvent(cmd, token) {
  const resource = {
    summary:     cmd.title,
    description: [cmd.description, 'Created by Opus Nexus'].filter(Boolean).join('\n\n'),
    location:    cmd.location || undefined,
    start: { dateTime: cmd.start, timeZone: 'Asia/Tokyo' },
    end:   { dateTime: cmd.end,   timeZone: 'Asia/Tokyo' },
    extendedProperties: { private: { source: 'opus-nexus', type: cmd.type || 'personal_admin' } }
  };
  const res = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify(resource)
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(`Calendar insert failed: ${JSON.stringify(data.error)}`);
  return data.htmlLink;
}

// ── Google Tasks ───────────────────────────────────────────────────────────
async function addTask(cmd, token) {
  const resource = {
    title: cmd.title,
    notes: [cmd.notes, 'Created by Opus Nexus'].filter(Boolean).join('\n\n') || undefined
  };
  if (cmd.due) resource.due = new Date(cmd.due + 'T00:00:00.000Z').toISOString();
  const res = await fetch(
    'https://tasks.googleapis.com/tasks/v1/lists/@default/tasks',
    {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify(resource)
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(`Tasks insert failed: ${JSON.stringify(data.error)}`);
  return data.id;
}

// ── Gmail ──────────────────────────────────────────────────────────────────
async function sendEmail(cmd, token) {
  const headers = [
    `To: ${cmd.to}`,
    cmd.cc  ? `Cc: ${cmd.cc}`   : null,
    cmd.bcc ? `Bcc: ${cmd.bcc}` : null,
    `Subject: ${cmd.subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: ${cmd.html ? 'text/html' : 'text/plain'}; charset=utf-8`,
    '',
    cmd.body
  ].filter(l => l !== null).join('\r\n');

  const raw = Buffer.from(headers).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const res = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
    {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify({ raw })
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(`Gmail send failed: ${JSON.stringify(data.error)}`);
  return data.id;
}

// ── Google Drive ───────────────────────────────────────────────────────────
async function saveToDrive(cmd, token) {
  const ext = cmd.filename.split('.').pop().toLowerCase();
  const mimeType = cmd.mime_type || DRIVE_MIME_TYPES[ext] || 'text/plain';
  const metadata = { name: cmd.filename, mimeType };
  if (cmd.folder_id) metadata.parents = [cmd.folder_id];

  const boundary = 'nexus_drive_boundary_314159';
  const body = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify(metadata),
    `--${boundary}`,
    `Content-Type: ${mimeType}`,
    '',
    cmd.content,
    `--${boundary}--`
  ].join('\r\n');

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',
    {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary="${boundary}"`
      },
      body
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(`Drive upload failed: ${JSON.stringify(data.error)}`);
  return data.webViewLink || data.id;
}

// ── Move processed file ────────────────────────────────────────────────────
function archive(filePath) {
  const dest = path.join('nexus-commands', 'processed', path.basename(filePath));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.renameSync(filePath, dest);
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  const files = process.argv.slice(2).filter(f => f.endsWith('.json') && !f.includes('/processed/'));

  if (!files.length) {
    console.log('No command files to process.');
    return;
  }

  for (const v of [CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN]) {
    if (!v) throw new Error('Missing env: GOOGLE_CLIENT_ID / CLIENT_SECRET / REFRESH_TOKEN');
  }

  const token = await getAccessToken();
  console.log('✓ OAuth token obtained');

  let ok = 0, fail = 0;

  for (const file of files) {
    console.log(`\n── Processing ${file}`);
    let raw;
    try {
      raw = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) {
      console.error(`  ✗ JSON parse error: ${e.message}`);
      fail++;
      continue;
    }

    const commands = Array.isArray(raw) ? raw : [raw];

    for (const cmd of commands) {
      try {
        validate(cmd);
        if (cmd.action === 'add_event') {
          const link = await addEvent(cmd, token);
          console.log(`  ✓ Event added: "${cmd.title}" (${cmd.start}) → ${link}`);
        } else if (cmd.action === 'add_task') {
          const id = await addTask(cmd, token);
          console.log(`  ✓ Task added: "${cmd.title}"${cmd.due ? ` due ${cmd.due}` : ''}`);
        } else if (cmd.action === 'send_email') {
          const id = await sendEmail(cmd, token);
          console.log(`  ✓ Email sent: "${cmd.subject}" → ${cmd.to} (id: ${id})`);
        } else if (cmd.action === 'save_to_drive') {
          const link = await saveToDrive(cmd, token);
          console.log(`  ✓ Drive file saved: "${cmd.filename}" → ${link}`);
        }
        ok++;
      } catch (e) {
        console.error(`  ✗ "${cmd.title || cmd.action}": ${e.message}`);
        fail++;
      }
    }

    archive(file);
    console.log(`  → Archived to nexus-commands/processed/`);
  }

  console.log(`\nDone: ${ok} succeeded, ${fail} failed.`);
  if (fail > 0) process.exit(1);
}

main().catch(e => { console.error(e.message); process.exit(1); });
