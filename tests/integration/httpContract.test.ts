import { once } from 'node:events';
import { createServer, type Server } from 'node:http';
import axios from 'axios';
import { afterEach, describe, expect, it } from 'vitest';
import { AuthManager } from '../../src/omadaClient/auth.js';
import { RequestHandler } from '../../src/omadaClient/request.js';

const servers: Server[] = [];
afterEach(async () => {
    await Promise.all(
        servers.splice(0).map(
            (server) =>
                new Promise<void>((resolve) => {
                    server.close(() => resolve());
                    server.closeAllConnections();
                })
        )
    );
});

async function fixture() {
    const calls: { method: string; path: string; authorization?: string }[] = [];
    let reads = 0;
    const server = createServer((req, res) => {
        const path = new URL(req.url ?? '/', 'http://local.test').pathname;
        calls.push({ method: req.method ?? 'GET', path, authorization: req.headers.authorization });
        res.setHeader('Content-Type', 'application/json');
        if (path === '/openapi/authorize/token') {
            res.end(JSON.stringify({ errorCode: 0, result: { accessToken: 'contract-token', expiresIn: 3600 } }));
        } else if (path === '/read' && ++reads < 3) {
            res.statusCode = 503;
            res.setHeader('Retry-After', '0');
            res.end(JSON.stringify({ errorCode: -1 }));
        } else if (path === '/write') {
            res.statusCode = 503;
            res.end(JSON.stringify({ errorCode: -1 }));
        } else if (path === '/redirect') {
            res.statusCode = 302;
            res.setHeader('Location', '/unexpected');
            res.end();
        } else {
            res.end(JSON.stringify({ errorCode: 0, result: { ok: true } }));
        }
    });
    servers.push(server);
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Missing loopback address');
    const http = axios.create({ baseURL: `http://127.0.0.1:${address.port}`, maxRedirects: 0, timeout: 1000, proxy: false });
    const auth = new AuthManager(http, 'fixture-id', 'fixture-secret', 'fixture-controller');
    return { calls, request: new RequestHandler(http, auth, { minRequestIntervalMs: 0, maxReadRetries: 2 }) };
}

describe('real loopback HTTP contracts', () => {
    it('shares authentication and retries reads without replaying writes or following redirects', async () => {
        const { calls, request } = await fixture();
        await Promise.all([request.get('/other'), request.get('/other'), request.get('/other')]);
        expect(calls.filter((call) => call.path === '/openapi/authorize/token')).toHaveLength(1);
        expect(calls.filter((call) => call.path === '/other').map((call) => call.authorization)).toEqual(Array(3).fill('AccessToken=contract-token'));
        expect(request.ensureSuccess(await request.get('/read'))).toEqual({ ok: true });
        expect(calls.filter((call) => call.path === '/read')).toHaveLength(3);
        await expect(request.put('/write', { enabled: true })).rejects.toMatchObject({ response: { status: 503 } });
        expect(calls.filter((call) => call.path === '/write')).toHaveLength(1);
        await expect(request.get('/redirect')).rejects.toMatchObject({ response: { status: 302 } });
        expect(calls.filter((call) => call.path === '/unexpected')).toHaveLength(0);
    });
});
