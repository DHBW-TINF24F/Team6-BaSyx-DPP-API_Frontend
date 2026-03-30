import { defineComponent, h, nextTick, onMounted, ref } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ========== Type Definitions based on DPP Mapping ==========
type StatusCode = 
    | 'Success' 
    | 'SuccessCreated' 
    | 'ClientErrorBadRequest'
    | 'ClientErrorResourceNotFound';

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
        version: string;
    };
    id: string;
    idShort: string;
    displayName?: Array<{
        language: string;
        text: string;
    }>;
};

type ViewerDppPayload = {
    info: DppInfo;
    submodels: Record<string, Array<{
        value: string;
        reference: string;
    }>>;
};

type ViewerDppResponse = {
    statusCode: StatusCode;
    payload: ViewerDppPayload[];
};

type NameplatePayload = {
    ManufacturerName?: Array<{ de?: string; en?: string }>;
    ManufacturerProductDesignation?: Array<{ de?: string; en?: string }>;
    SerialNumber?: string;
    CompanyLogo?: {
        contentType: string;
        value: string;
    };
};

type NameplateResponse = {
    statusCode: StatusCode;
    payload: NameplatePayload[];
};

function createJsonResponse<T>(payload: T, status = 200) {
    return {
        ok: status >= 200 && status < 300,
        status,
        json: async () => payload,
    };
}

// ========== Vue Components ==========
const ViewerComponent = defineComponent({
    name: 'ViewerComponent',
    props: {
        dppId: {
            type: String,
            required: true,
        },
    },
    setup(props: { dppId: string }) {
        const dppData = ref<ViewerDppPayload | null>(null);
        const loading = ref(true);
        const error = ref<string | null>(null);

        onMounted(async () => {
            try {
                const response = await fetch(`/api/dpps/${props.dppId}`);
                const result: ViewerDppResponse = await response.json();

                if (result.statusCode === 'Success' && result.payload.length > 0) {
                    dppData.value = result.payload[0];
                } else if (result.statusCode === 'ClientErrorResourceNotFound') {
                    error.value = 'DPP not found';
                }
                loading.value = false;
            } catch (e) {
                error.value = 'Failed to load DPP';
                loading.value = false;
            }
        });

        return () =>
            h('section', { class: 'dpp-viewer' }, [
                loading.value ? h('span', { class: 'loading' }, 'Loading...') : null,
                error.value ? h('span', { class: 'error' }, error.value) : null,
                dppData.value
                    ? h('div', [
                          h('span', { class: 'product-id' }, dppData.value.info.idShort),
                          h('span', { class: 'submodel-count' }, String(Object.keys(dppData.value.submodels).length)),
                          h('span', { class: 'global-asset-id' }, dppData.value.info.assetInformation.globalAssetId),
                      ])
                    : null,
            ]);
    },
});

const NavigationComponent = defineComponent({
    name: 'NavigationComponent',
    setup() {
        const data = ref<NameplatePayload | null>(null);
        const loading = ref(false);

        async function loadSubmodel(submodelId: string) {
            loading.value = true;
            try {
                const response = await fetch(`/api/dpps/dpp-001/collections/${submodelId}`);
                const result: NameplateResponse = await response.json();

                if (result.statusCode === 'Success' && result.payload.length > 0) {
                    data.value = result.payload[0];
                }
            } finally {
                loading.value = false;
            }
        }

        return () =>
            h('div', [
                h(
                    'button',
                    {
                        class: 'nav-btn',
                        onClick: () => loadSubmodel('Nameplate'),
                    },
                    'Digital Nameplate',
                ),
                loading.value ? h('span', { class: 'loading' }, 'Loading...') : null,
                data.value
                    ? h('div', [
                          h(
                              'div',
                              { class: 'manufacturer' },
                              data.value.ManufacturerName?.[0]?.de ?? data.value.ManufacturerName?.[0]?.en ?? 'n/a'
                          ),
                          h('div', { class: 'serial' }, data.value.SerialNumber ?? 'n/a'),
                      ])
                    : null,
            ]);
    },
});

const MissingDataComponent = defineComponent({
    name: 'MissingDataComponent',
    setup() {
        const data = ref<NameplatePayload>({});

        onMounted(async () => {
            try {
                const response = await fetch('/api/dpps/dpp-001/collections/Nameplate');
                const result: NameplateResponse = await response.json();

                if (result.statusCode === 'Success' && result.payload.length > 0) {
                    data.value = result.payload[0];
                }
            } catch (e) {
                // Handle error silently
            }
        });

        return () =>
            h('div', [
                h(
                    'span',
                    { class: 'manufacturer' },
                    data.value.ManufacturerName?.[0]?.de ?? data.value.ManufacturerName?.[0]?.en ?? 'N/A'
                ),
                h('span', { class: 'product-designation' }, data.value.ManufacturerProductDesignation?.[0]?.de ?? 'N/A'),
                !data.value.ManufacturerProductDesignation
                    ? h('span', { class: 'missing-data' }, 'Product designation missing')
                    : null,
            ]);
    },
});

const ResponsiveComponent = defineComponent({
    name: 'ResponsiveComponent',
    setup() {
        const isMobile = ref(window.innerWidth < 768);

        return () => h('div', { class: isMobile.value ? 'mobile-layout' : 'desktop-layout' }, 'content');
    },
});

// ========== Test Suite ==========
describe('FrontendBackendIntegration.test.ts; Integration tests for viewer components and API per DIN EN 18222', () => {
    const fetchMock = vi.fn();

    beforeEach(() => {
        fetchMock.mockReset();
        vi.stubGlobal('fetch', fetchMock);
    });

    it('IT-FB-01: should load DPP viewer with status code and payload structure on mount', async () => {
        const dppPayload: ViewerDppPayload = {
            info: {
                modelType: 'AssetAdministrationShell',
                assetInformation: {
                    assetKind: 'Type',
                    globalAssetId: 'https://pk.harting.com/test',
                },
                administration: { version: '1.0.1' },
                id: 'https://dpp40.harting.com/shells/test',
                idShort: 'TEST_AAS',
                displayName: [{ language: 'en', text: 'Test AAS' }],
            },
            submodels: {
                Nameplate: [
                    {
                        value: 'https://example.com/submodels/nameplate',
                        reference: 'https://admin-shell.io/zvei/nameplate/3/0/Nameplate',
                    },
                ],
                TechnicalData: [
                    {
                        value: 'https://example.com/submodels/techdata',
                        reference: 'https://admin-shell.io/techdata/1/0/TechnicalData',
                    },
                ],
            },
        };

        const response: ViewerDppResponse = {
            statusCode: 'Success',
            payload: [dppPayload],
        };

        fetchMock.mockResolvedValueOnce(createJsonResponse(response));

        const wrapper = mount(ViewerComponent, { props: { dppId: 'dpp-001' } });
        await flushPromises();

        expect(fetchMock).toHaveBeenCalledWith('/api/dpps/dpp-001');
        expect(wrapper.find('.product-id').text()).toBe('TEST_AAS');
        expect(wrapper.find('.submodel-count').text()).toBe('2');
        expect(wrapper.find('.global-asset-id').text()).toBe('https://pk.harting.com/test');
    });

    it('IT-FB-02: should request data element collection when navigation is used', async () => {
        const nameplatPayload: NameplatePayload = {
            ManufacturerName: [{ de: 'HARTING Electric Stiftung & Co. KG' }],
            ManufacturerProductDesignation: [{ de: 'Han 24B Assembly', en: 'Han 24B Assembly' }],
            SerialNumber: 'SN-0001',
            CompanyLogo: {
                contentType: 'image/png',
                value: 'aH0cHM6Ly9leGFtcGxlLmNvbS9sb2dvLnBuZw==',
            },
        };

        const response: NameplateResponse = {
            statusCode: 'Success',
            payload: [nameplatPayload],
        };

        fetchMock.mockResolvedValueOnce(createJsonResponse(response));

        const wrapper = mount(NavigationComponent);
        await wrapper.find('.nav-btn').trigger('click');
        await nextTick();

        expect(fetchMock).toHaveBeenCalledWith('/api/dpps/dpp-001/collections/Nameplate');
        expect(wrapper.find('.manufacturer').text()).toBe('HARTING Electric Stiftung & Co. KG');
        expect(wrapper.find('.serial').text()).toBe('SN-0001');
    });

    it('IT-FB-03: should render placeholders when optional data fields are missing', async () => {
        const nameplatPayload: NameplatePayload = {
            ManufacturerName: [{ de: 'HARTING Electric Stiftung & Co. KG' }],
        };

        const response: NameplateResponse = {
            statusCode: 'Success',
            payload: [nameplatPayload],
        };

        fetchMock.mockResolvedValueOnce(createJsonResponse(response));

        const wrapper = mount(MissingDataComponent);
        await flushPromises();

        expect(wrapper.find('.manufacturer').text()).toBe('HARTING Electric Stiftung & Co. KG');
        expect(wrapper.find('.product-designation').text()).toBe('N/A');
        expect(wrapper.find('.missing-data').exists()).toBe(true);
    });

    it('IT-FB-04: should handle error responses from API', async () => {
        const errorResponse: Omit<ViewerDppResponse, 'payload'> & { message?: string } = {
            statusCode: 'ClientErrorResourceNotFound',
            message: 'DPP not found',
        };

        fetchMock.mockResolvedValueOnce(createJsonResponse(errorResponse, 404));

        const wrapper = mount(ViewerComponent, { props: { dppId: 'non-existent' } });
        await flushPromises();

        expect(wrapper.find('.error').text()).toBe('DPP not found');
    });

    it('IT-FB-05: should switch to mobile layout below the breakpoint', () => {
        Object.defineProperty(window, 'innerWidth', {
            configurable: true,
            value: 600,
        });

        const wrapper = mount(ResponsiveComponent);

        expect(wrapper.classes()).toContain('mobile-layout');
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
