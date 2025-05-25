const dotenv = require('dotenv');
const path = require('path');

// Determine the environment and load the appropriate .env file
// Construct the path to the .env file in the root of the 'server' directory

const defaultEnvPath = path.resolve(__dirname, '../../.env');

// Load the .env file.
// The `dotenv.config()` function will load variables from a .env file into process.env.
// It's usually best to call this as early as possible in your application.
const result = dotenv.config({ path: defaultEnvPath });

if (result.error) {
  console.error('Error loading .env file:', result.error);
}

// Log the CLIENT_URL that is being loaded for debugging CORS issues
console.log(`[CONFIG] Loaded CLIENT_URL: ${process.env.CLIENT_URL}`);

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5001', 10),
  databaseUrl: process.env.DATABASE_URL || 'mongodb://localhost:27017/uraan_db_default',
  jwtSecret: process.env.JWT_SECRET || 'defaultSecretPleaseChangeInProduction',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
};