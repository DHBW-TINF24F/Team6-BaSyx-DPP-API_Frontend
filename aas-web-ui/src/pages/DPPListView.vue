<template>
  <v-container fluid class="pa-4">

    <!-- Suchfeld -->
    <v-row class="mb-6" justify="center">
      <v-col cols="12" md="6">
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          placeholder="AAS search..."
          variant="outlined"
          density="comfortable"
          clearable
        />
      </v-col>
    </v-row>

    <!-- Titel -->
    <div class="section-title text-h5 mb-3">
      Available AAS
    </div>

    <!-- Liste -->
    <v-card elevation="2">
      <v-list lines="two">

        <!-- Loading -->
        <v-list-item v-if="loading">
          <v-list-item-title>
            Loading AAS...
          </v-list-item-title>
        </v-list-item>

        <!-- Fehler -->
        <v-list-item v-else-if="error">
          <v-list-item-title class="text-error">
            {{ error }}
          </v-list-item-title>
        </v-list-item>

        <!-- AAS Liste -->
        <v-list-item
          v-for="aas in filteredAas"
          :key="aas.id"
          class="aas-item"
          @click="goToAas(aas.id, aas.name)"
        >

          <!-- Icon links -->
          <template #prepend>
            <v-icon color="primary">
              mdi-cube-outline
            </v-icon>
          </template>

          <!-- Name + ID -->
          <v-list-item-title
            class="d-flex align-center ga-3"
          >
            <!-- Name -->
            <span class="aas-name">
              {{ aas.name }}
            </span>

            <!-- ID Pill -->
            <v-chip
              size="small"
              color="primary"
              variant="tonal"
              pill
            >
              {{ aas.id }}
            </v-chip>
          </v-list-item-title>

          <!-- Beschreibung -->
          <v-list-item-subtitle>
            {{ aas.description }}
          </v-list-item-subtitle>

          <!-- Pfeil rechts -->
          <template #append>
            <v-icon>
              mdi-chevron-right
            </v-icon>
          </template>

        </v-list-item>

      </v-list>
    </v-card>

  </v-container>
</template>

<script lang="ts" setup>
import { useEnvStore } from '@/store/EnvironmentStore'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

/* Router */
const router = useRouter()

/* Suche */
const search = ref('')

/* Loading + Error */
const loading = ref(false)
const error = ref('')

/* AAS Daten */
const aasList = ref<
  {
    id: string
    name: string
    description: string
  }[]
>([])

/* API URL */
const API_URL = useEnvStore().getEnvAASRepoPath || 'http://localhost:8081/shells'

/* Daten laden */
async function fetchAAS() {
  loading.value = true
  error.value = ''

  try {
    const response = await fetch(API_URL)

    if (!response.ok) {
      throw new Error('Failed to fetch AAS data')
    }

    const data = await response.json()

    console.log('API RESPONSE:', data)

    /* Falls API result benutzt */
    const aasArray = data.result || data

    aasList.value = aasArray.map((item: any) => ({
      id: item.id,

      // Name:
      // 1. displayName EN / EN-US
      // 2. erstes displayName
      // 3. idShort
      // 4. fallback
      name:
        item.displayName?.find(
          (d: any) => d.language?.startsWith('en')
        )?.text
        ||
        item.displayName?.[0]?.text
        ||
        item.idShort
        ||
        'No Name',

      // Description:
      // 1. description EN
      // 2. erste description
      // 3. fallback
      description:
        item.description?.find(
          (d: any) => d.language?.startsWith('en')
        )?.text
        ||
        item.description?.[0]?.text
        ||
        ' ',
    }))

  } catch (err: any) {
    error.value =
      err.message || 'Unknown error'
  } finally {
    loading.value = false
  }
}

/* Beim Laden ausführen */
onMounted(() => {
  fetchAAS()
})

/* Suche */
const filteredAas = computed(() => {
  if (!search.value) {
    return aasList.value
  }

  return aasList.value.filter(a =>
    a.name
      .toLowerCase()
      .includes(search.value.toLowerCase())
  )
})

/* Navigation */
function goToAas(id: string, name?: string) {
  // Pass the human-readable name via history state so it is not visible in the URL
  router.push({ name: 'DPPDetailPage', query: { productId: id }, state: { name } })
}
</script>

<style scoped>
.section-title {
  color: rgb(var(--v-theme-titleText));
  border-bottom: 2px solid rgb(var(--v-theme-primary));
  padding-bottom: 8px;
}

.aas-item {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.aas-item:hover {
  background-color: rgba(var(--v-theme-primary), 0.08);
}

.aas-name {
  font-weight: 600;
}
</style>