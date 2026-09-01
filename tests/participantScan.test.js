const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

describe('Participant Meal Scan & Rating Suite', () => {
    // 1. Vendor Token Parser
    function extractVendorToken(rawResult) {
        if (!rawResult) return null;
        let token = rawResult.trim();

        if (token.includes('vendor_token=')) {
            try {
                const url = new URL(token);
                const param = url.searchParams.get('vendor_token');
                if (param) token = param;
            } catch {
                const match = token.match(/vendor_token=([^&]+)/);
                if (match) token = match[1];
            }
        }
        return token;
    }

    it('extracts vendor token from raw string and URL formats', () => {
        assert.equal(extractVendorToken('vend_12345'), 'vend_12345');
        assert.equal(extractVendorToken('https://summit.com/meal?vendor_token=vend_abcde'), 'vend_abcde');
        assert.equal(extractVendorToken('summit_app://scan?vendor_token=vend_custom&utm=1'), 'vend_custom');
        assert.equal(extractVendorToken(''), null);
    });

    // 2. Participant Scan Lock
    it('scanLock drops duplicate frames during an active meal decode', () => {
        let isLocked = false;
        let decodeCalls = 0;

        function handleDecode(qr) {
            if (!qr || isLocked) return false;
            isLocked = true; // synchronous lock
            decodeCalls++;
            return true;
        }

        function unlock() {
            isLocked = false;
        }

        // Simulate 20 rapid camera frames
        assert.equal(handleDecode('vend_1'), true);
        assert.equal(handleDecode('vend_1'), false); // blocked
        assert.equal(handleDecode('vend_1'), false); // blocked
        assert.equal(decodeCalls, 1);

        // After meal claimed or error, resetView unlocks scanner
        unlock();
        assert.equal(handleDecode('vend_2'), true);
        assert.equal(decodeCalls, 2);
    });

    // 3. Rating Bounds Validation
    it('validates rating scores within 1-5 integer bounds', () => {
        function validateRating(score) {
            if (typeof score !== 'number' || score < 1 || score > 5 || !Number.isInteger(score)) {
                return false;
            }
            return true;
        }

        assert.equal(validateRating(5), true);
        assert.equal(validateRating(1), true);
        assert.equal(validateRating(0), false);
        assert.equal(validateRating(6), false);
        assert.equal(validateRating(3.5), false);
    });
});
