#!/usr/bin/env node

/**
 * Backend Test Data Setup Script
 *
 * Dieses Script erstellt die notwendigen Test-Daten im echten DPP-Backend.
 * Verwendung:
 *   node scripts/setupTestData.mjs [BACKEND_URL]
 *
 * Beispiele:
 *   node scripts/setupTestData.mjs
 *   node scripts/setupTestData.mjs http://localhost:8080
 *   node scripts/setupTestData.mjs http://backend.example.com:8080
 */

// Configuration
const BACKEND_BASE_URL = process.argv[2] || process.env.DPP_BACKEND_BASE_URL || 'http://localhost:8080';
const TEST_DPP_ID = 'urn:uuid:test-dpp-1';
const TEST_PRODUCT_ID = 'urn:uuid:prod-123';
const TEST_REGISTRY_ID = 'aas-registry://dpps/test-dpp-1';

const NAMEPLATE_SEMANTIC_ID = 'https://admin-shell.io/idta/Nameplate/1/0';
const TECHNICAL_DATA_SEMANTIC_ID = 'https://admin-shell.io/idta/TechnicalData/1/0';
const CARBON_FOOTPRINT_SEMANTIC_ID = 'https://admin-shell.io/idta/CarbonFootprint/1/0';

// Test Data Templates
const testDppData = {
    productId: TEST_PRODUCT_ID,
    info: {
        productId: TEST_PRODUCT_ID,
        productName: 'Industrial Motor 3000',
        manufacturerProductDesignation: 'Industrial Motor 3000',
        manufacturer: 'Team 6 Manufacturing',
        version: '1.0.0',
    },
    submodels: [
        {
            idShort: 'nameplate',
            semanticId: NAMEPLATE_SEMANTIC_ID,
            name: 'Digital Nameplate',
            elementCount: 4,
        },
        {
            idShort: 'technicalData',
            semanticId: TECHNICAL_DATA_SEMANTIC_ID,
            name: 'Technical Data',
            elementCount: 6,
        },
        {
            idShort: 'carbonFootprint',
            semanticId: CARBON_FOOTPRINT_SEMANTIC_ID,
            name: 'Product Carbon Footprint',
            elementCount: 3,
        },
    ],
    assetInformation: {
        assetKind: 'Instance',
        globalAssetId: 'urn:uuid:asset-123',
    },
};

// Utility Functions
async function fetchJson(path, method = 'GET', body = null) {
    const url = `${BACKEND_BASE_URL}${path}`;
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(url, options);
        let data = null;
        try {
            data = await response.json();
        } catch {
            data = null;
        }

        return {
            status: response.status,
            ok: response.ok,
            data,
            url,
            method,
        };
    } catch (error) {
        console.error(`[ERROR] Fetch error for ${method} ${path}:`, error.message);
        throw error;
    }
}

async function checkHealth() {
    // console.log(`\n[INFO] Checking backend health: ${BACKEND_BASE_URL}`);
    try {
        const result = await fetchJson('/api/v1/dpp/health');
        if (result.ok && result.data?.status === 'UP') {
            // console.log('[OK] Backend is UP');
            return true;
        }

        console.error(`[ERROR] Backend health check failed: ${result.status}`);
        return false;
    } catch {
        console.error('[ERROR] Cannot connect to backend. Make sure it is running.');
        return false;
    }
}

async function createTestDpp() {
    // console.log(`\n[INFO] Creating test DPP: ${TEST_DPP_ID}`);
    const result = await fetchJson('/dpps', 'POST', testDppData);

    if (!result.ok) {
        console.error(`[ERROR] Failed to create DPP (${result.status}):`, result.data);
        return false;
    }

    if (result.data?.dppID === TEST_DPP_ID) {
        // console.log(`[OK] DPP created: ${result.data.dppID}`);
        return true;
    }

    console.error('[ERROR] Unexpected response structure:', result.data);
    return false;
}

async function registerDpp() {
    // console.log(`\n[INFO] Registering DPP in AAS Registry: ${TEST_REGISTRY_ID}`);
    const result = await fetchJson('/registerDPP', 'POST', {
        productId: TEST_PRODUCT_ID,
    });

    if (!result.ok) {
        console.error(`[ERROR] Failed to register DPP (${result.status}):`, result.data);
        return false;
    }

    if (result.data?.registryIdentifier === TEST_REGISTRY_ID) {
        // console.log(`[OK] DPP registered: ${result.data.registryIdentifier}`);
        return true;
    }

    console.error('[ERROR] Unexpected response structure:', result.data);
    return false;
}

async function verifyDppByProductId() {
    // console.log(`\n[INFO] Verifying DPP by Product ID: ${TEST_PRODUCT_ID}`);
    const result = await fetchJson(`/dppsByProductId/${encodeURIComponent(TEST_PRODUCT_ID)}`);

    if (!result.ok) {
        console.error(`[ERROR] Failed to retrieve DPP by Product ID (${result.status}):`, result.data);
        return false;
    }

    if (result.data?.payload?.dppId === TEST_DPP_ID) {
        // console.log(`[OK] DPP found by Product ID: ${result.data.payload.dppId}`);
        return true;
    }

    console.error('[ERROR] Unexpected response structure:', result.data);
    return false;
}

async function verifyDppById() {
    // console.log(`\n[INFO] Verifying DPP by ID: ${TEST_DPP_ID}`);
    const result = await fetchJson(`/dpps/${encodeURIComponent(TEST_DPP_ID)}`);

    if (!result.ok) {
        console.error(`[ERROR] Failed to retrieve DPP by ID (${result.status}):`, result.data);
        return false;
    }

    if (result.data?.payload?.productId === TEST_PRODUCT_ID) {
        // console.log(`[OK] DPP verified: ${result.data.payload.productId}`);
        return true;
    }

    console.error('[ERROR] Unexpected response structure:', result.data);
    return false;
}

async function printSummary(results) {
    /*
    console.log('\n' + '='.repeat(60));
    console.log('Setup Summary:');
    console.log('='.repeat(60));
    console.log(`Backend URL:        ${BACKEND_BASE_URL}`);
    console.log(`Test DPP ID:        ${TEST_DPP_ID}`);
    console.log(`Test Product ID:    ${TEST_PRODUCT_ID}`);
    console.log(`Test Registry ID:   ${TEST_REGISTRY_ID}`);
    console.log(`\nResults:`);
    console.log(`  Health Check:      ${results.health ? 'PASS' : 'FAIL'}`);
    console.log(`  Create DPP:        ${results.create ? 'PASS' : 'FAIL'}`);
    console.log(`  Register DPP:      ${results.register ? 'PASS' : 'FAIL'}`);
    console.log(`  Verify by ID:      ${results.verifyId ? 'PASS' : 'FAIL'}`);
    console.log(`  Verify by Prod ID: ${results.verifyProdId ? 'PASS' : 'FAIL'}`);
    */

    const allPassed = Object.values(results).every((v) => v === true);
    console.warn('\n' + '='.repeat(60));
    if (allPassed) {
        console.warn('All setup steps completed successfully.');
        console.warn('You can now run: yarn test:integration:real');
    } else {
        console.warn('Some setup steps failed. Please check the errors above.');
        process.exit(1);
    }
    console.warn('='.repeat(60) + '\n');
}

// Main Execution
async function main() {
    // console.log('\n' + '='.repeat(60));
    // console.log('Backend Test Data Setup Script');
    // console.log('='.repeat(60));

    const results = {
        health: false,
        create: false,
        register: false,
        verifyId: false,
        verifyProdId: false,
    };

    try {
        // Step 1: Health Check
        results.health = await checkHealth();
        if (!results.health) {
            throw new Error('Backend is not reachable');
        }

        // Step 2: Create Test DPP
        results.create = await createTestDpp();

        // Step 3: Register DPP
        results.register = await registerDpp();

        // Step 4: Verify by ID
        results.verifyId = await verifyDppById();

        // Step 5: Verify by Product ID
        results.verifyProdId = await verifyDppByProductId();

        // Print Summary
        await printSummary(results);
    } catch (error) {
        console.error('\n[ERROR] Setup failed:', error.message);
        process.exit(1);
    }
}

main();
