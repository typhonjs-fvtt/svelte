import type { SvelteApplication } from '../SvelteApplication';

/**
 * Provides an index of all visible rendered {@link SvelteApplication} instances in a given Svelte runtime. This allows
 * bulk operations to be performed across all apps.
 */
export class TJSAppIndex
{
   /**
    * Stores all visible / rendered apps.
    *
    * @type {Map<string, SvelteApplication>}
    */
   static #visibleApps: Map<string, SvelteApplication> = new Map();

   /**
    * Adds a SvelteApplication to all visible apps tracked.
    *
    * @param app - A SvelteApplication
    *
    * @package
    */
   static add(app: SvelteApplication)
   {
      this.#visibleApps.set(app.id, app);
   }

   /**
    * Removes a SvelteApplication from all visible apps tracked.
    *
    * @param app - A SvelteApplication
    *
    * @package
    */
   static delete(app: SvelteApplication)
   {
      this.#visibleApps.delete(app.id);
   }

   /**
    * Gets a particular app by ID.
    *
    * @param key - App ID.
    *
    * @returns Associated app.
    */
   static get(key: string): SvelteApplication
   {
      return this.#visibleApps.get(key);
   }

   /**
    * Returns whether an associated app by ID is being tracked.
    *
    * @param key - App ID.
    *
    * @returns The given App ID is visible.
    */
   static has(key: string): boolean
   {
      return this.#visibleApps.has(key);
   }

   /**
    * @returns All visible app IDs.
    */
   static keys(): IterableIterator<string>
   {
      return this.#visibleApps.keys();
   }

   /**
    * @returns All visible apps.
    */
   static values(): IterableIterator<SvelteApplication>
   {
      return this.#visibleApps.values();
   }
}
