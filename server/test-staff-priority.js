/**
 * Test Script for Staff Priority Upload System
 * 
 * This script tests the staff-only file upload with backend priority implementation.
 * 
 * Prerequisites:
 * - Server must be running on http://localhost:3001
 * - You need valid auth tokens for admin, staff, and student users
 * - A valid printer ID must exist in the database
 * 
 * Usage:
 * 1. Replace the placeholder tokens with actual tokens
 * 2. Replace PRINTER_ID with an actual printer ID from your database
 * 3. Run: node server/test-staff-priority.js
 */

const axios = require('axios');

// Configuration - REPLACE THESE WITH ACTUAL VALUES
const CONFIG = {
  baseURL: 'http://localhost:3001/api',
  adminToken: 'YOUR_ADMIN_TOKEN_HERE',
  staffToken: 'YOUR_STAFF_TOKEN_HERE',
  studentToken: 'YOUR_STUDENT_TOKEN_HERE',
  printerId: 'YOUR_PRINTER_ID_HERE',

  // User IDs (Clerk user IDs)
  adminUserId: 'admin_clerk_user_id',
  staffUserId: 'staff_clerk_user_id',
  studentUserId: 'student_clerk_user_id'
};

// Helper function to make API calls
async function apiCall(method, endpoint, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${CONFIG.baseURL}${endpoint}`,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      data
    };

    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || { message: error.message },
      status: error.response?.status
    };
  }
}

// Test functions
const tests = {
  async testAdminCannotUpload() {
    console.log('\n📌 TEST 1: Admin Cannot Upload Files');
    console.log('========================================');

    const printJobData = {
      clerkUserId: CONFIG.adminUserId,
      printerId: CONFIG.printerId,
      file: {
        cloudinaryUrl: 'https://example.com/test.pdf',
        publicId: 'test_admin_upload',
        originalName: 'admin_document.pdf',
        format: 'pdf',
        sizeKB: 500
      },
      settings: {
        pages: 'all',
        copies: 1,
        color: false,
        duplex: false,
        paperType: 'A4'
      }
    };

    const result = await apiCall('POST', '/print-jobs', printJobData, CONFIG.adminToken);

    if (!result.success && result.status === 403) {
      console.log('✅ PASSED: Admin upload blocked with 403 Forbidden');
      console.log('   Error message:', result.error.error?.message);
      console.log('   Error code:', result.error.error?.code);
      return true;
    } else {
      console.log('❌ FAILED: Admin upload should be blocked');
      console.log('   Result:', result);
      return false;
    }
  },

  async testStaffCanUploadWithHighPriority() {
    console.log('\n📌 TEST 2: Staff Can Upload with High Priority');
    console.log('===============================================');

    const printJobData = {
      clerkUserId: CONFIG.staffUserId,
      printerId: CONFIG.printerId,
      file: {
        cloudinaryUrl: 'https://example.com/staff-doc.pdf',
        publicId: 'test_staff_upload_' + Date.now(),
        originalName: 'staff_document.pdf',
        format: 'pdf',
        sizeKB: 750
      },
      settings: {
        pages: 'all',
        copies: 2,
        color: true,
        duplex: false,
        paperType: 'A4'
      }
    };

    const result = await apiCall('POST', '/print-jobs', printJobData, CONFIG.staffToken);

    if (result.success && result.data?.data?.priority === 'high') {
      console.log('✅ PASSED: Staff upload successful with high priority');
      console.log('   Print Job ID:', result.data.data._id);
      console.log('   Priority:', result.data.data.priority);
      console.log('   Queue Position:', result.data.data.queue?.position);
      return { success: true, jobId: result.data.data._id };
    } else {
      console.log('❌ FAILED: Staff upload should succeed with high priority');
      console.log('   Result:', result);
      return { success: false };
    }
  },

  async testStudentCanUploadWithNormalPriority() {
    console.log('\n📌 TEST 3: Student Can Upload with Normal Priority');
    console.log('==================================================');

    const printJobData = {
      clerkUserId: CONFIG.studentUserId,
      printerId: CONFIG.printerId,
      file: {
        cloudinaryUrl: 'https://example.com/student-doc.pdf',
        publicId: 'test_student_upload_' + Date.now(),
        originalName: 'student_document.pdf',
        format: 'pdf',
        sizeKB: 350
      },
      settings: {
        pages: 'all',
        copies: 1,
        color: false,
        duplex: false,
        paperType: 'A4'
      }
    };

    const result = await apiCall('POST', '/print-jobs', printJobData, CONFIG.studentToken);

    if (result.success && result.data?.data?.priority === 'normal') {
      console.log('✅ PASSED: Student upload successful with normal priority');
      console.log('   Print Job ID:', result.data.data._id);
      console.log('   Priority:', result.data.data.priority);
      console.log('   Queue Position:', result.data.data.queue?.position);
      return { success: true, jobId: result.data.data._id };
    } else {
      console.log('❌ FAILED: Student upload should succeed with normal priority');
      console.log('   Result:', result);
      return { success: false };
    }
  },

  async testPrintJobsAreSortedByPriority() {
    console.log('\n📌 TEST 4: Print Jobs Are Sorted by Priority');
    console.log('============================================');

    const result = await apiCall('GET', '/print-jobs', null, CONFIG.adminToken);

    if (result.success && result.data?.data?.jobs) {
      const jobs = result.data.data.jobs;
      console.log(`✅ Retrieved ${jobs.length} print jobs`);

      // Check if sorted correctly (high priority first)
      let lastPriority = 'high';
      let correctlySorted = true;

      for (const job of jobs) {
        if (lastPriority === 'high' && job.priority === 'normal') {
          lastPriority = 'normal';
        } else if (lastPriority === 'normal' && job.priority === 'high') {
          correctlySorted = false;
          break;
        }
      }

      if (correctlySorted) {
        console.log('✅ PASSED: Jobs are correctly sorted by priority');
        console.log('   First 5 jobs:');
        jobs.slice(0, 5).forEach((job, index) => {
          console.log(`   ${index + 1}. Priority: ${job.priority}, File: ${job.file?.originalName}`);
        });
        return true;
      } else {
        console.log('❌ FAILED: Jobs are not correctly sorted by priority');
        return false;
      }
    } else {
      console.log('❌ FAILED: Could not retrieve print jobs');
      console.log('   Result:', result);
      return false;
    }
  },

  async testAdminCanCreateStaffUser() {
    console.log('\n📌 TEST 5: Admin Can Create Staff User');
    console.log('======================================');

    const staffUserData = {
      firstName: 'Test',
      lastName: 'Staff',
      email: `test.staff.${Date.now()}@example.com`,
      password: 'SecurePassword123!',
      role: 'staff'
    };

    const result = await apiCall('POST', '/admin/create-user', staffUserData, CONFIG.adminToken);

    if (result.success && result.data?.data?.role === 'staff') {
      console.log('✅ PASSED: Admin successfully created staff user');
      console.log('   Email:', result.data.data.email);
      console.log('   Role:', result.data.data.role);
      console.log('   Clerk User ID:', result.data.data.clerkUserId);
      return true;
    } else {
      console.log('❌ FAILED: Admin should be able to create staff user');
      console.log('   Result:', result);
      return false;
    }
  }
};

// Run all tests
async function runAllTests() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  STAFF PRIORITY UPLOAD SYSTEM - TEST SUITE                ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  // Check configuration
  if (CONFIG.adminToken === 'YOUR_ADMIN_TOKEN_HERE' ||
    CONFIG.staffToken === 'YOUR_STAFF_TOKEN_HERE' ||
    CONFIG.studentToken === 'YOUR_STUDENT_TOKEN_HERE') {
    console.log('\n❌ ERROR: Please configure the tokens in the script before running tests');
    console.log('   Update CONFIG object with your actual tokens and IDs');
    return;
  }

  const results = [];

  // Run tests sequentially
  results.push(await tests.testAdminCannotUpload());
  results.push(await tests.testStaffCanUploadWithHighPriority());
  results.push(await tests.testStudentCanUploadWithNormalPriority());
  results.push(await tests.testPrintJobsAreSortedByPriority());
  results.push(await tests.testAdminCanCreateStaffUser());

  // Summary
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  TEST SUMMARY                                              ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  const passed = results.filter(r => r === true || r?.success === true).length;
  const failed = results.length - passed;

  console.log(`\nTotal Tests: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`\nSuccess Rate: ${((passed / results.length) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Staff priority upload system is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the output above.');
  }
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { tests, runAllTests };
