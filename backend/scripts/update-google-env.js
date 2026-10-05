const fs = require('fs');
const path = require('path');
const readline = require('readline');

const envPath = path.join(__dirname, '../.env');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log('\n====================================================');
console.log(' CardaLink Google OAuth Credential Setup Utility');
console.log('====================================================\n');

rl.question('Enter GOOGLE_CLIENT_ID: ', (clientId) => {
  rl.question('Enter GOOGLE_CLIENT_SECRET: ', (clientSecret) => {
    rl.close();

    const trimmedId = clientId.trim();
    const trimmedSecret = clientSecret.trim();

    if (!trimmedId || !trimmedSecret) {
      console.error('\n[Error] Both GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required.');
      process.exit(1);
    }

    let envContent = fs.readFileSync(envPath, 'utf8');

    envContent = envContent.replace(/^GOOGLE_CLIENT_ID=.*$/m, `GOOGLE_CLIENT_ID=${trimmedId}`);
    envContent = envContent.replace(/^GOOGLE_CLIENT_SECRET=.*$/m, `GOOGLE_CLIENT_SECRET=${trimmedSecret}`);
    envContent = envContent.replace(/^GOOGLE_CALLBACK_URL=.*$/m, `GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback`);

    fs.writeFileSync(envPath, envContent, 'utf8');

    console.log('\n====================================================');
    console.log(' SUCCESS: backend/.env updated successfully!');
    console.log(' Nodemon will automatically restart the server.');
    console.log('====================================================\n');
  });
});
