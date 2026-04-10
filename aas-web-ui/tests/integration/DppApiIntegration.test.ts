import { describe, expect, it } from 'vitest';

const runRealBackendTests = process.env.RUN_REAL_BACKEND_TESTS === 'true';
const describeRealBackend = runRealBackendTests ? describe : describe.skip;

const backendBaseUrl = (process.env.DPP_BACKEND_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');
const testDppId = process.env.DPP_TEST_DPP_ID || 'urn:uuid:test-dpp-1';
const testProductId = process.env.DPP_TEST_PRODUCT_ID || 'urn:uuid:prod-123';
const testDate = process.env.DPP_TEST_DATE || '2026-03-31T00:00:00Z';

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

describeRealBackend('DppApiIntegration.test.ts; Real backend tests based on getDPP endpoints', () => {
    it('IT-API-02: ReadDPPById - should return 200 and expected dppId from GET /dpps/{dppId}', async () => {
        const { response, body } = await getJson(`${backendBaseUrl}/dpps/${encodeURIComponent(testDppId)}`);

        expect(response.status).toBe(200);
        expect(body).toBeTruthy();
        expect((body as Record<string, unknown>).dppId).toBe(testDppId);
    });

    it('IT-API-03: ReadDPPByProductId - should return 200 and expected productId', async () => {
        const { response, body } = await getJson(
            `${backendBaseUrl}/dppsByProductId/${encodeURIComponent(testProductId)}`,
        );

        expect(response.status).toBe(200);
        expect(body).toBeTruthy();
        expect((body as Record<string, unknown>).productId).toBe(testProductId);
    });

    it('IT-API-04: ReadDPPVersionByProductIdAndDate - should return 200 and include versionDate', async () => {
        const { response, body } = await getJson(
            `${backendBaseUrl}/dppsByProductIdAndDate/${encodeURIComponent(testProductId)}?date=${encodeURIComponent(testDate)}`,
        );

        expect(response.status).toBe(200);
        expect(body).toBeTruthy();
        expect((body as Record<string, unknown>).productId).toBe(testProductId);
        expect((body as Record<string, unknown>).versionDate).toBe(testDate);
    });

    it('IT-API-GETDPP-01: should return 200 for GET /api/v1/dpp without id', async () => {
        const { response, body } = await getJson(`${backendBaseUrl}/api/v1/dpp`);

        expect(response.status).toBe(200);
        expect(body).toBeTruthy();
        expect((body as Record<string, unknown>).statusCode).toBe(200);
        expect((body as Record<string, unknown>).payload).toBeTruthy();
    });

    it('IT-API-GETDPP-02: should return 400 for invalid id parameter at GET /api/v1/dpp?id=...', async () => {
        const { response, body } = await getJson(`${backendBaseUrl}/api/v1/dpp?id=not-a-url`);

        expect(response.status).toBe(400);
        expect(body).toBeTruthy();
        expect((body as Record<string, unknown>).statusCode).toBe(400);
    });
});
