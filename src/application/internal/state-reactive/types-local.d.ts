import { Updater } from '#svelte/store';

interface SvelteReactiveStores {
   /**
    * Update function for app options store.
    */
   appOptionsUpdate: (this: void, updater: Updater<object>) => void;

   /**
    * Subscribes to local stores.
    */
   subscribe: Function;

   /**
    * Update function for UI state stores.
    */
   uiStateUpdate: (this: void, updater: Updater<object>) => void;

   /**
    * Unsubscribes from local stores.
    */
   unsubscribe: Function;
}

export { SvelteReactiveStores };
