import {defineConfig, Plugin} from 'vite';
import react from '@vitejs/plugin-react-swc';
import laravel from 'laravel-vite-plugin';
import replace from '@rollup/plugin-replace';
import tsconfigPaths from 'vite-tsconfig-paths';
import * as path from 'path';

// override laravel plugin base option (from absolute to relative to html base tag)
function basePath(): Plugin {
  return {
    name: 'test',
    enforce: 'post',
    config: () => {
      return {
        base: '',
      };
    },
  };
}

export default defineConfig({
  base: '',
  resolve: {
    preserveSymlinks: true,
    alias: {
      '@common': path.resolve(__dirname, './common/foundation/resources/client'),
      '@ui': path.resolve(__dirname, './common/foundation/resources/client/ui/library'),
      '@app': path.resolve(__dirname, './resources/client')
    }
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    origin: 'http://127.0.0.1:5173'
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      external: ['puppeteer', 'ioredis']
    },
  },
  plugins: [
    tsconfigPaths(),
    react(),
    laravel({
      input: ['resources/client/main.tsx'],
      refresh: false,
      buildDirectory: 'build'
    }),
    basePath(),
    replace({
      preventAssignment: true,
      __SENTRY_DEBUG__: false,
    }),
  ],
});
