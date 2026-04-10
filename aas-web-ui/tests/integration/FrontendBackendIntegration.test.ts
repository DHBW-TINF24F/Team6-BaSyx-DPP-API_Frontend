import { describe, expect, it } from 'vitest';

const runRealBackendTests = process.env.RUN_REAL_BACKEND_TESTS === 'true';
const describeRealBackend = runRealBackendTests ? describe : describe.skip;

const backendBaseUrl = (process.env.DPP_BACKEND_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');
const testDppId = process.env.DPP_TEST_DPP_ID || 'urn:uuid:test-dpp-1';
const testProductId = process.env.DPP_TEST_PRODUCT_ID || 'urn:uuid:prod-123';

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

describeRealBackend('FrontendBackendIntegration.test.ts; Real backend checks for viewer-facing getDPP calls', () => {
    it('IT-FB-01: viewer data load endpoint should return dppId and productId', async () => {
        const { response, body } = await getJson(`${backendBaseUrl}/dpps/${encodeURIComponent(testDppId)}`);

        expect(response.status).toBe(200);
        expect(body).toBeTruthy();
        expect((body as Record<string, unknown>).dppId).toBe(testDppId);
        expect((body as Record<string, unknown>).productId).toBeTruthy();
    });

    it('IT-FB-02: productId-based navigation endpoint should return matching productId', async () => {
        const { response, body } = await getJson(
            `${backendBaseUrl}/dppsByProductId/${encodeURIComponent(testProductId)}`,
        );

        expect(response.status).toBe(200);
        expect(body).toBeTruthy();
        expect((body as Record<string, unknown>).productId).toBe(testProductId);
    });

    it('IT-FB-04: invalid query parameter should be handled with client error', async () => {
        const { response, body } = await getJson(`${backendBaseUrl}/api/v1/dpp?id=invalid-url`);

        expect(response.status).toBe(400);
        expect(body).toBeTruthy();
        expect((body as Record<string, unknown>).statusCode).toBe(400);
    });
});
