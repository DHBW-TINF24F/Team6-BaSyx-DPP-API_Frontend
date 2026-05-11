# Real Backend Integration Test Setup

Dieses Dokument beschreibt, wie die Integrationstests gegen ein echtes DPP-Backend (nicht Mock) ausgeführt werden.

## Aktuelle Test-Modi

### 1. **Mock-Mode (Standard)**
Die Tests laufen standardmäßig gegen einen simulierten Backend mit `vi.stubGlobal('fetch', mockFetch)`.

```bash
# Mock-basierte Tests (Standard)
yarn test:integration
```

**Voraussetzungen:** Nur Node.js und Yarn erforderlich; keine Backend-Installation nötig.

**Verwendung:** Während der Entwicklung und vor Backend-Fertigstellung.

### 2. **Real Backend Mode**
Die Tests laufen gegen einen echten, laufenden DPP-Backend-Server.

```bash
# Real Backend Tests aktivieren
export RUN_REAL_BACKEND_TESTS=true
export DPP_BACKEND_BASE_URL=http://localhost:8080

# Dann Tests ausführen
yarn test:integration
```

Oder als One-Liner (Windows PowerShell):
```powershell
$env:RUN_REAL_BACKEND_TESTS = 'true'; $env:DPP_BACKEND_BASE_URL = 'http://localhost:8080'; & 'C:\Users\Admin\AppData\Local\Temp\WinGet\OpenJS.NodeJS.LTS.24.15.0\extracted\node-v24.15.0-win-x64\corepack.cmd' yarn test:integration
```

Oder als Kurzform mit package.json Script:
```bash
yarn test:integration:real
```

## Vorbereitung des echten Backends

### Voraussetzungen
- **Backend-Server** muss auf der konfigurierten `DPP_BACKEND_BASE_URL` erreichbar sein
- **Standard-Port:** `http://localhost:8080`
- **Alternativ:** `DPP_BACKEND_BASE_URL` Env-Variable setzen

### Erforderliche Endpoints

Das Backend muss folgende Endpoints gemäß [DIN EN 18222](../../PROJECT/SAS/mapping/DPP-Data-Object-Structure.md) bereitstellen:

#### GET Endpoints
- `GET /api/v1/dpp/health` – Health Check, antwortet mit `{ "status": "UP" }`
- `GET /api/v1/dpp/list?limit=5` – Discovery Listing
- `GET /dpps/{dppId}` – Read DPP by ID
- `GET /dppsByProductId/{productId}` – Read DPP by Product ID
- `GET /dppsByProductIdAndDate/{productId}?date=ISO-8601` – Read versioned DPP
- `GET /dpps/{dppId}/collections/{elementId}` – Read Collection
- `GET /dpps/{dppId}/elements/{elementPath}` – Read Element
- `GET /dpp/{productId}` – BaSyx Product-based DPP lookup

#### POST Endpoints
- `POST /dpps` – Create DPP (Body: `{ productId, info, submodels }`)
- `POST /dppsByProductIds` – Batch lookup (Body: `{ productIds: [...] }`)
- `POST /registerDPP` – Register in AAS Registry

#### PATCH Endpoints
- `PATCH /dpps/{dppId}` – Update DPP
- `PATCH /dpps/{dppId}/collections/{elementId}` – Update Collection
- `PATCH /dpps/{dppId}/elements/{elementPath}` – Update Element

#### DELETE Endpoints
- `DELETE /dpps/{dppId}` – Delete DPP (Response: 204 No Content)

### Response Structure Requirements

Alle Endpoints müssen Responses in folgender Standard-Struktur liefern:

**Success Response (200, 201):**
```json
{
  "statusCode": 200,
  "payload": { /* endpoint-specific data */ }
}
```

**Error Response (400, 404):**
```json
{
  "statusCode": 400,
  "errorMessage": {
    "message": "Detailed error description",
    "statusCode": 400
  }
}
```

**No Content Response (204):**
```
[empty body, HTTP 204]
```

### Test-Daten Setup

Für die Integrationstests wird der Backend mit mindestens folgenden Test-DPPs initialisiert:

```typescript
testDppId = 'urn:uuid:test-dpp-1'
testProductId = 'urn:uuid:prod-123'
testDate = '2026-03-31T00:00:00Z'
testRegistryIdentifier = 'aas-registry://dpps/test-dpp-1'
```

Der Backend kann weitere DPP-IDs und Product-IDs nach Bedarf hinzufügen.

## Test-Ausführung gegen echtes Backend

### Schritt 1: Backend starten
Stelle sicher, dass der DPP-Backend auf `http://localhost:8080` läuft.

### Schritt 2: Test-Umgebung setzen
```bash
export RUN_REAL_BACKEND_TESTS=true
export DPP_BACKEND_BASE_URL=http://localhost:8080
```

### Schritt 3: Tests ausführen
```bash
yarn test:integration
```

### Erwartete Ausgabe
```
 RUN  v4.1.0 C:/Users/Admin/Desktop/Team6-BaSyx-DPP-API/SOURCE/frontend/aas-web-ui

 ✓ tests/integration/BaSyxIntegration.test.ts (5 tests) 
 ✓ tests/integration/FrontendBackendIntegration.test.ts (7 tests) 
 ✓ tests/integration/DppApiIntegration.test.ts (14 tests) 

 Test Files  3 passed (3)
      Tests  26 passed (26)
   Start at  [timestamp]
   Duration  [time]ms
```

Alle **26 Tests** sollten bestanden werden.

## Fehlerbehebung

### Fehler: "Cannot connect to backend"
**Ursache:** Backend läuft nicht oder falsche URL.
**Lösung:** 
- Prüfe Backend-Status: `curl http://localhost:8080/api/v1/dpp/health`
- Setze `DPP_BACKEND_BASE_URL` korrekt, z.B. `http://192.168.x.x:8080` für Remote-Backend

### Fehler: "401 Unauthorized"
**Ursache:** Backend erfordert Authentifizierung.
**Lösung:** Erweitere `requestJson()` in `integrationHarness.ts` um Auth-Headers:
```typescript
export async function requestJson(path: string, init: RequestInit = {}, auth?: string) {
    const response = await fetch(`${backendBaseUrl}${path}`, {
        headers: {
            Accept: 'application/json',
            ...(auth ? { Authorization: auth } : {}),
            ...(init.headers || {}),
        },
        ...init,
    });
    // ...
}
```

### Fehler: "404 Not Found"
**Ursache:** Endpoint-Pfad falsch oder nicht implementiert.
**Lösung:** 
- Prüfe [DIN EN 18222 Spezifikation](../../PROJECT/SAS/mapping/DPP-Data-Object-Structure.md)
- Vergleiche mit Mock-Implementation in `integrationHarness.ts`

### Fehler: "Response structure mismatch"
**Ursache:** Backend-Response stimmt nicht mit Test-Erwartungen überein.
**Lösung:**
- Prüfe Response-Struktur gegen Fehlerausgabe
- Aktualisiere Backend-Response oder Test-Assertion

## Konfiguration für CI/CD

Für GitHub Actions oder andere CI-Systeme:

```yaml
- name: Run Real Backend Integration Tests
  env:
    RUN_REAL_BACKEND_TESTS: 'true'
    DPP_BACKEND_BASE_URL: 'http://backend-server:8080'
  run: |
    cd SOURCE/frontend/aas-web-ui
    yarn test:integration
```

## Umschaltung zwischen Mock und Real

Die Umschaltung erfolgt automatisch über die Umgebungsvariable `RUN_REAL_BACKEND_TESTS`:

| Szenario | Befehl | Modus |
|----------|--------|-------|
| **Entwicklung** | `yarn test:integration` | Mock ✅ |
| **Pre-Release** | `yarn test:integration:real` | Real Backend 🔴 |
| **Custom URL** | `DPP_BACKEND_BASE_URL=http://custom:9000 yarn test:integration:real` | Real Backend |
| **Debugging** | `RUN_REAL_BACKEND_TESTS=false yarn test:integration` | Mock (erzwungen) |

## Weitere Ressourcen

- [integrationHarness.ts](tests/integration/integrationHarness.ts) – Mock-Backend Implementation und Shared Test Utilities
- [DppApiIntegration.test.ts](tests/integration/DppApiIntegration.test.ts) – API Tests (14 Fälle)
- [FrontendBackendIntegration.test.ts](tests/integration/FrontendBackendIntegration.test.ts) – Frontend Tests (7 Fälle)
- [BaSyxIntegration.test.ts](tests/integration/BaSyxIntegration.test.ts) – BaSyx Tests (5 Fälle)
- [DIN EN 18222 Mapping](../../PROJECT/SAS/mapping/DPP-Data-Object-Structure.md)
- [Projekt STR](../../PROJECT/STR/TINF24F_STR_Team_6_0v1.md)

## Kontakt & Support

Bei Fragen zur Test-Struktur oder Backend-Integration: Siehe [PROJECT/MEETING_PROTOCOLS](../../PROJECT/MEETING_PROTOCOLS/).
