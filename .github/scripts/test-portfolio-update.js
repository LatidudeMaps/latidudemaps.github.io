const { Octokit } = require('@octokit/rest');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configurazione
const USERNAME = 'LatidudeMaps';
const TOKEN = process.env.GITHUB_TOKEN;

if (!TOKEN) {
  console.error('GITHUB_TOKEN environment variable is required');
  process.exit(1);
}

const octokit = new Octokit({
  auth: TOKEN
});

async function testPortfolioUpdate() {
  try {
    console.log('Starting portfolio update test...');
    console.log(`Testing for user: ${USERNAME}`);
    let allTestsPassed = true;

    // Test 1: Verifica token e permessi
    try {
      const { data: user } = await octokit.users.getAuthenticated();
      console.log('✅ Test 1 - Token is valid. Authenticated as:', user.login);
    } catch (error) {
      console.error('❌ Test 1 - Token authentication failed:', error.message);
      allTestsPassed = false;
      return;
    }

    // Test 2: Verifica accesso ai repository
    try {
      const { data: repos } = await octokit.repos.listForUser({
        username: USERNAME,
        type: 'owner',
        sort: 'updated',
        per_page: 100
      });
      console.log('✅ Test 2 - Successfully fetched repositories. Count:', repos.length);
      console.log('\nRepositories found:');
      repos.forEach(repo => console.log(`  - ${repo.name}`));
    } catch (error) {
      console.error('❌ Test 2 - Failed to fetch repositories:', error.message);
      allTestsPassed = false;
      return;
    }

    // Test 3: Verifica permessi di scrittura
    try {
      // Create test directories if they don't exist
      const directories = [
        'public/portfolio-media',
        'public/data'
      ];

      directories.forEach(dir => {
        const fullPath = path.join(process.cwd(), dir);
        if (!fs.existsSync(fullPath)) {
          fs.mkdirSync(fullPath, { recursive: true });
          console.log(`✅ Test 3 - Created directory: ${dir}`);
        } else {
          console.log(`✅ Test 3 - Directory exists: ${dir}`);
        }
      });
    } catch (error) {
      console.error('❌ Test 3 - Failed to create/verify directories:', error.message);
      allTestsPassed = false;
    }

    // Test 4: Verifica scrittura file
    try {
      const testData = { 
        test: true, 
        timestamp: new Date().toISOString(),
        message: 'This is a test entry'
      };
      
      fs.writeFileSync(
        path.join(process.cwd(), 'public/data/test-portfolio-data.json'),
        JSON.stringify(testData, null, 2)
      );
      console.log('✅ Test 4 - Successfully tested file writing');
      
      // Pulisci dopo il test
      fs.unlinkSync(path.join(process.cwd(), 'public/data/test-portfolio-data.json'));
    } catch (error) {
      console.error('❌ Test 4 - Failed to write test file:', error.message);
      allTestsPassed = false;
    }

    // Test 5: Verifica accesso ad un repository specifico
    try {
      const testRepo = 'maplibre_template'; // uno dei tuoi repository
      const { data: repo } = await octokit.repos.get({
        owner: USERNAME,
        repo: testRepo
      });
      console.log(`✅ Test 5 - Successfully accessed repository: ${testRepo}`);

      try {
        await octokit.repos.getContent({
          owner: USERNAME,
          repo: testRepo,
          path: 'project-info.md'
        });
        console.log(`✅ Test 5 - Found project-info.md in ${testRepo}`);
      } catch (error) {
        console.log(`ℹ️ Test 5 - No project-info.md found in ${testRepo} (this is okay)`);
      }
    } catch (error) {
      console.error('❌ Test 5 - Failed to access test repository:', error.message);
      allTestsPassed = false;
    }

    if (allTestsPassed) {
      console.log('\n✨ All tests completed successfully!');
      console.log('\nYou can now run the portfolio update script.');
    } else {
      console.error('\n❌ Some tests failed. Please check the errors above.');
    }
  } catch (error) {
    console.error('Test failed with error:', error);
    process.exit(1);
  }
}

testPortfolioUpdate();