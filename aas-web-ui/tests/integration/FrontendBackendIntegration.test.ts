import { describe, expect, it } from 'vitest';
import {
    buildLoadingSnapshot,
    buildViewerSnapshot,
    createJsonResponse,
    displayValue,
    fetchMock,
    installIntegrationBackendMock,
    mockDppDocument,
    mockDppDocumentMissingFields,
    requestJson,
    resolveViewerLayout,
    testCollectionId,
    testDppId,
    testElementPath,
    testProductId,
} from './integrationHarness';

installIntegrationBackendMock();

describe('FrontendBackendIntegration.test.ts; STR-aligned viewer integration checks', () => {
    const frontendCases = [
        {
            id: 'IT-FB-01',
            description: 'Viewer data load should expose the DPP header and submodels',
            async run() {
                const { response, body } = await requestJson(`/dpps/${encodeURIComponent(testDppId)}`);
                expect(response.status).toBe(200);

                const payload = (body as Record<string, unknown>).payload as typeof mockDppDocument;
                const snapshot = buildViewerSnapshot(payload, 1280);

                expect((body as Record<string, unknown>).dppId).toBe(testDppId);
                expect(payload.productId).toBe(testProductId);
                expect(snapshot).toMatchObject({
                    layout: 'desktop',
                    header: {
                        productId: testProductId,
                        productName: 'Industrial Motor 3000',
                        version: '1.0.0',
                    },
                });
            },
        },
        {
            id: 'IT-FB-02',
            description: 'ProductId navigation should keep the selected product context',
            async run() {
                const { response, body } = await requestJson(`/dppsByProductId/${encodeURIComponent(testProductId)}`);
                expect(response.status).toBe(200);

                const payload = (body as Record<string, unknown>).payload as Record<string, unknown>;
                expect((body as Record<string, unknown>).productId).toBe(testProductId);
                expect(payload.dppId).toBe(testDppId);
                expect(resolveViewerLayout(375)).toBe('mobile');
            },
        },
        {
            id: 'IT-FB-03',
            description: 'Missing fields should fall back to N/A in the viewer',
            async run() {
                const { response, body } = await requestJson('/api/v1/dpp');
                expect(response.status).toBe(200);

                const snapshot = buildViewerSnapshot(mockDppDocumentMissingFields, 1440);
                expect(displayValue(mockDppDocumentMissingFields.info.manufacturerProductDesignation)).toBe('N/A');
                expect(snapshot).toMatchObject({
                    layout: 'desktop',
                    header: {
                        productName: 'Industrial Motor 3000',
                    },
                });
                expect((body as Record<string, unknown>).statusCode).toBe(200);
            },
        },
        {
            id: 'IT-FB-04',
            description: 'Structured error responses should surface the backend error message',
            async run() {
                const { response, body } = await requestJson('/dpps/urn%3Auuid%3Amissing-dpp');

                expect(response.status).toBe(404);
                expect((body as Record<string, unknown>).statusCode).toBe(404);
                expect(((body as Record<string, unknown>).errorMessage as Record<string, unknown>).message).toBe(
                    'DPP not found'
                );
            },
        },
        {
            id: 'IT-FB-05',
            description: 'Responsive layout should switch between desktop and mobile snapshots',
            async run() {
                expect(resolveViewerLayout(1440)).toBe('desktop');
                expect(resolveViewerLayout(375)).toBe('mobile');
            },
        },
        {
            id: 'IT-FB-06',
            description: 'Collections and element lookups should remain addressable from the viewer',
            async run() {
                const collectionResponse = await requestJson(
                    `/dpps/${encodeURIComponent(testDppId)}/collections/${encodeURIComponent(testCollectionId)}`
                );
                const elementResponse = await requestJson(
                    `/dpps/${encodeURIComponent(testDppId)}/elements/${encodeURIComponent(testElementPath)}`
                );

                expect(collectionResponse.response.status).toBe(200);
                expect(elementResponse.response.status).toBe(200);
                expect(
                    ((collectionResponse.body as Record<string, unknown>).payload as Record<string, unknown>).items
                ).toHaveLength(3);
                expect(
                    ((elementResponse.body as Record<string, unknown>).payload as Record<string, unknown>).value
                ).toBe('Industrial Motor 3000');
            },
        },
        {
            id: 'IT-FB-07',
            description: 'Loading state should be visible until the backend payload is ready',
            async run() {
                expect(buildLoadingSnapshot(true)).toMatchObject({
                    isLoading: true,
                    skeletonVisible: true,
                    contentVisible: false,
                });
                expect(buildLoadingSnapshot(false)).toMatchObject({
                    isLoading: false,
                    skeletonVisible: false,
                    contentVisible: true,
                });
            },
        },
    ] as const;

    it.each(frontendCases)('$id: $description', async ({ run }) => {
        await run();
    });

    it('IT-FB-06: should handle ClientErrorBadRequest for invalid requests', async () => {
        const errorResponse = {
            statusCode: 'ClientErrorBadRequest',
            message: {
                messageType: 'Error' as const,
                text: 'Invalid request format',
                code: 400,
            },
        };

        fetchMock.mockResolvedValueOnce(createJsonResponse(errorResponse, 400));

        const response = await fetch('/api/dpps/invalid');
        const result = await response.json();

        expect(response.status).toBe(400);
        expect(result.statusCode).toBe('ClientErrorBadRequest');
    });

    it('IT-FB-07: should display loading state while fetching data', async () => {
        const dppPayload: ViewerDppPayload = {
            info: {
                modelType: 'AssetAdministrationShell',
                assetInformation: {
                    assetKind: 'Type',
                    globalAssetId: 'https://pk.harting.com/test',
                },
                administration: { version: '1.0.0' },
                id: 'https://example.com/aas',
                idShort: 'TEST',
            },
            submodels: {},
        };

        const response: ViewerDppResponse = {
            statusCode: 'Success',
            payload: [dppPayload],
        };

        fetchMock.mockResolvedValueOnce(createJsonResponse(response));

        const wrapper = mount(ViewerComponent, { props: { dppId: 'dpp-001' } });

        expect(wrapper.find('.loading').exists()).toBe(true);

        await flushPromises();

        expect(wrapper.find('.loading').exists()).toBe(false);
        expect(wrapper.find('.product-id').exists()).toBe(true);
    });
});
