<template>
    <v-container class="pa-3 pa-md-4">
        <div class="mx-auto" style="max-width: 1280px">
            <v-card class="pa-4 mb-4" rounded="lg" border>
                <v-card-title class="text-h5">DPP Viewer</v-card-title>
                <v-card-subtitle>Digital Product Passport Details</v-card-subtitle>

                <v-card-text v-if="productId">
                    <v-row class="ma-0" align="center">
                        <v-col cols="12" md="8" class="pa-2">
                            <div class="text-caption text-medium-emphasis">Product ID</div>
                            <div class="text-body-1 text-break font-weight-medium">{{ productId }}</div>

                            <div v-if="selectedAasTitle" class="mt-4">
                                <div class="text-caption text-medium-emphasis">AAS</div>
                                <div class="text-body-2">{{ selectedAasTitle }}</div>
                            </div>
                        </v-col>
                        <v-col cols="12" md="4" class="pa-2 d-flex justify-center justify-md-end">
                            <v-sheet border rounded="lg" class="pa-2" min-width="132">
                                <v-icon size="36" class="ma-8" color="medium-emphasis">mdi-qrcode</v-icon>
                            </v-sheet>
                        </v-col>
                    </v-row>
                </v-card-text>

                <v-card-text v-else>
                    <v-alert type="info" variant="tonal" rounded="lg">
                        No product selected. Please select an AAS from the
                        <router-link to="/dpp/list">DPP List</router-link> or the AAS Viewer.
                    </v-alert>
                </v-card-text>
            </v-card>

            <v-card v-if="productId" rounded="lg" border>
                <v-card-title class="text-subtitle-1 pa-4 pb-2">Passport Data</v-card-title>
                <v-divider />
                <v-card-text>
                    <v-row>
                        <v-col cols="12" md="6">
                            <v-list density="compact">
                                <v-list-item>
                                    <template #prepend>
                                        <v-icon color="medium-emphasis">mdi-identifier</v-icon>
                                    </template>
                                    <v-list-item-title>Product ID</v-list-item-title>
                                    <v-list-item-subtitle class="text-break">{{ productId }}</v-list-item-subtitle>
                                </v-list-item>
                                <v-list-item v-if="selectedAas && selectedAas.id">
                                    <template #prepend>
                                        <v-icon color="medium-emphasis">mdi-tag-outline</v-icon>
                                    </template>
                                    <v-list-item-title>AAS ID</v-list-item-title>
                                    <v-list-item-subtitle class="text-break">{{ selectedAas.id }}</v-list-item-subtitle>
                                </v-list-item>
                            </v-list>
                        </v-col>
                    </v-row>
                </v-card-text>
            </v-card>
        </div>
    </v-container>
</template>

<script lang="ts" setup>
    import { computed } from 'vue';
    import { useRoute } from 'vue-router';
    import { useAASStore } from '@/store/AASDataStore';

    const route = useRoute();
    const aasStore = useAASStore();

    const selectedAas = computed(() => aasStore.getSelectedAAS);
    const selectedAasTitle = computed(() => {
        if (!selectedAas.value || Object.keys(selectedAas.value).length === 0) return '';
        return selectedAas.value?.idShort?.trim() || selectedAas.value?.id || '';
    });

    const productId = computed(() => {
        const param = route.params.productId as string | undefined;
        if (param && param.trim() !== '') return decodeURIComponent(param);

        const globalAssetId = selectedAas.value?.assetInformation?.globalAssetId;
        if (globalAssetId && String(globalAssetId).trim() !== '') return String(globalAssetId);

        return '';
    });
</script>
