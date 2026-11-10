import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    setupFiles: ['reflect-metadata'],
    include: ['**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      // La meta del curso es 70 % en dominio y aplicación.
      include: ['src/domain/**/*.ts', 'src/application/**/*.ts'],
      exclude: ['**/*.spec.ts'],
      thresholds: { lines: 70, functions: 70, branches: 70, statements: 70 },
    },
  },
});
