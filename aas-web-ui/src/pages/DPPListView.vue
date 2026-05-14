<template>
  <v-container fluid class="pa-4">

    <!-- Search -->
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

    <!-- AVAILABLE DPPS -->
    <template v-if="availableDpps.length > 0">
      <div class="section-title text-h5 mb-3">
        Available DPPs
      </div>

      <v-card elevation="2" class="mb-6">
        <v-list lines="two">

          <v-list-item v-if="loading">
            <v-list-item-title>
              Loading AAS...
            </v-list-item-title>
          </v-list-item>

          <v-list-item v-else-if="error">
            <v-list-item-title class="text-error">
              {{ error }}
            </v-list-item-title>
          </v-list-item>

          <v-list-item
            v-for="aas in availableDpps"
            :key="aas.id"
            class="aas-item"
            @click="goToAas(aas.id)"
          >
            <template #prepend>
              <v-icon color="primary">
                mdi-package-variant
              </v-icon>
            </template>

            <v-list-item-title class="d-flex align-center ga-3">
              <span class="aas-name">{{ aas.name }}</span>

              <v-chip
                size="small"
                color="primary"
                variant="tonal"
                pill
              >
                {{ aas.id }}
              </v-chip>
            </v-list-item-title>

            <v-list-item-subtitle>
              {{ aas.description }}
            </v-list-item-subtitle>

            <template #append>
              <v-icon>mdi-chevron-right</v-icon>
            </template>
          </v-list-item>

        </v-list>
      </v-card>
    </template>

    <!-- AAS WITHOUT DPPS -->
    <template v-if="aasWithoutDpps.length > 0">
      <div class="section-title text-h5 mb-3">
        AAS without DPPs
      </div>

      <v-card elevation="2">
        <v-list lines="two">

          <v-list-item v-if="loading">
            <v-list-item-title>
              Loading AAS...
            </v-list-item-title>
          </v-list-item>

          <v-list-item v-else-if="error">
            <v-list-item-title class="text-error">
              {{ error }}
            </v-list-item-title>
          </v-list-item>

          <v-list-item
            v-for="aas in aasWithoutDpps"
            :key="aas.id"
            class="aas-item"
            @click="goToAas(aas.id)"
          >
            <template #prepend>
              <v-icon color="grey">
                mdi-cube-outline
              </v-icon>
            </template>

            <v-list-item-title class="d-flex align-center ga-3">
              <span class="aas-name">{{ aas.name }}</span>

              <v-chip
                size="small"
                color="grey"
                variant="tonal"
                pill
              >
                {{ aas.id }}
              </v-chip>
            </v-list-item-title>

            <v-list-item-subtitle>
              {{ aas.description }}
            </v-list-item-subtitle>

            <template #append>
              <v-icon>mdi-chevron-right</v-icon>
            </template>
          </v-list-item>

        </v-list>
      </v-card>
    </template>

  </v-container>
</template>

<script lang="ts" setup>
import { useEnvStore } from '@/store/EnvironmentStore'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

/* state */
const search = ref('')
const loading = ref(false)
const error = ref('')

const aasList = ref<any[]>([])
const aasWithDpp = ref<Set<string>>(new Set())

/* APIs & DPPs*/
const AAS_URL = useEnvStore().getEnvAASRepoPath || 'http://localhost:8081/shells'

const DPP_API = 'https://srv01.noah-becker.de/uni/swe/api/dpp/dppsByProductId'

/* fetch DPP by globalAssetId */
function encodeProductId(value: string): string {
  return btoa(value)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

async function fetchDppByGlobalAssetId(
  globalAssetId: string
): Promise<boolean> {
  try {
    const encodedProductId = encodeProductId(globalAssetId)

    console.log('globalAssetId:', globalAssetId)
    console.log('encodedProductId:', encodedProductId)
    const url = `${DPP_API}/${encodedProductId}`
    console.log('Calling:', url)
    const res = await fetch(url)
    console.log('status:', res.status)

    if (!res.ok) {
      return false
    }

    const data = await res.json()
    console.log('DPP response:', data)
    return data?.status === 'success'
  } catch (err) {
    console.error('Failed to fetch DPP:', err)
    return false
  }
}

/* load AAS + DPP check */
async function fetchAAS() {
  loading.value = true
  error.value = ''

  try {
    const res = await fetch(AAS_URL)

    if (!res.ok) {
      throw new Error('Failed to fetch AAS')
    }

    const data = await res.json()

    const aasArray = data.result || data

    const mapped = aasArray.map((item: any) => {
      const globalAssetId =
        item.assetInformation?.globalAssetId || ''

      return {
        id: item.id,
        globalAssetId,
        name:
          item.displayName?.find((d: any) =>
            d.language?.startsWith('en')
          )?.text ||
          item.displayName?.[0]?.text ||
          item.idShort ||
          'No Name',
        description:
          item.description?.find((d: any) =>
            d.language?.startsWith('en')
          )?.text ||
          item.description?.[0]?.text ||
          ' ',
      }
    })

    aasList.value = mapped

    /* check every AAS for DPP */
    const results = await Promise.all(
      mapped.map(async (aas: any) => {
        if (!aas.globalAssetId) {
          return {
            id: aas.id,
            hasDpp: false,
          }
        }

        const hasDpp =
          await fetchDppByGlobalAssetId(
            aas.globalAssetId
          )

        return {
          id: aas.id,
          hasDpp,
        }
      })
    )

    /* store all AAS ids with DPP */
    aasWithDpp.value = new Set(
      results
        .filter(r => r.hasDpp)
        .map(r => r.id)
    )

  } catch (err: any) {
    error.value =
      err.message || 'Unknown error'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchAAS()
})

/* filter */
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

/* categories */
const availableDpps = computed(() =>
  filteredAas.value.filter(a =>
    aasWithDpp.value.has(a.id)
  )
)

const aasWithoutDpps = computed(() =>
  filteredAas.value.filter(
    a => !aasWithDpp.value.has(a.id)
  )
)

/* navigation */
function goToAas(id: string) {
  const encodedId = btoa(id)
  router.push(`/dpp/detail/${encodedId}`)
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