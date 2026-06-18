// Jest polyfills — run BEFORE the test framework is installed.
// Provides Web APIs that the @edge-runtime/jest-environment does not
// expose by default (or that Node differs on).

// `process` is provided by Node, but tests sometimes assign to NODE_ENV.
// Make it writable so test files can do `process.env.NODE_ENV = 'test'`.
try {
  Object.defineProperty(process, 'NODE_ENV', {
    value: process.env.NODE_ENV || 'test',
    writable: true,
    configurable: true,
  })
} catch {
  // Already writable — ignore.
}

// `crypto.subtle` requires secure context in some Node versions.
// Node 18+ exposes it globally; nothing to do here for now.
export {}
