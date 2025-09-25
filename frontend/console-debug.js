// BROWSER CONSOLE DEBUG SCRIPT
// Copy and paste this entire script into your browser console while logged into admin dashboard
// This will diagnose the exact token issue

console.log('🔍 STARTING ADMIN TOKEN DIAGNOSIS...');
console.log('=====================================');

// Step 1: Check token storage
console.log('STEP 1: Checking token storage...');
const authToken = localStorage.getItem('auth_token');
const adminToken = localStorage.getItem('admin_token');
const regularToken = localStorage.getItem('token');
const userData = localStorage.getItem('user');

console.log('auth_token:', authToken ? `${authToken.substring(0, 30)}...` : 'NOT FOUND');
console.log('admin_token:', adminToken ? `${adminToken.substring(0, 30)}...` : 'NOT FOUND');
console.log('token:', regularToken ? `${regularToken.substring(0, 30)}...` : 'NOT FOUND');
console.log('user data:', userData ? JSON.parse(userData) : 'NOT FOUND');

// Final token (what api.js should use)
const finalToken = authToken || adminToken || regularToken;
console.log('Final token (api.js logic):', finalToken ? `${finalToken.substring(0, 30)}...` : 'NONE AVAILABLE');

if (!finalToken) {
    console.error('❌ PROBLEM FOUND: No token in localStorage!');
    console.log('Solutions:');
    console.log('1. Try logging out and back in');
    console.log('2. Check if login was successful');
    console.log('3. Check AuthContext.login() function');
} else {
    console.log('✅ Token found in localStorage');

    // Step 2: Test direct API call
    console.log('\nSTEP 2: Testing direct API call with token...');

    // Test the debug headers endpoint first
    fetch('http://localhost:8002/api/debug/headers', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${finalToken}`
        }
    }).then(response => {
        console.log('Debug headers response status:', response.status);
        return response.json();
    }).then(data => {
        console.log('Backend received headers:', data);

        if (data.auth_debug && data.auth_debug.HTTP_AUTHORIZATION) {
            console.log('✅ Backend received Authorization header correctly');

            // Step 3: Test user creation
            console.log('\nSTEP 3: Testing user creation...');
            return fetch('http://localhost:8002/api/admin/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${finalToken}`
                },
                body: JSON.stringify({
                    username: `consoletest_${Date.now()}`,
                    email: `console_${Date.now()}@example.com`,
                    first_name: 'Console',
                    last_name: 'Test',
                    role_id: 5
                })
            });
        } else {
            console.error('❌ Backend did NOT receive Authorization header');
            console.log('This indicates a browser/server configuration issue');
            return Promise.reject('Authorization header not received by backend');
        }
    }).then(response => {
        console.log('User creation response status:', response.status);
        return response.json();
    }).then(data => {
        console.log('User creation result:', data);
        if (data.success) {
            console.log('✅ USER CREATION SUCCESSFUL!');
            console.log('The direct API call works - issue is likely in the React app');
        } else {
            console.error('❌ User creation failed:', data.error);
        }
    }).catch(error => {
        console.error('❌ API test failed:', error);
        console.log('This suggests a network or server configuration issue');
    });
}

// Step 4: Check if we're in React app context
console.log('\nSTEP 4: Checking React app context...');
if (typeof React !== 'undefined') {
    console.log('✅ React is available');
} else {
    console.log('❌ React not available - make sure you\'re on the React app page');
}

// Check if apiRequest function is available
if (window.apiRequest || (window.modules && window.modules.apiRequest)) {
    console.log('✅ apiRequest function might be available');
} else {
    console.log('❌ apiRequest function not directly available');
    console.log('This is normal - it\'s imported in components');
}

console.log('\n=====================================');
console.log('🔍 DIAGNOSIS COMPLETE');
console.log('Check the results above to identify the issue');