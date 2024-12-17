import type {
   Readable,
   Writable,
   Updater }               from 'svelte/store';

import type { WebStorage } from '#runtime/svelte/store/web-storage';

/**
 * Contains the reactive functionality / Svelte stores associated with SvelteApplication and retrievable by
 * {@link SvelteApplication.reactive}.
 *
 * There are several reactive getters for UI state such and for two-way bindings / stores see
 * {@link SvelteReactive.storeUIState}:
 * - {@link SvelteReactive.dragging}
 * - {@link SvelteReactive.minimized}
 * - {@link SvelteReactive.resizing}
 *
 * There are also reactive getters / setters for {@link SvelteApp.Options} and Foundry
 * {@link ApplicationOptions}. You can use the following as one way bindings and update the associated stores. For
 * two-way bindings / stores see {@link SvelteReactive.storeAppOptions}.
 *
 * - {@link SvelteReactive.draggable}
 * - {@link SvelteReactive.focusAuto}
 * - {@link SvelteReactive.focusKeep}
 * - {@link SvelteReactive.focusTrap}
 * - {@link SvelteReactive.headerButtonNoClose}
 * - {@link SvelteReactive.headerButtonNoLabel}
 * - {@link SvelteReactive.headerIcon}
 * - {@link SvelteReactive.headerNoTitleMinimized}
 * - {@link SvelteReactive.minimizable}
 * - {@link SvelteReactive.popOut}
 * - {@link SvelteReactive.positionable}
 * - {@link SvelteReactive.resizable}
 * - {@link SvelteReactive.title}
 *
 * An instance of TJSWebStorage (session) / TJSSessionStorage is accessible via {@link SvelteReactive.sessionStorage}.
 * Optionally you can pass in an existing TJSWebStorage instance that can be shared across multiple SvelteApplications
 * by setting {@link SvelteApp.Options.sessionStorage}.
 *
 * -------------------------------------------------------------------------------------------------------------------
 *
 * This API is not sealed, and it is recommended that you extend it with accessors to get / set data that is reactive
 * in your application. An example of setting an exported prop `document` from the main mounted application shell.
 *
 * @example
 * ```js
 * import { hasSetter } from '#runtime/util/object';
 *
 * // Note: make a normal comment.
 * //  * @member {object} document - Adds accessors to SvelteReactive to get / set the document associated with
 * //  *                             Document with the mounted application shell Svelte component.
 * //  *
 * //  * @memberof SvelteReactive#
 * //  *
 * Object.defineProperty(this.reactive, 'document', {
 *    get: () => this.svelte?.applicationShell?.document,
 *    set: (document) =>
 *    {
 *       const component = this.svelte?.applicationShell;
 *       if (hasSetter(component, 'document')) { component.document = document; }
 *    }
 * });
 * ```
 */
declare interface SvelteReactive
{
   /**
    * @returns Returns WebStorage (session) instance.
    */
   get sessionStorage(): WebStorage;

   /**
    * Returns the store for app options.
    *
    * @returns App options store.
    */
   get storeAppOptions(): StoreAppOptions;

   /**
    * Returns the store for UI options.
    *
    * @returns UI options store.
    */
   get storeUIState(): StoreUIOptions;

   // Accessors for App state ----------------------------------------------------------------------------------------

   /**
    * Returns the draggable app option.
    *
    * @returns Draggable app option.
    */
   get draggable(): boolean;

   /**
    * Sets `this.options.draggable` which is reactive for application shells.
    *
    * @param draggable - Sets the draggable option.
    */
   set draggable(draggable: boolean);

   /**
    * Returns the focusAuto app option.
    *
    * @returns When true auto-management of app focus is enabled.
    */
   get focusAuto(): boolean;

   /**
    * Sets `this.options.focusAuto` which is reactive for application shells.
    *
    * @param focusAuto - Sets the focusAuto option.
    */
   set focusAuto(focusAuto: boolean);

   /**
    * Returns the focusKeep app option.
    *
    * @returns When `focusAuto` and `focusKeep` is true; keeps internal focus.
    */
   get focusKeep(): boolean;

   /**
    * Sets `this.options.focusKeep` which is reactive for application shells.
    *
    * @param {boolean}  focusKeep - Sets the focusKeep option.
    */
   set focusKeep(focusKeep: boolean);

   /**
    * Returns the focusTrap app option.
    *
    * @returns {boolean} When true focus trapping / wrapping is enabled keeping focus inside app.
    */
   get focusTrap(): boolean;

   /**
    * Sets `this.options.focusTrap` which is reactive for application shells.
    *
    * @param {boolean}  focusTrap - Sets the focusTrap option.
    */
   set focusTrap(focusTrap: boolean);

   /**
    * Returns the headerButtonNoClose app option.
    *
    * @returns {boolean} Remove the close the button in header app option.
    */
   get headerButtonNoClose(): boolean;

   /**
    * Sets `this.options.headerButtonNoClose` which is reactive for application shells.
    *
    * @param {boolean}  headerButtonNoClose - Sets the headerButtonNoClose option.
    */
   set headerButtonNoClose(headerButtonNoClose: boolean);

   /**
    * Returns the headerButtonNoLabel app option.
    *
    * @returns {boolean} Remove the labels from buttons in header app option.
    */
   get headerButtonNoLabel(): boolean;

   /**
    * Sets `this.options.headerButtonNoLabel` which is reactive for application shells.
    *
    * @param headerButtonNoLabel - Sets the headerButtonNoLabel option.
    */
   set headerButtonNoLabel(headerButtonNoLabel: boolean);

   /**
    * Returns the headerIcon app option.
    *
    * @returns URL for header app icon.
    */
   get headerIcon(): string | undefined;

   /**
    * Sets `this.options.headerIcon` which is reactive for application shells.
    *
    * @param headerIcon - Sets the headerButtonNoLabel option.
    */
   set headerIcon(headerIcon: string | undefined);

   /**
    * Returns the headerNoTitleMinimized app option.
    *
    * @returns When true removes the header title when minimized.
    */
   get headerNoTitleMinimized(): boolean;

   /**
    * Sets `this.options.headerNoTitleMinimized` which is reactive for application shells.
    *
    * @param headerNoTitleMinimized - Sets the headerNoTitleMinimized option.
    */
   set headerNoTitleMinimized(headerNoTitleMinimized: boolean);

   /**
    * Returns the minimizable app option.
    *
    * @returns Minimizable app option.
    */
   get minimizable(): boolean;

   /**
    * Sets `this.options.minimizable` which is reactive for application shells that are also pop out.
    *
    * @param minimizable - Sets the minimizable option.
    */
   set minimizable(minimizable: boolean);

   /**
    * Returns the Foundry popOut state; {@link ApplicationOptions.popOut}
    *
    * @returns Positionable app option.
    */
   get popOut(): boolean;

   /**
    * Sets `this.options.popOut` which is reactive for application shells. This will add / remove this application
    * from `ui.windows`.
    *
    * @param popOut - Sets the popOut option.
    */
   set popOut(popOut: boolean);

   /**
    * Returns the positionable app option; {@link SvelteApp.Options.positionable}
    *
    * @returns Positionable app option.
    */
   get positionable(): boolean;

   /**
    * Sets `this.options.positionable` enabling / disabling {@link SvelteApplication.position}.
    *
    * @param positionable - Sets the positionable option.
    */
   set positionable(positionable: boolean);

   /**
    * Returns the resizable option.
    *
    * @returns Resizable app option.
    */
   get resizable(): boolean;

   /**
    * Sets `this.options.resizable` which is reactive for application shells.
    *
    * @param resizable - Sets the resizable option.
    */
   set resizable(resizable: boolean);

   /**
    * Returns the title accessor from the parent Application class; {@link ApplicationOptions.title}
    *
    * @returns Title.
    */
   get title(): string;

   /**
    * Sets `this.options.title` which is reactive for application shells.
    *
    * Note: Will set empty string if title is undefined or null.
    *
    * @param title - Application title; will be localized, so a translation key is fine.
    */
   set title(title: string | undefined | null);

   // Accessors for UI state -----------------------------------------------------------------------------------------

   /**
    * Returns the current active Window / WindowProxy UI state.
    *
    * @returns Active window UI state.
    */
   get activeWindow(): Window;

   /**
    * Returns the current dragging UI state.
    *
    * @returns Dragging UI state.
    */
   get dragging(): boolean;

   /**
    * Returns the current minimized UI state.
    *
    * @returns Minimized UI state.
    */
   get minimized(): boolean;

   /**
    * Returns the current resizing UI state.
    *
    * @returns Resizing UI state.
    */
   get resizing(): boolean;

   /**
    * Sets the current active Window / WindowProxy UI state.
    *
    * Note: This is protected usage and used internally.
    *
    * @param activeWindow - Active Window / WindowProxy UI state.
    */
   set activeWindow(activeWindow: Window);

   /**
    * Provides a way to safely get this applications options given an accessor string which describes the
    * entries to walk. To access deeper entries into the object format the accessor string with `.` between entries
    * to walk.
    *
    * @param accessor - The path / key to set. You can set multiple levels.
    *
    * @param [defaultValue] - A default value returned if the accessor is not found.
    *
    * @returns Value at the accessor.
    */
   getOptions(accessor: string, defaultValue?: any): any;

   /**
    * Provides a way to merge `options` into this applications options and update the appOptions store.
    *
    * @param options - The options object to merge with `this.options`.
    */
   mergeOptions(options: object): void;

   /**
    * Provides a way to safely set this applications options given an accessor string which describes the
    * entries to walk. To access deeper entries into the object format the accessor string with `.` between entries
    * to walk.
    *
    * Additionally, if an application shell Svelte component is mounted and exports the `appOptions` property then
    * the application options is set to `appOptions` potentially updating the application shell / Svelte component.
    *
    * @param accessor - The path / key to set. You can set multiple levels.
    *
    * @param value - Value to set.
    */
   setOptions(accessor: string, value: any): void;

   /**
    * Serializes the main {@link SvelteApp.Options} for common application state.
    */
   toJSON(): SvelteReactiveData;

   /**
    * Updates the UI Options store with the current header buttons. You may dynamically add / remove header buttons
    * if using an application shell Svelte component. In either overriding `_getHeaderButtons` or responding to the
    * Hooks fired return a new button array and the uiOptions store is updated and the application shell will render
    * the new buttons.
    *
    * Optionally you can set in the SvelteApplication app options {@link SvelteApp.Options.headerButtonNoClose}
    * to remove the close button and {@link SvelteApp.Options.headerButtonNoLabel} to true and labels will be
    * removed from the header buttons.
    *
    * @param [opts] - Optional parameters (for internal use)
    *
    * @param [opts.headerButtonNoClose] - The value for `headerButtonNoClose`.
    *
    * @param [opts.headerButtonNoLabel] - The value for `headerButtonNoLabel`.
    */
   updateHeaderButtons({ headerButtonNoClose, headerButtonNoLabel }?: {
      headerButtonNoClose?: boolean;
      headerButtonNoLabel?: boolean;
   }): void;
}

/**
 * Provides a custom readable Svelte store for Application options state.
 */
type StoreAppOptions = {
   /**
    * Subscribe to all app options updates.
    */
   subscribe: Readable<object>;

   /**
    * Derived store for `draggable` updates.
    */
   draggable: Writable<boolean>;

   /**
    * Derived store for `focusAuto` updates.
    */
   focusAuto: Writable<boolean>;

   /**
    * Derived store for `focusKeep` updates.
    */
   focusKeep: Writable<boolean>;

   /**
    * Derived store for `focusTrap` updates.
    */
   focusTrap: Writable<boolean>;

   /**
    * Derived store for `headerButtonNoClose` updates.
    */
   headerButtonNoClose: Writable<boolean>;

   /**
    * Derived store for `headerButtonNoLabel` updates.
    */
   headerButtonNoLabel: Writable<boolean>;

   /**
    * Derived store for `headerIcon` updates.
    */
   headerIcon: Writable<string>;

   /**
    * Derived store for `headerNoTitleMinimized` updates.
    */
   headerNoTitleMinimized: Writable<boolean>;

   /**
    * Derived store for `minimizable` updates.
    */
   minimizable: Writable<boolean>;

   /**
    * Derived store for `popOut` updates.
    */
   popOut: Writable<boolean>;

   /**
    * Derived store for `positionable` updates.
    */
   positionable: Writable<boolean>;

   /**
    * Derived store for `resizable` updates.
    */
   resizable: Writable<boolean>;

   /**
    * Derived store for `title` updates.
    */
   title: Writable<string>;
};

/**
 * Provides a custom readable Svelte store for UI options state.
 */
type StoreUIOptions = {

   /**
    * Subscribe to all UI options updates.
    */
   subscribe: Readable<object>;

   /**
    * Derived store for `dragging` updates.
    */
   dragging: Writable<boolean>;

   /**
    * Derived store for `headerButtons` updates.
    */
   headerButtons: Readable<globalThis.ApplicationHeaderButton[]>;

   /**
    * Derived store for `minimized` updates.
    */
   minimized: Readable<boolean>;
   /**
    * Derived store for `resizing` updates.
    */
   resizing: Writable<boolean>;
};

/**
 * Defines the bulk serializable data from {@link SvelteReactive.toJSON} for common application state.
 */
type SvelteReactiveData = {
   /**
    * If true then application shells are draggable.
    */
   draggable: boolean;

   /**
    * When true auto-management of app focus is enabled.
    */
   focusAuto: boolean;

   /**
    * When `focusAuto` and `focusKeep` is true; keeps internal focus.
    */
   focusKeep: boolean;

   /**
    * When true focus trapping / wrapping is enabled keeping focus inside app.
    */
   focusTrap: boolean;

   /**
    * If true then the close header button is removed.
    */
   headerButtonNoClose: boolean;

   /**
    * If true then header button labels are removed.
    */
   headerButtonNoLabel: boolean;

   /**
    * If true then header title is hidden when minimized.
    */
   headerNoTitleMinimized: boolean;

   /**
    * If true then application shells are minimizable.
    */
   minimizable: boolean;

   /**
    * If false then `position.set` does not take effect.
    */
   positionable: boolean;

   /**
    * If true then application shells are resizable.
    */
   resizable: boolean;
}

export { StoreAppOptions, StoreUIOptions, SvelteReactive, SvelteReactiveData }
