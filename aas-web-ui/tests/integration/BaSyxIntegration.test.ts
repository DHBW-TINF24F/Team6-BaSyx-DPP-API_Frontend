import { beforeEach, describe, expect, it, vi } from 'vitest';

// ========== Type Definitions based on DPP Mapping ==========
type SubmodelReference = {
    value: string;
    reference: string;
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

type DppRecord = {
    info: DppInfo;
    submodels: Record<string, SubmodelReference[]>;
};

type AasRecord = {
    id: string;
    idShort: string;
    assetInformation: {
        assetKind: 'Type';
        globalAssetId: string;
    };
    submodels: Array<{
        idShort: string;
        semanticId: string;
    }>;
};

type RegistryEntry = {
    dppId: string;
    aasId: string;
    endpoint: string;
};

type SubmodelMetadata = {
    idShort: string;
    semanticId: string;
    version: string;
};

type NameplateData = {
    manufacturerName: string[];
    manufacturerProductDesignation: string[];
    companyLogo?: {
        contentType: string;
        value: string;
    };
    serialNumber?: string;
};

type BaSyxGateway = {
    createAas: ReturnType<typeof vi.fn>;
    registerAas: ReturnType<typeof vi.fn>;
    discoverByProductId: ReturnType<typeof vi.fn>;
    fetchSubmodelMetadata: ReturnType<typeof vi.fn>;
};

function createBaSyxGateway(): BaSyxGateway {
    return {
        createAas: vi.fn(),
        registerAas: vi.fn(),
        discoverByProductId: vi.fn(),
        fetchSubmodelMetadata: vi.fn(),
    };
}

// ========== Helper Functions ==========
async function persistDppAsAas(gateway: BaSyxGateway, dpp: DppRecord): Promise<AasRecord> {
    const submodelsList: Array<{
        idShort: string;
        semanticId: string;
    }> = [];

    for (const [submodelKey, submodelRefs] of Object.entries(dpp.submodels)) {
        if (submodelRefs.length > 0) {
            const metadata = await gateway.fetchSubmodelMetadata(submodelRefs[0].reference);
            submodelsList.push({
                idShort: submodelKey,
                semanticId: metadata.semanticId || submodelRefs[0].reference,
            });
        }
    }

    return gateway.createAas({
        id: dpp.info.id,
        idShort: dpp.info.idShort,
        assetInformation: dpp.info.assetInformation,
        submodels: submodelsList,
    });
}

async function registerDppAsAas(gateway: BaSyxGateway, entry: RegistryEntry): Promise<{ success: boolean }> {
    return gateway.registerAas(entry);
}

async function discoverDppByProductId(gateway: BaSyxGateway, productId: string): Promise<RegistryEntry[]> {
    return gateway.discoverByProductId(productId);
}
// ========== Test Suite ==========
describe('BaSyxIntegration.test.ts; Orchestration tests for BaSyx AAS Environment Component connectivity per DIN EN 18222', () => {
    let gateway: BaSyxGateway;

    beforeEach(() => {
        gateway = createBaSyxGateway();
    });

    it('IT-BX-01: should transform DPP info and submodels into AAS structure per DIN EN 18222 mapping', async () => {
        const dppRecord: DppRecord = {
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
                        value: 'https://dpp40.harting.com/shells/ZSN1/submodels/Nameplate/3/0',
                        reference: 'https://admin-shell.io/zvei/nameplate/3/0/Nameplate',
                    },
                ],
                TechnicalData: [
                    {
                        value: 'https://dpp40.harting.com/shells/ZSN1/submodels/TechnicalData/1/0',
                        reference: 'https://admin-shell.io/volvo/technicaldata/1/0/TechnicalData',
                    },
                ],
            },
        };

        gateway.fetchSubmodelMetadata.mockResolvedValue({
            semanticId: 'https://admin-shell.io/zvei/nameplate/3/0/Nameplate',
        });

        gateway.createAas.mockResolvedValue({
            id: 'https://dpp40.harting.com/shells/ZSN1',
            idShort: 'HARTING_AAS_ZSN1',
            assetInformation: dppRecord.info.assetInformation,
            submodels: [
                { idShort: 'Nameplate', semanticId: 'https://admin-shell.io/zvei/nameplate/3/0/Nameplate' },
                { idShort: 'TechnicalData', semanticId: 'https://admin-shell.io/volvo/technicaldata/1/0/TechnicalData' },
            ],
        } satisfies AasRecord);

        const result = await persistDppAsAas(gateway, dppRecord);

        expect(gateway.createAas).toHaveBeenCalledWith({
            id: 'https://dpp40.harting.com/shells/ZSN1',
            idShort: 'HARTING_AAS_ZSN1',
            assetInformation: dppRecord.info.assetInformation,
            submodels: expect.arrayContaining([
                expect.objectContaining({ idShort: 'Nameplate' }),
                expect.objectContaining({ idShort: 'TechnicalData' }),
            ]),
        });
        expect(result.submodels).toHaveLength(2);
        expect(result.idShort).toBe('HARTING_AAS_ZSN1');
    });

    it('IT-BX-02: should prepare registry entry for BaSyx registration per PostNewDPPToRegistry contract', async () => {
        const entry: RegistryEntry = {
            dppId: 'dpp-001',
            aasId: 'https://dpp40.harting.com/shells/ZSN1',
            endpoint: 'http://localhost:8081/aas/shells/https%3A%2F%2Fdpp40.harting.com%2Fshells%2FZSN1',
        };

        gateway.registerAas.mockResolvedValue({ success: true });

        const result = await registerDppAsAas(gateway, entry);

        expect(gateway.registerAas).toHaveBeenCalledWith(entry);
        expect(result).toEqual({ success: true });
    });

    it('IT-BX-03: should prepare discovery query for BaSyx discovery service', async () => {
        const discoveredEntries: RegistryEntry[] = [
            {
                dppId: 'dpp-001',
                aasId: 'https://dpp40.harting.com/shells/ZSN1',
                endpoint: 'http://localhost:8081/aas/shells/https%3A%2F%2Fdpp40.harting.com%2Fshells%2FZSN1',
            },
        ];

        gateway.discoverByProductId.mockResolvedValue(discoveredEntries);

        const result = await discoverDppByProductId(gateway, 'battery-pack-001');

        expect(gateway.discoverByProductId).toHaveBeenCalledWith('battery-pack-001');
        expect(result).toHaveLength(1);
        expect(result[0].aasId).toBe('https://dpp40.harting.com/shells/ZSN1');
    });

    it('IT-BX-04: should handle submodel references with semantic IDs', async () => {
        const dppRecord: DppRecord = {
            info: {
                modelType: 'AssetAdministrationShell',
                assetInformation: {
                    assetKind: 'Type',
                    globalAssetId: 'https://example.com/product',
                },
                administration: { version: '1.0.0' },
                id: 'https://example.com/aas',
                idShort: 'EXAMPLE_AAS',
            },
            submodels: {
                Nameplate: [
                    {
                        value: 'https://example.com/submodels/nameplate',
                        reference: 'https://admin-shell.io/zvei/nameplate/3/0/Nameplate',
                    },
                ],
                HandoverDocumentation: [
                    {
                        value: 'https://example.com/submodels/handover',
                        reference: 'https://admin-shell.io/handover/documentation/1/0/HandoverDocumentation',
                    },
                ],
            },
        };

        gateway.fetchSubmodelMetadata.mockResolvedValue({
            semanticId: 'https://admin-shell.io/zvei/nameplate/3/0/Nameplate',
            version: '3.0',
        });

        gateway.createAas.mockResolvedValue({
            id: dppRecord.info.id,
            idShort: dppRecord.info.idShort,
            assetInformation: dppRecord.info.assetInformation,
            submodels: [
                { idShort: 'Nameplate', semanticId: 'https://admin-shell.io/zvei/nameplate/3/0/Nameplate' },
                {
                    idShort: 'HandoverDocumentation',
                    semanticId: 'https://admin-shell.io/handover/documentation/1/0/HandoverDocumentation',
                },
            ],
        } satisfies AasRecord);

        const result = await persistDppAsAas(gateway, dppRecord);

        expect(result.submodels).toHaveLength(2);
        expect(result.submodels[0]).toEqual(
            expect.objectContaining({
                idShort: 'Nameplate',
                semanticId: expect.stringContaining('nameplate'),
            })
        );
    });

    it('IT-BX-05: should extract asset information for AAS creation', async () => {
        const dppRecord: DppRecord = {
            info: {
                modelType: 'AssetAdministrationShell',
                assetInformation: {
                    assetKind: 'Type' as const,
                    globalAssetId: 'https://pk.harting.com/test-product',
                    defaultThumbnail: {
                        contentType: 'image/png',
                        path: 'thumbnail.png',
                    },
                },
                administration: { version: '2.0.0' },
                id: 'https://example.com/aas/test',
                idShort: 'TEST_AAS',
            },
            submodels: {},
        };

        gateway.createAas.mockResolvedValue({
            id: dppRecord.info.id,
            idShort: dppRecord.info.idShort,
            assetInformation: dppRecord.info.assetInformation,
            submodels: [],
        } satisfies AasRecord);

        const result = await persistDppAsAas(gateway, dppRecord);

        expect(gateway.createAas).toHaveBeenCalledWith(
            expect.objectContaining({
                assetInformation: expect.objectContaining({
                    assetKind: 'Type',
                    defaultThumbnail: {
                        contentType: 'image/png',
                        path: 'thumbnail.png',
                    },
                }),
            })
        );
        expect(result.assetInformation.globalAssetId).toBe('https://pk.harting.com/test-product');
    });
});
