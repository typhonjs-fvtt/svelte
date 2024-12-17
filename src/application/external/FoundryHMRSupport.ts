import { TJSAppIndex } from '../internal';

export class FoundryHMRSupport
{
   static initialize()
   {
      if (import.meta.hot)
      {
         Hooks.on('hotReload', (data): boolean =>
         {
            // Only handle JSON hot reload presumably specified in package manifest for language translation files.
            if (data?.extension === 'json')
            {
               // Postpone until next clock tick to allow Foundry to update localization first.
               setTimeout(() =>
               {
                  for (const app of TJSAppIndex.values())
                  {
                     const appShell = app.svelte.applicationShell;

                     // Retrieve the original `svelte-hmr` instrumented HMR component / not the proxy.
                     const hmrComponent = appShell?.$$?.hmr_cmp;

                     if (appShell && typeof hmrComponent?.$replace === 'function')
                     {
                        const svelteData = app.svelte.dataByComponent(appShell);
                        if (svelteData)
                        {
                           try
                           {
                              // Replace with self; this will invoke `on_hmr` callback in associated SvelteApplication.
                              hmrComponent.$replace(hmrComponent.constructor, {
                                 target: svelteData.config.target,
                                 anchor: svelteData.config.anchor,
                                 preserveLocalState: true,
                                 conservative: true
                              });
                           }
                           catch (error)
                           {
                              const name = hmrComponent?.constructor?.name ?? 'Unknown';
                              console.error(`TyphonJS Runtime Library error; Could not hot reload component: '${name}'`);
                              console.error(error);
                           }
                        }
                     }
                  }
               }, 0);
            }

            return true;
         });
      }
   }
}
