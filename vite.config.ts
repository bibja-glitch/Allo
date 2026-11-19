import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  const enableHmr = process.env.ENABLE_HMR === 'true' && process.env.DISABLE_HMR !== 'true';
  return {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: enableHmr,
      ...(enableHmr ? {} : { ws: false as const }),
      watch: enableHmr ? {} : null,
    },
  };
});
