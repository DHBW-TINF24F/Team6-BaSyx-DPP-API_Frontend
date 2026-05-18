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
} from './integrationHarness';

installIntegrationBackendMock();

type ApiRequest = {
    path: string;
    init?: RequestInit;
};

type ApiCase = {
    id: string;
    description: string;
    request: ApiRequest;
    verify(response: Response, body: unknown): void;
};

describe('DppApiIntegration.test.ts; STR-aligned prepared DPP API tests', () => {
    const apiCases: ApiCase[] = [
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
                expect(((body as Record<string, unknown>).payload as Record<string, unknown>).productId).toBe(
                    testProductId
                );
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
                expect(((body as Record<string, unknown>).payload as Record<string, unknown>).productId).toBe(
                    testProductId
                );
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
                expect(
                    (
                        ((body as Record<string, unknown>).payload as Record<string, unknown>).info as Record<
                            string,
                            unknown
                        >
                    ).version
                ).toBe('1.0.1');
            },
        },
        async readDppVersionByProductIdAndDate(productId: string, date: string) {
            const response = await fetch(`/api/dppsbyProductIdAndDate/${productId}?date=${encodeURIComponent(date)}`);
            return response.json();
        },
        async readDppIdsByProductIds(productIds: string[]) {
            const response = await fetch(`/api/dppsbyProductIds`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productIds }),
            });

            return response.json();
        },
        async updateDppById(dppId: string, payload: Partial<DppPayload>) {
            const response = await fetch(`${baseUrl}/${dppId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            return response.json();
        },
        async deleteDppById(dppId: string) {
            const response = await fetch(`${baseUrl}/${dppId}`, {
                method: 'DELETE',
            });

            return response.json();
        },
        async registerDpp(payload: unknown) {
            const response = await fetch(`${baseUrl.replace('/dpps', '')}/registerDPP`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            return response.json();
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
                expect(((body as Record<string, unknown>).payload as typeof mockCollectionRecord).items).toHaveLength(
                    3
                );
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
                expect(((body as Record<string, unknown>).payload as typeof mockElementRecord).value).toBe(
                    'Industrial Motor 3000'
                );
            },
        },
    };
}

describe('DppApiIntegration.test.ts; API tests mapped to DIN EN 18222 DPP-Data-Object-Structure specification', () => {
    const fetchMock = vi.fn();
    const apiClient = createDppApiClient();

    beforeEach(() => {
        fetchMock.mockReset();
        vi.stubGlobal('fetch', fetchMock);
    });

    // ========== CreateDPP Tests ==========
    it('IT-API-01: CreateDPP - should POST to /dpps with DPP info and submodels', async () => {
        const dppInput: CreateDppInput = {
            info: {
                modelType: 'AssetAdministrationShell',
                assetInformation: {
                    assetKind: 'Type',
                    globalAssetId: 'https://pk.harting.com/?.20P=ZSN1',
                    defaultThumbnail: {
                        contentType: 'image/png',
                        path: 'b24b11da.png',
                    },
                },
                administration: {
                    version: '1.0.1',
                    creator: {
                        keys: [{ type: 'GlobalReference', value: 'sebastian.eicke@harting.com' }],
                        type: 'ExternalReference',
                    },
                },
                id: 'https://dpp40.harting.com/shells/ZSN1',
                displayName: [
                    { language: 'en', text: 'HARTING AAS ZSN1' },
                    { language: 'de', text: 'HARTING AAS ZSN1 DE' },
                ],
                idShort: 'HARTING_AAS_ZSN1',
            },
            verify(response: Response, body: unknown) {
                expect(response.status).toBe(200);
                expect((body as Record<string, unknown>).collectionId).toBe(testCollectionId);
                expect(((body as Record<string, unknown>).payload as Record<string, unknown>).name).toBe(
                    'Updated Collection'
                );
            },
        };

        const createdResponse: CreatedResponse = {
            statusCode: 'SuccessCreated',
            dppID: 'dpp-001',
        };

        fetchMock.mockResolvedValueOnce(createJsonResponse(createdResponse, 201));

        const result = await apiClient.createDpp(dppInput);

        expect(fetchMock).toHaveBeenCalledWith('/api/dpps', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dppInput),
        });
        expect(result).toEqual(createdResponse);
        expect(result.statusCode).toBe('SuccessCreated');
    });

    // ========== ReadDPPById Tests ==========
    it('IT-API-02: ReadDPPById - should fetch DPP with complete structure from GET /dpps/{dppId}', async () => {
        const dppPayload: DppPayload = {
            info: {
                modelType: 'AssetAdministrationShell',
                assetInformation: {
                    assetKind: 'Type',
                    globalAssetId: 'https://pk.harting.com/?.20P=ZSN1',
                },
                administration: { version: '1.0.1' },
                id: 'https://dpp40.harting.com/shells/ZSN1',
                idShort: 'HARTING_AAS_ZSN1',
            },
            verify(response: Response, body: unknown) {
                expect(response.status).toBe(200);
                expect((body as Record<string, unknown>).elementPath).toBe(testElementPath);
                expect(((body as Record<string, unknown>).payload as Record<string, unknown>).value).toBe(
                    'Updated Value'
                );
            },
        };

        const response: SuccessResponse<DppPayload> = {
            statusCode: 'Success',
            payload: [dppPayload],
        };

        fetchMock.mockResolvedValueOnce(createJsonResponse(response));

        const result = await apiClient.readDppById('dpp-001');

        expect(fetchMock).toHaveBeenCalledWith('/api/dpps/dpp-001');
        expect(result.statusCode).toBe('Success');
        expect(result.payload).toHaveLength(1);
        expect(result.payload[0].info.idShort).toBe('HARTING_AAS_ZSN1');
    });

    // ========== ReadDPPByProductId Tests ==========
    it('IT-API-03: ReadDPPByProductId - should fetch DPP from GET /dppsByProductId/{productId}', async () => {
        const dppPayload: DppPayload = {
            info: {
                modelType: 'AssetAdministrationShell',
                assetInformation: { assetKind: 'Type', globalAssetId: 'https://pk.harting.com/test' },
                administration: { version: '1.0.0' },
                id: 'https://dpp40.harting.com/shells/test',
                idShort: 'TEST_AAS',
            },
            submodels: {},
        };

        const response: SuccessResponse<DppPayload> = {
            statusCode: 'Success',
            payload: [dppPayload],
        };

        fetchMock.mockResolvedValueOnce(createJsonResponse(response));

        const result = await apiClient.readDppByProductId('battery-pack-001');

        expect(fetchMock).toHaveBeenCalledWith('/api/dppsbyProductId/battery-pack-001');
        expect(result.statusCode).toBe('Success');
        expect(result.payload[0].info.idShort).toBe('TEST_AAS');
    });

    // ========== ReadDPPVersionByProductIdAndDate Tests ==========
    it('IT-API-04: ReadDPPVersionByProductIdAndDate - should fetch specific version from GET /dppsByProductIdAndDate/{productId}', async () => {
        const dppPayload: DppPayload = {
            info: {
                modelType: 'AssetAdministrationShell',
                assetInformation: { assetKind: 'Type', globalAssetId: 'https://pk.harting.com/versioned' },
                administration: { version: '2.0.0' },
                id: 'https://dpp40.harting.com/shells/versioned',
                idShort: 'VERSIONED_AAS',
            },
            submodels: {},
        };

        const response: SuccessResponse<DppPayload> = {
            statusCode: 'Success',
            payload: [dppPayload],
        };

        const dateParam = '2025-01-01T00:00:00Z';
        fetchMock.mockResolvedValueOnce(createJsonResponse(response));

        const result = await apiClient.readDppVersionByProductIdAndDate('battery-pack-001', dateParam);

        expect(fetchMock).toHaveBeenCalledWith(
            `/api/dppsbyProductIdAndDate/battery-pack-001?date=${encodeURIComponent(dateParam)}`
        );
        expect(result.statusCode).toBe('Success');
        expect(result.payload[0].info.administration.version).toBe('2.0.0');
    });

    // ========== ReadDPPIdsByProductIds Tests ==========
    it('IT-API-05: ReadDPPIdsByProductIds - should POST to /dppsbyProductIds and return identifiers', async () => {
        const identifiersPayload: DppIdentifiersPayload = {
            productId: 'battery-pack-001',
            dpps: [{ dppId: 'dpp-001' }, { dppId: 'dpp-002' }],
        };

        const response: SuccessResponse<DppIdentifiersPayload> = {
            statusCode: 'Success',
            payload: [identifiersPayload],
        };

        fetchMock.mockResolvedValueOnce(createJsonResponse(response));

        const result = await apiClient.readDppIdsByProductIds(['battery-pack-001']);

        expect(fetchMock).toHaveBeenCalledWith('/api/dppsbyProductIds', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productIds: ['battery-pack-001'] }),
        });
        expect(result.statusCode).toBe('Success');
        expect(result.payload[0].dpps).toHaveLength(2);
    });

    // ========== UpdateDPPById Tests ==========
    it('IT-API-06: UpdateDPPById - should PATCH to /dpps/{dppId} with updated data', async () => {
        const updatePayload: Partial<DppPayload> = {
            info: {
                modelType: 'AssetAdministrationShell',
                assetInformation: { assetKind: 'Type', globalAssetId: 'https://pk.harting.com/updated' },
                administration: { version: '1.1.0' },
                id: 'https://dpp40.harting.com/shells/updated',
                idShort: 'UPDATED_AAS',
            },
            verify(response: Response, body: unknown) {
                expect(response.status).toBe(400);
                expect((body as Record<string, unknown>).statusCode).toBe(400);
                expect(((body as Record<string, unknown>).errorMessage as Record<string, unknown>).message).toBe(
                    'id must be a valid URL'
                );
            },
        },
    ];

        expect(response.ok).toBe(false);
        expect(response.status).toBe(404);
        expect(error.statusCode).toBe('ClientErrorResourceNotFound');
    });
});
