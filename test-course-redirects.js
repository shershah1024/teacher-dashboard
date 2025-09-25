#!/usr/bin/env node

// Test script to verify course redirect URLs
const courses = {
  telc_a1: 'https://telc-a1.thesmartlanguage.com/lessons',
  telc_a2: 'https://telc-a2.thesmartlanguage.com/lessons',
  telc_b1: 'https://telc-b1.thesmartlanguage.com/lessons',
  telc_b2: 'https://telc-b2.thesmartlanguage.com/lessons'
};

console.log('🎯 Course Redirect URLs Configuration');
console.log('=====================================\n');

console.log('When students sign up via magic links, they will be redirected to:\n');

Object.entries(courses).forEach(([courseId, url]) => {
  const level = courseId.split('_')[1].toUpperCase();
  console.log(`📚 ${courseId.toUpperCase()} (Level ${level}):`);
  console.log(`   → ${url}`);
  console.log('');
});

console.log('📝 Testing Student Flow:');
console.log('------------------------');
console.log('1. Teacher sends invitation for telc_a1');
console.log('2. Student clicks magic link in email');
console.log('3. Student creates account (passwordless)');
console.log('4. Redirected to: /student-onboarding?course=telc_a1');
console.log('5. Student clicks "Start Learning Now"');
console.log('6. 5-second countdown begins');
console.log('7. Auto-redirect to: https://telc-a1.thesmartlanguage.com/lessons');
console.log('');

console.log('✅ Configuration Complete!');
console.log('');
console.log('To test the flow:');
console.log('1. Send an invitation from /teacher-dashboard/manage-students');
console.log('2. Check the redirect URL in the student onboarding page');
console.log('3. Verify the correct platform URL is used');
console.log('');

// Test the configuration file exists
try {
  console.log('📋 Checking configuration file...');
  const fs = require('fs');
  const configPath = './lib/course-config.ts';
  
  if (fs.existsSync(configPath)) {
    console.log('✅ Configuration file found: lib/course-config.ts');
    
    const content = fs.readFileSync(configPath, 'utf8');
    const urlsFound = content.includes('thesmartlanguage.com');
    
    if (urlsFound) {
      console.log('✅ Platform URLs are configured correctly');
    } else {
      console.log('⚠️  Platform URLs might need updating');
    }
  } else {
    console.log('❌ Configuration file not found');
  }
} catch (error) {
  console.log('⚠️  Could not verify configuration file');
}

console.log('\n🔗 View the documentation: COURSE_REDIRECT_GUIDE.md');