import {
   FoundryHMRSupport,
   PopoutSupport }   from './external';

export * from './SvelteApplication';
export * from './TJSDialog';

// Handle `hotReload` Foundry hook when running the Vite dev server.
if (import.meta.hot) { FoundryHMRSupport.initialize(); }

// Handle `PopOut!` module hooks to allow applications to popout to their own browser window.
PopoutSupport.initialize();
