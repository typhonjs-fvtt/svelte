import path                from 'path';

import { babel }           from '@rollup/plugin-babel';        // Babel is used for private class fields for browser usage.
import resolve             from '@rollup/plugin-node-resolve';
import { generateTSDef }   from '@typhonjs-build-test/esm-d-ts';
import fs                  from 'fs-extra';
import { rollup }          from 'rollup';
import sourcemaps          from 'rollup-plugin-sourcemaps';
import svelte              from 'rollup-plugin-svelte';
import { terser }          from 'rollup-plugin-terser';
import upath               from 'upath';

import terserConfig  from './terser.config.mjs';

const s_COMPRESS = false;
const s_SOURCEMAPS = true;

// Defines Svelte and all local exports as external.
const s_LOCAL_EXTERNAL = [
   'svelte', 'svelte/easing', 'svelte/internal', 'svelte/motion', 'svelte/store', 'svelte/transition',
   'svelte/types',

   '@typhonjs-fvtt/svelte/action', '@typhonjs-fvtt/svelte/application', '@typhonjs-fvtt/svelte/application/legacy',
   '@typhonjs-fvtt/svelte/component/core', '@typhonjs-fvtt/svelte/gsap', '@typhonjs-fvtt/svelte/handler',
   '@typhonjs-fvtt/svelte/helper', '@typhonjs-fvtt/svelte/store', '@typhonjs-fvtt/svelte/transition',
   '@typhonjs-fvtt/svelte/util', '@typhonjs-fvtt/svelte/plugin/data', '@typhonjs-fvtt/svelte/plugin/system',

   `foundry-gsap`  // Replaced by consumer for Foundry GSAP path.
];

// Defines potential output plugins to use conditionally if the .env file indicates the bundles should be
// minified / mangled.
const outputPlugins = s_COMPRESS ? [terser(terserConfig)] : [];

// Defines whether source maps are generated / loaded from the .env file.
const sourcemap = s_SOURCEMAPS;

const rollupConfigs = [
   {
      input: {
         input: 'src/action/index.js',
         external: s_LOCAL_EXTERNAL
      },
      output: {
         output: {
            file: 'dist/action/index.js',
            format: 'es',
            plugins: outputPlugins,
            preferConst: true,
            sourcemap,
            // sourcemapPathTransform: (sourcePath) => sourcePath.replace(relativePath, `.`)
         }
      }
   },
   {
      input: {
         input: 'src/application/index.js',
         external: s_LOCAL_EXTERNAL,
         plugins: [
            resolve(),
            sourcemaps(),
            babel({
               babelHelpers: 'bundled',
               presets: [
                  ['@babel/preset-env', {
                     bugfixes: true,
                     shippedProposals: true,
                     targets: { esmodules: true }
                  }]
               ]
            })
         ]
      },
      output: {
         output: {
            file: 'dist/application/index.js',
            format: 'es',
            plugins: outputPlugins,
            preferConst: true,
            sourcemap,
            // sourcemapPathTransform: (sourcePath) => sourcePath.replace(relativePath, `.`)
         }
      }
   },
   {
      input: {
         input: 'src/application/legacy/index.js',
         external: s_LOCAL_EXTERNAL,
         plugins: [
            resolve(),
            sourcemaps(),
            babel({
               babelHelpers: 'bundled',
               presets: [
                  ['@babel/preset-env', {
                     bugfixes: true,
                     shippedProposals: true,
                     targets: { esmodules: true }
                  }]
               ]
            })
         ]
      },
      output: {
         output: {
            file: 'dist/application/legacy/index.js',
            format: 'es',
            plugins: outputPlugins,
            preferConst: true,
            sourcemap,
            // sourcemapPathTransform: (sourcePath) => sourcePath.replace(relativePath, `.`)
         }
      }
   },
   {
      input: {
         input: 'src/component/core/index.js',
         external: s_LOCAL_EXTERNAL,
         plugins: [
            svelte({
               emitCss: false,
               onwarn: (warning, handler) =>
               {
                  // Suppress `a11y-missing-attribute` for missing href in <a> links.
                  if (warning.message.includes(`<a> element should have an href attribute`)) { return; }

                  // Let Rollup handle all other warnings normally.
                  handler(warning);
               }
            }),
            resolve()
         ]
      },
      output: {
         output: {
            file: 'dist/component/core/index.js',
            format: 'es',
            plugins: outputPlugins,
            preferConst: true,
            sourcemap,
            // sourcemapPathTransform: (sourcePath) => sourcePath.replace(relativePath, `.`)
         }
      }
   },
   {
      input: {
         input: 'src/gsap/index.js',
         external: s_LOCAL_EXTERNAL
      },
      output: {
         output: {
            file: 'dist/gsap/index.js',
            format: 'es',
            paths: {
               gsap: '/scripts/greensock/esm/all.js'
            },
            plugins: outputPlugins,
            preferConst: true,
            sourcemap,
            // sourcemapPathTransform: (sourcePath) => sourcePath.replace(relativePath, `.`)
         }
      }
   },
   {
      input: {
         input: 'src/handler/index.js',
         external: s_LOCAL_EXTERNAL,
         plugins: [
            resolve(),
            sourcemaps()
         ]
      },
      output: {
         output: {
            file: 'dist/handler/index.js',
            format: 'es',
            plugins: outputPlugins,
            preferConst: true,
            sourcemap,
            // sourcemapPathTransform: (sourcePath) => sourcePath.replace(relativePath, `.`)
         }
      }
   },
   {
      input: {
         input: 'src/helper/index.js',
         external: s_LOCAL_EXTERNAL
      },
      output: {
         output: {
            file: 'dist/helper/index.js',
            format: 'es',
            plugins: outputPlugins,
            preferConst: true,
            sourcemap,
            // sourcemapPathTransform: (sourcePath) => sourcePath.replace(relativePath, `.`)
         }
      }
   },
   {
      input: {
         input: 'src/store/index.js',
         external: s_LOCAL_EXTERNAL,
         plugins: [
            resolve(),
            sourcemaps()
         ]
      },
      output: {
         output: {
            file: 'dist/store/index.js',
            format: 'es',
            plugins: outputPlugins,
            preferConst: true,
            sourcemap,
            // sourcemapPathTransform: (sourcePath) => sourcePath.replace(relativePath, `.`)
         }
      }
   },
   {
      input: {
         input: 'src/transition/index.js',
         external: s_LOCAL_EXTERNAL,
         plugins: [
            resolve(),
            sourcemaps()
         ]
      },
      output: {
         output: {
            file: 'dist/transition/index.js',
            format: 'es',
            plugins: outputPlugins,
            preferConst: true,
            sourcemap,
            // sourcemapPathTransform: (sourcePath) => sourcePath.replace(relativePath, `.`)
         }
      }
   },
   {
      input: {
         input: 'src/util/index.js',
         external: s_LOCAL_EXTERNAL,
         plugins: [
            resolve(),
            sourcemaps()
         ]
      },
      output: {
         output: {
            file: 'dist/util/index.js',
            format: 'es',
            plugins: outputPlugins,
            preferConst: true,
            sourcemap,
            // sourcemapPathTransform: (sourcePath) => sourcePath.replace(relativePath, `.`)
         }
      }
   },
   {
      input: {
         input: 'src/plugin/data/index.js',
         external: s_LOCAL_EXTERNAL
      },
      output: {
         output: {
            file: 'dist/plugin/data/index.js',
            format: 'es',
            plugins: outputPlugins,
            preferConst: true,
            sourcemap,
            // sourcemapPathTransform: (sourcePath) => sourcePath.replace(relativePath, `.`)
         }
      }
   },
   {
      input: {
         input: 'src/plugin/system/index.js',
         external: s_LOCAL_EXTERNAL,
         plugins: [
            resolve(),
            sourcemaps()
         ]
      },
      output: {
         output: {
            file: 'dist/plugin/system/index.js',
            format: 'es',
            plugins: outputPlugins,
            preferConst: true,
            sourcemap,
            // sourcemapPathTransform: (sourcePath) => sourcePath.replace(relativePath, `.`)
         }
      }
   }
];

for (const config of rollupConfigs)
{
   const bundle = await rollup(config.input);

   await bundle.write(config.output);

   // closes the bundle
   await bundle.close();

   await generateTSDef({
      main: config.output.output.file,
      output: upath.changeExt(config.output.output.file, '.d.ts')
   });

   fs.writeJSONSync(`${path.dirname(config.output.output.file)}/package.json`, {
      main: './index.js',
      module: './index.js',
      type: 'module',
      types: './index.d.ts'
   });
}
