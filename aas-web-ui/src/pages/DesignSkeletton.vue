<template>
    <v-container fluid class="pa-4">
        <!-- Suchleiste -->
        <v-row class="mb-6" justify="center">
            <v-col cols="12" md="6">
                <v-text-field
                    prepend-inner-icon="mdi-magnify"
                    placeholder="Suchen..."
                    variant="outlined"
                    density="comfortable"
                    hide-details
                    clearable
                    class="search-bar"
                ></v-text-field>
            </v-col>
        </v-row>

        <!-- Section 1: 3 Panels nebeneinander -->
        <div class="section-title text-h5 mb-3">Kategorie 1 - Drei Panels</div>
        <v-row class="mb-6">
            <v-col cols="4" v-for="item in section1Items" :key="item.id">
                <v-card
                    class="panel-card"
                    elevation="2"
                    @click="navigateToDpp(item.id)"
                >
                    <v-card-title class="panel-header">
                        {{ item.title }}
                    </v-card-title>
                    <v-card-text class="panel-content">
                        <div class="image-placeholder">
                            <v-icon size="48" color="grey">mdi-image-outline</v-icon>
                            <div class="text-caption mt-2">Bild Platzhalter</div>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <!-- Section 2: 1 Panel -->
        <div class="section-title text-h5 mb-3">Kategorie 2 - Ein Panel</div>
        <v-row class="mb-6">
            <v-col cols="12">
                <v-card
                    class="panel-card"
                    elevation="2"
                    @click="navigateToDpp(section2Item.id)"
                >
                    <v-card-title class="panel-header">
                        {{ section2Item.title }}
                    </v-card-title>
                    <v-card-text class="panel-content">
                        <div class="image-placeholder">
                            <v-icon size="48" color="grey">mdi-image-outline</v-icon>
                            <div class="text-caption mt-2">Bild Platzhalter</div>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <!-- Section 3: 5 Panels -->
        <div class="section-title text-h5 mb-3">Kategorie 3 - Fünf Panels</div>
        <v-row>
            <v-col
                cols="12" sm="6"
                v-for="item in section3Items"
                :key="item.id"
                class="panel-col-5"
            >
                <v-card
                    class="panel-card"
                    elevation="2"
                    @click="navigateToDpp(item.id)"
                >
                    <v-card-title class="panel-header">
                        {{ item.title }}
                    </v-card-title>
                    <v-card-text class="panel-content">
                        <div class="image-placeholder">
                            <v-icon size="48" color="grey">mdi-image-outline</v-icon>
                            <div class="text-caption mt-2">Bild Platzhalter</div>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router'

// ─── Types ────────────────────────────────────────────────────────────────────
interface DppTile {
    id: string
    title: string
}

// ─── Router ───────────────────────────────────────────────────────────────────
const router = useRouter()

// ─── Mock-Daten (TODO: durch API-Daten ersetzen) ──────────────────────────────
const section1Items: DppTile[] = [
    { id: 'DPP-001', title: 'Panel 1' },
    { id: 'DPP-002', title: 'Panel 2' },
    { id: 'DPP-003', title: 'Panel 3' },
]

const section2Item: DppTile = { id: 'DPP-004', title: 'Panel 1' }

const section3Items: DppTile[] = [
    { id: 'DPP-005', title: 'Panel 1' },
    { id: 'DPP-006', title: 'Panel 2' },
    { id: 'DPP-007', title: 'Panel 3' },
    { id: 'DPP-008', title: 'Panel 4' },
    { id: 'DPP-009', title: 'Panel 5' },
]

// ─── Navigation ───────────────────────────────────────────────────────────────
function navigateToDpp(id: string) {
    router.push({ name: 'DPPDetailPage', query: { productId: id } })
}
</script>

<style scoped>
    .section-title {
        color: rgb(var(--v-theme-titleText));
        border-bottom: 2px solid rgb(var(--v-theme-primary));
        padding-bottom: 8px;
    }

    .panel-card {
        height: 250px;
        display: flex;
        flex-direction: column;
        background-color: rgb(var(--v-theme-card));
        cursor: pointer;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
    }

    .panel-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12) !important;
    }

    .panel-header {
        background-color: rgb(var(--v-theme-cardHeader));
        font-size: 1rem;
        font-weight: 500;
        flex-shrink: 0;
    }

    .panel-content {
        flex-grow: 1;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .image-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 150px;
        border: 2px dashed rgb(var(--v-theme-divider));
        border-radius: 8px;
        background-color: rgb(var(--v-theme-detailsCard));
    }

    /* 5 Panels in einer Reihe */
    .panel-col-5 {
        flex: 0 0 20%;
        max-width: 20%;
    }
</style>