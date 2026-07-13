// for utils tests using plain TS
module.exports = {
  preset: 'ts-jest/presets/default', // for TypeScript only
  testEnvironment: 'node',          // plain Node environment
  testPathIgnorePatterns: ['/node_modules/', '/.expo/'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  // NOTE: mappings are evaluated in order — asset stub must come before the "@/" alias so
  // that "@/…/x.mp4" resolves to the stub rather than the (untransformable) binary file.
  moduleNameMapper: {
    // Stub binary/static assets (video/image/font) that TS modules require().
    '\\.(mp4|mov|m4v|webm|png|jpe?g|gif|webp|svg|ttf|otf)$': '<rootDir>/jest/assetStub.js',
    // Resolve the "@/..." path alias (from tsconfig) at runtime, e.g. for JSON data imports.
    '^@/(.*)$': '<rootDir>/$1',
  },
};