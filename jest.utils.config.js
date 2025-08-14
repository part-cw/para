// for utils tests using plain TS  
module.exports = {
  preset: 'ts-jest/presets/default', // for TypeScript only
  testEnvironment: 'node',          // plain Node environment
  testPathIgnorePatterns: ['/node_modules/', '/.expo/'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
};