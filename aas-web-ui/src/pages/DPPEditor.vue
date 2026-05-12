<template>
    <v-container class="pa-3 pa-md-4">
        <div class="mx-auto" style="max-width: 1280px">
            <v-card class="pa-4 mb-4" rounded="lg" border>
                <v-card-title class="text-h5">DPP Editor</v-card-title>
                <v-card-subtitle>Edit Digital Product Passport</v-card-subtitle>

                <v-card-text v-if="!productId">
                    <v-alert type="info" variant="tonal" rounded="lg">
                        No product selected. Please select an AAS from the
                        <router-link to="/dpp/list">DPP List</router-link> or the AAS Viewer.
                    </v-alert>
                </v-card-text>
            </v-card>

            <template v-if="productId">
                <v-card rounded="lg" border class="mb-4">
                    <v-card-title class="text-subtitle-1 pa-4 pb-2">Passport Data</v-card-title>
                    <v-divider />
                    <v-card-text>
                        <v-row>
                            <v-col cols="12" md="6">
                                <v-text-field
                                    v-model="editableProductId"
                                    label="Product ID"
                                    variant="outlined"
                                    density="compact"
                                    readonly
                                    hint="Derived from AAS globalAssetId"
                                    persistent-hint />
                            </v-col>
                            <v-col cols="12" md="6">
                                <v-text-field
                                    v-model="editableTitle"
                                    label="Product Title"
                                    variant="outlined"
                                    density="compact" />
                            </v-col>
                        </v-row>
                    </v-card-text>
                    <v-card-actions class="pa-4 pt-0">
                        <v-spacer />
                        <v-btn
                            color="primary"
                            variant="tonal"
                            prepend-icon="mdi-content-save"
                            @click="onSave">
                            Save
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </template>
        </div>
    </v-container>
</template>

<script lang="ts" setup>
    import { computed, ref, watch } from 'vue';
    import { useRoute } from 'vue-router';
    import { useAASStore } from '@/store/AASDataStore';
    import { useNavigationStore } from '@/store/NavigationStore';

    const route = useRoute();
    const aasStore = useAASStore();
    const navigationStore = useNavigationStore();

    const selectedAas = computed(() => aasStore.getSelectedAAS);

    const productId = computed(() => {
        const param = route.params.productId as string | undefined;
        if (param && param.trim() !== '') return decodeURIComponent(param);

        const globalAssetId = selectedAas.value?.assetInformation?.globalAssetId;
        if (globalAssetId && String(globalAssetId).trim() !== '') return String(globalAssetId);

        return '';
    });

    const editableProductId = ref('');
    const editableTitle = ref('');

    watch(
        productId,
        (id) => {
            editableProductId.value = id;
            editableTitle.value =
                selectedAas.value?.idShort?.trim() || selectedAas.value?.id || id;
        },
        { immediate: true }
    );

    function onSave(): void {
        navigationStore.dispatchSnackbar({
            status: true,
            timeout: 3000,
            color: 'success',
            btnColor: 'buttonText',
            text: 'DPP saved successfully.',
        });
    }
</script>
