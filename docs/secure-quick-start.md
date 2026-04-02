# Secure Quick Start

## 1. Create an Omada Open API application

Use the official TP-Link Open API flow documented here:

- [How to Configure OpenAPI via Omada Controller](https://community.tp-link.com/en/business/kb/detail/412930)

Collect:

- `OMADA_BASE_URL`
- `OMADA_CLIENT_ID`
- `OMADA_CLIENT_SECRET`
- `OMADA_OMADAC_ID`

## 2. Start in read-only mode

```bash
OMADA_BASE_URL=https://controller.example.com:8043 \
OMADA_CLIENT_ID=... \
OMADA_CLIENT_SECRET=... \
OMADA_OMADAC_ID=... \
OMADA_STRICT_SSL=true \
OMADA_CAPABILITY_PROFILE=safe-read \
npm run dev
```

## 3. Expand only when needed

- `safe-read`: baseline
- `ops-write`: low-risk operational actions such as reboot/reconnect/block/unblock
- `admin`: only after explicit review

## 4. Lab-only exceptions

If you must test HTTP mode or self-signed certificates, document the exception in your deployment notes and keep it out of production quick starts.
