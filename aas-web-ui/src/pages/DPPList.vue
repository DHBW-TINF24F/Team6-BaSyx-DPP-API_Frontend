<template>
    <v-container class="pa-3 pa-md-4">
        <div class="mx-auto" style="max-width: 1280px">
            <v-card class="pa-4 mb-4" rounded="lg" border>
                <v-card-title class="text-h5">DPP List</v-card-title>
                <v-card-subtitle>All available Digital Product Passports</v-card-subtitle>
            </v-card>

            <v-card rounded="lg" border>
                <v-list lines="two">
                    <v-list-item
                        v-for="dpp in dppList"
                        :key="dpp.id"
                        :title="dpp.title"
                        :subtitle="dpp.id"
                        nav
                        :to="{ path: `/dpp/details/${encodeURIComponent(dpp.id)}` }">
                        <template #prepend>
                            <v-avatar color="surface-light" rounded>
                                <v-icon color="medium-emphasis">mdi-certificate-outline</v-icon>
                            </v-avatar>
                        </template>
                        <template #append>
                            <v-icon color="medium-emphasis">mdi-chevron-right</v-icon>
                        </template>
                    </v-list-item>

                    <v-list-item v-if="dppList.length === 0" class="pa-6">
                        <v-list-item-title class="text-medium-emphasis text-center">
                            No Digital Product Passports available
                        </v-list-item-title>
                    </v-list-item>
                </v-list>
            </v-card>
        </div>
    </v-container>
</template>

<script lang="ts" setup>
    import { computed } from 'vue';
    import { useAASStore } from '@/store/AASDataStore';

    const aasStore = useAASStore();

    const selectedAas = computed(() => aasStore.getSelectedAAS);

    const dppList = computed(() => {
        if (!selectedAas.value || Object.keys(selectedAas.value).length === 0) return [];

        const globalAssetId = selectedAas.value?.assetInformation?.globalAssetId;
        const aasId = selectedAas.value?.id;
        const idShort = selectedAas.value?.idShort;

        if (!aasId) return [];

        return [
            {
                id: globalAssetId || aasId,
                title: idShort || aasId,
            },
        ];
    });
</script>
