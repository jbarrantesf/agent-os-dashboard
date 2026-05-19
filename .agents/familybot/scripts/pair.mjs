// FamilyBot — WhatsApp pairing
// Genera QR code para vincular dispositivo. Guarda sesión en ../auth.
import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys';
import qrcode from 'qrcode';
import pino from 'pino';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_DIR = path.resolve(__dirname, '..', 'auth');
const QR_PNG = path.resolve(__dirname, '..', 'logs', 'qr.png');
const QR_TXT = path.resolve(__dirname, '..', 'logs', 'qr.txt');

const logger = pino({ level: 'warn' });

async function main() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();
  console.log(`[FamilyBot] Baileys WA v${version.join('.')}, auth dir: ${AUTH_DIR}`);

  const sock = makeWASocket({
    version,
    auth: state,
    logger,
    printQRInTerminal: false,
    browser: ['FamilyBot', 'Chrome', '1.0.0'],
    syncFullHistory: false,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      // Save QR as PNG and ASCII
      await qrcode.toFile(QR_PNG, qr, { width: 512, margin: 2 });
      const ascii = await qrcode.toString(qr, { type: 'terminal', small: true });
      writeFileSync(QR_TXT, ascii);
      console.log(`[FamilyBot] QR generated → ${QR_PNG}`);
      console.log(`[FamilyBot] QR ascii → ${QR_TXT}`);
    }

    if (connection === 'open') {
      console.log('[FamilyBot] ✅ CONNECTED. Session saved.');
      console.log(`[FamilyBot] User: ${JSON.stringify(sock.user)}`);
      setTimeout(() => process.exit(0), 1500);
    }

    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode;
      console.log(`[FamilyBot] Connection closed. Reason: ${reason}`);
      if (reason === DisconnectReason.loggedOut) {
        console.log('[FamilyBot] Logged out. Re-run pair.mjs to re-link.');
        process.exit(1);
      } else {
        console.log('[FamilyBot] Will retry in 3s...');
        setTimeout(main, 3000);
      }
    }
  });
}

main().catch((e) => {
  console.error('[FamilyBot] Fatal:', e);
  process.exit(1);
});
