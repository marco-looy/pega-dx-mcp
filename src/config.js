
// Lazy configuration loader - only validates when accessed
let _config = null;

function loadConfig() {
  if (_config) {
    return _config;
  }

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

  // Validate and normalize API version
  let apiVersion = (process.env.PEGA_API_VERSION || 'v2').toLowerCase();
  if (apiVersion !== 'v1' && apiVersion !== 'v2') {
    console.warn(`⚠️  WARNING: Invalid PEGA_API_VERSION "${apiVersion}". Must be "v1" or "v2".`);
    console.warn('   Defaulting to "v2".');
    apiVersion = 'v2';
  }

  _config = {
    pega: {
      baseUrl: baseUrl,
      clientId: process.env.PEGA_CLIENT_ID,
      clientSecret: process.env.PEGA_CLIENT_SECRET,
      scope: process.env.PEGA_SCOPE || '',
      requestTimeout: 30000,
      _apiVersion: apiVersion,  // Store the normalized version
      // Derived URLs from base URL
      get tokenUrl() {
        return `${this.baseUrl}/prweb/PRRestService/oauth2/v1/token`;
      },
      get apiBaseUrl() {
        // Version-aware API base URL
        if (this._apiVersion === 'v1') {
          return `${this.baseUrl}/prweb/api/v1`;
        }
        return `${this.baseUrl}/prweb/api/application/v2`;
      },
      get apiVersion() {
        return this._apiVersion;
      }
    }
  };

  // Validate required configuration only when config is loaded
  const requiredConfig = [
    'pega.baseUrl',
    'pega.clientId',
    'pega.clientSecret'
  ];

  for (const path of requiredConfig) {
    const value = path.split('.').reduce((obj, key) => obj?.[key], _config);
    if (!value) {
      throw new Error(`Missing required configuration: ${path}`);
    }
  }

  return _config;
}

// Export config as a getter that loads lazily
export const config = new Proxy({}, {
  get(target, prop) {
    return loadConfig()[prop];
  }
});
