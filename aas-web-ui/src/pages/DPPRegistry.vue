<template>
  <v-container fluid class="pa-4">
    <v-row>
      <!-- AAS -->
      <v-col cols="12" md="3">
        <div class="section-title text-h5 mb-3">AAS</div>
        <v-card elevation="2" class="panel-card">
          <div class="pa-4">
            <v-text-field
              v-model="searchAas"
              prepend-inner-icon="mdi-magnify"
              placeholder="Search AAS..."
              variant="outlined"
              density="comfortable"
              clearable
              hide-details
            />
          </div>
          <v-divider />
          <v-list>
            <v-list-item
              v-for="aas in filteredAas"
              :key="aas.id"
              :active="selectedAas?.id === aas.id"
              @click="selectAas(aas)"
            >
              <template #prepend>
                <v-icon color="primary"> mdi-package-variant </v-icon>
              </template>

              <v-list-item-title>
                {{ aas.name }}
              </v-list-item-title>

              <v-list-item-subtitle>
                {{ aas.globalAssetId }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <!-- DPP -->
      <v-col cols="12" md="9">
        <div class="section-title text-h5 mb-3">DPPs</div>
        <v-card elevation="2" class="panel-card pa-3">
          <!-- CREATE BUTTON -->
          <v-btn
            color="primary"
            class="mb-3"
            prepend-icon="mdi-plus"
            :disabled="!selectedAas"
            @click="createDialog = true"
          >
            New DPP / Version
          </v-btn>
          <v-list v-if="selectedAas">
            <v-list-item v-for="dpp in selectedDpps" :key="dpp.id">
              <template #prepend>
                <v-icon color="primary"> mdi-file-document-outline </v-icon>
              </template>
              <v-list-item-title class="d-flex align-center ga-2 flex-wrap">
                <span>
                  {{ formatDate(dpp.createdAt) }}
                </span>
                <span class="text-medium-emphasis"> • </span>
                <span class="font-weight-medium">
                  {{ dpp.id }}
                </span>
                <v-chip size="small" color="primary" variant="tonal">
                  v{{ dpp.version }}
                </v-chip>
              </v-list-item-title>
              <template #append>
                <v-btn
                  icon
                  color="red"
                  variant="text"
                  @click="openDeleteDialog(dpp)"
                >
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </template>
            </v-list-item>
            <v-list-item v-if="selectedDpps.length === 0">
              <v-list-item-title> No DPP found </v-list-item-title>
            </v-list-item>
          </v-list>
          <v-list v-else>
            <v-list-item>
              <v-list-item-title> Select an AAS first </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>

    <!-- DELETE DIALOG -->
    <v-dialog v-model="deleteDialog" max-width="420">
      <v-card>
        <v-card-title>Delete DPP?</v-card-title>
        <v-card-text>
          Delete <b>{{ dppToDelete?.id }}</b
          >?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="red" @click="confirmDelete">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!--CREATE DIALOG -->
    <v-dialog v-model="createDialog" max-width="420">
      <v-card>
        <v-card-title>Create DPP Version</v-card-title>
        <v-card-text>
          <v-text-field v-model="newVersion" label="Version (e.g. 1.0, 2.0)" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="createDialog = false"> Cancel </v-btn>
          <v-btn color="primary" @click="createDpp"> Create </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useEnvStore } from "@/store/EnvironmentStore";
import { useAASStore } from "@/store/AASDataStore";

/* STORE */
const aasStore = useAASStore();

/* STATE */
const aasList = ref<any[]>([]);
const selectedAas = ref<any | null>(null);
const searchAas = ref("");
const dppMap = ref<Record<string, any[]>>({});

/* DIALOGS */
const deleteDialog = ref(false);
const createDialog = ref(false);
const dppToDelete = ref<any | null>(null);

/* CREATE INPUT */
const newVersion = ref("1.0");

/* API */
const AAS_URL =
  useEnvStore().getEnvAASRepoPath || "http://localhost:8081/shells";

/* FETCH AAS */
async function fetchAAS() {
  const res = await fetch(AAS_URL);
  const data = await res.json();
  const aasArray = data.result || [];
  aasList.value = aasArray.map((item: any) => ({
    id: item.id,
    productId:
      item.id || item.assetInformation?.specificAssetIds?.[0]?.value || "",
    globalAssetId: item.assetInformation?.globalAssetId || "",
    name: item.displayName?.[0]?.text || item.idShort || "Unnamed",
    _raw: item,
  }));
}

/* LOAD DPPs */
async function loadDpps(aas: any) {
  const encodedAssetId = btoa(aas.productId)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  const res = await fetch(
    "https://srv01.noah-becker.de/uni/swe/api/dpp/dppsByProductIds",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify([encodedAssetId]),
    },
  );
  const data = await res.json();
  const dpps = data?.results?.[encodedAssetId] || [];
  const detailed = await Promise.all(
    dpps.map(async (entry: any) => {
      const detailRes = await fetch(
        `https://srv01.noah-becker.de/uni/swe/api/dpp/dpps/${entry.dppId}`,
      );

      const json = await detailRes.json();
      const dpp = json.dpp;
      return {
        id: dpp.dppId,
        version: dpp.version,
        createdAt: dpp.createdAt,
      };
    }),
  );
  dppMap.value[aas.id] = detailed
    .filter(Boolean)
    .toSorted((a: any, b: any) => Number(b.createdAt) - Number(a.createdAt));
}
/* SELECT */
async function selectAas(aas: any) {
  selectedAas.value = aas;
  aasStore.dispatchSelectedAAS(aas._raw);
  await loadDpps(aas);
}
/* DELETE */
function openDeleteDialog(dpp: any) {
  dppToDelete.value = dpp;
  deleteDialog.value = true;
}

async function confirmDelete() {
  if (!selectedAas.value || !dppToDelete.value) return;
  const aasId = selectedAas.value.id;
  const dppId = String(dppToDelete.value.id);
  await fetch(`https://srv01.noah-becker.de/uni/swe/api/dpp/dpps/${dppId}`, {
    method: "DELETE",
  });
  dppMap.value[aasId] = (dppMap.value[aasId] || []).filter(
    (d) => d.id !== dppId,
  );

  deleteDialog.value = false;
  dppToDelete.value = null;
}

/* CREATE DPP / VERSION */
async function createDpp() {
  if (!selectedAas.value) return;
  const payload = {
    shell: {
      id: selectedAas.value.globalAssetId,
      dpps: [
        {
          productId: selectedAas.value.id,
          version: newVersion.value,
        },
      ],
    },
  };
  await fetch("https://srv01.noah-becker.de/uni/swe/api/dpp/dpps", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });
  createDialog.value = false;
  newVersion.value = "1.0";
  await loadDpps(selectedAas.value);
}

/* FORMAT DATE */
function formatDate(timestamp: string) {
  if (!timestamp) return "Unknown";
  return new Date(Number(timestamp)).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* FILTER */
const filteredAas = computed(() => {
  if (!searchAas.value) return aasList.value;
  return aasList.value.filter((a) =>
    a.name.toLowerCase().includes(searchAas.value.toLowerCase()),
  );
});

/* SELECTED */
const selectedDpps = computed(() => {
  if (!selectedAas.value) return [];
  return dppMap.value[selectedAas.value.id] || [];
});

/* INIT */
onMounted(async () => {
  await fetchAAS();
  const storeAas = aasStore.getSelectedAAS;
  if (storeAas?.id) {
    const match = aasList.value.find((a) => a.id === storeAas.id);
    if (match) await selectAas(match);
  }
});

/* SYNC FROM STORE */
watch(
  () => aasStore.getSelectedAAS,
  async (newVal) => {
    if (!newVal?.id) {
      selectedAas.value = null;
      return;
    }
    if (selectedAas.value?.id === newVal.id) return;
    const match = aasList.value.find((a) => a.id === newVal.id);
    if (match) {
      selectedAas.value = match;
      await loadDpps(match);
    }
  },
);
</script>

<style scoped>
.section-title {
  border-bottom: 2px solid rgb(var(--v-theme-primary));
  padding-bottom: 8px;
}

.panel-card {
  height: calc(100vh - 170px);
  overflow-y: auto;
}
</style>
