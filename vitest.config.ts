import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    env: {
      FORCE_COLOR: '1'
    },
    include: [
      'test/**/*.test.ts'
    ]
  }
})
