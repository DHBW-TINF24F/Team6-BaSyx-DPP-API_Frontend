import { describe, expect, it } from 'vitest';

const runRealBackendTests = process.env.RUN_REAL_BACKEND_TESTS === 'true';
const describeRealBackend = runRealBackendTests ? describe : describe.skip;

const backendBaseUrl = (process.env.DPP_BACKEND_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');
const testProductId = process.env.DPP_TEST_PRODUCT_ID || '02095002010200';

async function getJson(url: string): Promise<{ response: Response; body: unknown }> {
    const response = await fetch(url, {
        headers: { Accept: 'application/json' },
    });

    let body: unknown = null;
    try {
        body = await response.json();
    } catch {
        body = null;
    }

    return { response, body };
}

describeRealBackend('BaSyxIntegration.test.ts; Real backend checks for BaSyx discovery and getDPP orchestration', () => {
    it('IT-BX-01: health endpoint should confirm backend readiness', async () => {
        const { response, body } = await getJson(`${backendBaseUrl}/api/v1/dpp/health`);

        expect(response.status).toBe(200);
        expect(body).toBeTruthy();
        expect((body as Record<string, unknown>).status).toBe('UP');
    });

    it('IT-BX-03: list endpoint should return payload object for discovery data', async () => {
        const { response, body } = await getJson(`${backendBaseUrl}/api/v1/dpp/list?limit=5`);

        expect(response.status).toBe(200);
        expect(body).toBeTruthy();
        expect((body as Record<string, unknown>).statusCode).toBe(200);
        expect((body as Record<string, unknown>).payload).toBeTruthy();
    });

    it('IT-BX-05: product-based getDPP endpoint should return structured response or 404', async () => {
        const { response, body } = await getJson(`${backendBaseUrl}/dpp/${encodeURIComponent(testProductId)}`);

        expect([200, 404]).toContain(response.status);
        expect(body).toBeTruthy();
        expect((body as Record<string, unknown>).statusCode).toBe(response.status);
    });
});
