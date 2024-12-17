import type { SvelteComponent } from '#svelte';

import type { TJSSvelteConfig } from '#runtime/svelte/util';

/**
 * Provides a mechanism to retrieve and query all mounted Svelte components including the main application shell.
 */
declare interface GetSvelteData
{
   /**
    * Returns any mounted {@link MountedAppShell}.
    *
    * @returns Any mounted application shell.
    */
   get applicationShell(): MountedAppShell | null;

   /**
    * Returns the indexed Svelte component.
    *
    * @param index - The index of the Svelte component instance to retrieve.
    *
    * @returns The loaded Svelte component.
    */
   component(index: number): SvelteComponent | undefined;

   /**
    * Returns the Svelte component entries iterator.
    *
    * @returns {IterableIterator<[number, SvelteComponent]>} Svelte component entries iterator.
    * @yields
    */
   componentEntries(): IterableIterator<[number, SvelteComponent]>;

   /**
    * Returns the Svelte component values iterator.
    *
    * @returns {IterableIterator<SvelteComponent>} Svelte component values iterator.
    * @yields
    */
   componentValues(): IterableIterator<SvelteComponent>;

   /**
    * Returns the indexed SvelteData entry.
    *
    * @param {number}   index - The index of SvelteData instance to retrieve.
    *
    * @returns {SvelteData} The loaded Svelte config + component.
    */
   data(index: number): SvelteData;

   /**
    * Returns the {@link SvelteData} instance for a given component.
    *
    * @param {SvelteComponent} component - Svelte component.
    *
    * @returns {SvelteData} -  The loaded Svelte config + component.
    */
   dataByComponent(component: SvelteComponent): SvelteData;

   /**
    * Returns the SvelteData entries iterator.
    *
    * @returns {IterableIterator<[number, SvelteData]>} SvelteData entries iterator.
    */
   dataEntries(): IterableIterator<[number, SvelteData]>;

   /**
    * Returns the SvelteData values iterator.
    *
    * @returns {IterableIterator<SvelteData>} SvelteData values iterator.
    */
   dataValues(): IterableIterator<SvelteData>;

   /**
    * Returns the length of the mounted Svelte component list.
    *
    * @returns {number} Length of mounted Svelte component list.
    */
   get length(): number;
}

/**
 * Application shell contract for Svelte components.
 */
type MountedAppShell = {
   /**
    * The root element / exported prop.
    */
   elementRoot: HTMLElement;
   /**
    * The content element / exported prop.
    */
   elementContent?: HTMLElement;
   /**
    * The target element / exported prop.
    */
   elementTarget?: HTMLElement;
};

/**
 * Provides access to a mounted Svelte component.
 */
type SvelteData = {
   /**
    * The TJSSvelteConfig for this component.
    */
   config: TJSSvelteConfig;
   /**
    * The svelte component instance.
    */
   component: SvelteComponent;
   /**
    * The main bound element.
    */
   element: HTMLElement;
};

export { GetSvelteData, MountedAppShell, SvelteData }
