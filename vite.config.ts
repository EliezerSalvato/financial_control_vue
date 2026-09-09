import { defineConfig, loadEnv } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import { readFileSync } from 'node:fs';
import vue from '@vitejs/plugin-vue';
import vueDevTools from 'vite-plugin-vue-devtools';

type VercelHeader = { key: string; value: string };
type VercelConfig = {
  headers?: Array<{ source: string; headers: VercelHeader[] }>;
};

function httpOrigin(url: string): string {
  return new URL(url.replace(/^ws/i, 'http')).origin;
}

function securityHeadersFromVercel(): Record<string, string> {
  const vercel = JSON.parse(readFileSync(new URL('./vercel.json', import.meta.url), 'utf8')) as VercelConfig;
  const group = vercel.headers?.[0];

  if (!group) return {};

  return Object.fromEntries(group.headers.map(({ key, value }) => [key, value]));
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [vue(), vueDevTools()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: httpOrigin(env.VITE_API_BASE_URL),
          changeOrigin: true,
        },
        '/cable': {
          target: httpOrigin(env.VITE_CABLE_URL),
          changeOrigin: true,
          ws: true,
        },
      },
    },
    preview: {
      headers: securityHeadersFromVercel(),
    },
  };
});
