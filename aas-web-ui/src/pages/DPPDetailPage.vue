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
                    <v-btn class="back-btn" variant="elevated" color="white" prepend-icon="mdi-arrow-left" size="small" elevation="3" @click="goBack">
                        Zurück
                    </v-btn>
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
                        <div class="meta-value text-break">{{ new Date(dpp.createdAt * 1) || '-' }}</div>
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
                                            <v-icon :icon="openPanels.includes(submodel.name) ? 'mdi-cube' : 'mdi-cube-outline'" />
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
                                    <div v-if="getSubmodelEntries(submodel.name).length > 0" class="values-container">
                                        <ValueTree :entries="getSubmodelEntries(submodel.name)" />
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
                                    {{ openPanels.includes(submodel.name) ? 'mdi-cube' : 'mdi-cube-outline' }}
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

// ─── Base64 decode helper ─────────────────────────────────────────────────────
/**
 * Safely decode a Base64-encoded string (with or without trailing `=` padding).
 * Falls back to the original value if decoding fails or the input is empty.
 */
function decodeBase64(encoded: string | undefined | null): string {
    if (!encoded) return '-'
    try {
        // Reverse URL-safe Base64 substitutions, then re-add stripped padding
        let standard = encoded.replace(/-/g, '+').replace(/_/g, '/')
        const remainder = standard.length % 4
        if (remainder === 2) standard += '=='
        else if (remainder === 3) standard += '='

        return decodeURIComponent(
            atob(standard)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        )
    } catch {
        // Not valid Base64 – return as-is
        return encoded
    }
}

// ─── State ────────────────────────────────────────────────────────────────────
const dpp              = ref<Dpp | null>(null)
const loading          = ref(true)
const errorMessage     = ref('')
const submodelsValues  = ref<Record<string, SubmodelEntry[]> | null>(null)
const openPanels       = ref<string[]>([])

// ─── Panel toggle (sidebar) ───────────────────────────────────────────────────
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

// ─── Render helpers ───────────────────────────────────────────────────────────
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

// ─── Render function: ValueTree ───────────────────────────────────────────────
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
    setup(props) {
        return () => h('div', { class: 'vt-root' }, renderEntries(props.entries, 0))
    },
})

// ─── Navigation ───────────────────────────────────────────────────────────────
function goBack() { router.push({ name: 'DPPList' }) }

// ─── Data Loading ─────────────────────────────────────────────────────────────
async function loadDpp(): Promise<void> {
    const currentProductId = btoa(productId.value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
    if (!currentProductId) {
        dpp.value = null
        errorMessage.value = ''
        loading.value = false
        return
    }

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
            errorMessage.value = data.message?.[0]?.text || data.result?.message?.[0]?.text
                || `Kein DPP für Product ID "${currentProductId}" gefunden.`
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

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(() => { void loadDpp() })
watch(productId, () => { void loadDpp() })
</script>

<!-- ═══════════════════════════════════════════════════════════════════════════
     SCOPED – template elements (hero card, sidebar, panels shell)
════════════════════════════════════════════════════════════════════════════ -->
<style scoped>
.dpp-detail-container { max-width: 1200px; margin: 0 auto; }
.hero-card            { border-radius: 12px; }
.back-btn             { color: rgb(var(--v-theme-primary)) !important; font-weight: 500; }

.dpp-title      { color: rgb(var(--v-theme-titleText)); }
.section-title  { color: rgb(var(--v-theme-titleText)); border-bottom: 2px solid rgb(var(--v-theme-primary)); padding-bottom: 8px; }
.meta-label     { color: rgb(var(--v-theme-primary)); font-size: .75rem; font-weight: 600; letter-spacing: .08em; margin-bottom: 4px; text-transform: uppercase; }
.meta-value     { color: rgb(var(--v-theme-titleText)); font-weight: 500; }

/* Sidebar */
.sidebar-card          { background-color: rgb(var(--v-theme-card)); border-radius: 12px; position: sticky; top: 16px; }
.sidebar-submodel-chip { display: flex; align-items: center; padding: 6px 10px; border-radius: 8px; font-size: .8125rem; font-weight: 500; cursor: pointer; color: rgb(var(--v-theme-titleText)); transition: background-color .15s, color .15s; user-select: none; }
.sidebar-submodel-chip:hover   { background-color: rgba(var(--v-theme-primary), .08); }
.sidebar-submodel-chip--active { background-color: rgba(var(--v-theme-primary), .12); color: rgb(var(--v-theme-primary)); font-weight: 600; }

/* Expansion panels */
.submodel-panels              { border-radius: 10px; overflow: hidden; border: 1px solid rgba(var(--v-border-color), .12); }
.submodel-panel               { border-bottom: 1px solid rgba(var(--v-border-color), .1); }
.submodel-panel:last-child    { border-bottom: none; }
.submodel-panel-title         { font-size: .9375rem; min-height: 64px !important; transition: background-color .15s; }
.submodel-panel-title:hover   { background-color: rgba(var(--v-theme-primary), .04); }
.submodel-name                { font-size: .9375rem; color: rgb(var(--v-theme-titleText)); line-height: 1.3; }
.submodel-ref                 { max-width: 320px; }

/* Panel body */
.submodel-panel-content :deep(.v-expansion-panel-text__wrapper) { padding: 16px 20px 20px; }
.values-container { display: flex; flex-direction: column; }
</style>

<!-- ═══════════════════════════════════════════════════════════════════════════
     NON-SCOPED – ValueTree render-function output
     All selectors nested under `.vt-root` to avoid global leaks.
════════════════════════════════════════════════════════════════════════════ -->
<style>
/* ── Root ─────────────────────────────────────────────────────────────────── */
.vt-root {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

/* ══════════════════════════════════════════════════════════════════════════
   LEAF PROPERTY ROW
══════════════════════════════════════════════════════════════════════════ */
.vt-prop {
    display: grid;
    grid-template-columns: 3px 20px minmax(110px, 28%) 1fr;
    column-gap: 10px;
    align-items: center;
    min-height: 34px;
    padding: 7px 10px 7px 0;
    border-bottom: 1px solid rgba(var(--v-border-color), .06);
    border-radius: 6px;
    transition: background-color .12s;
}
.vt-prop:hover      { background-color: rgba(var(--v-theme-primary), .035); }
.vt-prop--last      { border-bottom: none; }

.vt-prop-bar {
    width: 3px; align-self: stretch; min-height: 20px;
    border-radius: 2px; background: rgb(var(--v-theme-primary)); opacity: .3;
}
.vt-prop-icon {
    font-size: 14px; color: rgb(var(--v-theme-primary)); opacity: .6; justify-self: center;
}
.vt-prop-key {
    font-size: .8rem; font-weight: 600; color: rgb(var(--v-theme-primary));
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.vt-prop-val {
    font-size: .8375rem; color: rgb(var(--v-theme-titleText)); word-break: break-word; opacity: .88;
}

.vt-link { color: rgb(var(--v-theme-primary)); text-decoration: none; font-weight: 500; word-break: break-all; }
.vt-link:hover { text-decoration: underline; }

/* ══════════════════════════════════════════════════════════════════════════
   COLLECTION / GROUP
══════════════════════════════════════════════════════════════════════════ */
.vt-group {
    border-radius: 8px; border: 1px solid rgba(var(--v-theme-primary), .12);
    overflow: hidden; margin-top: 4px; margin-bottom: 4px;
}
.vt-group--last { margin-bottom: 0; }

.vt-group-head {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 12px; background-color: rgba(var(--v-theme-primary), .07);
}
.vt-group-icon  { font-size: 15px; color: rgb(var(--v-theme-primary)); opacity: .8; flex-shrink: 0; }
.vt-group-label { font-size: .825rem; font-weight: 700; color: rgb(var(--v-theme-primary)); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.vt-group-count { font-size: .675rem; font-weight: 700; color: rgb(var(--v-theme-primary)); background: rgba(var(--v-theme-primary), .12); border-radius: 10px; padding: 1px 7px; flex-shrink: 0; line-height: 1.4; }

.vt-group-body {
    padding: 6px 10px 8px 14px;
    border-left: 2px solid rgba(var(--v-theme-primary), .18);
}

/* Nested groups: progressively subtler headers */
.vt-group-body .vt-group-head                  { background-color: rgba(var(--v-theme-primary), .045); }
.vt-group-body .vt-group-body .vt-group-head   { background-color: rgba(var(--v-theme-primary), .03); }
</style>