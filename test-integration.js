#!/usr/bin/env node

/**
 * Integration Test Suite
 * Tests the actual API endpoints and manual override functionality
 */

const http = require('http');

// Test configuration
const API_BASE = 'http://meatpi:3003';
const BIBLE_API_BASE = 'http://meatpi:3005';

// Test results tracking
let testResults = {
    apiHealth: null,
    bibleApiHealth: null,
    manualOverrideEndpoint: null,
    bibleDataFetch: null,
    fullWorkflow: null
};

// Helper function to make HTTP requests
function makeRequest(options, postData = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({ status: res.statusCode, data: jsonData });
                } catch (error) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        if (postData) {
            req.write(JSON.stringify(postData));
        }
        
        req.end();
    });
}

// Test 1: API Health Check
async function testAPIHealth() {
    console.log('🧪 Test 1: API Health Check');
    
    try {
        const options = {
            hostname: 'meatpi',
            port: 3003,
            path: '/api/health',
            method: 'GET'
        };
        
        const response = await makeRequest(options);
        
        if (response.status === 200 && response.data.status === 'ok') {
            console.log('✅ tScribe API is healthy');
            testResults.apiHealth = { success: true, message: 'API healthy' };
        } else {
            console.log('❌ tScribe API health check failed');
            testResults.apiHealth = { success: false, message: `Status: ${response.status}, Response: ${JSON.stringify(response.data)}` };
        }
    } catch (error) {
        console.log('❌ tScribe API health check error:', error.message);
        testResults.apiHealth = { success: false, message: error.message };
    }
}

// Test 2: Bible API Health Check
async function testBibleAPIHealth() {
    console.log('🧪 Test 2: Bible API Health Check');
    
    try {
        const options = {
            hostname: 'meatpi',
            port: 3005,
            path: '/api/health',
            method: 'GET'
        };
        
        const response = await makeRequest(options);
        
        if (response.status === 200 && response.data.status === 'healthy') {
            console.log('✅ Bible API is healthy');
            testResults.bibleApiHealth = { success: true, message: 'Bible API healthy' };
        } else {
            console.log('❌ Bible API health check failed');
            testResults.bibleApiHealth = { success: false, message: `Status: ${response.status}` };
        }
    } catch (error) {
        console.log('❌ Bible API health check error:', error.message);
        testResults.bibleApiHealth = { success: false, message: error.message };
    }
}

// Test 3: Manual Override Endpoint Test
async function testManualOverrideEndpoint() {
    console.log('🧪 Test 3: Manual Override Endpoint Test');
    
    try {
        const testPayload = {
            book: 'GEN',
            chapter: 1,
            version: 'WEB',
            maxSentences: 5,
            excludeVerseNumbers: true,
            createVideo: false,
            transcribeFullBook: false,
            manualOverride: {
                enabled: true,
                introduction: 'Custom Introduction for Testing',
                content: 'This is custom text content for testing the manual override functionality. It should be processed instead of the original Bible text.',
                maxSentences: 3,
                ttsSpeed: 'normal'
            }
        };
        
        const options = {
            hostname: 'meatpi',
            port: 3003,
            path: '/api/transcribe',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        console.log('Sending manual override request...');
        const response = await makeRequest(options, testPayload);
        
        if (response.status === 200 && response.data.success) {
            console.log('✅ Manual override endpoint accepted request');
            console.log(`Job ID: ${response.data.jobId}`);
            testResults.manualOverrideEndpoint = { 
                success: true, 
                message: `Job started: ${response.data.jobId}`,
                jobId: response.data.jobId
            };
        } else {
            console.log('❌ Manual override endpoint failed');
            console.log('Response:', response);
            testResults.manualOverrideEndpoint = { 
                success: false, 
                message: `Status: ${response.status}, Data: ${JSON.stringify(response.data)}`
            };
        }
    } catch (error) {
        console.log('❌ Manual override endpoint error:', error.message);
        testResults.manualOverrideEndpoint = { success: false, message: error.message };
    }
}

// Test 4: Bible Data Fetch Test
async function testBibleDataFetch() {
    console.log('🧪 Test 4: Bible Data Fetch Test');
    
    try {
        const options = {
            hostname: 'meatpi',
            port: 3005,
            path: '/api/books/GEN/chapters/1',
            method: 'GET'
        };
        
        const response = await makeRequest(options);
        
        if (response.status === 200 && response.data.success) {
            console.log('✅ Bible data fetch successful');
            console.log(`Chapter text length: ${response.data.data.text ? response.data.data.text.length : 'N/A'} characters`);
            testResults.bibleDataFetch = { 
                success: true, 
                message: 'Bible data fetched successfully',
                textLength: response.data.data.text ? response.data.data.text.length : 0
            };
        } else {
            console.log('❌ Bible data fetch failed');
            testResults.bibleDataFetch = { 
                success: false, 
                message: `Status: ${response.status}`
            };
        }
    } catch (error) {
        console.log('❌ Bible data fetch error:', error.message);
        testResults.bibleDataFetch = { success: false, message: error.message };
    }
}

// Test 5: Full Workflow Test (without actually processing)
async function testFullWorkflow() {
    console.log('🧪 Test 5: Full Workflow Test');
    
    try {
        // Test the workflow by checking if all components are accessible
        const components = [
            { name: 'tScribe API', url: 'http://meatpi:3003/api/health' },
            { name: 'Bible API', url: 'http://meatpi:3005/api/health' },
            { name: 'Bible Books Endpoint', url: 'http://meatpi:3005/api/books' }
        ];
        
        let allComponentsWorking = true;
        const results = [];
        
        for (const component of components) {
            try {
                const url = new URL(component.url);
                const options = {
                    hostname: url.hostname,
                    port: url.port,
                    path: url.pathname,
                    method: 'GET'
                };
                
                const response = await makeRequest(options);
                if (response.status === 200) {
                    results.push(`✅ ${component.name}: Working`);
                } else {
                    results.push(`❌ ${component.name}: Status ${response.status}`);
                    allComponentsWorking = false;
                }
            } catch (error) {
                results.push(`❌ ${component.name}: ${error.message}`);
                allComponentsWorking = false;
            }
        }
        
        results.forEach(result => console.log(result));
        
        if (allComponentsWorking) {
            console.log('✅ All workflow components are accessible');
            testResults.fullWorkflow = { success: true, message: 'All components working' };
        } else {
            console.log('❌ Some workflow components are not accessible');
            testResults.fullWorkflow = { success: false, message: 'Some components failed' };
        }
        
    } catch (error) {
        console.log('❌ Full workflow test error:', error.message);
        testResults.fullWorkflow = { success: false, message: error.message };
    }
}

// Test 6: Manual Override Parameter Validation
async function testManualOverrideValidation() {
    console.log('🧪 Test 6: Manual Override Parameter Validation');
    
    const testCases = [
        {
            name: 'Valid Manual Override',
            payload: {
                book: 'GEN',
                chapter: 1,
                version: 'WEB',
                manualOverride: {
                    enabled: true,
                    content: 'Valid test content',
                    introduction: 'Valid introduction',
                    maxSentences: 5
                }
            },
            expectedSuccess: true
        },
        {
            name: 'Manual Override with Empty Content',
            payload: {
                book: 'GEN',
                chapter: 1,
                version: 'WEB',
                manualOverride: {
                    enabled: true,
                    content: '',
                    introduction: 'Valid introduction',
                    maxSentences: 5
                }
            },
            expectedSuccess: false
        },
        {
            name: 'Manual Override Disabled',
            payload: {
                book: 'GEN',
                chapter: 1,
                version: 'WEB',
                manualOverride: {
                    enabled: false,
                    content: 'This should be ignored',
                    introduction: 'This should be ignored',
                    maxSentences: 5
                }
            },
            expectedSuccess: true
        }
    ];
    
    for (const testCase of testCases) {
        try {
            const options = {
                hostname: 'meatpi',
                port: 3003,
                path: '/api/transcribe',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            
            console.log(`Testing: ${testCase.name}`);
            const response = await makeRequest(options, testCase.payload);
            
            if (testCase.expectedSuccess && response.status === 200) {
                console.log(`✅ ${testCase.name}: Passed`);
            } else if (!testCase.expectedSuccess && response.status !== 200) {
                console.log(`✅ ${testCase.name}: Correctly rejected`);
            } else {
                console.log(`❌ ${testCase.name}: Unexpected result (Status: ${response.status})`);
            }
        } catch (error) {
            console.log(`❌ ${testCase.name}: Error - ${error.message}`);
        }
    }
}

// Run all tests
async function runAllTests() {
    console.log('🚀 Starting Integration Test Suite\n');
    
    try {
        await testAPIHealth();
        await testBibleAPIHealth();
        await testBibleDataFetch();
        await testFullWorkflow();
        await testManualOverrideValidation();
        await testManualOverrideEndpoint();
        
        console.log('\n📊 Test Summary:');
        console.log('================');
        
        Object.entries(testResults).forEach(([testName, result]) => {
            if (result) {
                const status = result.success ? '✅' : '❌';
                console.log(`${status} ${testName}: ${result.message}`);
            }
        });
        
        const passedTests = Object.values(testResults).filter(r => r && r.success).length;
        const totalTests = Object.values(testResults).filter(r => r !== null).length;
        
        console.log(`\n🎯 Overall Result: ${passedTests}/${totalTests} tests passed`);
        
        if (passedTests === totalTests) {
            console.log('🎉 All integration tests passed!');
            return true;
        } else {
            console.log('⚠️  Some integration tests failed');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Test suite error:', error.message);
        return false;
    }
}

// Export for use in other test files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        runAllTests,
        testResults
    };
}

// Run tests if this file is executed directly
if (require.main === module) {
    runAllTests().then(success => {
        process.exit(success ? 0 : 1);
    });
}
