import resolve                   from '@rollup/plugin-node-resolve';
import { generateDTS }           from '@typhonjs-build-test/esm-d-ts';
import { importsExternal }       from '@typhonjs-build-test/rollup-plugin-pkg-imports';
import { getFileList }           from '@typhonjs-utils/file-util';
import fs                        from 'fs-extra';
import { rollup }                from 'rollup';

import { externalPathsNPM }      from './.rollup/local/externalPathsNPM.js';
import { typhonjsRuntime }       from './.rollup/local/index.js';

// Defines the node-resolve config.
const s_RESOLVE_CONFIG = {
   browser: true,
   dedupe: ['svelte', '@typhonjs-svelte/runtime-base']
};

// Defines potential output plugins to use conditionally if the .env file indicates the bundles should be
// minified / mangled.
const outputPlugins = [];

const external = [/^svelte/, /@typhonjs-svelte\/runtime-base\/*/, /@typhonjs-fvtt\/svelte\/*/];

// Defines whether source maps are generated / loaded from the .env file.
const sourcemap = true;

// GenerateDTS options -----------------------------------------------------------------------------------------------

// Provides naive search / replace of bundled declaration file rewriting the re-bundled definitions. This will alter
// the JSDoc comments and import symbols.
const dtsReplace = {
   _svelte_fvtt_: '_typhonjs_fvtt_svelte_',
   '#svelte-fvtt/': '@typhonjs-fvtt/svelte/',
   '/\\/\\/ <reference.*\\/>': ''   // Svelte v4 types currently add triple slash references.
};

// Rollup plugin options for generateDTS.
const dtsPluginOptions = { bundlePackageExports: true, dtsReplace };

// -------------------------------------------------------------------------------------------------------------------

/**
 *  Adds a getter for position after `get elementTarget()`. This is necessary to perform as a DTS replacement as
 *  Foundry defines a `position` property on Application.
 *
 * @type {string}
 */
const dtsReplacePositionGetter = `    get elementTarget(): HTMLElement;

    /**
     * Returns the TJSPosition instance.
     *
     * @returns {import('@typhonjs-svelte/runtime-base/svelte/store/position').TJSPosition} The TJSPosition instance.
     */
    get position(): TJSPosition;
`;

// Common application generateDTS options.
const applicationDTSOptions = {
   dtsReplace: {
      ...dtsReplace,
      'get elementTarget\\(\\): HTMLElement;': dtsReplacePositionGetter,

      // The following replacements handle cases where JSDoc can't properly define generic extends clauses.
      'SvelteApplication<Options = SvelteApp.Options<svelte.SvelteComponent<any, any, any>>>': 'SvelteApplication<Options extends SvelteApp.Options = SvelteApp.Options> extends Application<Options> ',
      '<Options = SvelteApp.Options<svelte.SvelteComponent<any, any, any>>>': '<Options extends SvelteApp.Options = SvelteApp.Options>',

      // The following replacement is to handle `SvelteApp.Options` extension of Foundry core `ApplicationOptions`.
      'interface Options<Component extends SvelteComponent = SvelteComponent>': 'interface Options<Component extends SvelteComponent = SvelteComponent> extends ApplicationOptions'
   },
   rollupExternal: external,
   logLevel: 'debug',
};

// -------------------------------------------------------------------------------------------------------------------

const rollupConfigs = [
   {
      input: {
         input: 'src/animate/gsap/index.js',
         external,
         plugins: [
            importsExternal(),
            typhonjsRuntime({ exclude: [`@typhonjs-fvtt/svelte/animate/gsap`] }),
            generateDTS.plugin(dtsPluginOptions)
         ]
      },
      output: {
         file: '_dist/animate/gsap/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         paths: externalPathsNPM,
         plugins: outputPlugins,
         sourcemap
      }
   },
   {
      input: {
         input: 'src/application/index.js',
         external,
         plugins: [
            importsExternal(),
            typhonjsRuntime({ exclude: [`@typhonjs-fvtt/svelte/application`] }),
            generateDTS.plugin(applicationDTSOptions)
         ]
      },
      output: {
         file: '_dist/application/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         paths: externalPathsNPM,
         plugins: outputPlugins,
         sourcemap
      }
   },
   {
      input: {
         input: 'src/store/fvtt/document/index.js',
         external,
         plugins: [
            importsExternal(),
            resolve(s_RESOLVE_CONFIG),
            generateDTS.plugin(dtsPluginOptions)
         ]
      },
      output: {
         file: '_dist/store/fvtt/document/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         paths: externalPathsNPM,
         plugins: outputPlugins,
         sourcemap
      }
   },
   {
      input: {
         input: 'src/store/fvtt/settings/index.js',
         external,
         plugins: [
            importsExternal(),
            resolve(s_RESOLVE_CONFIG),
            generateDTS.plugin(dtsPluginOptions)
         ]
      },
      output: {
         file: '_dist/store/fvtt/settings/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         paths: externalPathsNPM,
         plugins: outputPlugins,
         sourcemap
      }
   },
   {
      input: {
         input: 'src/store/fvtt/settings/world/index.js',
         external,
         plugins: [
            importsExternal(),
            resolve(s_RESOLVE_CONFIG),
            generateDTS.plugin(dtsPluginOptions)
         ]
      },
      output: {
         file: '_dist/store/fvtt/settings/world/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         paths: externalPathsNPM,
         plugins: outputPlugins,
         sourcemap
      }
   }
];

for (const config of rollupConfigs)
{
   console.log(`Generating bundle: ${config.input.input}`);

   const bundle = await rollup(config.input);
   await bundle.write(config.output);
   await bundle.close();
}

// Application rewriting types / exports -----------------------------------------------------------------------------

// The manipulation below is to rewrite `SvelteApplication` as `SvelteApp` to be able to merge with the namespace
// `SvelteApp`. `SvelteApp` is then reexported as `SvelteApplication` in both the sub-path JS bundle and declarations.
{
   // JS Bundle mods --------------
   let applicationIndexJS = fs.readFileSync('./_dist/application/index.js', 'utf-8');

   applicationIndexJS = applicationIndexJS.replaceAll('SvelteApplication', 'SvelteApp');
   applicationIndexJS = applicationIndexJS.replaceAll('export { SvelteApp, TJSDialog };',
    'export { SvelteApp, SvelteApp as SvelteApplication, TJSDialog };');

   fs.writeFileSync('./_dist/application/index.js', applicationIndexJS);

   // DTS Bundle mods -------------
   let applicationIndexDTS = fs.readFileSync('./_dist/application/index.d.ts', 'utf-8');

   applicationIndexDTS = applicationIndexDTS.replaceAll('SvelteApplication', 'SvelteApp');

   // Only replace the second instance of `SvelteApp,` with `SvelteApp as SvelteApplication,` in export statement.
   applicationIndexDTS = applicationIndexDTS.replace(/export\s*{([^}]*)}/s, (match, exportContent) =>
   {
      let counter = 0;
      const updatedContent = exportContent.replace(/SvelteApp,/g, (m) =>
      {
         counter++;
         return counter === 2 ? 'SvelteApp as SvelteApplication,' : m;
      });
      return `export {${updatedContent}}`;
   });

   fs.writeFileSync('./_dist/application/index.d.ts', applicationIndexDTS);
}

// Svelte components
await generateDTS({ input: './_dist/component/application/index.js' });
await generateDTS({ input: './_dist/component/internal/index.js' });
