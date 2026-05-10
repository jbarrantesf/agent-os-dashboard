# Implementación — Webhook Email Inbound

## Archivo a crear
```
apps/web/src/app/api/webhooks/email-inbound/route.ts
```
Copiar el contenido de `route.ts` en este mismo folder.

## Variable de entorno a agregar en Vercel
```
POSTMARK_SERVER_TOKEN = e80f74f9-562a-49db-9d10-33bcec314b32
```
Vercel Dashboard → aios-munso → Settings → Environment Variables

## Dirección inbound de Postmark (para Kenneth)
```
afd6c2bf6962e9dd01e4a4e2704798e4@inbound.postmarkapp.com
```

## Próximos pasos después de implementar
1. Agregar var de entorno en Vercel y hacer redeploy
2. Enviar correo a Kenneth con instrucciones de reenvío
3. Hacer prueba end-to-end: enviar email de prueba → verificar en dashboard que aparece propuesta
4. Completar mapeo de remitentes en `REMITENTES_CANAL_MODERNO` con emails reales (pedirle a Georgina)
