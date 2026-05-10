import { describe, expect, it } from 'vitest';

import {
    installIntegrationBackendMock,
    mockCollectionRecord,
    mockDppDocument,
    mockElementRecord,
    requestJson,
    testCollectionId,
    testDate,
    testDppId,
    testElementPath,
    testProductId,
    testRegistryIdentifier,
    testUnknownDppId,
    testUnknownProductId,
} from './integrationHarness';

installIntegrationBackendMock();

describe('DppApiIntegration.test.ts; STR-aligned prepared DPP API tests', () => {
    const apiCases = [
        {
            id: 'IT-API-01',
            description: 'CreateDPP should create a new DPP document',
            request: {
                path: '/dpps',
                init: {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        productId: testProductId,
                        info: mockDppDocument.info,
                        submodels: mockDppDocument.submodels,
                    }),
                },
            },
            verify(response: Response, body: unknown) {
                expect(response.status).toBe(201);
                expect((body as Record<string, unknown>).dppID).toBe(testDppId);
                expect((body as Record<string, unknown>).payload).toBeTruthy();
                expect(((body as Record<string, unknown>).payload as Record<string, unknown>).productId).toBe(testProductId);
            },
        },
        {
            id: 'IT-API-02',
            description: 'ReadDPPById should return the requested DPP',
            request: {
                path: `/dpps/${encodeURIComponent(testDppId)}`,
            },
            verify(response: Response, body: unknown) {
                expect(response.status).toBe(200);
                expect((body as Record<string, unknown>).dppId).toBe(testDppId);
                expect(((body as Record<string, unknown>).payload as Record<string, unknown>).productId).toBe(testProductId);
            },
        },
        {
            id: 'IT-API-03',
            description: 'UpdateDPP should patch the DPP info section',
            request: {
                path: `/dpps/${encodeURIComponent(testDppId)}`,
                init: {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        info: {
                            version: '1.0.1',
                        },
                    }),
                },
            },
            verify(response: Response, body: unknown) {
                expect(response.status).toBe(200);
                expect((body as Record<string, unknown>).dppId).toBe(testDppId);
                expect((((body as Record<string, unknown>).payload as Record<string, unknown>).info as Record<string, unknown>).version).toBe('1.0.1');
            },
        },
        {
            id: 'IT-API-04',
            description: 'DeleteDPP should remove the DPP and return 204',
            request: {
                path: `/dpps/${encodeURIComponent(testDppId)}`,
                init: {
                    method: 'DELETE',
                },
            },
            verify(response: Response, body: unknown) {
                expect(response.status).toBe(204);
                expect(body).toBeNull();
            },
        },
        {
            id: 'IT-API-05',
            description: 'ReadDPPByProductId should return the matching productId',
            request: {
                path: `/dppsByProductId/${encodeURIComponent(testProductId)}`,
            },
            verify(response: Response, body: unknown) {
                expect(response.status).toBe(200);
                expect((body as Record<string, unknown>).productId).toBe(testProductId);
                expect(((body as Record<string, unknown>).payload as Record<string, unknown>).dppId).toBe(testDppId);
            },
        },
        {
            id: 'IT-API-06',
            description: 'ReadDPPByProductIdAndDate should return the requested versionDate',
            request: {
                path: `/dppsByProductIdAndDate/${encodeURIComponent(testProductId)}?date=${encodeURIComponent(testDate)}`,
            },
            verify(response: Response, body: unknown) {
                expect(response.status).toBe(200);
                expect((body as Record<string, unknown>).productId).toBe(testProductId);
                expect((body as Record<string, unknown>).versionDate).toBe(testDate);
            },
        },
        {
            id: 'IT-API-07',
            description: 'ReadDPPsByProductIds should resolve multiple productIds',
            request: {
                path: '/dppsByProductIds',
                init: {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ productIds: [testProductId, 'urn:uuid:prod-456'] }),
                },
            },
            verify(response: Response, body: unknown) {
                expect(response.status).toBe(200);
                const payload = (body as Record<string, unknown>).payload as Array<Record<string, unknown>>;
                expect(payload).toHaveLength(2);
                expect(payload[0].productId).toBe(testProductId);
                expect(payload[1].productId).toBe('urn:uuid:prod-456');
            },
        },
        {
            id: 'IT-API-08',
            description: 'RegisterDPP should return a registry identifier',
            request: {
                path: '/registerDPP',
                init: {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ productId: testRegistryIdentifier }),
                },
            },
            verify(response: Response, body: unknown) {
                expect(response.status).toBe(201);
                expect((body as Record<string, unknown>).registryIdentifier).toBe(testRegistryIdentifier);
            },
        },
        {
            id: 'IT-API-09',
            description: 'ReadCollectionsByElementId should return collection entries',
            request: {
                path: `/dpps/${encodeURIComponent(testDppId)}/collections/${encodeURIComponent(testCollectionId)}`,
            },
            verify(response: Response, body: unknown) {
                expect(response.status).toBe(200);
                expect((body as Record<string, unknown>).elementId).toBe(testCollectionId);
                expect(((body as Record<string, unknown>).payload as typeof mockCollectionRecord).items).toHaveLength(3);
            },
        },
        {
            id: 'IT-API-10',
            description: 'ReadElementsByPath should return the addressed element value',
            request: {
                path: `/dpps/${encodeURIComponent(testDppId)}/elements/${encodeURIComponent(testElementPath)}`,
            },
            verify(response: Response, body: unknown) {
                expect(response.status).toBe(200);
                expect((body as Record<string, unknown>).elementPath).toBe(testElementPath);
                expect(((body as Record<string, unknown>).payload as typeof mockElementRecord).value).toBe('Industrial Motor 3000');
            },
        },
        {
            id: 'IT-API-11',
            description: 'UpdateDataElementCollection should patch a collection element',
            request: {
                path: `/dpps/${encodeURIComponent(testDppId)}/collections/${encodeURIComponent(testCollectionId)}`,
                init: {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: 'Updated Collection',
                    }),
                },
            },
            verify(response: Response, body: unknown) {
                expect(response.status).toBe(200);
                expect((body as Record<string, unknown>).collectionId).toBe(testCollectionId);
                expect(((body as Record<string, unknown>).payload as Record<string, unknown>).name).toBe('Updated Collection');
            },
        },
        {
            id: 'IT-API-12',
            description: 'UpdateDataElement should patch a single element',
            request: {
                path: `/dpps/${encodeURIComponent(testDppId)}/elements/${encodeURIComponent(testElementPath)}`,
                init: {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        value: 'Updated Value',
                    }),
                },
            },
            verify(response: Response, body: unknown) {
                expect(response.status).toBe(200);
                expect((body as Record<string, unknown>).elementPath).toBe(testElementPath);
                expect(((body as Record<string, unknown>).payload as Record<string, unknown>).value).toBe('Updated Value');
            },
        },
        {
            id: 'IT-API-13',
            description: 'ReadLegacyApiRoot should return the prepared root payload',
            request: {
                path: '/api/v1/dpp',
            },
            verify(response: Response, body: unknown) {
                expect(response.status).toBe(200);
                expect((body as Record<string, unknown>).statusCode).toBe(200);
                expect(((body as Record<string, unknown>).payload as Record<string, unknown>).dppId).toBe(testDppId);
            },
        },
        {
            id: 'IT-API-14',
            description: 'RejectInvalidIdQuery should return 400 for malformed id input',
            request: {
                path: '/api/v1/dpp?id=not-a-url',
            },
            verify(response: Response, body: unknown) {
                expect(response.status).toBe(400);
                expect((body as Record<string, unknown>).statusCode).toBe(400);
                expect(((body as Record<string, unknown>).errorMessage as Record<string, unknown>).message).toBe('id must be a valid URL');
            },
        },
    ] as const;

    it.each(apiCases)('$id: $description', async ({ request, verify }) => {
        const { response, body } = await requestJson(request.path, request.init);
        verify(response, body);
    });
});
