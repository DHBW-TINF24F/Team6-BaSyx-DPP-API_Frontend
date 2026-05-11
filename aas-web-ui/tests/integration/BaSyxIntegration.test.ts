import { describe, expect, it } from 'vitest';

import {
    buildBasyxSnapshot,
    installIntegrationBackendMock,
    mockDppDocument,
    requestJson,
    testProductId,
    testRegistryIdentifier,
} from './integrationHarness';

installIntegrationBackendMock();

describe('BaSyxIntegration.test.ts; STR-aligned BaSyx discovery and orchestration checks', () => {
    const basyxCases = [
        {
            id: 'IT-BX-01',
            description: 'Health endpoint should confirm backend readiness',
            async run() {
                const { response, body } = await requestJson('/api/v1/dpp/health');

                expect(response.status).toBe(200);
                expect((body as Record<string, unknown>).status).toBe('UP');
            },
        },
        {
            id: 'IT-BX-02',
            description: 'List endpoint should return discovery data with the configured limit',
            async run() {
                const { response, body } = await requestJson('/api/v1/dpp/list?limit=5');

                expect(response.status).toBe(200);
                expect((body as Record<string, unknown>).statusCode).toBe(200);
                expect((body as Record<string, unknown>).payload as Array<Record<string, unknown>>).toHaveLength(5);
            },
        },
        {
            id: 'IT-BX-03',
            description: 'Product-based getDPP endpoint should return the prepared product payload',
            async run() {
                const { response, body } = await requestJson(`/dpp/${encodeURIComponent(testProductId)}`);

                expect(response.status).toBe(200);
                expect((body as Record<string, unknown>).statusCode).toBe(200);
                expect(((body as Record<string, unknown>).payload as Record<string, unknown>).productId).toBe(testProductId);
            },
        },
        {
            id: 'IT-BX-04',
            description: 'Discovery snapshot should expose submodel references and asset data',
            async run() {
                const snapshot = buildBasyxSnapshot(mockDppDocument);

                expect(snapshot).toMatchObject({
                    assetInformation: {
                        assetKind: 'Instance',
                        globalAssetId: 'urn:uuid:asset-123',
                    },
                    registryIdentifier: testRegistryIdentifier,
                });
                expect((snapshot.submodelReferences as Array<string>)).toContain('https://admin-shell.io/idta/TechnicalData/1/0');
            },
        },
        {
            id: 'IT-BX-05',
            description: 'Registry registration should return the prepared registry identifier',
            async run() {
                const { response, body } = await requestJson('/registerDPP', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ productId: testProductId }),
                });

                expect(response.status).toBe(201);
                expect((body as Record<string, unknown>).registryIdentifier).toBe(testRegistryIdentifier);
            },
        },
    ] as const;

    it.each(basyxCases)('$id: $description', async ({ run }) => {
        await run();
    });
});
