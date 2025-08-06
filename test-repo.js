// Test script to verify GitHub API access
const axios = require('axios');

async function testGitHubAccess() {
  const token = 'TU_TOKEN_AQUI'; // Replace with your token
  
  const headers = {
    'Authorization': `token ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'stlabs-start-cli'
  };

  try {
    console.log('🔍 Testing repository access...');
    
    // Test 1: Check if repo exists and user has access
    const repoResponse = await axios.get('https://api.github.com/repos/s-tlabs/boilerplates', { headers });
    console.log('✅ Repository exists and accessible');
    console.log('📋 Repo info:', {
      name: repoResponse.data.name,
      private: repoResponse.data.private,
      permissions: repoResponse.data.permissions
    });
    
    // Test 2: Check if templates.json exists
    const fileResponse = await axios.get('https://api.github.com/repos/s-tlabs/boilerplates/contents/templates.json', { headers });
    console.log('✅ templates.json exists');
    console.log('📄 File size:', fileResponse.data.size, 'bytes');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.status, error.response?.statusText);
    console.error('📝 Details:', error.response?.data?.message);
    
    if (error.response?.status === 404) {
      console.log('\n💡 Possible causes:');
      console.log('• Repository does not exist');
      console.log('• You do not have access to the repository');
      console.log('• Token does not have sufficient permissions');
      console.log('• You are not a member of the s-tlabs organization');
    }
  }
}

testGitHubAccess();