import { build, context } from 'esbuild';
// import { nodeExternalsPlugin } from 'esbuild-node-externals';
import alias from 'esbuild-plugin-alias';
import { resolve } from 'path';
import fg from 'fast-glob';
// import chokidar from 'chokidar';
import { LogLevel } from 'esbuild';

async function main() {
  const entryPoints = await fg('src/**/interface/handlers/*Handler.ts');
  const isWatchMode = process.argv.includes('--watch');
  console.log(`isWatchMode: ${isWatchMode}`);

  if (!entryPoints || entryPoints.length === 0) {
    console.log('No lambda handler TypeScript files found in app/.');
    process.exit(0);
  }

  const buildOptions = {
    entryPoints,
    bundle: true,
    platform: 'node' as const,
    target: 'node22',
    outbase: 'src',
    outdir: '.dist/src',
    sourcemap: isWatchMode,
    logLevel: 'info' as LogLevel,
    plugins: [
      alias({
        '@src': resolve(__dirname, 'src'),
        '@test': resolve(__dirname, 'test'),
        '@root': resolve(__dirname, '.'),
      }),
    ],
  };

  try {
    if (isWatchMode) {
      const ctx = await context(buildOptions);
      await ctx.watch();
    } else {
      await build({ ...buildOptions, external: ['@aws-sdk'], minify: true });
      console.log('✅ TypeScript build successful');
    }
  } catch (error) {
    console.log(entryPoints);
    console.log(resolve(__dirname, 'src'));
    console.error('❌ TypeScript build failed:', error);
    process.exit(1);
  }
}

main();
