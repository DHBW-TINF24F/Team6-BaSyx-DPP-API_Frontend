import { vi } from 'vitest';

export const runRealBackendTests = process.env.RUN_REAL_BACKEND_TESTS === 'true';
export const backendBaseUrl = (process.env.DPP_BACKEND_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');

export const testDppId = process.env.DPP_TEST_DPP_ID || 'urn:uuid:test-dpp-1';
export const testProductId = process.env.DPP_TEST_PRODUCT_ID || 'urn:uuid:prod-123';
export const testDate = process.env.DPP_TEST_DATE || '2026-03-31T00:00:00Z';
export const testRegistryIdentifier = 'aas-registry://dpps/test-dpp-1';
export const testCollectionId = 'materialComposition';
export const testElementPath = 'info/manufacturerProductDesignation';
export const testUnknownDppId = 'urn:uuid:missing-dpp';
export const testUnknownProductId = 'urn:uuid:missing-product';
export const testRegistryProductId = 'urn:uuid:registry-prod-1';

export const nameplateSemanticId = 'https://admin-shell.io/idta/Nameplate/1/0';
export const technicalDataSemanticId = 'https://admin-shell.io/idta/TechnicalData/1/0';
export const carbonFootprintSemanticId = 'https://admin-shell.io/idta/CarbonFootprint/1/0';

type MockDppDocument = {
    dppId: string;
    productId: string;
    versionDate: string;
    info: {
        productId: string;
        productName: string;
        manufacturerProductDesignation?: string;
        manufacturer?: string;
        version: string;
    };
    submodels: Array<{
        idShort: string;
        semanticId: string;
        name: string;
        elementCount: number;
    }>;
    assetInformation: {
        assetKind: string;
        globalAssetId: string;
    };
};

export const mockDppDocument: MockDppDocument = {
    dppId: testDppId,
    productId: testProductId,
    versionDate: testDate,
    info: {
        productId: testProductId,
        productName: 'Industrial Motor 3000',
        manufacturerProductDesignation: 'Industrial Motor 3000',
        manufacturer: 'Team 6 Manufacturing',
        version: '1.0.0',
    },
    submodels: [
        {
            idShort: 'nameplate',
            semanticId: nameplateSemanticId,
            name: 'Digital Nameplate',
            elementCount: 4,
        },
        {
            idShort: 'technicalData',
            semanticId: technicalDataSemanticId,
            name: 'Technical Data',
            elementCount: 6,
        },
        {
            idShort: 'carbonFootprint',
            semanticId: carbonFootprintSemanticId,
            name: 'Product Carbon Footprint',
            elementCount: 3,
        },
    ],
    assetInformation: {
        assetKind: 'Instance',
        globalAssetId: 'urn:uuid:asset-123',
    },
};

export const mockDppDocumentMissingFields: MockDppDocument = {
    ...mockDppDocument,
    info: {
        productId: testProductId,
        productName: 'Industrial Motor 3000',
        version: '1.0.0',
    },
};

export const mockCollectionRecord = {
    dppId: testDppId,
    elementId: testCollectionId,
    title: 'Material Composition',
    items: [
        { path: 'materials[0].name', value: 'Steel' },
        { path: 'materials[1].name', value: 'Copper' },
        { path: 'materials[2].name', value: 'Plastic' },
    ],
};

export const mockElementRecord = {
    dppId: testDppId,
    elementPath: testElementPath,
    value: 'Industrial Motor 3000',
};

export const mockBasyxList = [
    {
        productId: testProductId,
        dppId: testDppId,
        registryIdentifier: testRegistryIdentifier,
    },
    {
        productId: testRegistryProductId,
        dppId: 'urn:uuid:dpp-2',
        registryIdentifier: 'aas-registry://dpps/test-dpp-2',
    },
    {
        productId: 'urn:uuid:registry-prod-3',
        dppId: 'urn:uuid:dpp-3',
        registryIdentifier: 'aas-registry://dpps/test-dpp-3',
    },
    {
        productId: 'urn:uuid:registry-prod-4',
        dppId: 'urn:uuid:dpp-4',
        registryIdentifier: 'aas-registry://dpps/test-dpp-4',
    },
    {
        productId: 'urn:uuid:registry-prod-5',
        dppId: 'urn:uuid:dpp-5',
        registryIdentifier: 'aas-registry://dpps/test-dpp-5',
    },
];

let integrationMockInstalled = false;

function createJsonResponse(status: number, body: unknown): Response {
    return new Response(body === null ? null : JSON.stringify(body), {
        status,
        headers: body === null ? undefined : { 'Content-Type': 'application/json' },
    });
}

function createErrorBody(statusCode: number, message: string): Record<string, unknown> {
    return {
        statusCode,
        errorMessage: {
            message,
            statusCode,
        },
    };
}

export function displayValue(value: string | undefined | null): string {
    return value && value.trim().length > 0 ? value : 'N/A';
}

export function resolveViewerLayout(viewportWidth: number): 'desktop' | 'mobile' {
    return viewportWidth >= 768 ? 'desktop' : 'mobile';
}

export function buildViewerSnapshot(document: MockDppDocument, viewportWidth: number): Record<string, unknown> {
    return {
        layout: resolveViewerLayout(viewportWidth),
        header: {
            productId: document.info.productId,
            productName: displayValue(document.info.manufacturerProductDesignation ?? document.info.productName),
            version: document.info.version,
        },
        submodels: document.submodels.map((submodel) => submodel.name),
        loadingState: {
            isLoading: false,
            hasContent: true,
        },
    };
}

export function buildLoadingSnapshot(isLoading: boolean): Record<string, unknown> {
    return {
        isLoading,
        skeletonVisible: isLoading,
        contentVisible: !isLoading,
    };
}

export function buildBasyxSnapshot(document: MockDppDocument): Record<string, unknown> {
    return {
        assetInformation: document.assetInformation,
        registryIdentifier: testRegistryIdentifier,
        submodelReferences: document.submodels.map((submodel) => submodel.semanticId),
    };
}

async function readJsonBody(request: Request): Promise<unknown> {
    const contentLength = request.headers.get('content-length');
    if (contentLength === '0') {
        return null;
    }

    try {
        return await request.clone().json();
    } catch {
        return null;
    }
}

function normalizeRequest(input: RequestInfo | URL, init: RequestInit): Request {
    if (input instanceof Request) {
        return input.clone();
    }

    return new Request(input.toString(), init);
}

function parseBodyProductIds(body: unknown): string[] {
    if (Array.isArray(body)) {
        return body.map((value) => String(value));
    }

    if (body && typeof body === 'object' && 'productIds' in body && Array.isArray((body as { productIds: unknown[] }).productIds)) {
        return (body as { productIds: unknown[] }).productIds.map((value) => String(value));
    }

    return [testProductId];
}

function handleDppByProductId(productId: string): Response {
    if (productId === testProductId || productId === testRegistryProductId) {
        return createJsonResponse(200, {
            statusCode: 200,
            productId,
            payload: {
                ...mockDppDocument,
                productId,
                info: {
                    ...mockDppDocument.info,
                    productId,
                },
            },
        });
    }

    return createJsonResponse(404, createErrorBody(404, 'DPP not found for productId'));
}

function handleDppByProductIdAndDate(productId: string, date: string): Response {
    if (productId !== testProductId) {
        return createJsonResponse(404, createErrorBody(404, 'DPP not found for productId and date'));
    }

    return createJsonResponse(200, {
        statusCode: 200,
        productId,
        versionDate: date,
        payload: {
            ...mockDppDocument,
            productId,
            versionDate: date,
        },
    });
}

function handleDppById(dppId: string): Response {
    if (dppId !== testDppId) {
        return createJsonResponse(404, createErrorBody(404, 'DPP not found'));
    }

    return createJsonResponse(200, {
        statusCode: 200,
        dppId,
        productId: mockDppDocument.productId,
        payload: mockDppDocument,
    });
}

function handleCollectionByElementId(dppId: string, elementId: string): Response {
    if (dppId !== testDppId || elementId !== testCollectionId) {
        return createJsonResponse(404, createErrorBody(404, 'Collection not found'));
    }

    return createJsonResponse(200, {
        statusCode: 200,
        dppId,
        elementId,
        payload: mockCollectionRecord,
    });
}

function handleElementByPath(dppId: string, elementPath: string): Response {
    if (dppId !== testDppId || elementPath !== testElementPath) {
        return createJsonResponse(404, createErrorBody(404, 'Element not found'));
    }

    return createJsonResponse(200, {
        statusCode: 200,
        dppId,
        elementPath,
        payload: mockElementRecord,
    });
}

async function mockFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
    const request = normalizeRequest(input, init);
    const url = new URL(request.url);
    const { pathname, searchParams } = url;
    const method = request.method.toUpperCase();
    const body = await readJsonBody(request);

    if (method === 'GET' && pathname === '/api/v1/dpp/health') {
        return createJsonResponse(200, { status: 'UP' });
    }

    if (method === 'GET' && pathname === '/api/v1/dpp/list') {
        const limit = Number.parseInt(searchParams.get('limit') || `${mockBasyxList.length}`, 10);
        return createJsonResponse(200, {
            statusCode: 200,
            payload: mockBasyxList.slice(0, Number.isNaN(limit) ? mockBasyxList.length : limit),
        });
    }

    if (method === 'GET' && pathname === '/api/v1/dpp') {
        if (searchParams.has('id')) {
            return createJsonResponse(400, createErrorBody(400, 'id must be a valid URL'));
        }

        return createJsonResponse(200, {
            statusCode: 200,
            payload: mockDppDocument,
        });
    }

    if (method === 'POST' && pathname === '/registerDPP') {
        return createJsonResponse(201, {
            statusCode: 201,
            registryIdentifier: testRegistryIdentifier,
            payload: {
                productId: testProductId,
                dppId: testDppId,
            },
        });
    }

    if (method === 'POST' && pathname === '/dppsByProductIds') {
        const productIds = parseBodyProductIds(body);
        return createJsonResponse(200, {
            statusCode: 200,
            payload: productIds.map((productId, index) => ({
                productId,
                dppId: `urn:uuid:batch-dpp-${index + 1}`,
            })),
        });
    }

    if (method === 'POST' && pathname === '/dpps') {
        const payload = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
        return createJsonResponse(201, {
            statusCode: 201,
            dppID: testDppId,
            payload: {
                dppId: testDppId,
                productId: String(payload.productId ?? testProductId),
                info: payload.info ?? mockDppDocument.info,
                submodels: payload.submodels ?? mockDppDocument.submodels,
            },
        });
    }

    // Handle PATCH for collections and elements
    if (method === 'PATCH' && pathname.includes('/collections/')) {
        const segments = pathname.split('/').filter(Boolean);
        const dppId = decodeURIComponent(segments[1] || '');
        const elementId = decodeURIComponent(segments[3] || '');
        
        if (dppId !== testDppId) {
            return createJsonResponse(404, createErrorBody(404, 'DPP not found'));
        }
        
        const patch = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
        return createJsonResponse(200, {
            statusCode: 200,
            dppId,
            collectionId: elementId,
            payload: {
                ...mockCollectionRecord,
                ...(patch as Record<string, unknown>),
            },
        });
    }

    if (method === 'PATCH' && pathname.includes('/elements/')) {
        const segments = pathname.split('/').filter(Boolean);
        const dppId = decodeURIComponent(segments[1] || '');
        const elementPath = decodeURIComponent(segments[3] || '');
        
        if (dppId !== testDppId) {
            return createJsonResponse(404, createErrorBody(404, 'DPP not found'));
        }
        
        const patch = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
        return createJsonResponse(200, {
            statusCode: 200,
            dppId,
            elementPath,
            payload: {
                ...mockElementRecord,
                ...(patch as Record<string, unknown>),
            },
        });
    }

    if (method === 'PATCH' && pathname.startsWith('/dpps/')) {
        const dppId = decodeURIComponent(pathname.split('/')[2] || '');
        if (dppId !== testDppId) {
            return createJsonResponse(404, createErrorBody(404, 'DPP not found'));
        }

        const patch = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
        return createJsonResponse(200, {
            statusCode: 200,
            dppId,
            payload: {
                ...mockDppDocument,
                info: {
                    ...mockDppDocument.info,
                    ...(patch.info && typeof patch.info === 'object' ? patch.info : {}),
                },
            },
        });
    }

    if (method === 'DELETE' && pathname.startsWith('/dpps/')) {
        const dppId = decodeURIComponent(pathname.split('/')[2] || '');
        if (dppId !== testDppId) {
            return createJsonResponse(404, createErrorBody(404, 'DPP not found'));
        }

        return new Response(null, { status: 204 });
    }

    if (pathname.startsWith('/dppsByProductIdAndDate/')) {
        const productId = decodeURIComponent(pathname.split('/')[2] || '');
        return handleDppByProductIdAndDate(productId, searchParams.get('date') || testDate);
    }

    if (pathname.startsWith('/dppsByProductId/')) {
        const productId = decodeURIComponent(pathname.split('/')[2] || '');
        return handleDppByProductId(productId);
    }

    if (pathname.startsWith('/dpps/')) {
        const segments = pathname.split('/').filter(Boolean);
        const dppId = decodeURIComponent(segments[1] || '');

        if (segments.length === 2 && method === 'GET') {
            return handleDppById(dppId);
        }

        if (segments.length === 4 && segments[2] === 'collections' && method === 'GET') {
            return handleCollectionByElementId(dppId, decodeURIComponent(segments[3] || ''));
        }

        if (segments.length === 4 && segments[2] === 'elements' && method === 'GET') {
            return handleElementByPath(dppId, decodeURIComponent(segments[3] || ''));
        }
    }

    if (method === 'GET' && pathname.startsWith('/dpp/')) {
        const productId = decodeURIComponent(pathname.split('/')[2] || '');
        if (productId === testProductId) {
            return createJsonResponse(200, {
                statusCode: 200,
                payload: {
                    ...buildBasyxSnapshot(mockDppDocument),
                    productId,
                },
            });
        }

        return createJsonResponse(404, createErrorBody(404, 'Product DPP not found'));
    }

    return createJsonResponse(404, createErrorBody(404, `Unhandled mock request: ${method} ${pathname}`));
}

export function installIntegrationBackendMock(): void {
    if (runRealBackendTests || integrationMockInstalled) {
        return;
    }

    integrationMockInstalled = true;
    vi.stubGlobal('fetch', mockFetch);
}

export async function requestJson(path: string, init: RequestInit = {}): Promise<{ response: Response; body: unknown }> {
    const response = await fetch(`${backendBaseUrl}${path}`, {
        headers: {
            Accept: 'application/json',
            ...(init.headers || {}),
        },
        ...init,
    });

    let body: unknown = null;
    try {
        body = await response.json();
    } catch {
        body = null;
    }

    return { response, body };
}