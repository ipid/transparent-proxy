import { builtinModules } from 'node:module'
import path from 'node:path'
import { defineConfig } from 'vite'

const externalModules = [
  ...builtinModules,
  ...builtinModules.map((moduleName) => `node:${moduleName}`),
  'commander',
  'valibot',
]

// 详见 https://vite.dev/config/
export default defineConfig({
  // 路径别名：@ 指向 src 目录
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  // 核心优化：切换到 Library Mode（官方最佳实践）
  build: {
    lib: {
      // 入口文件（必须）
      entry: path.resolve(import.meta.dirname, './src/index.ts'),
      // 只输出 ESM 格式（你当前的需求）
      formats: ['es'],
      // 精确控制输出文件名 → 得到 transparent-proxy.mjs
      fileName: () => 'transparent-proxy.mjs',
    },

    // 这是一个 Node CLI，不应尝试把 Node 内置模块打成浏览器产物
    rollupOptions: {
      external: externalModules,
    },

    // 输出目录
    outDir: 'dist',

    // 每次构建前清空 dist（强烈推荐）
    emptyOutDir: true,

    // 库通常不压缩，保持代码可读
    minify: false,

    // 没必要 source map
    sourcemap: false,

    // 依赖版本已经要求 Node 20.19+，构建目标直接对齐运行时
    target: 'node20',
  },
})
