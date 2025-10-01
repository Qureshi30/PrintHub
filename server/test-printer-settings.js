const { mapPrintSettings, validatePageRange, configureDuplexOptions } = require('./src/utils/fileUtils');

/**
 * Comprehensive Test Suite for Printer Settings
 * Run with: node test-printer-settings.js
 */

console.log('🧪 PRINTER SETTINGS TEST SUITE');
console.log('==============================\n');

// Test Cases
const testCases = [
  {
    name: 'Basic Single-Sided Color Printing',
    settings: {
      copies: 1,
      paperType: 'A4',
      duplex: false,
      color: true,
      pages: 'all'
    },
    expected: {
      copies: undefined, // Only set if > 1
      paperSize: 'A4',
      duplex: false,
      color: true,
      monochrome: undefined
    }
  },
  {
    name: 'Multiple Copies with Duplex',
    settings: {
      copies: 3,
      paperType: 'Letter',
      duplex: true,
      color: false,
      pages: 'all'
    },
    expected: {
      copies: 3,
      paperSize: 'Letter',
      duplex: 'long',
      color: undefined,
      monochrome: true
    }
  },
  {
    name: 'Custom Page Range',
    settings: {
      copies: 1,
      paperType: 'A4',
      duplex: false,
      color: false,
      pages: '1-5,8,10-12'
    },
    expected: {
      paperSize: 'A4',
      pages: '1-5,8,10-12',
      duplex: false,
      monochrome: true
    }
  },
  {
    name: 'Single Page Current',
    settings: {
      copies: 1,
      paperType: 'A4',
      duplex: false,
      color: false,
      pages: 'current'
    },
    expected: {
      paperSize: 'A4',
      pages: '1',
      duplex: false,
      monochrome: true
    }
  },
  {
    name: 'A3 Paper with High Copies',
    settings: {
      copies: 25,
      paperType: 'A3',
      duplex: true,
      color: true,
      pages: 'all'
    },
    expected: {
      copies: 25,
      paperSize: 'A3',
      duplex: 'long',
      color: true
    }
  },
  {
    name: 'Certificate Paper (fallback to A4)',
    settings: {
      copies: 1,
      paperType: 'Certificate',
      duplex: false,
      color: false,
      pages: 'all'
    },
    expected: {
      paperSize: 'A4', // Should fallback
      duplex: false,
      monochrome: true
    }
  },
  {
    name: 'Invalid Page Range',
    settings: {
      copies: 1,
      paperType: 'A4',
      duplex: false,
      color: false,
      pages: 'invalid-range'
    },
    expected: {
      paperSize: 'A4',
      pages: undefined, // Should not be set due to invalid range
      duplex: false,
      monochrome: true
    }
  },
  {
    name: 'Maximum Copies Boundary',
    settings: {
      copies: 150, // Over limit
      paperType: 'Legal',
      duplex: true,
      color: false,
      pages: '1-3'
    },
    expected: {
      copies: 100, // Should be clamped to max
      paperSize: 'Legal',
      pages: '1-3',
      duplex: 'long',
      monochrome: true
    }
  }
];

// Run Tests
let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  console.log(`\n📋 Test ${index + 1}: ${testCase.name}`);
  console.log('   Settings:', JSON.stringify(testCase.settings, null, 2));
  
  try {
    const result = mapPrintSettings(testCase.settings);
    
    // Verify expected properties
    let testPassed = true;
    for (const [key, expectedValue] of Object.entries(testCase.expected)) {
      if (expectedValue === undefined) {
        if (result[key] !== undefined) {
          console.log(`   ❌ FAIL: Expected ${key} to be undefined, got ${result[key]}`);
          testPassed = false;
        }
      } else {
        if (result[key] !== expectedValue) {
          console.log(`   ❌ FAIL: Expected ${key} = ${expectedValue}, got ${result[key]}`);
          testPassed = false;
        }
      }
    }
    
    if (testPassed) {
      console.log('   ✅ PASS');
      passed++;
    } else {
      console.log('   ❌ FAIL');
      console.log('   Result:', JSON.stringify(result, null, 2));
      failed++;
    }
    
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    failed++;
  }
});

// Page Range Validation Tests
console.log('\n\n🔢 PAGE RANGE VALIDATION TESTS');
console.log('==============================');

const pageRangeTests = [
  { input: '1-5', expected: '1-5' },
  { input: '1,3,5', expected: '1,3,5' },
  { input: '1-5,8,10-12', expected: '1-5,8,10-12' },
  { input: '1', expected: '1' },
  { input: 'current', expected: '1' },
  { input: 'invalid', expected: null },
  { input: '1-', expected: null },
  { input: 'a-b', expected: null },
  { input: '1-5,invalid,8', expected: null }
];

pageRangeTests.forEach((test, index) => {
  const result = validatePageRange(test.input);
  if (result === test.expected) {
    console.log(`✅ Page Range Test ${index + 1}: "${test.input}" → "${result}"`);
    passed++;
  } else {
    console.log(`❌ Page Range Test ${index + 1}: "${test.input}" → Expected "${test.expected}", got "${result}"`);
    failed++;
  }
});

// Duplex Configuration Tests
console.log('\n\n🔄 DUPLEX CONFIGURATION TESTS');
console.log('============================');

const duplexTests = [
  { duplex: true, name: 'Duplex Enabled' },
  { duplex: false, name: 'Duplex Disabled' }
];

duplexTests.forEach((test, index) => {
  console.log(`\n📋 Duplex Test ${index + 1}: ${test.name}`);
  const options = {};
  configureDuplexOptions(options, test.duplex);
  
  if (test.duplex) {
    // Check duplex options are set
    if (options.duplex === 'long' && 
        options.sides === 'two-sided-long-edge' && 
        options.duplexing === 'DuplexTumble' && 
        options.printOnBothSidesOfPaper === true &&
        options.win32?.duplex === 'DMDUP_VERTICAL') {
      console.log('   ✅ PASS: All duplex options configured correctly');
      passed++;
    } else {
      console.log('   ❌ FAIL: Duplex options not configured correctly');
      console.log('   Result:', JSON.stringify(options, null, 2));
      failed++;
    }
  } else {
    // Check duplex options are disabled
    if (options.duplex === false && 
        options.sides === 'one-sided' && 
        options.duplexing === 'Simplex' && 
        options.printOnBothSidesOfPaper === false) {
      console.log('   ✅ PASS: All simplex options configured correctly');
      passed++;
    } else {
      console.log('   ❌ FAIL: Simplex options not configured correctly');
      console.log('   Result:', JSON.stringify(options, null, 2));
      failed++;
    }
  }
});

// Summary
console.log('\n\n📊 TEST SUMMARY');
console.log('===============');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📋 Total: ${passed + failed}`);

if (failed === 0) {
  console.log('\n🎉 ALL TESTS PASSED! Printer settings are working correctly.');
} else {
  console.log(`\n⚠️  ${failed} test(s) failed. Please review the printer settings implementation.`);
}

process.exit(failed > 0 ? 1 : 0);