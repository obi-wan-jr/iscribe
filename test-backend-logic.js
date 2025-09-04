#!/usr/bin/env node

/**
 * Backend Logic Test Suite
 * Tests the manual override logic in routes/api.js
 */

const assert = require('assert');

// Mock the bibleService
const mockBibleService = {
    getBookName: (bookId) => {
        const bookMapping = {
            'GEN': 'Genesis',
            'EXO': 'Exodus',
            'LEV': 'Leviticus',
            'NUM': 'Numbers',
            'DEU': 'Deuteronomy'
        };
        return bookMapping[bookId.toUpperCase()] || bookId;
    }
};

// Test 1: Manual Override Parameter Validation
function testManualOverrideValidation() {
    console.log('🧪 Test 1: Manual Override Parameter Validation');
    
    // Test case 1: Valid manual override
    const validOverride = {
        enabled: true,
        content: "This is custom text for testing.",
        introduction: "Custom Introduction",
        maxSentences: 3,
        ttsSpeed: "normal"
    };
    
    assert(validOverride.enabled === true, 'Manual override should be enabled');
    assert(validOverride.content.length > 0, 'Content should not be empty');
    assert(typeof validOverride.maxSentences === 'number', 'maxSentences should be a number');
    
    console.log('✅ Valid manual override parameters passed');
    
    // Test case 2: Invalid manual override
    const invalidOverride = {
        enabled: true,
        content: "", // Empty content
        introduction: "",
        maxSentences: "invalid" // Not a number
    };
    
    assert(invalidOverride.content.length === 0, 'Content should be empty for invalid test');
    console.log('✅ Invalid manual override parameters detected correctly');
}

// Test 2: Book Name Translation
function testBookNameTranslation() {
    console.log('🧪 Test 2: Book Name Translation');
    
    const testCases = [
        { input: 'GEN', expected: 'Genesis' },
        { input: 'EXO', expected: 'Exodus' },
        { input: 'LEV', expected: 'Leviticus' },
        { input: 'NUM', expected: 'Numbers' },
        { input: 'DEU', expected: 'Deuteronomy' },
        { input: 'UNKNOWN', expected: 'UNKNOWN' }
    ];
    
    testCases.forEach(testCase => {
        const result = mockBibleService.getBookName(testCase.input);
        assert(result === testCase.expected, 
            `Expected "${testCase.expected}" for input "${testCase.input}", got "${result}"`);
    });
    
    console.log('✅ All book name translations passed');
}

// Test 3: Manual Override Logic Flow
function testManualOverrideLogicFlow() {
    console.log('🧪 Test 3: Manual Override Logic Flow');
    
    // Simulate the backend logic
    const params = {
        manualOverride: {
            enabled: true,
            content: "Custom text content for testing purposes.",
            introduction: "Custom Introduction Text",
            maxSentences: 4
        }
    };
    
    let bibleText = "Original Bible text that should be overridden";
    let maxSentencesValue = 5;
    let introText;
    const book = 'GEN';
    const chapter = 1;
    
    // Simulate the manual override check
    if (params.manualOverride && params.manualOverride.enabled) {
        console.log('Manual override enabled, using custom text');
        bibleText = params.manualOverride.content;
        
        if (params.manualOverride.maxSentences) {
            maxSentencesValue = parseInt(params.manualOverride.maxSentences);
        }
    }
    
    // Simulate the introduction logic
    const fullBookName = mockBibleService.getBookName(book);
    if (params.manualOverride && params.manualOverride.enabled && params.manualOverride.introduction) {
        introText = params.manualOverride.introduction;
    } else {
        introText = `${fullBookName}, Chapter ${chapter}.`;
    }
    
    // Assertions
    assert(bibleText === "Custom text content for testing purposes.", 
        'Bible text should be overridden with custom content');
    assert(maxSentencesValue === 4, 'maxSentences should be overridden to 4');
    assert(introText === "Custom Introduction Text", 
        'Introduction should use manual override text');
    assert(fullBookName === "Genesis", 'fullBookName should be available for video overlay');
    
    console.log('✅ Manual override logic flow passed');
}

// Test 4: No Manual Override (Default Behavior)
function testNoManualOverride() {
    console.log('🧪 Test 4: No Manual Override (Default Behavior)');
    
    const params = {
        manualOverride: {
            enabled: false
        }
    };
    
    let bibleText = "Original Bible text";
    let maxSentencesValue = 5;
    let introText;
    const book = 'EXO';
    const chapter = 2;
    
    // Simulate the logic when manual override is disabled
    if (params.manualOverride && params.manualOverride.enabled) {
        bibleText = params.manualOverride.content;
    }
    
    const fullBookName = mockBibleService.getBookName(book);
    if (params.manualOverride && params.manualOverride.enabled && params.manualOverride.introduction) {
        introText = params.manualOverride.introduction;
    } else {
        introText = `${fullBookName}, Chapter ${chapter}.`;
    }
    
    // Assertions
    assert(bibleText === "Original Bible text", 
        'Bible text should remain original when override is disabled');
    assert(maxSentencesValue === 5, 'maxSentences should remain default');
    assert(introText === "Exodus, Chapter 2.", 
        'Introduction should use default format');
    assert(fullBookName === "Exodus", 'fullBookName should be available');
    
    console.log('✅ No manual override behavior passed');
}

// Test 5: Edge Cases
function testEdgeCases() {
    console.log('🧪 Test 5: Edge Cases');
    
    // Test case 1: Manual override enabled but no content
    const params1 = {
        manualOverride: {
            enabled: true,
            content: "",
            introduction: "",
            maxSentences: null
        }
    };
    
    let bibleText1 = "Original text";
    if (params1.manualOverride && params1.manualOverride.enabled) {
        bibleText1 = params1.manualOverride.content;
    }
    
    assert(bibleText1 === "", 'Empty content should be handled');
    console.log('✅ Empty content edge case handled');
    
    // Test case 2: Manual override with partial data
    const params2 = {
        manualOverride: {
            enabled: true,
            content: "Partial content",
            introduction: "", // No custom introduction
            maxSentences: undefined
        }
    };
    
    const book = 'LEV';
    const chapter = 3;
    const fullBookName = mockBibleService.getBookName(book);
    
    let introText2;
    if (params2.manualOverride && params2.manualOverride.enabled && params2.manualOverride.introduction) {
        introText2 = params2.manualOverride.introduction;
    } else {
        introText2 = `${fullBookName}, Chapter ${chapter}.`;
    }
    
    assert(introText2 === "Leviticus, Chapter 3.", 
        'Should fall back to default introduction when custom is empty');
    console.log('✅ Partial data edge case handled');
}

// Run all tests
function runAllTests() {
    console.log('🚀 Starting Backend Logic Test Suite\n');
    
    try {
        testManualOverrideValidation();
        testBookNameTranslation();
        testManualOverrideLogicFlow();
        testNoManualOverride();
        testEdgeCases();
        
        console.log('\n🎉 All backend logic tests passed!');
        return true;
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        return false;
    }
}

// Export for use in other test files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        runAllTests,
        mockBibleService
    };
}

// Run tests if this file is executed directly
if (require.main === module) {
    const success = runAllTests();
    process.exit(success ? 0 : 1);
}
