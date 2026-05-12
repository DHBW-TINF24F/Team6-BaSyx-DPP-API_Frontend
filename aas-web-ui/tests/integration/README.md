# Integration Tests

Diese Verzeichnis enthält die STR-konformen Integrationstests für das DPP-Backend und Frontend.

## Quick Start

### Mock-Tests (Standard)
```bash
yarn test:integration
```

Führt alle 26 Tests gegen einen simulierten Backend aus. Keine weitere Konfiguration nötig.

**Erwartetes Ergebnis:**
```
 ✓ tests/integration/BaSyxIntegration.test.ts (5 tests) 
 ✓ tests/integration/FrontendBackendIntegration.test.ts (7 tests) 
 ✓ tests/integration/DppApiIntegration.test.ts (14 tests) 

 Test Files  3 passed (3)
      Tests  26 passed (26)
```

### Real-Backend-Tests
```bash
yarn test:integration:real
```

Führt alle 26 Tests gegen einen echten Backend aus. Vorbereitung erforderlich.

**Vorbereitung:**
1. Backend starten auf `http://localhost:8080`
2. Test-Daten initialisieren: `node scripts/setupTestData.mjs`
3. Tests ausführen: `yarn test:integration:real`

**Weitere Details:** Siehe [REAL_BACKEND_SETUP.md](../REAL_BACKEND_SETUP.md)

## Test-Struktur

| Datei | Tests | Fokus |
|-------|-------|-------|
| [DppApiIntegration.test.ts](./DppApiIntegration.test.ts) | 14 | DIN EN 18222 API Endpoints |
| [FrontendBackendIntegration.test.ts](./FrontendBackendIntegration.test.ts) | 7 | Viewer und Frontend-Backend Interaktion |
| [BaSyxIntegration.test.ts](./BaSyxIntegration.test.ts) | 5 | BaSyx Discovery und Orchestrierung |
| [integrationHarness.ts](./integrationHarness.ts) | — | Geteilte Mock-Backend Implementation |

## Umgebungsvariablen

| Variable | Default | Verwendung |
|----------|---------|-----------|
| `RUN_REAL_BACKEND_TESTS` | `false` | Mock-Tests aktivieren (`false`) / Real-Backend-Tests aktivieren (`true`) |
| `DPP_BACKEND_BASE_URL` | `http://localhost:8080` | Backend-URL für Real-Backend-Tests |
| `DPP_TEST_DPP_ID` | `urn:uuid:test-dpp-1` | Test-DPP ID |
| `DPP_TEST_PRODUCT_ID` | `urn:uuid:prod-123` | Test-Product ID |
| `DPP_TEST_DATE` | `2026-03-31T00:00:00Z` | Test-Datum für Versioning |

## Mock-Backend Features

Der integrierte Mock-Backend (`integrationHarness.ts`) stellt folgende Routes bereit:

### Health & Discovery
- `GET /api/v1/dpp/health` – Health Check
- `GET /api/v1/dpp/list?limit=N` – DPP Discovery mit Limit

### CRUD Operations
- `POST /dpps` – DPP erstellen
- `GET /dpps/{dppId}` – DPP abrufen
- `PATCH /dpps/{dppId}` – DPP updaten
- `DELETE /dpps/{dppId}` – DPP löschen

### Product-Based Lookups
- `GET /dppsByProductId/{productId}` – DPP per Produkt
- `GET /dppsByProductIdAndDate/{productId}?date=ISO8601` – Versionierter DPP
- `POST /dppsByProductIds` – Batch-Lookup

### Submodels & Elements
- `GET /dpps/{dppId}/collections/{elementId}` – Collection abrufen
- `GET /dpps/{dppId}/elements/{elementPath}` – Element abrufen

### Registry & BaSyx
- `POST /registerDPP` – Im Registry registrieren
- `GET /dpp/{productId}` – BaSyx-basierter DPP-Lookup

## Entwicklung

### Neue Tests hinzufügen
1. Test-Case zur entsprechenden `.test.ts` Datei hinzufügen
2. Bei Bedarf: Mock-Route in `integrationHarness.ts` hinzufügen oder erweitern
3. Tests lokal mit `yarn test:integration` validieren
4. Against Real Backend mit `yarn test:integration:real` testen (nach Backend-Fertigstellung)

### Mock-Backend erweitern
Bearbeite `integrationHarness.ts`:
- Mock-Daten: `mockDppDocument`, `mockBasyxList`, etc.
- Test-Konstanten: `testDppId`, `testProductId`, etc.
- Mock-Routes: `async function mockFetch(...)`

## Fehlersuche

Siehe [REAL_BACKEND_SETUP.md](../REAL_BACKEND_SETUP.md#fehlerbehandlung)

## Standards & Konformität

Alle Tests folgen:
- ✅ DIN EN 18222 (DPP-Data-Object-Structure)
- ✅ Vitest/Vue Test Utils Best Practices
- ✅ TypeScript strict mode
- ✅ 26 Tests (14 API + 7 Frontend + 5 BaSyx)

## Ressourcen

- [DIN EN 18222 Mapping](../../PROJECT/SAS/mapping/DPP-Data-Object-Structure.md)
- [STR System Test Report](../../PROJECT/STR/TINF24F_STR_Team_6_0v1.md)
- [Real Backend Setup Guide](../REAL_BACKEND_SETUP.md)
- [Setup Test Data Script](../scripts/setupTestData.mjs)
