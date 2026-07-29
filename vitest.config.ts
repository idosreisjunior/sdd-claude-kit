import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    // Testes devem ser determinísticos: sem rede, sem relógio real, sem
    // dependência de ordem (standards.md §7).
    environment: 'node',
    restoreMocks: true,
  },
})
