<template>
    <v-container fluid class="pa-4 dpp-detail-container">

        <!-- Loading State -->
        <template v-if="loading">
            <v-skeleton-loader type="image" class="w-full rounded-xl mb-6" height="500" />
            <v-row>
                <v-col cols="12" md="8">
                    <v-skeleton-loader type="heading" class="mb-2" />
                    <v-skeleton-loader type="text" class="mb-4" />
                    <v-skeleton-loader type="chip, chip, chip" />
                </v-col>
                <v-col cols="12" md="4">
                    <v-skeleton-loader type="card" />
                </v-col>
            </v-row>
        </template>

        <!-- Not Found State -->
        <template v-else-if="!dpp">
            <div class="text-center mt-12">
                <v-icon size="64" color="grey">mdi-alert-circle-outline</v-icon>
                <p class="text-h6 text-grey mt-4">Kein DPP mit der Product-ID „{{ productId }}" gefunden.</p>
                <p v-if="errorMessage" class="text-body-2 text-grey mt-2">{{ errorMessage }}</p>
                <v-btn
                    variant="text"
                    color="primary"
                    class="mt-4"
                    prepend-icon="mdi-arrow-left"
                    @click="goBack"
                >
                    Zurück zur Übersicht
                </v-btn>
            </div>
        </template>

        <!-- DPP Content -->
        <template v-else>
            <v-card class="hero-card mb-6 pa-6" elevation="2">
                <div class="d-flex flex-column flex-md-row align-md-start justify-space-between ga-4">
                    <div>
                        <div class="text-overline text-primary mb-1">Digital Product Passport</div>
                        <h1 class="dpp-title text-h4 font-weight-bold mb-2">
                            {{ nameFromState || dpp.productId }}
                        </h1>
                        <p class="dpp-description text-body-1 text-grey-darken-1 mb-0">
                            DPP-ID: {{ dpp.dppId }}
                        </p>
                    </div>

                    <v-btn
                        class="back-btn"
                        variant="elevated"
                        color="white"
                        prepend-icon="mdi-arrow-left"
                        size="small"
                        elevation="3"
                        @click="goBack"
                    >
                        Zurück
                    </v-btn>
                </div>

                <v-divider class="border-primary my-6" thickness="2" />

                <v-row dense>
                    <v-col cols="12" sm="6" md="3">
                        <div class="meta-label">Product ID</div>
                        <div class="meta-value text-break">{{ dpp.productId }}</div>
                    </v-col>
                    <v-col cols="12" sm="6" md="3">
                        <div class="meta-label">DPP ID</div>
                        <div class="meta-value text-break">{{ dpp.dppId }}</div>
                    </v-col>
                    <v-col cols="12" sm="6" md="3">
                        <div class="meta-label">Version</div>
                        <div class="meta-value text-break">{{ dpp.version || '-' }}</div>
                    </v-col>
                    <v-col cols="12" sm="6" md="3">
                        <div class="meta-label">Erstellt am</div>
                        <div class="meta-value text-break">{{ dpp.createdAt || '-' }}</div>
                    </v-col>
                </v-row>
            </v-card>

            <!-- Content Row -->
            <v-row class="mb-12">

                <!-- Main Section -->
                <v-col cols="12" md="8" class="pr-md-6">

                    <h1 class="dpp-title text-h4 font-weight-bold mb-4">
                        Submodels
                    </h1>

                    <p class="dpp-description text-body-1 text-grey-darken-1 mb-6">
                        Die Detailseite lädt die Informationen direkt aus dem DPP-Backend.
                    </p>

                    <v-divider class="border-primary mb-6" thickness="2" />

                    <h2 class="section-title text-h5 font-weight-bold mb-4">Submodels</h2>
                    <div class="dpp-content text-body-1 text-grey-darken-1">
                        <v-list v-if="dpp.submodels.length > 0" lines="two" density="comfortable" class="bg-transparent">
                            <v-list-item
                                v-for="submodel in dpp.submodels"
                                :key="`${submodel.reference}-${submodel.name}`"
                                class="px-0"
                            >
                                <template #prepend>
                                    <v-avatar color="primary" variant="tonal" size="40">
                                        <v-icon icon="mdi-cube-outline" />
                                    </v-avatar>
                                </template>

                                <v-list-item-title>{{ submodel.name || 'Unbenanntes Submodel' }}</v-list-item-title>
                                <v-list-item-subtitle class="text-break">
                                    {{ submodel.reference }}
                                </v-list-item-subtitle>
                                <template #append>
                                    <v-chip size="small" variant="tonal" color="primary">
                                        {{ submodel.version || '-' }}
                                    </v-chip>
                                </template>
                            </v-list-item>
                        </v-list>

                        <v-alert v-else type="info" variant="tonal" class="mt-2">
                            Für dieses DPP sind keine Submodels hinterlegt.
                        </v-alert>
                        
                        <div v-if="submodelsValues && Object.keys(submodelsValues).length > 0" class="mt-6">
                            <h2 class="section-title text-h6 font-weight-medium mb-3">Submodel Values</h2>
                            <div v-for="(entries, name) in submodelsValues" :key="name" class="mb-4">
                                <div class="text-subtitle-2 mb-2">{{ name }}</div>
                                <v-list dense class="bg-transparent">
                                    <v-list-item v-for="(entry, idx) in entries" :key="idx" class="px-0">
                                        <v-list-item-content>
                                            <div v-if="entry.idShort">
                                                <strong>{{ entry.idShort }}</strong>: {{ entry.value }}
                                            </div>
                                            <div v-else>{{ JSON.stringify(entry) }}</div>
                                        </v-list-item-content>
                                    </v-list-item>
                                </v-list>
                            </div>
                        </div>
                    </div>

                </v-col>

                <!-- Sidebar -->
                <v-col cols="12" md="4">
                    <v-card class="sidebar-card pa-6" elevation="2">

                        <h2 class="section-title text-h5 font-weight-bold mb-4">Informationen</h2>
                        <v-list density="comfortable" class="bg-transparent pa-0">
                            <v-list-item class="px-0">
                                <v-list-item-title>Product ID</v-list-item-title>
                                <v-list-item-subtitle class="text-break">{{ dpp.productId }}</v-list-item-subtitle>
                            </v-list-item>
                            <v-list-item class="px-0">
                                <v-list-item-title>DPP ID</v-list-item-title>
                                <v-list-item-subtitle class="text-break">{{ dpp.dppId }}</v-list-item-subtitle>
                            </v-list-item>
                            <v-list-item class="px-0">
                                <v-list-item-title>Version</v-list-item-title>
                                <v-list-item-subtitle>{{ dpp.version || '-' }}</v-list-item-subtitle>
                            </v-list-item>
                        </v-list>

                        <v-divider class="border-primary my-6" thickness="2" />

                        <h2 class="section-title text-h5 font-weight-bold mb-4">Weitere Details</h2>
                        <div class="text-body-2 text-grey-darken-1 text-break">
                            Erstellt am: {{ dpp.createdAt || '-' }}
                        </div>

                    </v-card>
                </v-col>

            </v-row>
        </template>

    </v-container>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAASStore } from '@/store/AASDataStore'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Dpp {
    dppId: string
    productId: string
    createdAt: string
    version: string
    submodels: Array<{
        reference: string
        version: string
        name: string
    }>
}

interface DppApiResponse {
    // New/simple wrapper
    status?: string                          // "success" | undefined
    dpp?: Dpp                                // direkt auf Root-Ebene
    submodels_values?: Record<string, unknown[]>
    message?: Array<{                        // Fehlerstruktur (new)
        messageType?: string
        text?: string
        code?: string
        correlationId?: string
        timestamp?: string
    }>

    // Legacy DIN wrapper
    statusCode?: string
    payload?: {
        dpp?: Dpp
        submodels_values?: Record<string, unknown[]>
    }
    result?: {
        message?: Array<{
            text?: string
        }>
    }
}
// ─── Store & Router ───────────────────────────────────────────────────────────
const aasStore = useAASStore()
const router = useRouter()

const selectedAas = computed(() => aasStore.getSelectedAAS)

const productId = computed(() => {
    const aas = selectedAas.value
    if (!aas || Object.keys(aas).length === 0) return ''
    return (aas.assetInformation?.globalAssetId || aas.id || '') as string
})

const nameFromState = computed(() => {
    const aas = selectedAas.value
    if (!aas || Object.keys(aas).length === 0) return ''
    const displayName = aas.displayName as Array<{ language: string; text: string }> | undefined
    return displayName?.find((d: any) => d.language?.startsWith('en'))?.text
        || displayName?.[0]?.text
        || aas.idShort
        || ''
})

// ─── State ────────────────────────────────────────────────────────────────────
const dpp = ref<Dpp | null>(null)
const loading = ref(true)
const errorMessage = ref('')
const submodelsValues = ref<Record<string, Array<Record<string, unknown>>> | null>(null)

// ─── Navigation ───────────────────────────────────────────────────────────────
function goBack() {
    router.push({ name: 'DesignSkeletton' })
}
async function loadDpp(): Promise<void> {
    const currentProductId = productId.value

    if (!currentProductId) {
        dpp.value = null
        errorMessage.value = ''
        loading.value = false
        return
    }

    loading.value = true
    errorMessage.value = ''

    try {
        const response = await fetch(`https://srv01.noah-becker.de/uni/swe/api/dpp/dppsByProductId/${encodeURIComponent(currentProductId)}`)
        const data = (await response.json()) as DppApiResponse

        // Normalize response shapes:
        // - New: { status: 'success', dpp: {...}, submodels_values: {...} }
        // - Legacy: { statusCode: 'Success', payload: { dpp: {...}, submodels_values: {...} } }
        // - Error shapes: { message: [...] } or { result: { message: [...] } }

        let resolvedDpp: Dpp | undefined
        let resolvedSubmodelsValues: Record<string, Array<Record<string, unknown>>> | undefined

        if (data && data.status && String(data.status).toLowerCase() === 'success' && data.dpp) {
            resolvedDpp = data.dpp
            resolvedSubmodelsValues = (data.submodels_values ?? undefined) as Record<string, Array<Record<string, unknown>>> | undefined
        } else if (data && data.statusCode && data.payload && data.payload.dpp) {
            resolvedDpp = data.payload.dpp
            resolvedSubmodelsValues = (data.payload.submodels_values ?? data.submodels_values) as Record<string, Array<Record<string, unknown>>> | undefined
        } else if (data && (data as any).dpp) {
            // fallback: top-level dpp present
            resolvedDpp = (data as any).dpp
            resolvedSubmodelsValues = (data as any).submodels_values as Record<string, Array<Record<string, unknown>>> | undefined
        }

        if (!resolvedDpp) {
            dpp.value = null
            // prefer new message shape, fallback to legacy result
            const msg = data.message?.[0]?.text || data.result?.message?.[0]?.text || (data as any).message?.[0]?.text
            errorMessage.value = msg || `Kein DPP für Product ID "${currentProductId}" gefunden.`
            return
        }

        dpp.value = resolvedDpp
        submodelsValues.value = resolvedSubmodelsValues ?? null
    } catch (error) {
        dpp.value = null
        errorMessage.value = error instanceof Error ? error.message : 'DPP konnte nicht geladen werden.'
    } finally {
        loading.value = false
    }
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(() => {
    void loadDpp()
})

watch(selectedAas, () => {
    void loadDpp()
})
</script>

<style scoped>
.dpp-detail-container {
    max-width: 1200px;
    margin: 0 auto;
}

.hero-card {
    border-radius: 12px;
}

.back-btn {
    color: rgb(var(--v-theme-primary)) !important;
    font-weight: 500;
}

/* ── Typography ─────────────────────────────────────────────────────────────── */
.dpp-title {
    color: rgb(var(--v-theme-titleText));
}

.section-title {
    color: rgb(var(--v-theme-titleText));
    border-bottom: 2px solid rgb(var(--v-theme-primary));
    padding-bottom: 8px;
}

.meta-label {
    color: rgb(var(--v-theme-primary));
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    margin-bottom: 4px;
    text-transform: uppercase;
}

.meta-value {
    color: rgb(var(--v-theme-titleText));
    font-weight: 500;
}

/* ── Sidebar ────────────────────────────────────────────────────────────────── */
.sidebar-card {
    background-color: rgb(var(--v-theme-card));
    border-radius: 12px;
    position: sticky;
    top: 16px;
}
</style>