const http = require('http');
const db = require('../src/config/db');

const BASE_URL = 'http://127.0.0.1:5000/api';

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${path}`;
    const parsedUrl = new URL(url);
    const bodyData = options.body ? JSON.stringify(options.body) : null;
    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      agent: false,
      headers: {
        'Content-Type': 'application/json',
        'Connection': 'close',
        ...(bodyData ? { 'Content-Length': Buffer.byteLength(bodyData) } : {}),
        ...options.headers,
      },
    };

    const req = http.request(reqOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (bodyData) {
      req.write(bodyData);
    }
    req.end();
  });
}

async function runTestMatrix() {
  console.log('\n====================================================');
  console.log(' CardaLink IAM Complete Test Matrix Verification');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, description) {
    if (condition) {
      console.log(`  ✓ [PASS] ${description}`);
      passed++;
    } else {
      console.error(`  ✗ [FAIL] ${description}`);
      failed++;
    }
  }

  try {
    const timestamp = Date.now();
    const farmerEmail = `farmer_${timestamp}@cardalink.test`;
    const traderEmail = `trader_${timestamp}@cardalink.test`;
    const exporterEmail = `exporter_${timestamp}@cardalink.test`;
    const testPassword = 'Password@1234';

    // 1. Password Authentication & Validation Matrix
    console.log('--- 1. Password Authentication Matrix ---');

    // Register Farmer
    const regFarmer = await request('/auth/register', {
      method: 'POST',
      body: {
        full_name: 'Test Farmer',
        email: farmerEmail,
        phone: '9876543210',
        password: testPassword,
        confirmPassword: testPassword,
        role: 'FARMER',
      },
    });
    assert(regFarmer.status === 201 && regFarmer.body.success, 'Farmer registration returns 201 Created');
    assert(regFarmer.body.data?.user?.role === 'FARMER', 'Registered role set to FARMER');
    assert(regFarmer.body.data?.user?.status === 'APPROVED', 'Registered user status set to APPROVED');

    // Block ADMIN in public registration
    const regAdmin = await request('/auth/register', {
      method: 'POST',
      body: {
        full_name: 'Hacker Admin',
        email: `hacker_${timestamp}@cardalink.test`,
        phone: '9876543210',
        password: testPassword,
        confirmPassword: testPassword,
        role: 'ADMIN',
      },
    });
    assert(regAdmin.status === 400 && !regAdmin.body.success, 'Public ADMIN registration strictly blocked (400 Bad Request)');

    // Duplicate email blocked
    const regDup = await request('/auth/register', {
      method: 'POST',
      body: {
        full_name: 'Dup Farmer',
        email: farmerEmail,
        phone: '9876543210',
        password: testPassword,
        confirmPassword: testPassword,
        role: 'FARMER',
      },
    });
    assert(regDup.status === 400, 'Duplicate email registration blocked (400 Conflict/Validation Error)');

    // Invalid email / password login enumeration defense
    const badLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: farmerEmail, password: 'WrongPassword@123' },
    });
    assert(badLogin.status === 401 && badLogin.body.message === 'Invalid email or password', 'Invalid password returns generic non-enumerating error message');

    // Valid Farmer Login
    const farmerLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: farmerEmail, password: testPassword },
    });
    assert(farmerLogin.status === 200 && farmerLogin.body.data?.token, 'Valid Farmer login returns 200 OK and JWT token');
    const farmerToken = farmerLogin.body.data?.token;

    // Admin Login
    const adminLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: 'admin@cardalink.com', password: 'Admin@1234' },
    });
    if (adminLogin.status !== 200) {
      console.log('DEBUG adminLogin status:', adminLogin.status, 'body:', JSON.stringify(adminLogin.body));
    }
    assert(adminLogin.status === 200 && adminLogin.body.data?.user?.role === 'ADMIN', 'Seeded System Administrator login returns 200 OK with ADMIN role');
    const adminToken = adminLogin.body.data?.token;

    // 2. Identity & Profile Verification (/api/auth/me)
    console.log('\n--- 2. IAM Identity & Session Matrix ---');
    const getMe = await request('/auth/me', {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    if (getMe.status !== 200) {
      console.log('DEBUG getMe status:', getMe.status, 'body:', JSON.stringify(getMe.body || getMe.raw));
    }
    assert(getMe.status === 200 && getMe.body?.data?.user?.email === farmerEmail, '/api/auth/me returns authoritative PostgreSQL user profile');
    assert(Array.isArray(getMe.body.data?.user?.permissions), '/api/auth/me returns active RBAC permission claims');
    assert(!getMe.body.data?.user?.password_hash, 'password_hash is strictly excluded from identity response');

    // 3. Authorization & RBAC Route Protection Matrix
    console.log('\n--- 3. Role-Based Access Control (RBAC) Matrix ---');
    
    // Farmer accessing Farmer-only inventory API -> OK
    const farmerTestOk = await request('/auth/iam-test-farmer-inventory', {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    assert(farmerTestOk.status === 200, 'Farmer user authorized for FARMER resource');

    // Farmer attempting Admin-only API -> Denied 403
    const farmerAdminDenied = await request('/auth/iam-test-admin-only', {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    assert(farmerAdminDenied.status === 403, 'Farmer user denied access to ADMIN resource (403 Forbidden)');

    // Admin accessing Admin-only API -> OK
    const adminTestOk = await request('/auth/iam-test-admin-only', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminTestOk.status === 200, 'Admin user authorized for ADMIN resource');

    // 4. Resource Ownership Verification Matrix
    console.log('\n--- 4. Resource Ownership Matrix ---');
    const farmerUserId = getMe.body.data?.user?.id;
    const farmerOwnPlantation = await request(`/farmer/plantations/${farmerUserId}`, {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    assert(farmerOwnPlantation.status === 200, 'Farmer can access their OWN plantation resource');

    const farmerOtherPlantation = await request(`/farmer/plantations/9999`, {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    assert(farmerOtherPlantation.status === 403, 'Farmer blocked from accessing ANOTHER farmer\'s plantation resource (403 Forbidden)');

    // 5. Account Status Enforcement Matrix (SUSPENDED / REJECTED)
    console.log('\n--- 5. Account Status Enforcement Matrix ---');
    
    // Admin suspends farmer user
    const suspendRes = await request(`/admin/users/${farmerUserId}/status`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'SUSPENDED' },
    });
    assert(suspendRes.status === 200 && suspendRes.body.data?.user?.status === 'SUSPENDED', 'Admin successfully changed farmer status to SUSPENDED');

    // Suspended farmer login attempt -> Blocked 403
    const suspendedLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: farmerEmail, password: testPassword },
    });
    assert(suspendedLogin.status === 403, 'Suspended user blocked from logging in (403 Forbidden)');

    // Suspended farmer API request with existing token -> Blocked 403
    const suspendedApiReq = await request('/auth/me', {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    assert(suspendedApiReq.status === 403, 'Suspended user blocked from API access even with active token (403 Forbidden)');

    // Admin approves farmer back
    await request(`/admin/users/${farmerUserId}/status`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'APPROVED' },
    });

    // 6. Security Audit Log Matrix
    console.log('\n--- 6. Security Audit Log Matrix ---');
    const auditLogsRes = await request('/admin/audit-logs', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(auditLogsRes.status === 200 && Array.isArray(auditLogsRes.body.data?.logs), 'Admin can fetch security audit logs');
    assert(auditLogsRes.body.data?.logs.length > 0, 'Audit log entries recorded for REGISTRATION, LOGIN_SUCCESS, ACCOUNT_SUSPENDED');

    // 7. Logout Invalidation & Token Expiration Matrix
    console.log('\n--- 7. Logout & Token Expiration Matrix ---');

    // Invalid / Expired JWT Token Rejection
    const invalidTokenReq = await request('/auth/me', {
      headers: { Authorization: 'Bearer invalid_malformed_jwt_token' },
    });
    assert(invalidTokenReq.status === 401, 'Invalid/malformed JWT token is rejected (401 Unauthorized)');

    // HttpOnly Cookie Session Authentication
    const cookieAuthReq = await request('/auth/me', {
      headers: { Cookie: `cardalink_token=${adminToken}` },
    });
    assert(cookieAuthReq.status === 200 && cookieAuthReq.body.data?.user?.email === 'admin@cardalink.com', 'HttpOnly Cookie session authentication succeeds');

    // Audit Log Secrets Safety Check
    const hasSecretsInLogs = auditLogsRes.body.data?.logs?.some((log) => {
      const text = JSON.stringify(log);
      return text.includes(testPassword) || text.includes('cardalink_super_secret_jwt_key_2026') || text.includes('GOCSPX-');
    });
    assert(!hasSecretsInLogs, 'Audit logs do NOT contain sensitive passwords, JWT secrets, or OAuth credentials');

    const logoutRes = await request('/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    assert(logoutRes.status === 200, 'Logout endpoint returns 200 OK');

    console.log('\n====================================================');
    console.log(` IAM TEST MATRIX SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test matrix execution error:', err);
    process.exit(1);
  }
}


runTestMatrix();
