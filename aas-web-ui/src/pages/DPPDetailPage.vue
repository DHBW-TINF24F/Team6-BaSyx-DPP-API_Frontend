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
                <v-btn variant="text" color="primary" class="mt-4" prepend-icon="mdi-arrow-left" @click="goBack">
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
                        <h1 class="dpp-title text-h4 font-weight-bold mb-2">{{ nameFromState }}</h1>
                        <p class="dpp-description text-body-1 text-grey-darken-1 mb-0">DPP-ID: {{ decodeBase64(dpp.dppId) }}</p>
                    </div>
                    <div class="d-flex align-center ga-2">
                        <v-menu v-if="dppVersions.length > 1" :close-on-content-click="true" location="bottom end" max-height="360">
                            <template #activator="{ props: menuProps }">
                                <v-btn v-bind="menuProps" variant="tonal" color="primary" size="small" class="version-switcher-btn">
                                    <v-icon start size="16">mdi-swap-horizontal</v-icon>
                                    Version {{ currentVersionIndex + 1 }} / {{ dppVersions.length }}
                                    <v-icon end size="16">mdi-chevron-down</v-icon>
                                </v-btn>
                            </template>
                            <v-card class="version-menu-card" min-width="340" max-width="480">
                                <div class="version-menu-header pa-3 pb-2">
                                    <div class="d-flex align-center ga-2">
                                        <v-icon size="18" color="primary">mdi-history</v-icon>
                                        <span class="text-subtitle-2 font-weight-bold" style="color: rgb(var(--v-theme-primary))">
                                            DPP-Versionen ({{ dppVersions.length }})
                                        </span>
                                    </div>
                                </div>
                                <v-divider />
                                <v-list density="compact" class="version-list pa-1" nav>
                                    <v-list-item
                                        v-for="(version, vIdx) in dppVersions"
                                        :key="version.dppId"
                                        :active="version.dppId === dpp.dppId"
                                        :class="{ 'version-item--active': version.dppId === dpp.dppId }"
                                        class="version-item rounded-lg mb-1"
                                        @click="switchDpp(version.dppId)"
                                    >
                                        <template #prepend>
                                            <div class="version-index-badge mr-3" :class="{ 'version-index-badge--active': version.dppId === dpp.dppId }">
                                                {{ vIdx + 1 }}
                                            </div>
                                        </template>
                                        <v-list-item-title class="version-item-title text-break">{{ shortenDppId(version.dppId) }}</v-list-item-title>
                                        <v-list-item-subtitle class="version-item-sub">{{ decodeBase64(version.dppId) }}</v-list-item-subtitle>
                                        <template #append>
                                            <v-icon v-if="version.dppId === dpp.dppId" size="18" color="primary">mdi-check-circle</v-icon>
                                        </template>
                                    </v-list-item>
                                </v-list>
                            </v-card>
                        </v-menu>
                        <v-btn class="back-btn" variant="elevated" color="white" prepend-icon="mdi-arrow-left" size="small" elevation="3" @click="goBack">
                            Zurück
                        </v-btn>
                    </div>
                </div>

                <v-divider class="border-primary my-6" thickness="2" />

                <v-row dense>
                    <v-col cols="12" sm="6" md="3">
                        <div class="meta-label">Product ID</div>
                        <div class="meta-value text-break">{{ decodeBase64(dpp.productId) }}</div>
                    </v-col>
                    <v-col cols="12" sm="6" md="3">
                        <div class="meta-label">DPP ID</div>
                        <div class="meta-value text-break">{{ decodeBase64(dpp.dppId) }}</div>
                    </v-col>
                    <v-col cols="12" sm="6" md="3">
                        <div class="meta-label">Version</div>
                        <div class="meta-value text-break">{{ dpp.version || '-' }}</div>
                    </v-col>
                    <v-col cols="12" sm="6" md="3">
                        <div class="meta-label">Erstellt am</div>
                        <div class="meta-value text-break">{{ formatTimestamp(dpp.createdAt) }}</div>
                    </v-col>
                </v-row>
            </v-card>

            <!-- Content Row -->
            <v-row class="mb-12">
                <!-- Main Section -->
                <v-col cols="12" md="8" class="pr-md-6">
                    <h1 class="dpp-title text-h4 font-weight-bold mb-4">Submodels</h1>
                    <p class="dpp-description text-body-1 text-grey-darken-1 mb-6">
                        Die Detailseite lädt die Informationen direkt aus dem DPP-Backend.
                        Klicke auf ein Submodel, um dessen Werte anzuzeigen.
                    </p>
                    <v-divider class="border-primary mb-6" thickness="2" />

                    <template v-if="dpp.submodels.length > 0">
                        <v-expansion-panels v-model="openPanels" multiple variant="accordion" class="submodel-panels">
                            <v-expansion-panel
                                v-for="submodel in dpp.submodels"
                                :key="`${submodel.reference}-${submodel.name}`"
                                :value="submodel.name"
                                class="submodel-panel"
                                elevation="0"
                            >
                                <v-expansion-panel-title class="submodel-panel-title px-4 py-3">
                                    <div class="d-flex align-center ga-3 flex-1">
                                        <v-avatar color="primary" variant="tonal" size="40">
                                            <v-icon :icon="submodelIcon(submodel.name, openPanels.includes(submodel.name))" />
                                        </v-avatar>
                                        <div class="min-w-0">
                                            <div class="font-weight-semibold submodel-name">{{ submodel.name || 'Unbenanntes Submodel' }}</div>
                                            <div class="text-caption text-grey text-truncate submodel-ref">{{ submodel.reference }}</div>
                                        </div>
                                    </div>
                                    <template #actions="{ expanded }">
                                        <div class="d-flex align-center ga-2">
                                            <v-chip size="small" variant="tonal" color="primary">{{ submodel.version || '-' }}</v-chip>
                                            <v-icon :icon="expanded ? 'mdi-chevron-up' : 'mdi-chevron-down'" color="primary" />
                                        </div>
                                    </template>
                                </v-expansion-panel-title>

                                <v-expansion-panel-text class="submodel-panel-content">
                                    <div v-if="getSubmodelEntries(submodel.name).length > 0">
                                        <!-- ── Specialized renderers ── -->
                                        <NamePlateView
                                            v-if="submodel.name === 'NamePlate'"
                                            :entries="getSubmodelEntries(submodel.name)"
                                        />
                                        <MaterialCompositionView
                                            v-else-if="submodel.name === 'MaterialComposition'"
                                            :entries="getSubmodelEntries(submodel.name)"
                                        />
                                        <HandoverDocumentationView
                                            v-else-if="submodel.name === 'HandoverDocumentation'"
                                            :entries="getSubmodelEntries(submodel.name)"
                                        />
                                        <CarbonFootPrintView
                                            v-else-if="submodel.name === 'CarbonFootPrint'"
                                            :entries="getSubmodelEntries(submodel.name)"
                                        />
                                        <CircularityView
                                            v-else-if="submodel.name === 'Circularity'"
                                            :entries="getSubmodelEntries(submodel.name)"
                                        />
                                        <TechnicalDataView
                                            v-else-if="submodel.name === 'TechnicalData'"
                                            :entries="getSubmodelEntries(submodel.name)"
                                        />
                                        <ProductConditionView
                                            v-else-if="submodel.name === 'ProductCondition'"
                                            :entries="getSubmodelEntries(submodel.name)"
                                        />
                                        <!-- ── Generic fallback ── -->
                                        <div v-else class="values-container">
                                            <ValueTree :entries="getSubmodelEntries(submodel.name)" />
                                        </div>
                                    </div>
                                    <v-alert v-else type="info" variant="tonal" density="compact" class="mt-1 mb-2">
                                        Keine Values für dieses Submodel verfügbar.
                                    </v-alert>
                                </v-expansion-panel-text>
                            </v-expansion-panel>
                        </v-expansion-panels>
                    </template>

                    <v-alert v-else type="info" variant="tonal" class="mt-2">
                        Für dieses DPP sind keine Submodels hinterlegt.
                    </v-alert>
                </v-col>

                <!-- Sidebar -->
                <v-col cols="12" md="4">
                    <v-card class="sidebar-card pa-6" elevation="2">
                        <h2 class="section-title text-h5 font-weight-bold mb-4">Submodels</h2>
                        <div class="d-flex flex-column ga-2">
                            <div
                                v-for="submodel in dpp.submodels"
                                :key="submodel.name"
                                class="sidebar-submodel-chip"
                                :class="{ 'sidebar-submodel-chip--active': openPanels.includes(submodel.name) }"
                                @click="togglePanel(submodel.name)"
                            >
                                <v-icon size="14" :color="openPanels.includes(submodel.name) ? 'primary' : 'grey'" class="mr-2">
                                    {{ submodelIcon(submodel.name, openPanels.includes(submodel.name)) }}
                                </v-icon>
                                <span>{{ submodel.name }}</span>
                            </div>
                        </div>
                    </v-card>
                </v-col>
            </v-row>
        </template>
    </v-container>
</template>

<script lang="ts" setup>
import { computed, defineComponent, h, onMounted, ref, watch, type PropType, type VNode } from 'vue'
import { useRouter } from 'vue-router'
import { useAASStore } from '@/store/AASDataStore'

// ─── Types ────────────────────────────────────────────────────────────────────
interface SubmodelEntry {
    idShort?: string
    value?: unknown
    modelType?: string
    valueType?: string
    contentType?: string
    children?: SubmodelEntry[]
    [key: string]: unknown
}

interface Dpp {
    dppId: string
    productId: string
    createdAt: string
    version: string
    submodels: Array<{ reference: string; version: string; name: string }>
}

interface DppApiResponse {
    status?: string
    dpp?: Dpp
    submodels_values?: Record<string, unknown[]>
    message?: Array<{ messageType?: string; text?: string; code?: string; correlationId?: string; timestamp?: string }>
    statusCode?: string
    payload?: { dpp?: Dpp; submodels_values?: Record<string, unknown[]> }
    result?: { message?: Array<{ text?: string }> }
}

interface DppVersionEntry { dppId: string }
interface DppVersionsResponse { status?: string; results?: Record<string, DppVersionEntry[]> }

// ─── Store & Router ───────────────────────────────────────────────────────────
const aasStore = useAASStore()
const router   = useRouter()

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

// ─── Base64 helpers ───────────────────────────────────────────────────────────
function encodeBase64(value: string): string {
    try { return btoa(value).replace(/=/g, '') } catch { return value }
}

function decodeBase64(encoded: string | undefined | null): string {
    if (!encoded) return '-'
    try {
        let padded = encoded
        const remainder = padded.length % 4
        if (remainder === 2) padded += '=='
        else if (remainder === 3) padded += '='
        return decodeURIComponent(
            atob(padded).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
        )
    } catch { return encoded }
}

function shortenDppId(encoded: string): string {
    const decoded = decodeBase64(encoded)
    if (decoded === encoded) return encoded
    const parts = decoded.replace(/\/+$/, '').split('/')
    return parts[parts.length - 1] || decoded
}

function formatTimestamp(ts: string | number | undefined | null): string {
    if (!ts) return '-'
    const n = typeof ts === 'string' ? Number(ts) : ts
    if (isNaN(n as number)) return String(ts)
    try { return new Date(n).toLocaleString('de-DE') } catch { return String(ts) }
}

// ─── Submodel icons ───────────────────────────────────────────────────────────
function submodelIcon(name: string, open: boolean): string {
    const icons: Record<string, string> = {
        NamePlate:               open ? 'mdi-id-card' : 'mdi-id-card-outline',
        MaterialComposition:     open ? 'mdi-atom' : 'mdi-atom-variant',
        HandoverDocumentation:   open ? 'mdi-file-document' : 'mdi-file-document-outline',
        CarbonFootPrint:         open ? 'mdi-leaf' : 'mdi-leaf-circle-outline',
        Circularity:             open ? 'mdi-recycle' : 'mdi-recycle',
        TechnicalData:           open ? 'mdi-chip' : 'mdi-chip',
        ProductCondition:        open ? 'mdi-heart-pulse' : 'mdi-heart-outline',
    }
    return icons[name] ?? (open ? 'mdi-cube' : 'mdi-cube-outline')
}

// ─── State ────────────────────────────────────────────────────────────────────
const dpp              = ref<Dpp | null>(null)
const loading          = ref(true)
const errorMessage     = ref('')
const submodelsValues  = ref<Record<string, SubmodelEntry[]> | null>(null)
const openPanels       = ref<string[]>([])
const dppVersions      = ref<DppVersionEntry[]>([])

const currentVersionIndex = computed(() => {
    if (!dpp.value || dppVersions.value.length === 0) return 0
    const idx = dppVersions.value.findIndex((v: DppVersionEntry) => v.dppId === dpp.value!.dppId)
    return idx >= 0 ? idx : 0
})

function togglePanel(name: string) {
    const idx = openPanels.value.indexOf(name)
    if (idx >= 0) openPanels.value.splice(idx, 1)
    else openPanels.value.push(name)
}

// ─── Normalisation helpers ────────────────────────────────────────────────────
function tryParseJsonIfString(v: unknown): unknown {
    if (typeof v !== 'string') return v
    const s = v.trim()
    if ((s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']'))) {
        try { return JSON.parse(s) } catch { return v }
    }
    return v
}

function normalizeEntries(raw: unknown, fallbackId?: string): SubmodelEntry[] {
    const res: SubmodelEntry[] = []
    const r = tryParseJsonIfString(raw)

    if (Array.isArray(r)) {
        for (let i = 0; i < r.length; i++) {
            const item = r[i]
            if (!item) continue
            if (typeof item !== 'object') { res.push({ idShort: `${fallbackId ?? 'item'}_${i}`, value: item }); continue }
            const obj = item as Record<string, unknown>
            if (obj.idShort || obj.modelType || 'value' in obj) {
                const entry: SubmodelEntry = {
                    idShort: (obj.idShort as string) || (obj.id as string) || `${fallbackId ?? 'item'}_${i}`,
                    modelType: obj.modelType as string | undefined,
                    value: 'value' in obj ? tryParseJsonIfString(obj.value) : undefined,
                    valueType: obj.valueType as string | undefined,
                    contentType: obj.contentType as string | undefined,
                    ...obj,
                }
                if (entry.value && typeof entry.value === 'object') entry.value = normalizeEntries(entry.value, entry.idShort)
                res.push(entry); continue
            }
            const children = normalizeEntries(obj, `${fallbackId ?? 'obj'}_child`)
            res.push({ idShort: obj.idShort as string || obj.id as string || `${fallbackId ?? 'obj'}_${i}`, value: children })
        }
        return res
    }

    if (r && typeof r === 'object') {
        const obj = r as Record<string, unknown>
        if ('idShort' in obj || 'value' in obj || 'modelType' in obj) {
            const entry: SubmodelEntry = {
                idShort: (obj.idShort as string) || fallbackId,
                modelType: obj.modelType as string | undefined,
                value: 'value' in obj ? tryParseJsonIfString(obj.value) : undefined,
                valueType: obj.valueType as string | undefined,
                contentType: obj.contentType as string | undefined,
                ...obj,
            }
            if (entry.value && typeof entry.value === 'object') entry.value = normalizeEntries(entry.value, entry.idShort)
            return [entry]
        }
        for (const k of Object.keys(obj)) {
            const children = normalizeEntries(obj[k], k)
            if (children.length === 1 && typeof children[0].value !== 'object' && !Array.isArray(children[0].value))
                res.push({ idShort: k, value: children[0].value })
            else res.push({ idShort: k, value: children })
        }
        return res
    }

    return [{ idShort: fallbackId || 'value', value: r }]
}

function normalizeSubmodelsValues(raw?: Record<string, unknown> | null): Record<string, SubmodelEntry[]> | null {
    if (!raw) return null
    const out: Record<string, SubmodelEntry[]> = {}
    for (const key of Object.keys(raw)) out[key] = normalizeEntries((raw as any)[key], key)
    return out
}

function getSubmodelEntries(name: string): SubmodelEntry[] {
    if (!submodelsValues.value) return []
    if (submodelsValues.value[name]) return submodelsValues.value[name]
    const lc = name.toLowerCase()
    const found = Object.keys(submodelsValues.value).find(k => k.toLowerCase() === lc)
    return found ? submodelsValues.value[found] : []
}

// ─── Entry lookup helpers (used in specialized views) ─────────────────────────
function findByIdShort(entries: SubmodelEntry[], id: string): SubmodelEntry | undefined {
    for (const e of entries) {
        if (e.idShort === id) return e
        if (Array.isArray(e.value)) {
            const found = findByIdShort(e.value as SubmodelEntry[], id)
            if (found) return found
        }
    }
    return undefined
}

function flatVal(entries: SubmodelEntry[], id: string): string {
    const e = findByIdShort(entries, id)
    if (!e) return '-'
    const v = e.value
    if (v === null || v === undefined) return '-'
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v)
    return '-'
}

function childEntries(entry: SubmodelEntry | undefined): SubmodelEntry[] {
    if (!entry) return []
    if (Array.isArray(entry.value)) return entry.value as SubmodelEntry[]
    return []
}

// ─── Generic Value Tree (fallback) ───────────────────────────────────────────
function getEntryLabel(entry: SubmodelEntry, index?: number): string {
    const base = String(entry.idShort || entry.modelType || 'Eintrag')
    const cleaned = base
        .replace(/SubmodelElementCollection$/i, '')
        .replace(/SubmodelElementList$/i, '')
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/_/g, ' ')
        .trim()
    return cleaned || base || `Eintrag_${index ?? 0}`
}

function isLikelyLink(value: string): boolean {
    return value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/')
}

function getEntryDisplayValue(entry: SubmodelEntry): string {
    const v = entry.value
    if (v === null || v === undefined) return '-'
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v)
    try { return JSON.stringify(v) } catch { return String(v) }
}

function getChildEntries(entry: SubmodelEntry): SubmodelEntry[] {
    if (Array.isArray(entry.children)) return entry.children
    if (Array.isArray(entry.value)) return entry.value as SubmodelEntry[]
    if (entry.value && typeof entry.value === 'object') return normalizeEntries(entry.value, entry.idShort)
    return []
}

function modelTypeIcon(mt?: string): string {
    const lc = String(mt ?? '').toLowerCase()
    if (lc.includes('file'))       return 'mdi-file-outline'
    if (lc.includes('collection')) return 'mdi-folder-outline'
    if (lc.includes('list'))       return 'mdi-format-list-bulleted'
    if (lc.includes('property'))   return 'mdi-tag-outline'
    return 'mdi-circle-small'
}

function renderLeaf(entry: SubmodelEntry, index: number, isLast: boolean): VNode {
    const label = getEntryLabel(entry, index)
    const raw   = getEntryDisplayValue(entry)
    const link  = isLikelyLink(raw)
    const valueEl = link
        ? h('a', { href: raw, target: raw.startsWith('http') ? '_blank' : undefined, rel: raw.startsWith('http') ? 'noopener noreferrer' : undefined, class: 'vt-link' }, raw)
        : h('span', {}, raw)
    return h('div', { class: ['vt-prop', isLast && 'vt-prop--last'] }, [
        h('div', { class: 'vt-prop-bar' }),
        h('i',   { class: `mdi ${modelTypeIcon(entry.modelType)} vt-prop-icon` }),
        h('div', { class: 'vt-prop-key' }, label),
        h('div', { class: 'vt-prop-val' }, [valueEl]),
    ])
}

function renderCollection(entry: SubmodelEntry, index: number, depth: number, isLast: boolean): VNode {
    const label    = getEntryLabel(entry, index)
    const children = getChildEntries(entry)
    return h('div', { class: ['vt-group', isLast && 'vt-group--last'] }, [
        h('div', { class: 'vt-group-head' }, [
            h('i', { class: `mdi ${modelTypeIcon(entry.modelType)} vt-group-icon` }),
            h('span', { class: 'vt-group-label' }, label),
            h('span', { class: 'vt-group-count' }, String(children.length)),
        ]),
        h('div', { class: 'vt-group-body' }, renderEntries(children, depth + 1)),
    ])
}

function renderEntries(entries: SubmodelEntry[], depth: number): VNode[] {
    return entries.map((entry, idx) => {
        const isLast   = idx === entries.length - 1
        const children = getChildEntries(entry)
        return children.length > 0
            ? renderCollection(entry, idx, depth, isLast)
            : renderLeaf(entry, idx, isLast)
    })
}

const ValueTree = defineComponent({
    name: 'ValueTree',
    props: {
        entries: { type: Array as PropType<SubmodelEntry[]>, required: true },
    },
    setup(props: Readonly<{ entries: SubmodelEntry[] }>) {
        return () => h('div', { class: 'vt-root' }, renderEntries(props.entries, 0))
    },
})

// ═══════════════════════════════════════════════════════════════════════════════
// ── Specialized Submodel Components ──────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// ─── 1. NamePlate ─────────────────────────────────────────────────────────────
const NamePlateView = defineComponent({
    name: 'NamePlateView',
    props: { entries: { type: Array as PropType<SubmodelEntry[]>, required: true } },
    setup(props) {
        return () => {
            const e = props.entries
            const contact = childEntries(findByIdShort(e, 'ContactInformation'))
            const markings = childEntries(findByIdShort(e, 'Markings'))

            // Main info rows
            const infoRows = [
                { label: 'Hersteller',       icon: 'mdi-factory',        val: flatVal(e, 'ManufacturerName') },
                { label: 'Produktbezeichnung', icon: 'mdi-tag',           val: flatVal(e, 'ManufacturerProductDesignation') },
                { label: 'Produktfamilie',   icon: 'mdi-layers-triple',   val: flatVal(e, 'ManufacturerProductFamily') },
                { label: 'Seriennummer',     icon: 'mdi-barcode',         val: flatVal(e, 'SerialNumber') },
                { label: 'Baujahr',          icon: 'mdi-calendar',        val: flatVal(e, 'YearOfConstruction') },
            ]

            return h('div', { class: 'np-root' }, [
                // Header band
                h('div', { class: 'np-header' }, [
                    h('div', { class: 'np-header-icon' }, [
                        h('i', { class: 'mdi mdi-id-card np-hicon' })
                    ]),
                    h('div', {}, [
                        h('div', { class: 'np-header-title' }, flatVal(e, 'ManufacturerName')),
                        h('div', { class: 'np-header-sub' }, flatVal(e, 'ManufacturerProductDesignation')),
                    ])
                ]),

                // Info grid
                h('div', { class: 'np-grid' },
                    infoRows.map(row =>
                        h('div', { class: 'np-card' }, [
                            h('i', { class: `mdi ${row.icon} np-card-icon` }),
                            h('div', { class: 'np-card-label' }, row.label),
                            h('div', { class: 'np-card-val' }, row.val),
                        ])
                    )
                ),

                // Contact block
                contact.length > 0 ? h('div', { class: 'np-section' }, [
                    h('div', { class: 'np-section-title' }, [
                        h('i', { class: 'mdi mdi-map-marker np-section-icon' }),
                        'Kontaktadresse',
                    ]),
                    h('div', { class: 'np-address' }, [
                        h('div', {}, flatVal(contact, 'Street')),
                        h('div', {}, `${flatVal(contact, 'ZipCode')} ${flatVal(contact, 'City')}`),
                        h('div', {}, flatVal(contact, 'Country')),
                    ])
                ]) : null,

                // Markings
                markings.length > 0 ? h('div', { class: 'np-section' }, [
                    h('div', { class: 'np-section-title' }, [
                        h('i', { class: 'mdi mdi-certificate np-section-icon' }),
                        'Kennzeichnungen',
                    ]),
                    h('div', { class: 'np-markings' },
                        markings.map(m => {
                            const mChildren = childEntries(m)
                            const name = flatVal(mChildren, 'MarkingName')
                            const fileEntry = findByIdShort(mChildren, 'MarkingFile')
                            const fileSrc = fileEntry ? String(fileEntry.value ?? '') : ''
                            return h('div', { class: 'np-marking-chip' }, [
                                fileSrc && fileSrc !== '-'
                                    ? h('img', { src: fileSrc, class: 'np-marking-img', alt: name, onError: (ev: Event) => { (ev.target as HTMLImageElement).style.display = 'none' } })
                                    : h('i', { class: 'mdi mdi-certificate-outline np-marking-fallback-icon' }),
                                h('span', { class: 'np-marking-name' }, name),
                            ])
                        })
                    )
                ]) : null,
            ])
        }
    },
})

// ─── 2. MaterialComposition ───────────────────────────────────────────────────
const MaterialCompositionView = defineComponent({
    name: 'MaterialCompositionView',
    props: { entries: { type: Array as PropType<SubmodelEntry[]>, required: true } },
    setup(props) {
        const COLORS = ['#2196F3','#4CAF50','#FF9800','#E91E63','#9C27B0','#00BCD4','#FF5722','#8BC34A']

        function buildPieSlices(substances: Array<{ name: string; pct: number; weight: string }>): string {
            const total = substances.reduce((s, x) => s + x.pct, 0) || 100
            let angle = -Math.PI / 2
            const R = 80; const cx = 100; const cy = 100
            return substances.map((s, i) => {
                const sweep = (s.pct / total) * 2 * Math.PI
                const x1 = cx + R * Math.cos(angle)
                const y1 = cy + R * Math.sin(angle)
                angle += sweep
                const x2 = cx + R * Math.cos(angle)
                const y2 = cy + R * Math.sin(angle)
                const large = sweep > Math.PI ? 1 : 0
                return `<path d="M${cx},${cy} L${x1},${y1} A${R},${R} 0 ${large},1 ${x2},${y2} Z" fill="${COLORS[i % COLORS.length]}" opacity="0.9"/>`
            }).join('')
        }

        return () => {
            const e = props.entries
            const compRoot = findByIdShort(e, 'MaterialComposition')
            const compChildren = childEntries(compRoot)

            const chemistry = flatVal(compChildren.length ? compChildren : e, 'BatteryChemistry')
            const critRaw   = childEntries(findByIdShort(compChildren.length ? compChildren : e, 'CriticalRawMaterials'))
            const substList = childEntries(findByIdShort(compChildren.length ? compChildren : e, 'SubstancesList'))

            const substances = substList.map(s => {
                const sc = childEntries(s)
                return {
                    name:   flatVal(sc, 'SubstanceName'),
                    pct:    parseFloat(flatVal(sc, 'SubstancePercentage')) || 0,
                    weight: flatVal(sc, 'SubstanceWeight'),
                    cas:    flatVal(sc, 'SubstanceCASNumber'),
                }
            })

            const total = substances.reduce((s, x) => s + x.pct, 0)
            const rest  = total < 100 ? [{ name: 'Sonstige', pct: 100 - total, weight: '-', cas: '-' }] : []
            const allSlices = [...substances, ...rest]

            const pieSvg = buildPieSlices(allSlices)

            return h('div', { class: 'mc-root' }, [
                // Chemistry badge
                chemistry !== '-' ? h('div', { class: 'mc-chem-badge' }, [
                    h('i', { class: 'mdi mdi-flask-outline mc-chem-icon' }),
                    h('span', {}, chemistry),
                ]) : null,

                h('div', { class: 'mc-layout' }, [
                    // Pie chart
                    h('div', { class: 'mc-chart-wrap' }, [
                        h('div', { class: 'mc-chart-title' }, 'Zusammensetzung'),
                        h('div', { innerHTML: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="mc-pie">${pieSvg}</svg>`, class: 'mc-pie-container' }),
                        h('div', { class: 'mc-legend' },
                            allSlices.map((s, i) =>
                                h('div', { class: 'mc-legend-item' }, [
                                    h('span', { class: 'mc-legend-dot', style: `background:${COLORS[i % COLORS.length]}` }),
                                    h('span', { class: 'mc-legend-label' }, `${s.name} (${s.pct.toFixed(1)}%)`),
                                ])
                            )
                        ),
                    ]),

                    // Substances table
                    h('div', { class: 'mc-table-wrap' }, [
                        h('div', { class: 'mc-chart-title' }, 'Substanzen'),
                        h('table', { class: 'mc-table' }, [
                            h('thead', {}, h('tr', {}, [
                                h('th', {}, 'Substanz'), h('th', {}, 'Gew. (g)'), h('th', {}, 'Anteil'), h('th', {}, 'CAS-Nr.')
                            ])),
                            h('tbody', {},
                                substances.map((s, i) =>
                                    h('tr', {}, [
                                        h('td', {}, [
                                            h('span', { class: 'mc-dot', style: `background:${COLORS[i % COLORS.length]}` }),
                                            s.name
                                        ]),
                                        h('td', {}, s.weight),
                                        h('td', {}, [
                                            h('div', { class: 'mc-bar-wrap' }, [
                                                h('div', { class: 'mc-bar-fill', style: `width:${Math.min(s.pct, 100)}%;background:${COLORS[i % COLORS.length]}` }),
                                            ]),
                                            h('span', { class: 'mc-pct-label' }, `${s.pct}%`)
                                        ]),
                                        h('td', { class: 'mc-cas' }, s.cas),
                                    ])
                                )
                            )
                        ]),

                        // Critical raw materials
                        critRaw.length > 0 ? h('div', { class: 'mc-crm-section' }, [
                            h('div', { class: 'mc-crm-title' }, [
                                h('i', { class: 'mdi mdi-alert-circle-outline mc-crm-icon' }),
                                'Kritische Rohstoffe (%)',
                            ]),
                            h('div', { class: 'mc-crm-grid' },
                                critRaw.map(cr => {
                                    const val = parseFloat(String(cr.value ?? '0')) || 0
                                    return h('div', { class: 'mc-crm-item' }, [
                                        h('div', { class: 'mc-crm-name' }, cr.idShort ?? '-'),
                                        h('div', { class: 'mc-crm-bar-outer' }, [
                                            h('div', { class: 'mc-crm-bar-inner', style: `width:${Math.min(val * 4, 100)}%` })
                                        ]),
                                        h('div', { class: 'mc-crm-val', class2: val === 0 ? 'mc-crm-zero' : '' }, `${val}%`),
                                    ])
                                })
                            )
                        ]) : null,
                    ]),
                ]),
            ])
        }
    },
})

// ─── 3. HandoverDocumentation ─────────────────────────────────────────────────
const HandoverDocumentationView = defineComponent({
    name: 'HandoverDocumentationView',
    props: { entries: { type: Array as PropType<SubmodelEntry[]>, required: true } },
    setup(props) {
        const docCategories: Array<{ key: string; label: string; icon: string; color: string }> = [
            { key: 'AssemblyInstructions',   label: 'Montageanleitung',   icon: 'mdi-wrench',          color: '#1976D2' },
            { key: 'OperatingInstructions',  label: 'Bedienungsanleitung',icon: 'mdi-book-open-variant',color: '#388E3C' },
            { key: 'MaintenanceInstructions',label: 'Wartungshandbuch',   icon: 'mdi-tools',           color: '#F57C00' },
            { key: 'SafetyInstructions',     label: 'Sicherheitshinweise',icon: 'mdi-shield-alert',    color: '#D32F2F' },
        ]

        function getFileLinks(entries: SubmodelEntry[], categoryKey: string): string[] {
            const cat = findByIdShort(entries, categoryKey)
            if (!cat) return []
            const links: string[] = []
            function walk(e: SubmodelEntry[]) {
                for (const x of e) {
                    if (x.modelType === 'File' && x.value) links.push(String(x.value))
                    if (Array.isArray(x.value)) walk(x.value as SubmodelEntry[])
                }
            }
            walk(childEntries(cat))
            return links
        }

        return () => {
            const e = props.entries
            const docRoot = findByIdShort(e, 'HandoverDocumentation')
            const docChildren = childEntries(docRoot)

            const metaRows = [
                { label: 'Hersteller', icon: 'mdi-factory',   val: flatVal(e, 'Manufacturer') },
                { label: 'Kunde',      icon: 'mdi-account',   val: flatVal(e, 'Customer') },
                { label: 'Kontakt',    icon: 'mdi-email',      val: flatVal(e, 'ContactInformation') },
                { label: 'Bestellung', icon: 'mdi-receipt',   val: flatVal(e, 'OrderReference') },
                { label: 'Produkt',    icon: 'mdi-information',val: flatVal(e, 'ProductInformation') },
            ]

            return h('div', { class: 'hd-root' }, [
                // Meta info bar
                h('div', { class: 'hd-meta-grid' },
                    metaRows.filter(r => r.val !== '-').map(r =>
                        h('div', { class: 'hd-meta-item' }, [
                            h('i', { class: `mdi ${r.icon} hd-meta-icon` }),
                            h('div', {}, [
                                h('div', { class: 'hd-meta-label' }, r.label),
                                h('div', { class: 'hd-meta-val' }, r.val),
                            ])
                        ])
                    )
                ),

                // Document cards
                h('div', { class: 'hd-docs-title' }, [
                    h('i', { class: 'mdi mdi-folder-open hd-docs-title-icon' }),
                    'Dokumente',
                ]),
                h('div', { class: 'hd-docs-grid' },
                    docCategories.map(cat => {
                        const links = getFileLinks(docChildren, cat.key)
                        return h('div', { class: 'hd-doc-card', style: `--cat-color:${cat.color}` }, [
                            h('div', { class: 'hd-doc-card-head' }, [
                                h('i', { class: `mdi ${cat.icon} hd-doc-card-icon` }),
                                h('span', { class: 'hd-doc-card-label' }, cat.label),
                            ]),
                            links.length > 0
                                ? h('div', { class: 'hd-doc-links' },
                                    links.map(link =>
                                        h('a', {
                                            href: link,
                                            target: link.startsWith('http') ? '_blank' : undefined,
                                            rel: 'noopener noreferrer',
                                            class: 'hd-doc-link'
                                        }, [
                                            h('i', { class: 'mdi mdi-file-pdf-box hd-doc-link-icon' }),
                                            link.split('/').pop() || link
                                        ])
                                    )
                                )
                                : h('div', { class: 'hd-doc-empty' }, 'Kein Dokument verfügbar'),
                        ])
                    })
                ),
            ])
        }
    },
})

// ─── 4. CarbonFootPrint ───────────────────────────────────────────────────────
const CarbonFootPrintView = defineComponent({
    name: 'CarbonFootPrintView',
    props: { entries: { type: Array as PropType<SubmodelEntry[]>, required: true } },
    setup(props) {
        const stageConfig = [
            { key: 'PreExtractionAndProcessingCO2Equivalent', label: 'Rohstoffgewinnung',  color: '#5C6BC0', icon: 'mdi-pickaxe' },
            { key: 'MainProductionCO2Equivalent',              label: 'Produktion',          color: '#EF5350', icon: 'mdi-factory' },
            { key: 'BatteryDistributionCO2Equivalent',         label: 'Distribution',        color: '#FFA726', icon: 'mdi-truck' },
            { key: 'EndOfLifeAndRecyclingCO2Equivalent',       label: 'End of Life',         color: '#26A69A', icon: 'mdi-recycle' },
        ]

        return () => {
            const e = props.entries
            const pfRoot = findByIdShort(e, 'ProductCarbonFootprint')
            const pf = childEntries(pfRoot)

            const totalRaw = parseFloat(flatVal(pf, 'TotalCO2Equivalent')) || 0
            const unit     = flatVal(pf, 'DeclaringUnit')
            const phase    = flatVal(pf, 'CarbonFootprintLifeCycleStages')
            const ref      = flatVal(pf, 'CarbonFootprintTotalReference')

            const stages = stageConfig.map(s => ({
                ...s,
                val: parseFloat(flatVal(pf, s.key)) || 0,
            }))

            const stagesTotal = stages.reduce((sum, s) => sum + s.val, 0) || 1
            const maxVal = Math.max(...stages.map(s => s.val), 1)

            // Donut chart SVG
            const R = 70; const cx = 90; const cy = 90; const strokeW = 28
            const circ = 2 * Math.PI * R
            let offset = 0
            const donutSegments = stages.map(s => {
                const frac = s.val / stagesTotal
                const dash = frac * circ
                const seg = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${s.color}" stroke-width="${strokeW}" stroke-dasharray="${dash} ${circ - dash}" stroke-dashoffset="${-offset}" transform="rotate(-90 ${cx} ${cy})" opacity="0.92"/>`
                offset += dash
                return seg
            })

            const donutSvg = `<svg viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg" class="cf-donut">
                <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="rgba(0,0,0,0.06)" stroke-width="${strokeW}"/>
                ${donutSegments.join('')}
                <text x="${cx}" y="${cy - 8}" text-anchor="middle" font-size="18" font-weight="700" fill="currentColor">${totalRaw}</text>
                <text x="${cx}" y="${cy + 10}" text-anchor="middle" font-size="7" fill="currentColor" opacity="0.6">${unit}</text>
            </svg>`

            return h('div', { class: 'cf-root' }, [
                // Top summary strip
                h('div', { class: 'cf-summary' }, [
                    h('div', { class: 'cf-total-block' }, [
                        h('div', { class: 'cf-total-label' }, 'Gesamt CO₂-Äquivalent'),
                        h('div', { class: 'cf-total-val' }, `${totalRaw} ${unit}`),
                        h('div', { class: 'cf-phase-badge' }, phase),
                    ]),
                    ref !== '-' ? h('a', { href: ref, target: '_blank', rel: 'noopener noreferrer', class: 'cf-ref-link' }, [
                        h('i', { class: 'mdi mdi-open-in-new' }), ' Referenzdokument',
                    ]) : null,
                ]),

                h('div', { class: 'cf-layout' }, [
                    // Donut
                    h('div', { class: 'cf-donut-wrap' }, [
                        h('div', { class: 'cf-chart-title' }, 'Lebenszyklus-Verteilung'),
                        h('div', { innerHTML: donutSvg, class: 'cf-donut-container' }),
                    ]),

                    // Horizontal bar chart
                    h('div', { class: 'cf-bars-wrap' }, [
                        h('div', { class: 'cf-chart-title' }, 'Phasen im Detail'),
                        h('div', { class: 'cf-bars' },
                            stages.map(s =>
                                h('div', { class: 'cf-bar-row' }, [
                                    h('div', { class: 'cf-bar-label' }, [
                                        h('i', { class: `mdi ${s.icon} cf-bar-icon`, style: `color:${s.color}` }),
                                        s.label,
                                    ]),
                                    h('div', { class: 'cf-bar-track' }, [
                                        h('div', { class: 'cf-bar-fill', style: `width:${(s.val / maxVal) * 100}%;background:${s.color}` }),
                                    ]),
                                    h('div', { class: 'cf-bar-val' }, `${s.val}`),
                                    h('div', { class: 'cf-bar-pct' }, `${((s.val / stagesTotal) * 100).toFixed(1)}%`),
                                ])
                            )
                        ),
                    ]),
                ]),
            ])
        }
    },
})

// ─── 5. Circularity ──────────────────────────────────────────────────────────
const CircularityView = defineComponent({
    name: 'CircularityView',
    props: { entries: { type: Array as PropType<SubmodelEntry[]>, required: true } },
    setup(props) {
        function arcPath(pct: number, r: number, cx: number, cy: number): string {
            const clamp = Math.min(Math.max(pct, 0), 99.99)
            const angle = (clamp / 100) * 2 * Math.PI - Math.PI / 2
            const x = cx + r * Math.cos(angle)
            const y = cy + r * Math.sin(angle)
            const large = clamp > 50 ? 1 : 0
            return `M${cx},${cy - r} A${r},${r} 0 ${large},1 ${x},${y}`
        }

        return () => {
            const e = props.entries
            const cirRoot = findByIdShort(e, 'Circularity')
            const cir = childEntries(cirRoot)

            const recyclePct = parseFloat(flatVal(childEntries(findByIdShort(cir, 'Recyclability')), 'RecyclabilityRate')) || 0

            const recycledContentList = childEntries(
                findByIdShort(childEntries(findByIdShort(cir, 'RecycledContent')), 'RecycledContentList')
            )

            const dismantlingFiles: string[] = []
            const dismStep = findByIdShort(childEntries(findByIdShort(cir, 'Dismantling')), 'DismantlingStep')
            if (dismStep) {
                function walkFiles(en: SubmodelEntry[]) {
                    for (const x of en) {
                        if (x.modelType === 'File' && x.value) dismantlingFiles.push(String(x.value))
                        if (Array.isArray(x.value)) walkFiles(x.value as SubmodelEntry[])
                    }
                }
                walkFiles(childEntries(dismStep))
            }

            const gaugeR = 60; const gcx = 80; const gcy = 80
            const bg = `M${gcx},${gcy - gaugeR} A${gaugeR},${gaugeR} 0 1,1 ${gcx - 0.001},${gcy - gaugeR}`
            const fg = arcPath(recyclePct, gaugeR, gcx, gcy)

            const gaugeSvg = `<svg viewBox="0 0 160 140" xmlns="http://www.w3.org/2000/svg" class="circ-gauge-svg">
                <path d="${bg}" fill="none" stroke="rgba(0,0,0,0.08)" stroke-width="14" stroke-linecap="round"/>
                <path d="${fg}" fill="none" stroke="#4CAF50" stroke-width="14" stroke-linecap="round"/>
                <text x="${gcx}" y="${gcy + 6}" text-anchor="middle" font-size="22" font-weight="800" fill="#4CAF50">${recyclePct}%</text>
                <text x="${gcx}" y="${gcy + 24}" text-anchor="middle" font-size="8" fill="currentColor" opacity="0.55">Recyclingfähigkeit</text>
            </svg>`

            return h('div', { class: 'circ-root' }, [
                h('div', { class: 'circ-layout' }, [
                    // Gauge
                    h('div', { class: 'circ-gauge-wrap' }, [
                        h('div', { class: 'circ-section-title' }, [h('i', { class: 'mdi mdi-recycle circ-title-icon' }), 'Recyclingrate']),
                        h('div', { innerHTML: gaugeSvg }),
                        h('div', { class: 'circ-gauge-label' }, recyclePct >= 90 ? '🟢 Excellent' : recyclePct >= 70 ? '🟡 Gut' : '🔴 Niedrig'),
                    ]),

                    h('div', { class: 'circ-right' }, [
                        // Recycled content
                        recycledContentList.length > 0 ? h('div', { class: 'circ-rc-section' }, [
                            h('div', { class: 'circ-section-title' }, [h('i', { class: 'mdi mdi-refresh circ-title-icon' }), 'Recycelter Materialanteil']),
                            h('div', { class: 'circ-rc-list' },
                                recycledContentList.map(item => {
                                    const ic = childEntries(item)
                                    const name = flatVal(ic, 'SubstanceName')
                                    const pct = parseFloat(flatVal(ic, 'RecycledContentPercentage')) || 0
                                    return h('div', { class: 'circ-rc-item' }, [
                                        h('div', { class: 'circ-rc-name' }, name),
                                        h('div', { class: 'circ-rc-bar-outer' }, [
                                            h('div', { class: 'circ-rc-bar-inner', style: `width:${Math.min(pct * 5, 100)}%` }),
                                        ]),
                                        h('div', { class: 'circ-rc-pct' }, `${pct}%`),
                                    ])
                                })
                            ),
                        ]) : null,

                        // Dismantling docs
                        dismantlingFiles.length > 0 ? h('div', { class: 'circ-dism-section' }, [
                            h('div', { class: 'circ-section-title' }, [h('i', { class: 'mdi mdi-hammer-screwdriver circ-title-icon' }), 'Demontageanleitung']),
                            h('div', { class: 'circ-dism-links' },
                                dismantlingFiles.map(f =>
                                    h('a', { href: f, class: 'circ-dism-link', target: f.startsWith('http') ? '_blank' : undefined }, [
                                        h('i', { class: 'mdi mdi-file-pdf-box' }), ' ', f.split('/').pop() || f
                                    ])
                                )
                            )
                        ]) : null,
                    ]),
                ]),
            ])
        }
    },
})

// ─── 6. TechnicalData ────────────────────────────────────────────────────────
const TechnicalDataView = defineComponent({
    name: 'TechnicalDataView',
    props: { entries: { type: Array as PropType<SubmodelEntry[]>, required: true } },
    setup(props) {
        const sectionMeta: Record<string, { label: string; icon: string; color: string }> = {
            CapacityEnergyVoltage:      { label: 'Kapazität & Spannung',     icon: 'mdi-lightning-bolt',    color: '#FFA726' },
            RoundTripEnergyEfficiency:  { label: 'Rundrip-Wirkungsgrad',     icon: 'mdi-rotate-right',      color: '#42A5F5' },
            Resistance:                 { label: 'Innenwiderstand',           icon: 'mdi-resistor',          color: '#EF5350' },
            PowerCapability:            { label: 'Leistung',                  icon: 'mdi-flash',             color: '#AB47BC' },
            Temperature:                { label: 'Temperaturbereich',         icon: 'mdi-thermometer',       color: '#26C6DA' },
            Lifetime:                   { label: 'Lebensdauer',               icon: 'mdi-calendar-clock',    color: '#66BB6A' },
        }

        function formatLabel(raw: string): string {
            return raw
                .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
                .replace(/_/g, ' ')
                .trim()
        }

        return () => {
            const e = props.entries
            const genInfo  = findByIdShort(e, 'GeneralInformation')
            const techProp = findByIdShort(e, 'TechnicalProperties')

            const genChildren  = childEntries(genInfo)
            const techChildren = childEntries(techProp)

            // General info key fields
            const genRows = [
                { label: 'Hersteller',       val: flatVal(genChildren, 'ManufacturerName') },
                { label: 'Produktname',      val: flatVal(genChildren, 'ManufacturerProductDesignation') },
                { label: 'Artikelnummer',    val: flatVal(genChildren, 'ManufacturerArticleNumber') },
                { label: 'Bestellcode',      val: flatVal(genChildren, 'ManufacturerOrderCode') },
                { label: 'Garantie',         val: flatVal(genChildren, 'WarrantyPeriod') },
                { label: 'Batterieklasse',   val: flatVal(genChildren, 'BatteryCategory') },
                { label: 'Masse (g)',        val: flatVal(genChildren, 'BatteryMass') },
            ]

            return h('div', { class: 'td-root' }, [
                // General info card
                h('div', { class: 'td-gen-card' }, [
                    h('div', { class: 'td-gen-header' }, [
                        h('i', { class: 'mdi mdi-information-outline td-gen-icon' }),
                        h('span', {}, 'Allgemeine Informationen'),
                    ]),
                    h('div', { class: 'td-gen-grid' },
                        genRows.filter(r => r.val !== '-').map(r =>
                            h('div', { class: 'td-gen-item' }, [
                                h('div', { class: 'td-gen-label' }, r.label),
                                h('div', { class: 'td-gen-val' }, r.val),
                            ])
                        )
                    ),
                ]),

                // Technical property sections
                h('div', { class: 'td-sections' },
                    techChildren.map(section => {
                        const meta = sectionMeta[section.idShort ?? ''] ?? { label: formatLabel(section.idShort ?? 'Eigenschaften'), icon: 'mdi-cog-outline', color: '#78909C' }
                        const rows = childEntries(section).filter(r => r.modelType === 'Property')
                        return h('div', { class: 'td-section', style: `--sec-color:${meta.color}` }, [
                            h('div', { class: 'td-sec-header' }, [
                                h('i', { class: `mdi ${meta.icon} td-sec-icon` }),
                                h('span', {}, meta.label),
                            ]),
                            h('div', { class: 'td-sec-grid' },
                                rows.map(r =>
                                    h('div', { class: 'td-sec-item' }, [
                                        h('div', { class: 'td-sec-label' }, formatLabel(r.idShort ?? '')),
                                        h('div', { class: 'td-sec-val' }, String(r.value ?? '-')),
                                    ])
                                )
                            ),
                        ])
                    })
                ),
            ])
        }
    },
})

// ─── 7. ProductCondition ─────────────────────────────────────────────────────
const ProductConditionView = defineComponent({
    name: 'ProductConditionView',
    props: { entries: { type: Array as PropType<SubmodelEntry[]>, required: true } },
    setup(props) {
        function gauge(pct: number, label: string, color: string, size = 100): string {
            const r = size * 0.36; const cx = size / 2; const cy = size / 2
            const circ = 2 * Math.PI * r
            const filled = (pct / 100) * circ
            return `<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" class="pc-gauge-svg">
                <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(0,0,0,0.08)" stroke-width="10"/>
                <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="10" stroke-dasharray="${filled} ${circ - filled}" stroke-linecap="round" transform="rotate(-90 ${cx} ${cy})"/>
                <text x="${cx}" y="${cy + 5}" text-anchor="middle" font-size="${size * 0.16}" font-weight="800" fill="${color}">${pct}%</text>
                <text x="${cx}" y="${cy + size * 0.22}" text-anchor="middle" font-size="${size * 0.09}" fill="currentColor" opacity="0.5">${label}</text>
            </svg>`
        }

        return () => {
            const e = props.entries
            const condRoot = findByIdShort(e, 'Condition')
            const cond = childEntries(condRoot)

            const sohRoot = findByIdShort(cond, 'StateOfHealth')
            const soh = childEntries(sohRoot)

            const sohPct    = parseFloat(flatVal(soh, 'StateOfHealthPercent'))    || 0
            const sohEnergy = parseFloat(flatVal(soh, 'StateOfHealthEnergy'))     || 0
            const sohPower  = parseFloat(flatVal(soh, 'StateOfHealthPower'))      || 0
            const socRaw    = parseFloat(flatVal(cond, 'StateOfCharge'))          || 0
            const socPct    = Math.round(socRaw * 100)
            const status    = flatVal(cond, 'Status')

            const opRoot = findByIdShort(e, 'Operation')
            const op = childEntries(opRoot)

            const tempRoot = findByIdShort(op, 'TemperatureHistory')
            const temp = childEntries(tempRoot)

            const opStats = [
                { label: 'Ladezyklen',       icon: 'mdi-battery-charging',   val: flatVal(op, 'CycleCount'),         unit: '' },
                { label: 'Gesamtentladung',  icon: 'mdi-battery-minus',       val: flatVal(op, 'TotalDischarge'),     unit: ' Ah' },
                { label: 'Tiefentladungen',  icon: 'mdi-battery-alert',       val: flatVal(op, 'DeepDischargeEvents'),unit: '' },
                { label: 'Betriebsstunden',  icon: 'mdi-clock-outline',       val: flatVal(op, 'OperatingHours'),     unit: ' h' },
                { label: 'Seit letzter Ladung', icon: 'mdi-timer-outline',    val: flatVal(op, 'TimeSinceLastCharge'),unit: ' h' },
            ]

            const socColor  = socPct >= 60 ? '#4CAF50' : socPct >= 30 ? '#FF9800' : '#EF5350'
            const sohColor  = sohPct >= 80 ? '#4CAF50' : sohPct >= 60 ? '#FF9800' : '#EF5350'

            const minTemp = parseFloat(flatVal(temp, 'MinTemperature')) || 0
            const maxTemp = parseFloat(flatVal(temp, 'MaxTemperature')) || 0
            const avgTemp = parseFloat(flatVal(temp, 'AvgTemperature')) || 0
            const tempRange = maxTemp - minTemp || 1
            const avgPos = Math.min(Math.max(((avgTemp - minTemp) / tempRange) * 100, 0), 100)

            return h('div', { class: 'pc-root' }, [
                // Status badge
                h('div', { class: 'pc-status-row' }, [
                    h('div', { class: `pc-status-badge pc-status-${(status || 'original').toLowerCase()}` }, [
                        h('i', { class: 'mdi mdi-shield-check pc-status-icon' }),
                        status,
                    ])
                ]),

                // Gauges row
                h('div', { class: 'pc-gauges' }, [
                    h('div', { class: 'pc-gauge-item' }, [
                        h('div', { innerHTML: gauge(sohPct, 'SoH', sohColor, 120) }),
                        h('div', { class: 'pc-gauge-label' }, 'State of Health'),
                    ]),
                    h('div', { class: 'pc-gauge-item' }, [
                        h('div', { innerHTML: gauge(Math.round(sohEnergy), 'SoH\nEnergie', '#42A5F5', 120) }),
                        h('div', { class: 'pc-gauge-label' }, 'SoH Energie'),
                    ]),
                    h('div', { class: 'pc-gauge-item' }, [
                        h('div', { innerHTML: gauge(Math.round(sohPower), 'SoH\nLeistung', '#AB47BC', 120) }),
                        h('div', { class: 'pc-gauge-label' }, 'SoH Leistung'),
                    ]),
                    h('div', { class: 'pc-gauge-item' }, [
                        h('div', { innerHTML: gauge(socPct, 'SoC', socColor, 120) }),
                        h('div', { class: 'pc-gauge-label' }, 'State of Charge'),
                    ]),
                ]),

                // Operational stats
                h('div', { class: 'pc-op-section' }, [
                    h('div', { class: 'pc-section-title' }, [h('i', { class: 'mdi mdi-chart-line pc-title-icon' }), 'Betriebsdaten']),
                    h('div', { class: 'pc-op-grid' },
                        opStats.map(s =>
                            h('div', { class: 'pc-op-item' }, [
                                h('i', { class: `mdi ${s.icon} pc-op-icon` }),
                                h('div', { class: 'pc-op-val' }, `${s.val}${s.unit}`),
                                h('div', { class: 'pc-op-label' }, s.label),
                            ])
                        )
                    ),
                ]),

                // Temperature history
                temp.length > 0 ? h('div', { class: 'pc-temp-section' }, [
                    h('div', { class: 'pc-section-title' }, [h('i', { class: 'mdi mdi-thermometer pc-title-icon' }), 'Temperaturverlauf']),
                    h('div', { class: 'pc-temp-bar-wrap' }, [
                        h('div', { class: 'pc-temp-label-min' }, `${minTemp}°C`),
                        h('div', { class: 'pc-temp-track' }, [
                            h('div', { class: 'pc-temp-gradient' }),
                            h('div', { class: 'pc-temp-avg-marker', style: `left:${avgPos}%` }, [
                                h('div', { class: 'pc-temp-avg-line' }),
                                h('div', { class: 'pc-temp-avg-tooltip' }, `⌀ ${avgTemp}°C`),
                            ]),
                        ]),
                        h('div', { class: 'pc-temp-label-max' }, `${maxTemp}°C`),
                    ]),
                    h('div', { class: 'pc-temp-stats' }, [
                        h('span', { class: 'pc-temp-stat' }, [h('i', { class: 'mdi mdi-arrow-down-thin pc-temp-cold-icon' }), ` Min: ${minTemp}°C`]),
                        h('span', { class: 'pc-temp-stat' }, [h('i', { class: 'mdi mdi-approximately-equal pc-temp-avg-icon' }), ` Ø: ${avgTemp}°C`]),
                        h('span', { class: 'pc-temp-stat' }, [h('i', { class: 'mdi mdi-arrow-up-thin pc-temp-hot-icon' }), ` Max: ${maxTemp}°C`]),
                    ]),
                ]) : null,
            ])
        }
    },
})

// ─── Navigation ───────────────────────────────────────────────────────────────
function goBack() { router.push({ name: 'DPPList' }) }

// ─── Data Loading ─────────────────────────────────────────────────────────────
async function loadDppVersions(): Promise<void> {
    if (!productId.value) { dppVersions.value = []; return }
    const b64ProductId = encodeBase64(productId.value)
    try {
        const response = await fetch('https://srv01.noah-becker.de/uni/swe/api/dpp/dppsByProductIds', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify([b64ProductId]),
        })
        if (!response.ok) { dppVersions.value = []; return }
        const data = (await response.json()) as DppVersionsResponse
        if (data?.status?.toLowerCase() === 'success' && data.results) {
            const entries = data.results[b64ProductId] || Object.values(data.results)[0] || []
            dppVersions.value = entries
        } else {
            dppVersions.value = []
        }
    } catch {
        dppVersions.value = []
    }
}

async function loadDppByDppId(dppId: string): Promise<void> {
    loading.value = true; errorMessage.value = ''; openPanels.value = []
    try {
        const response = await fetch(`https://srv01.noah-becker.de/uni/swe/api/dpp/dpps/${dppId}`)
        const data = (await response.json()) as DppApiResponse
        let resolvedDpp: Dpp | undefined
        let resolvedSV:  Record<string, unknown[]> | undefined
        if (data?.status && String(data.status).toLowerCase() === 'success' && data.dpp) {
            resolvedDpp = data.dpp; resolvedSV = data.submodels_values
        } else if (data?.statusCode && data.payload?.dpp) {
            resolvedDpp = data.payload.dpp; resolvedSV = data.payload.submodels_values ?? data.submodels_values
        } else if ((data as any)?.dpp) {
            resolvedDpp = (data as any).dpp; resolvedSV = (data as any).submodels_values
        }
        if (!resolvedDpp) {
            dpp.value = null
            errorMessage.value = data.message?.[0]?.text || data.result?.message?.[0]?.text || 'DPP konnte nicht geladen werden.'
            return
        }
        dpp.value = resolvedDpp
        submodelsValues.value = normalizeSubmodelsValues((resolvedSV as Record<string, unknown>) ?? null)
    } catch (error) {
        dpp.value = null
        errorMessage.value = error instanceof Error ? error.message : 'DPP konnte nicht geladen werden.'
    } finally {
        loading.value = false
    }
}

async function loadDpp(): Promise<void> {
    const currentProductId = encodeBase64(productId.value)
    if (!currentProductId) { dpp.value = null; errorMessage.value = ''; loading.value = false; return }
    loading.value = true; errorMessage.value = ''; openPanels.value = []
    try {
        const response = await fetch(`https://srv01.noah-becker.de/uni/swe/api/dpp/dppsByProductId/${currentProductId}`)
        const data = (await response.json()) as DppApiResponse
        let resolvedDpp: Dpp | undefined
        let resolvedSV:  Record<string, unknown[]> | undefined
        if (data?.status && String(data.status).toLowerCase() === 'success' && data.dpp) {
            resolvedDpp = data.dpp; resolvedSV = data.submodels_values
        } else if (data?.statusCode && data.payload?.dpp) {
            resolvedDpp = data.payload.dpp; resolvedSV = data.payload.submodels_values ?? data.submodels_values
        } else if ((data as any)?.dpp) {
            resolvedDpp = (data as any).dpp; resolvedSV = (data as any).submodels_values
        }
        if (!resolvedDpp) {
            dpp.value = null
            errorMessage.value = data.message?.[0]?.text || data.result?.message?.[0]?.text || `Kein DPP für Product ID "${currentProductId}" gefunden.`
            return
        }
        dpp.value = resolvedDpp
        submodelsValues.value = normalizeSubmodelsValues((resolvedSV as Record<string, unknown>) ?? null)
    } catch (error) {
        dpp.value = null
        errorMessage.value = error instanceof Error ? error.message : 'DPP konnte nicht geladen werden.'
    } finally {
        loading.value = false
    }
}

async function switchDpp(dppId: string): Promise<void> {
    if (dpp.value && dpp.value.dppId === dppId) return
    await loadDppByDppId(dppId)
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(async () => {
    await loadDpp()
    await loadDppVersions()
})

watch(productId, async () => {
    await loadDpp()
    await loadDppVersions()
})
</script>

<!-- ═══════════════════════════════════════════════════════════════════════════
     SCOPED – template elements
════════════════════════════════════════════════════════════════════════════ -->
<style scoped>
.dpp-detail-container { max-width: 1200px; margin: 0 auto; }
.hero-card            { border-radius: 12px; }
.back-btn             { color: rgb(var(--v-theme-primary)) !important; font-weight: 500; }
.dpp-title      { color: rgb(var(--v-theme-titleText)); }
.section-title  { color: rgb(var(--v-theme-titleText)); border-bottom: 2px solid rgb(var(--v-theme-primary)); padding-bottom: 8px; }
.meta-label     { color: rgb(var(--v-theme-primary)); font-size: .75rem; font-weight: 600; letter-spacing: .08em; margin-bottom: 4px; text-transform: uppercase; }
.meta-value     { color: rgb(var(--v-theme-titleText)); font-weight: 500; }

.version-switcher-btn { text-transform: none !important; font-weight: 600; letter-spacing: 0; }
.version-menu-card    { border: 1px solid rgba(var(--v-theme-primary), .15); border-radius: 12px !important; overflow: hidden; }
.version-menu-header  { background-color: rgba(var(--v-theme-primary), .06); }
.version-list         { max-height: 300px; overflow-y: auto; }
.version-item         { transition: background-color .12s ease; border: 1px solid transparent; min-height: 52px; }
.version-item--active { background-color: rgba(var(--v-theme-primary), .08) !important; border-color: rgba(var(--v-theme-primary), .2); }
.version-index-badge  { width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; border-radius: 8px; font-size: .75rem; font-weight: 700; background-color: rgba(var(--v-border-color), .1); color: rgba(var(--v-theme-on-surface), .5); }
.version-index-badge--active { background-color: rgba(var(--v-theme-primary), .15); color: rgb(var(--v-theme-primary)); }
.version-item-title { font-size: .8125rem !important; font-weight: 600 !important; color: rgb(var(--v-theme-titleText)); line-height: 1.3; }
.version-item-sub   { font-size: .7rem !important; opacity: .6; max-width: 340px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.sidebar-card          { background-color: rgb(var(--v-theme-card)); border-radius: 12px; position: sticky; top: 16px; }
.sidebar-submodel-chip { display: flex; align-items: center; padding: 6px 10px; border-radius: 8px; font-size: .8125rem; font-weight: 500; cursor: pointer; color: rgb(var(--v-theme-titleText)); transition: background-color .15s, color .15s; user-select: none; }
.sidebar-submodel-chip:hover   { background-color: rgba(var(--v-theme-primary), .08); }
.sidebar-submodel-chip--active { background-color: rgba(var(--v-theme-primary), .12); color: rgb(var(--v-theme-primary)); font-weight: 600; }

.submodel-panels              { border-radius: 10px; overflow: hidden; border: 1px solid rgba(var(--v-border-color), .12); }
.submodel-panel               { border-bottom: 1px solid rgba(var(--v-border-color), .1); }
.submodel-panel:last-child    { border-bottom: none; }
.submodel-panel-title         { font-size: .9375rem; min-height: 64px !important; transition: background-color .15s; }
.submodel-panel-title:hover   { background-color: rgba(var(--v-theme-primary), .04); }
.submodel-name                { font-size: .9375rem; color: rgb(var(--v-theme-titleText)); line-height: 1.3; }
.submodel-ref                 { max-width: 320px; }
.submodel-panel-content :deep(.v-expansion-panel-text__wrapper) { padding: 16px 20px 20px; }
.values-container { display: flex; flex-direction: column; }
</style>

<!-- ═══════════════════════════════════════════════════════════════════════════
     NON-SCOPED – ValueTree + Specialized Submodel Views
════════════════════════════════════════════════════════════════════════════ -->
<style>
/* ── Generic ValueTree ───────────────────────────────────────────────────── */
.vt-root { display: flex; flex-direction: column; gap: 2px; }
.vt-prop { display: grid; grid-template-columns: 3px 20px minmax(110px, 28%) 1fr; column-gap: 10px; align-items: center; min-height: 34px; padding: 7px 10px 7px 0; border-bottom: 1px solid rgba(var(--v-border-color), .06); border-radius: 6px; transition: background-color .12s; }
.vt-prop:hover  { background-color: rgba(var(--v-theme-primary), .035); }
.vt-prop--last  { border-bottom: none; }
.vt-prop-bar    { width: 3px; align-self: stretch; min-height: 20px; border-radius: 2px; background: rgb(var(--v-theme-primary)); opacity: .3; }
.vt-prop-icon   { font-size: 14px; color: rgb(var(--v-theme-primary)); opacity: .6; justify-self: center; }
.vt-prop-key    { font-size: .8rem; font-weight: 600; color: rgb(var(--v-theme-primary)); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.vt-prop-val    { font-size: .8375rem; color: rgb(var(--v-theme-titleText)); word-break: break-word; opacity: .88; }
.vt-link        { color: rgb(var(--v-theme-primary)); text-decoration: none; font-weight: 500; word-break: break-all; }
.vt-link:hover  { text-decoration: underline; }
.vt-group       { border-radius: 8px; border: 1px solid rgba(var(--v-theme-primary), .12); overflow: hidden; margin-top: 4px; margin-bottom: 4px; }
.vt-group--last { margin-bottom: 0; }
.vt-group-head  { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background-color: rgba(var(--v-theme-primary), .07); }
.vt-group-icon  { font-size: 15px; color: rgb(var(--v-theme-primary)); opacity: .8; flex-shrink: 0; }
.vt-group-label { font-size: .825rem; font-weight: 700; color: rgb(var(--v-theme-primary)); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.vt-group-count { font-size: .675rem; font-weight: 700; color: rgb(var(--v-theme-primary)); background: rgba(var(--v-theme-primary), .12); border-radius: 10px; padding: 1px 7px; flex-shrink: 0; line-height: 1.4; }
.vt-group-body  { padding: 6px 10px 8px 14px; border-left: 2px solid rgba(var(--v-theme-primary), .18); }
.vt-group-body .vt-group-head                { background-color: rgba(var(--v-theme-primary), .045); }
.vt-group-body .vt-group-body .vt-group-head { background-color: rgba(var(--v-theme-primary), .03); }

/* ── Shared specialized styles ───────────────────────────────────────────── */
.sm-section-title { font-size: .75rem; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: rgb(var(--v-theme-primary)); margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }

/* ══════════════════════════════════════════════════════════════════════════
   1. NamePlate
══════════════════════════════════════════════════════════════════════════ */
.np-root { display: flex; flex-direction: column; gap: 16px; }
.np-header { display: flex; align-items: center; gap: 16px; padding: 16px 20px; background: linear-gradient(135deg, rgba(var(--v-theme-primary), .1), rgba(var(--v-theme-primary), .04)); border-radius: 10px; border: 1px solid rgba(var(--v-theme-primary), .15); }
.np-header-icon { width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; background: rgba(var(--v-theme-primary), .12); border-radius: 10px; flex-shrink: 0; }
.np-hicon { font-size: 26px; color: rgb(var(--v-theme-primary)); }
.np-header-title { font-size: 1.1rem; font-weight: 700; color: rgb(var(--v-theme-titleText)); }
.np-header-sub   { font-size: .875rem; color: rgba(var(--v-theme-titleText), .6); margin-top: 2px; }
.np-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 10px; }
.np-card { background: rgba(var(--v-border-color), .06); border-radius: 8px; padding: 12px 14px; border: 1px solid rgba(var(--v-border-color), .1); }
.np-card-icon  { font-size: 18px; color: rgb(var(--v-theme-primary)); opacity: .7; margin-bottom: 4px; display: block; }
.np-card-label { font-size: .7rem; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; color: rgb(var(--v-theme-primary)); margin-bottom: 2px; }
.np-card-val   { font-size: .875rem; font-weight: 600; color: rgb(var(--v-theme-titleText)); }
.np-section { display: flex; flex-direction: column; gap: 8px; }
.np-section-title { font-size: .75rem; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: rgb(var(--v-theme-primary)); display: flex; align-items: center; gap: 6px; }
.np-section-icon { font-size: 14px; }
.np-address { font-size: .9rem; color: rgb(var(--v-theme-titleText)); background: rgba(var(--v-border-color), .06); padding: 12px 16px; border-radius: 8px; border-left: 3px solid rgb(var(--v-theme-primary)); line-height: 1.8; }
.np-markings { display: flex; flex-wrap: wrap; gap: 8px; }
.np-marking-chip { display: inline-flex; align-items: center; gap: 8px; border: 1px solid rgba(var(--v-theme-primary), .2); border-radius: 8px; padding: 6px 12px; background: rgba(var(--v-theme-primary), .04); }
.np-marking-img  { height: 28px; width: auto; object-fit: contain; }
.np-marking-fallback-icon { font-size: 22px; color: rgb(var(--v-theme-primary)); }
.np-marking-name { font-size: .875rem; font-weight: 600; color: rgb(var(--v-theme-titleText)); }

/* ══════════════════════════════════════════════════════════════════════════
   2. MaterialComposition
══════════════════════════════════════════════════════════════════════════ */
.mc-root { display: flex; flex-direction: column; gap: 16px; }
.mc-chem-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(var(--v-theme-primary), .08); border: 1px solid rgba(var(--v-theme-primary), .2); border-radius: 20px; padding: 6px 14px; font-size: .875rem; font-weight: 600; color: rgb(var(--v-theme-primary)); align-self: flex-start; }
.mc-chem-icon { font-size: 16px; }
.mc-layout { display: grid; grid-template-columns: 1fr 1.5fr; gap: 20px; }
@media (max-width: 700px) { .mc-layout { grid-template-columns: 1fr; } }
.mc-chart-title { font-size: .75rem; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: rgb(var(--v-theme-primary)); margin-bottom: 10px; }
.mc-chart-wrap { display: flex; flex-direction: column; }
.mc-pie-container { line-height: 0; }
.mc-pie { width: 100%; max-width: 200px; border-radius: 50%; display: block; margin: 0 auto; }
.mc-legend { display: flex; flex-direction: column; gap: 4px; margin-top: 10px; }
.mc-legend-item { display: flex; align-items: center; gap: 6px; font-size: .78rem; color: rgb(var(--v-theme-titleText)); }
.mc-legend-dot   { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.mc-legend-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mc-table-wrap { display: flex; flex-direction: column; }
.mc-table { width: 100%; border-collapse: collapse; font-size: .8rem; }
.mc-table th { text-align: left; padding: 6px 8px; font-size: .7rem; font-weight: 700; text-transform: uppercase; color: rgb(var(--v-theme-primary)); border-bottom: 2px solid rgba(var(--v-theme-primary), .2); letter-spacing: .04em; }
.mc-table td { padding: 7px 8px; border-bottom: 1px solid rgba(var(--v-border-color), .08); color: rgb(var(--v-theme-titleText)); vertical-align: middle; }
.mc-table tr:last-child td { border-bottom: none; }
.mc-dot  { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; vertical-align: middle; }
.mc-bar-wrap  { height: 6px; background: rgba(var(--v-border-color), .15); border-radius: 3px; overflow: hidden; margin-bottom: 2px; }
.mc-bar-fill  { height: 100%; border-radius: 3px; transition: width .4s; }
.mc-pct-label { font-size: .72rem; opacity: .7; }
.mc-cas  { font-size: .72rem; opacity: .6; font-family: monospace; }
.mc-crm-section { margin-top: 16px; }
.mc-crm-title { font-size: .75rem; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: rgb(var(--v-theme-primary)); display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
.mc-crm-icon { font-size: 14px; }
.mc-crm-grid { display: flex; flex-direction: column; gap: 6px; }
.mc-crm-item { display: grid; grid-template-columns: 100px 1fr 40px; align-items: center; gap: 8px; font-size: .8rem; }
.mc-crm-name { color: rgb(var(--v-theme-titleText)); font-weight: 500; }
.mc-crm-bar-outer { height: 6px; background: rgba(var(--v-border-color), .15); border-radius: 3px; overflow: hidden; }
.mc-crm-bar-inner { height: 100%; background: rgb(var(--v-theme-primary)); border-radius: 3px; transition: width .4s; }
.mc-crm-val   { font-size: .78rem; font-weight: 600; text-align: right; color: rgb(var(--v-theme-titleText)); }

/* ══════════════════════════════════════════════════════════════════════════
   3. HandoverDocumentation
══════════════════════════════════════════════════════════════════════════ */
.hd-root { display: flex; flex-direction: column; gap: 16px; }
.hd-meta-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 10px; }
.hd-meta-item { display: flex; align-items: flex-start; gap: 8px; padding: 10px 12px; background: rgba(var(--v-border-color), .06); border-radius: 8px; }
.hd-meta-icon { font-size: 16px; color: rgb(var(--v-theme-primary)); margin-top: 1px; flex-shrink: 0; }
.hd-meta-label { font-size: .68rem; font-weight: 700; text-transform: uppercase; color: rgb(var(--v-theme-primary)); letter-spacing: .05em; }
.hd-meta-val   { font-size: .83rem; color: rgb(var(--v-theme-titleText)); margin-top: 1px; word-break: break-word; }
.hd-docs-title { font-size: .75rem; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: rgb(var(--v-theme-primary)); display: flex; align-items: center; gap: 6px; }
.hd-docs-title-icon { font-size: 15px; }
.hd-docs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
.hd-doc-card { border-radius: 10px; border: 1px solid rgba(var(--v-border-color), .15); overflow: hidden; }
.hd-doc-card-head { display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: color-mix(in srgb, var(--cat-color) 12%, transparent); border-bottom: 1px solid rgba(var(--v-border-color), .1); }
.hd-doc-card-icon  { font-size: 18px; color: var(--cat-color); }
.hd-doc-card-label { font-size: .8rem; font-weight: 700; color: rgb(var(--v-theme-titleText)); }
.hd-doc-links { display: flex; flex-direction: column; gap: 4px; padding: 10px 14px; }
.hd-doc-link  { display: flex; align-items: center; gap: 6px; font-size: .8rem; color: rgb(var(--v-theme-primary)); text-decoration: none; padding: 4px 0; transition: opacity .15s; }
.hd-doc-link:hover { opacity: .7; text-decoration: underline; }
.hd-doc-link-icon { font-size: 16px; color: #D32F2F; }
.hd-doc-empty { padding: 10px 14px; font-size: .8rem; color: rgba(var(--v-theme-titleText), .4); font-style: italic; }

/* ══════════════════════════════════════════════════════════════════════════
   4. CarbonFootPrint
══════════════════════════════════════════════════════════════════════════ */
.cf-root { display: flex; flex-direction: column; gap: 16px; }
.cf-summary { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; padding: 14px 18px; background: rgba(var(--v-theme-primary), .05); border-radius: 10px; border: 1px solid rgba(var(--v-theme-primary), .15); }
.cf-total-block { display: flex; flex-direction: column; gap: 4px; }
.cf-total-label { font-size: .7rem; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: rgb(var(--v-theme-primary)); }
.cf-total-val   { font-size: 1.4rem; font-weight: 800; color: rgb(var(--v-theme-titleText)); line-height: 1.1; }
.cf-phase-badge { display: inline-block; font-size: .72rem; padding: 2px 8px; border-radius: 10px; background: rgba(var(--v-theme-primary), .1); color: rgb(var(--v-theme-primary)); margin-top: 2px; }
.cf-ref-link    { display: flex; align-items: center; gap: 6px; font-size: .82rem; color: rgb(var(--v-theme-primary)); text-decoration: none; padding: 6px 12px; border-radius: 8px; border: 1px solid rgba(var(--v-theme-primary), .3); transition: background .15s; }
.cf-ref-link:hover { background: rgba(var(--v-theme-primary), .08); }
.cf-layout { display: grid; grid-template-columns: 200px 1fr; gap: 20px; align-items: start; }
@media (max-width: 600px) { .cf-layout { grid-template-columns: 1fr; } }
.cf-chart-title { font-size: .75rem; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: rgb(var(--v-theme-primary)); margin-bottom: 10px; }
.cf-donut-wrap { display: flex; flex-direction: column; }
.cf-donut-container { line-height: 0; }
.cf-donut { width: 100%; color: rgb(var(--v-theme-titleText)); }
.cf-bars-wrap { display: flex; flex-direction: column; }
.cf-bars { display: flex; flex-direction: column; gap: 10px; }
.cf-bar-row   { display: grid; grid-template-columns: 140px 1fr 50px 44px; align-items: center; gap: 8px; }
.cf-bar-label { display: flex; align-items: center; gap: 6px; font-size: .8rem; color: rgb(var(--v-theme-titleText)); }
.cf-bar-icon  { font-size: 14px; }
.cf-bar-track { height: 10px; background: rgba(var(--v-border-color), .12); border-radius: 5px; overflow: hidden; }
.cf-bar-fill  { height: 100%; border-radius: 5px; transition: width .5s; }
.cf-bar-val   { font-size: .8rem; font-weight: 700; color: rgb(var(--v-theme-titleText)); text-align: right; }
.cf-bar-pct   { font-size: .72rem; color: rgba(var(--v-theme-titleText), .5); text-align: right; }

/* ══════════════════════════════════════════════════════════════════════════
   5. Circularity
══════════════════════════════════════════════════════════════════════════ */
.circ-root { display: flex; flex-direction: column; gap: 16px; }
.circ-layout { display: grid; grid-template-columns: 180px 1fr; gap: 24px; align-items: start; }
@media (max-width: 600px) { .circ-layout { grid-template-columns: 1fr; } }
.circ-section-title { font-size: .75rem; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: rgb(var(--v-theme-primary)); display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
.circ-title-icon { font-size: 14px; }
.circ-gauge-wrap { display: flex; flex-direction: column; align-items: center; }
.circ-gauge-svg  { width: 100%; color: rgb(var(--v-theme-titleText)); }
.circ-gauge-label { font-size: .8rem; font-weight: 600; margin-top: 4px; }
.circ-right { display: flex; flex-direction: column; gap: 16px; }
.circ-rc-section { display: flex; flex-direction: column; }
.circ-rc-list { display: flex; flex-direction: column; gap: 6px; }
.circ-rc-item { display: grid; grid-template-columns: 80px 1fr 44px; align-items: center; gap: 8px; font-size: .8rem; }
.circ-rc-name { color: rgb(var(--v-theme-titleText)); font-weight: 500; }
.circ-rc-bar-outer { height: 6px; background: rgba(var(--v-border-color), .15); border-radius: 3px; overflow: hidden; }
.circ-rc-bar-inner { height: 100%; background: #4CAF50; border-radius: 3px; transition: width .4s; }
.circ-rc-pct { font-size: .78rem; font-weight: 600; color: #4CAF50; text-align: right; }
.circ-dism-section { display: flex; flex-direction: column; }
.circ-dism-links { display: flex; flex-direction: column; gap: 4px; }
.circ-dism-link { display: flex; align-items: center; gap: 6px; font-size: .8rem; color: rgb(var(--v-theme-primary)); text-decoration: none; }
.circ-dism-link:hover { text-decoration: underline; }

/* ══════════════════════════════════════════════════════════════════════════
   6. TechnicalData
══════════════════════════════════════════════════════════════════════════ */
.td-root { display: flex; flex-direction: column; gap: 16px; }
.td-gen-card   { border: 1px solid rgba(var(--v-border-color), .15); border-radius: 10px; overflow: hidden; }
.td-gen-header { display: flex; align-items: center; gap: 8px; padding: 10px 16px; background: rgba(var(--v-theme-primary), .07); font-size: .8rem; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: rgb(var(--v-theme-primary)); }
.td-gen-icon   { font-size: 16px; }
.td-gen-grid   { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 0; }
.td-gen-item   { padding: 10px 16px; border-right: 1px solid rgba(var(--v-border-color), .08); border-bottom: 1px solid rgba(var(--v-border-color), .08); }
.td-gen-label  { font-size: .68rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: rgb(var(--v-theme-primary)); margin-bottom: 2px; }
.td-gen-val    { font-size: .875rem; font-weight: 600; color: rgb(var(--v-theme-titleText)); }
.td-sections { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }
.td-section  { border-radius: 10px; border: 1px solid color-mix(in srgb, var(--sec-color) 25%, transparent); overflow: hidden; }
.td-sec-header { display: flex; align-items: center; gap: 8px; padding: 9px 14px; background: color-mix(in srgb, var(--sec-color) 10%, transparent); font-size: .78rem; font-weight: 700; text-transform: uppercase; color: var(--sec-color); letter-spacing: .06em; border-bottom: 1px solid color-mix(in srgb, var(--sec-color) 20%, transparent); }
.td-sec-icon   { font-size: 15px; }
.td-sec-grid   { display: flex; flex-direction: column; }
.td-sec-item   { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 10px; padding: 7px 14px; border-bottom: 1px solid rgba(var(--v-border-color), .06); }
.td-sec-item:last-child { border-bottom: none; }
.td-sec-label  { font-size: .78rem; color: rgba(var(--v-theme-titleText), .7); }
.td-sec-val    { font-size: .82rem; font-weight: 700; color: rgb(var(--v-theme-titleText)); text-align: right; font-variant-numeric: tabular-nums; }

/* ══════════════════════════════════════════════════════════════════════════
   7. ProductCondition
══════════════════════════════════════════════════════════════════════════ */
.pc-root { display: flex; flex-direction: column; gap: 16px; }
.pc-status-row { display: flex; }
.pc-status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 5px 14px; border-radius: 20px; font-size: .82rem; font-weight: 700; }
.pc-status-original { background: rgba(76, 175, 80, .12); color: #388E3C; border: 1px solid rgba(76, 175, 80, .3); }
.pc-status-refurbished { background: rgba(255, 152, 0, .12); color: #F57C00; border: 1px solid rgba(255, 152, 0, .3); }
.pc-status-damaged { background: rgba(239, 83, 80, .12); color: #D32F2F; border: 1px solid rgba(239, 83, 80, .3); }
.pc-status-icon { font-size: 15px; }
.pc-gauges { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; }
.pc-gauge-item { display: flex; flex-direction: column; align-items: center; flex: 0 0 auto; }
.pc-gauge-svg  { width: 120px; height: 120px; color: rgb(var(--v-theme-titleText)); }
.pc-gauge-label { font-size: .72rem; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; color: rgba(var(--v-theme-titleText), .55); margin-top: -4px; }
.pc-section-title { font-size: .75rem; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: rgb(var(--v-theme-primary)); display: flex; align-items: center; gap: 6px; margin-bottom: 10px; }
.pc-title-icon { font-size: 14px; }
.pc-op-section { display: flex; flex-direction: column; }
.pc-op-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 10px; }
.pc-op-item { background: rgba(var(--v-border-color), .07); border-radius: 10px; padding: 12px 14px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 4px; border: 1px solid rgba(var(--v-border-color), .12); }
.pc-op-icon  { font-size: 22px; color: rgb(var(--v-theme-primary)); opacity: .8; }
.pc-op-val   { font-size: 1rem; font-weight: 800; color: rgb(var(--v-theme-titleText)); font-variant-numeric: tabular-nums; }
.pc-op-label { font-size: .68rem; color: rgba(var(--v-theme-titleText), .55); text-transform: uppercase; letter-spacing: .04em; }
.pc-temp-section { display: flex; flex-direction: column; }
.pc-temp-bar-wrap { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
.pc-temp-label-min { font-size: .78rem; font-weight: 600; color: #42A5F5; min-width: 48px; text-align: right; }
.pc-temp-label-max { font-size: .78rem; font-weight: 600; color: #EF5350; min-width: 48px; }
.pc-temp-track { flex: 1; height: 14px; border-radius: 7px; overflow: visible; position: relative; }
.pc-temp-gradient { position: absolute; inset: 0; border-radius: 7px; background: linear-gradient(to right, #42A5F5, #66BB6A, #FF7043, #EF5350); }
.pc-temp-avg-marker { position: absolute; top: -6px; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; }
.pc-temp-avg-line    { width: 2px; height: 26px; background: rgb(var(--v-theme-titleText)); opacity: .7; border-radius: 1px; }
.pc-temp-avg-tooltip { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-border-color), .2); border-radius: 6px; padding: 2px 7px; font-size: .7rem; font-weight: 700; color: rgb(var(--v-theme-titleText)); white-space: nowrap; margin-top: 2px; box-shadow: 0 2px 6px rgba(0,0,0,.1); }
.pc-temp-stats { display: flex; gap: 16px; font-size: .8rem; }
.pc-temp-stat { display: flex; align-items: center; gap: 3px; color: rgb(var(--v-theme-titleText)); opacity: .75; }
.pc-temp-cold-icon { color: #42A5F5; }
.pc-temp-avg-icon  { color: #66BB6A; }
.pc-temp-hot-icon  { color: #EF5350; }
</style>