import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate and clean base URL
let baseUrl = process.env.PEGA_BASE_URL;
if (baseUrl && baseUrl.includes('/prweb')) {
  console.warn('⚠️  WARNING: PEGA_BASE_URL contains "/prweb" which is not needed.');
  console.warn('   The "/prweb" path is automatically appended for API calls.');
  console.warn('   Please update your .env file to remove "/prweb" from PEGA_BASE_URL');
  
  // Clean the URL by removing /prweb and anything after it
  baseUrl = baseUrl.replace(/\/prweb.*$/, '');
  console.warn(`   Using cleaned URL: ${baseUrl}`);
}

export const config = {
  pega: {
    baseUrl: baseUrl,
    apiVersion: process.env.PEGA_API_VERSION || 'v2',
    clientId: process.env.PEGA_CLIENT_ID,
    clientSecret: process.env.PEGA_CLIENT_SECRET,
    scope: process.env.PEGA_SCOPE || '',
    // Derived URLs from base URL
    get tokenUrl() {
      return `${this.baseUrl}/prweb/PRRestService/oauth2/v1/token`;
    },
    get apiBaseUrl() {
      return `${this.baseUrl}/prweb/api/application/${this.apiVersion}`;
    }
  },
  server: {
    logLevel: process.env.LOG_LEVEL || 'info',
    cacheTtl: parseInt(process.env.CACHE_TTL) || 300000,
    requestTimeout: parseInt(process.env.REQUEST_TIMEOUT) || 30000,
  }
};

// Validate required configuration
const requiredConfig = [
  'pega.baseUrl',
  'pega.clientId',
  'pega.clientSecret'
];

for (const path of requiredConfig) {
  const value = path.split('.').reduce((obj, key) => obj?.[key], config);
  if (!value) {
    throw new Error(`Missing required configuration: ${path}`);
  }
}
