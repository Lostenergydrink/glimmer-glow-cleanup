/**
 * Jest Configuration for GlimmerGlow Shop Tests
 */

module.exports = {
  // Base directory for Jest
  rootDir: './',
  
  // Test files pattern
  testMatch: [
    '<rootDir>/tests/**/*.test.js'
  ],
  
  // Module file extensions
  moduleFileExtensions: ['js', 'json'],
  
  // Transform files before testing
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // Setup files before tests
  setupFiles: ['<rootDir>/tests/setup.js'],
  
  // Test environment
  testEnvironment: 'jsdom',
  
  // Coverage reporting
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage',
  collectCoverageFrom: [
    '<rootDir>/client/services/**/*.js',
    '<rootDir>/scripts/shop/**/*.js'
  ],
  
  // Ignore these directories for transforms
  transformIgnorePatterns: [
    '/node_modules/'
  ],
  
  // Module name mapper for aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  
  // Verbose output
  verbose: true,
  
  // Test timeout
  testTimeout: 10000
}; 