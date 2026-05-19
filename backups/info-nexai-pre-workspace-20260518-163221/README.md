# Backup info@nexaisolutionscr.com — pre-Workspace migration

**Fecha:** 2026-05-18T16:33:07.384036
**Origen:** imap.secureserver.net:993 (GoDaddy email)
**Total mensajes:** 126
**Total tamaño:** 11.41 MB

## Carpetas respaldadas
- `INBOX.mbox` — 102 mensajes (10452 KB)
- `Sent.mbox` — 24 mensajes (1236 KB)
- `Drafts.mbox` — 0 mensajes (0 KB)
- `Archive.mbox` — 0 mensajes (0 KB)
- `Trash.mbox` — 0 mensajes (0 KB)
- `Spam.mbox` — 0 mensajes (0 KB)
- `Scheduled.mbox` — 0 mensajes (0 KB)

## Cómo abrir
- **Apple Mail:** Archivo → Importar buzones → Ficheros mbox → seleccionar carpeta
- **Thunderbird:** instalar extensión ImportExportTools NG → importar mbox
- **Python:** `import mailbox; m = mailbox.mbox('INBOX.mbox')`

## Cómo restaurar a Gmail Workspace
1. Apple Mail importa los `.mbox`
2. Crear cuenta IMAP de `info@nexaisolutionscr.com` (la nueva en Workspace) en Mail
3. Arrastrar mensajes de la carpeta importada al IMAP nuevo
4. Gmail sincroniza arriba
