import { beforeEach, describe, expect, it, vi } from 'vitest';

// ========== Type Definitions ==========
type StatusCode = 
    | 'Success' 
    | 'SuccessCreated' 
    | 'SuccessAccepted'
    | 'SuccessNoContent'
    | 'ClientErrorBadRequest'
    | 'ClientNotAuthorized'
    | 'ClientForbidden'
    | 'ClientMethodNotAllowed'
    | 'ClientErrorResourceNotFound'
    | 'ClientResourceConflict'
    | 'ServerInternalError'
    | 'ServerErrorBadGateway';

type ErrorMessage = {
    messageType: 'Info' | 'Warning' | 'Error' | 'Exception';
    text: string;
    code?: number;
    correlationId?: string;
    timestamp?: string;
};

type SuccessResponse<T> = {
    statusCode: StatusCode;
    payload: T[];
};

type CreatedResponse = {
    statusCode: 'SuccessCreated';
    dppID: string;
};

type RegistryResponse = {
    statusCode: StatusCode;
    registryIdentifier: string;
};

type DeleteResponse = {
    statusCode: StatusCode;
};

type ErrorResponse = {
    statusCode: StatusCode;
    message: ErrorMessage;
};

type DppInfo = {
    modelType: 'AssetAdministrationShell';
    assetInformation: {
        assetKind: 'Type';
        defaultThumbnail?: {
            contentType: string;
            path: string;
        };
        globalAssetId: string;
    };
    administration: {
        creator?: {
            keys: Array<{
                type: string;
                value: string;
            }>;
            type: string;
        };
        version: string;
    };
    id: string;
    description?: Array<{
        language: string;
        text: string;
    }>;
    displayName?: Array<{
        language: string;
        text: string;
    }>;
    idShort: string;
};

type SubmodelReference = {
    value: string;
    reference: string;
};

type DppPayload = {
    info: DppInfo;
    submodels: Record<string, SubmodelReference[]>;
};

type DppIdentifiersPayload = {
    productId: string;
    dpps: Array<{ dppId: string }>;
};

type CreateDppInput = {
    info: DppInfo;
    submodels: Record<string, SubmodelReference[]>;
};

type JsonResponse<T> = {
    ok: boolean;
    status: number;
    json: () => Promise<T>;
};

function createJsonResponse<T>(payload: T, status = 200): JsonResponse<T> {
    return {
        ok: status >= 200 && status < 300,
        status,
        json: async () => payload,
    };
}

function createDppApiClient(baseUrl = '/api/dpps') {
    return {
        async createDpp(payload: CreateDppInput) {
            const response = await fetch(baseUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            return response.json();
        },
        async readDppById(dppId: string) {
            const response = await fetch(`${baseUrl}/${dppId}`);
            return response.json();
        },
        async readDppByProductId(productId: string) {
            const response = await fetch(`${baseUrl}ByProductId/${productId}`);
            return response.json();
        },
        async readDppVersionByProductIdAndDate(productId: string, date: string) {
            const response = await fetch(`${baseUrl}ByProductIdAndDate/${productId}?date=${encodeURIComponent(date)}`);
            return response.json();
        },
        async readDppIdsByProductIds(productIds: string[]) {
            const response = await fetch(`${baseUrl}ByProductIds`, {
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
        async readDataElementCollection(dppId: string, elementId: string) {
            const response = await fetch(`${baseUrl}/${dppId}/collections/${elementId}`);
            return response.json();
        },
        async readDataElement(dppId: string, elementPath: string) {
            const response = await fetch(`${baseUrl}/${dppId}/elements/${elementPath}`);
            return response.json();
        },
        async updateDataElementCollection(dppId: string, elementId: string, payload: unknown) {
            const response = await fetch(`${baseUrl}/${dppId}/collections/${elementId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            return response.json();
        },
        async updateDataElement(dppId: string, elementPath: string, payload: unknown) {
            const response = await fetch(`${baseUrl}/${dppId}/elements/${elementPath}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            return response.json();
        },
        async getRawResponse(url: string) {
            return fetch(url);
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
            submodels: {
                Nameplate: [
                    {
                        value: 'https://dpp40.harting.com/shells/ZSN1/submodels/Nameplate/2/0',
                        reference: 'https://admin-shell.io/zvei/nameplate/2/0/Nameplate',
                    },
                ],
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
            submodels: {
                Nameplate: [
                    {
                        value: 'https://dpp40.harting.com/shells/ZSN1/submodels/Nameplate/3/0',
                        reference: 'https://admin-shell.io/zvei/nameplate/3/0/Nameplate',
                    },
                ],
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

        expect(fetchMock).toHaveBeenCalledWith('/api/dppsByProductId/battery-pack-001');
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
            `/api/dppsByProductIdAndDate/battery-pack-001?date=${encodeURIComponent(dateParam)}`
        );
        expect(result.statusCode).toBe('Success');
        expect(result.payload[0].info.administration.version).toBe('2.0.0');
    });

    // ========== ReadDPPIdsByProductIds Tests ==========
    it('IT-API-05: ReadDPPIdsByProductIds - should POST to /dppsByProductIds and return identifiers', async () => {
        const identifiersPayload: DppIdentifiersPayload = {
            productId: 'battery-pack-001',
            dpps: [
                { dppId: 'dpp-001' },
                { dppId: 'dpp-002' },
            ],
        };

        const response: SuccessResponse<DppIdentifiersPayload> = {
            statusCode: 'Success',
            payload: [identifiersPayload],
        };

        fetchMock.mockResolvedValueOnce(createJsonResponse(response));

        const result = await apiClient.readDppIdsByProductIds(['battery-pack-001']);

        expect(fetchMock).toHaveBeenCalledWith('/api/dppsByProductIds', {
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
            submodels: {},
        };

        const response: SuccessResponse<DppPayload> = {
            statusCode: 'Success',
            payload: [
                {
                    ...updatePayload,
                    info: updatePayload.info!,
                    submodels: updatePayload.submodels || {},
                },
            ],
        };

        fetchMock.mockResolvedValueOnce(createJsonResponse(response));

        const result = await apiClient.updateDppById('dpp-001', updatePayload);

        expect(fetchMock).toHaveBeenCalledWith('/api/dpps/dpp-001', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatePayload),
        });
        expect(result.statusCode).toBe('Success');
    });

    // ========== DeleteDPPById Tests ==========
    it('IT-API-07: DeleteDPPById - should DELETE /dpps/{dppId} and return statusCode only', async () => {
        const response: DeleteResponse = {
            statusCode: 'Success',
        };

        fetchMock.mockResolvedValueOnce(createJsonResponse(response));

        const result = await apiClient.deleteDppById('dpp-001');

        expect(fetchMock).toHaveBeenCalledWith('/api/dpps/dpp-001', {
            method: 'DELETE',
        });
        expect(result.statusCode).toBe('Success');
        expect(result.payload).toBeUndefined();
    });

    // ========== PostNewDPPToRegistry Tests ==========
    it('IT-API-08: PostNewDPPToRegistry - should POST to /registerDPP and return registryIdentifier', async () => {
        const registryPayload = { dppId: 'dpp-001', aasId: 'aas-dpp-001' };
        const response: RegistryResponse = {
            statusCode: 'SuccessCreated',
            registryIdentifier: 'registry-entry-001',
        };

        fetchMock.mockResolvedValueOnce(createJsonResponse(response, 201));

        const result = await apiClient.registerDpp(registryPayload);

        expect(fetchMock).toHaveBeenCalledWith('/api/registerDPP', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(registryPayload),
        });
        expect(result.statusCode).toBe('SuccessCreated');
        expect(result.registryIdentifier).toBe('registry-entry-001');
    });

    // ========== ReadDataElementCollection Tests ==========
    it('IT-API-09: ReadDataElementCollection - should GET /dpps/{dppId}/collections/{elementId}', async () => {
        const collectionPayload = {
            'ProductArticleNumberOfManufacturer': '09 30 024 0301',
            'ManufacturerName': [{ de: 'HARTING Electric Stiftung & Co. KG' }],
        };

        const response: SuccessResponse<typeof collectionPayload> = {
            statusCode: 'Success',
            payload: [collectionPayload],
        };

        fetchMock.mockResolvedValueOnce(createJsonResponse(response));

        const result = await apiClient.readDataElementCollection('dpp-001', 'Nameplate');

        expect(fetchMock).toHaveBeenCalledWith('/api/dpps/dpp-001/collections/Nameplate');
        expect(result.statusCode).toBe('Success');
        expect(result.payload[0].ManufacturerName).toBeDefined();
    });

    // ========== ReadDataElement Tests ==========
    it('IT-API-10: ReadDataElement - should GET /dpps/{dppId}/elements/{elementPath}', async () => {
        const elementPayload = {
            value: 'HARTING Electric Stiftung & Co. KG',
        };

        const response: SuccessResponse<typeof elementPayload> = {
            statusCode: 'Success',
            payload: [elementPayload],
        };

        fetchMock.mockResolvedValueOnce(createJsonResponse(response));

        const result = await apiClient.readDataElement('dpp-001', 'Nameplate.ManufacturerName');

        expect(fetchMock).toHaveBeenCalledWith('/api/dpps/dpp-001/elements/Nameplate.ManufacturerName');
        expect(result.statusCode).toBe('Success');
        expect(result.payload[0].value).toBe('HARTING Electric Stiftung & Co. KG');
    });

    // ========== UpdateDataElementCollection Tests ==========
    it('IT-API-11: UpdateDataElementCollection - should PATCH /dpps/{dppId}/collections/{elementId}', async () => {
        const updatePayload = {
            ManufacturerName: [{ de: 'Updated Manufacturer Name' }],
        };

        const response: SuccessResponse<typeof updatePayload> = {
            statusCode: 'Success',
            payload: [updatePayload],
        };

        fetchMock.mockResolvedValueOnce(createJsonResponse(response));

        const result = await apiClient.updateDataElementCollection('dpp-001', 'Nameplate', updatePayload);

        expect(fetchMock).toHaveBeenCalledWith('/api/dpps/dpp-001/collections/Nameplate', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatePayload),
        });
        expect(result.statusCode).toBe('Success');
    });

    // ========== UpdateDataElement Tests ==========
    it('IT-API-12: UpdateDataElement - should PATCH /dpps/{dppId}/elements/{elementPath}', async () => {
        const updatePayload = {
            value: 'New Manufacturer Value',
        };

        const response: SuccessResponse<typeof updatePayload> = {
            statusCode: 'Success',
            payload: [updatePayload],
        };

        fetchMock.mockResolvedValueOnce(createJsonResponse(response));

        const result = await apiClient.updateDataElement('dpp-001', 'Nameplate.ManufacturerName', updatePayload);

        expect(fetchMock).toHaveBeenCalledWith('/api/dpps/dpp-001/elements/Nameplate.ManufacturerName', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatePayload),
        });
        expect(result.statusCode).toBe('Success');
    });

    // ========== Error Handling Tests ==========
    it('IT-API-13: should handle ClientErrorBadRequest errors with proper error message structure', async () => {
        const errorResponse: ErrorResponse = {
            statusCode: 'ClientErrorBadRequest',
            message: {
                messageType: 'Error',
                text: 'Invalid DPP structure',
                code: 400,
                correlationId: 'corr-123',
                timestamp: '2025-03-27T10:00:00Z',
            },
        };

        fetchMock.mockResolvedValueOnce(createJsonResponse(errorResponse, 400));

        const response = await apiClient.getRawResponse('/api/dpps/invalid');
        const error = await response.json();

        expect(response.ok).toBe(false);
        expect(response.status).toBe(400);
        expect(error.statusCode).toBe('ClientErrorBadRequest');
        expect(error.message.messageType).toBe('Error');
    });

    it('IT-API-14: should handle ClientErrorResourceNotFound errors', async () => {
        const errorResponse: ErrorResponse = {
            statusCode: 'ClientErrorResourceNotFound',
            message: {
                messageType: 'Error',
                text: 'DPP not found',
                code: 404,
            },
        };

        fetchMock.mockResolvedValueOnce(createJsonResponse(errorResponse, 404));

        const response = await apiClient.getRawResponse('/api/dpps/non-existent');
        const error = await response.json();

        expect(response.ok).toBe(false);
        expect(response.status).toBe(404);
        expect(error.statusCode).toBe('ClientErrorResourceNotFound');
    });
});
