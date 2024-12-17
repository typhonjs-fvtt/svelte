import type { SvelteComponent }  from 'svelte';

import type {
   GetSvelteData,
   MountedAppShell,
   SvelteData }                  from './types';

/**
 * Provides a mechanism to retrieve and query all mounted Svelte components including the main application shell.
 */
export class GetSvelteDataImpl implements GetSvelteData
{
   readonly #applicationShellHolder: MountedAppShell[] | null[];

   readonly #svelteData: SvelteData[];

   /**
    * Keep a direct reference to the SvelteData array in an associated {@link SvelteApplication}.
    *
    * @param applicationShellHolder - A reference to the MountedAppShell array.
    *
    * @param svelteData - A reference to the SvelteData array of mounted components.
    */
   constructor(applicationShellHolder: MountedAppShell[] | null[], svelteData: SvelteData[])
   {
      this.#applicationShellHolder = applicationShellHolder;
      this.#svelteData = svelteData;
   }

   /**
    * Returns any mounted {@link MountedAppShell}.
    *
    * @returns Any mounted application shell.
    */
   get applicationShell(): MountedAppShell | null { return this.#applicationShellHolder[0]; }

   /**
    * Returns the indexed Svelte component.
    *
    * @param index - The index of the Svelte component instance to retrieve.
    *
    * @returns The loaded Svelte component at given index.
    */
   component(index: number): SvelteComponent | undefined
   {
      const data: SvelteData = this.#svelteData[index];
      return data?.component ?? void 0;
   }

   /**
    * Returns the Svelte component entries iterator.
    *
    * @returns Svelte component entries iterator.
    * @yields
    */
   *componentEntries(): IterableIterator<[number, SvelteComponent]>
   {
      for (let cntr: number = 0; cntr < this.#svelteData.length; cntr++)
      {
         yield [cntr, this.#svelteData[cntr].component];
      }
   }

   /**
    * Returns the Svelte component values iterator.
    *
    * @returns Svelte component values iterator.
    * @yields
    */
   *componentValues(): IterableIterator<SvelteComponent>
   {
      for (let cntr: number = 0; cntr < this.#svelteData.length; cntr++)
      {
         yield this.#svelteData[cntr].component;
      }
   }

   /**
    * Returns the indexed SvelteData entry.
    *
    * @param index - The index of SvelteData instance to retrieve.
    *
    * @returns The loaded Svelte config + component.
    */
   data(index: number): SvelteData
   {
      return this.#svelteData[index];
   }

   /**
    * Returns the {@link SvelteData} instance for a given component.
    *
    * @param component - Svelte component.
    *
    * @returns The loaded Svelte config + component.
    */
   dataByComponent(component: SvelteComponent): SvelteData
   {
      for (const data of this.#svelteData)
      {
         if (data.component === component) { return data; }
      }

      return void 0;
   }

   /**
    * Returns the SvelteData entries iterator.
    *
    * @returns SvelteData entries iterator.
    */
   dataEntries(): IterableIterator<[number, SvelteData]>
   {
      return this.#svelteData.entries();
   }

   /**
    * Returns the SvelteData values iterator.
    *
    * @returns SvelteData values iterator.
    */
   dataValues(): IterableIterator<SvelteData>
   {
      return this.#svelteData.values();
   }

   /**
    * Returns the length of the mounted Svelte component list.
    *
    * @returns Length of mounted Svelte component list.
    */
   get length(): number
   {
      return this.#svelteData.length;
   }
}
