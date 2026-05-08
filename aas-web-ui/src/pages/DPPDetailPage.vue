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
                <p class="text-h6 text-grey mt-4">Kein DPP mit der ID „{{ id }}" gefunden.</p>
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

            <!-- Hero Image Section -->
            <div class="image-wrapper mb-6">
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

                <v-img
                    :src="dpp.image_url || '/no-image_placeholder.jpg'"
                    :alt="dpp.title"
                    class="hero-image rounded-xl"
                    height="500"
                    cover
                />
            </div>

            <!-- Content Row -->
            <v-row class="mb-12">

                <!-- Main Section -->
                <v-col cols="12" md="8" class="pr-md-6">

                    <h1 class="dpp-title text-h4 font-weight-bold mb-4">
                        {{ dpp.title }}
                    </h1>

                    <p class="dpp-description text-body-1 text-grey-darken-1 mb-6">
                        {{ dpp.description }}
                    </p>

                    <v-divider class="border-primary mb-6" thickness="2" />

                    <h2 class="section-title text-h5 font-weight-bold mb-4">Details</h2>
                    <div class="dpp-content text-body-1 text-grey-darken-1">
                        <!-- TODO: Inhalt ergänzen -->
                    </div>

                </v-col>

                <!-- Sidebar -->
                <v-col cols="12" md="4">
                    <v-card class="sidebar-card pa-6" elevation="2">

                        <h2 class="section-title text-h5 font-weight-bold mb-4">Informationen</h2>
                        <!-- TODO: Inhalt ergänzen -->

                        <v-divider class="border-primary my-6" thickness="2" />

                        <h2 class="section-title text-h5 font-weight-bold mb-4">Weitere Details</h2>
                        <!-- TODO: Inhalt ergänzen -->

                    </v-card>
                </v-col>

            </v-row>
        </template>

    </v-container>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Dpp {
    id: string
    title: string
    description: string
    image_url: string | null
}

// ─── Router & Route ───────────────────────────────────────────────────────────
const route = useRoute()
const router = useRouter()

// ID kommt als Query-Parameter: /design/dppdetail?id=DPP-001
const id = route.query.id as string

// ─── State ────────────────────────────────────────────────────────────────────
const dpp = ref<Dpp | null>(null)
const loading = ref(true)

// ─── Navigation ───────────────────────────────────────────────────────────────
function goBack() {
    router.push({ name: 'DesignSkeletton' })
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(async () => {
    // TODO: API-Aufruf ergänzen, z.B.:
    // const response = await getDppById(id)
    // if (response.success) dpp.value = response.data
    loading.value = false
})
</script>

<style scoped>
.dpp-detail-container {
    max-width: 1200px;
    margin: 0 auto;
}

/* ── Hero Image ─────────────────────────────────────────────────────────────── */
.image-wrapper {
    position: relative;
}

.hero-image {
    width: 100%;
    border-radius: 12px;
}

.back-btn {
    position: absolute;
    top: 16px;
    left: 16px;
    z-index: 10;
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

/* ── Sidebar ────────────────────────────────────────────────────────────────── */
.sidebar-card {
    background-color: rgb(var(--v-theme-card));
    border-radius: 12px;
    position: sticky;
    top: 16px;
}
</style>