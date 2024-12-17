import { derived, writable }     from '#svelte/store';

import { subscribeIgnoreFirst }  from '#runtime/svelte/store/util';

import {
   TJSSessionStorage,
   TJSWebStorage }               from '#runtime/svelte/store/web-storage';

import { propertyStore }         from '#runtime/svelte/store/writable-derived';

import {
   deepMerge,
   safeAccess,
   safeSet }                     from '#runtime/util/object';

import { SvelteApplication }     from '../../SvelteApplication';

import type {
   Updater,
   Unsubscriber }                from '#svelte/store';

import type { WebStorage }       from '#runtime/svelte/store/web-storage';

import type {
   StoreAppOptions,
   StoreUIOptions,
   SvelteReactiveData }          from './types';

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
 * `ApplicationOptions`. You can use the following as one way bindings and update the
 * associated stores. For two-way bindings / stores see {@link SvelteReactive.storeAppOptions}.
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
 * import { hasSetter } from '@typhonjs-fvtt/runtime/svelte/util';
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
 */
export class SvelteReactiveImpl
{
   readonly #application: SvelteApplication;

   #initialized: boolean = false;

   readonly #sessionStorage: WebStorage;

   /**
    * The Application option store which is injected into mounted Svelte component context under the `external` key.
    */
   #storeAppOptions: StoreAppOptions;

   /**
    * Stores the update function for `#storeAppOptions`.
    */
   #storeAppOptionsUpdate: (this: void, updater: Updater<object>) => void;

   /**
    * Stores the UI state data to make it accessible via getters.
    */
   #dataUIState: any;

   /**
    * The UI option store which is injected into mounted Svelte component context under the `external` key.
    */
   #storeUIState: StoreUIOptions;

   /**
    * Stores the update function for `#storeUIState`.
    */
   #storeUIStateUpdate: (this: void, updater: Updater<object>) => void;

   /**
    * Stores the unsubscribe functions from local store subscriptions.
    */
   #storeUnsubscribe: Unsubscriber[] = [];

   /**
    * @param application - The host Foundry application.
    */
   constructor(application: SvelteApplication)
   {
      this.#application = application;
      const optionsSessionStorage = application?.options?.sessionStorage;

      if (optionsSessionStorage !== void 0 && !(optionsSessionStorage instanceof TJSWebStorage))
      {
         throw new TypeError(`'options.sessionStorage' is not an instance of TJSWebStorage.`);
      }

      // If no external web storage API instance is available then create a TJSSessionStorage instance.
      this.#sessionStorage = optionsSessionStorage !== void 0 ? optionsSessionStorage : new TJSSessionStorage();
   }

   /**
    * Initializes reactive support. Package private for internal use.
    *
    * @returns {import('./types-local').SvelteReactiveStores | undefined} Internal methods to interact with Svelte
    * stores.
    *
    * @package
    * @internal
    */
   initialize()
   {
      if (this.#initialized) { return; }

      this.#initialized = true;

      this.#storesInitialize();

      return {
         appOptionsUpdate: this.#storeAppOptionsUpdate,
         uiStateUpdate: this.#storeUIStateUpdate,
         subscribe: this.#storesSubscribe.bind(this),
         unsubscribe: this.#storesUnsubscribe.bind(this)
      };
   }

// Store getters -----------------------------------------------------------------------------------------------------

   /**
    * @returns {import('#runtime/svelte/store/web-storage').WebStorage} Returns WebStorage (session) instance.
    */
   get sessionStorage()
   {
      return this.#sessionStorage;
   }

   /**
    * Returns the store for app options.
    *
    * @returns {import('./types').StoreAppOptions} App options store.
    */
   get storeAppOptions() { return this.#storeAppOptions; }

   /**
    * Returns the store for UI options.
    *
    * @returns {import('./types').StoreUIOptions} UI options store.
    */
   get storeUIState() { return this.#storeUIState; }

// Only reactive getters ---------------------------------------------------------------------------------------------

   /**
    * Returns the current active Window / WindowProxy UI state.
    *
    * @returns Active window UI state.
    */
   get activeWindow(): Window { return this.#dataUIState.activeWindow ?? globalThis; }

   /**
    * Returns the current dragging UI state.
    *
    * @returns Dragging UI state.
    */
   get dragging(): boolean { return this.#dataUIState.dragging; }

   /**
    * Returns the current minimized UI state.
    *
    * @returns Minimized UI state.
    */
   get minimized(): boolean { return this.#dataUIState.minimized; }

   /**
    * Returns the current resizing UI state.
    *
    * @returns Resizing UI state.
    */
   get resizing(): boolean { return this.#dataUIState.resizing; }

   /**
    * Sets the current active Window / WindowProxy UI state.
    *
    * Note: This is protected usage and used internally.
    *
    * @param activeWindow - Active Window / WindowProxy UI state.
    */
   set activeWindow(activeWindow: Window)
   {
      // Note: when setting activeWindow to undefined `globalThis` is set. There isn't a great test for Window /
      // WindowProxy, so check `toString`.
      if (activeWindow === void 0 || activeWindow === null ||
       (Object.prototype.toString.call(activeWindow) === '[object Window]'))
      {
         this.#storeUIStateUpdate((options) => deepMerge(options, { activeWindow: activeWindow ?? globalThis }));
      }
   }

// Reactive getter / setters -----------------------------------------------------------------------------------------

   /**
    * Returns the draggable app option.
    *
    * @returns Draggable app option.
    */
   get draggable(): boolean { return this.#application?.options?.draggable; }

   /**
    * Returns the focusAuto app option.
    *
    * @returns When true auto-management of app focus is enabled.
    */
   get focusAuto(): boolean { return this.#application?.options?.focusAuto; }

   /**
    * Returns the focusKeep app option.
    *
    * @returns When `focusAuto` and `focusKeep` is true; keeps internal focus.
    */
   get focusKeep(): boolean { return this.#application?.options?.focusKeep; }

   /**
    * Returns the focusTrap app option.
    *
    * @returns When true focus trapping / wrapping is enabled keeping focus inside app.
    */
   get focusTrap(): boolean { return this.#application?.options?.focusTrap; }

   /**
    * Returns the headerButtonNoClose app option.
    *
    * @returns Remove the close the button in header app option.
    */
   get headerButtonNoClose(): boolean { return this.#application?.options?.headerButtonNoClose; }

   /**
    * Returns the headerButtonNoLabel app option.
    *
    * @returns Remove the labels from buttons in header app option.
    */
   get headerButtonNoLabel(): boolean { return this.#application?.options?.headerButtonNoLabel; }

   /**
    * Returns the headerIcon app option.
    *
    * @returns URL for header app icon.
    */
   get headerIcon(): string | undefined { return this.#application?.options?.headerIcon; }

   /**
    * Returns the headerNoTitleMinimized app option.
    *
    * @returns When true removes the header title when minimized.
    */
   get headerNoTitleMinimized(): boolean { return this.#application?.options?.headerNoTitleMinimized; }

   /**
    * Returns the minimizable app option.
    *
    * @returns {boolean} Minimizable app option.
    */
   get minimizable(): boolean { return this.#application?.options?.minimizable; }

   /**
    * Returns the Foundry popOut state; {@link Application.popOut}
    *
    * @returns Positionable app option.
    */
   get popOut(): boolean { return this.#application.popOut; }

   /**
    * Returns the positionable app option; {@link SvelteApp.Options.positionable}
    *
    * @returns Positionable app option.
    */
   get positionable(): boolean { return this.#application?.options?.positionable; }

   /**
    * Returns the resizable option.
    *
    * @returns Resizable app option.
    */
   get resizable(): boolean { return this.#application?.options?.resizable; }

   /**
    * Returns the title accessor from the parent Application class; {@link Application.title}
    *
    * @privateRemarks
    * TODO: Application v2; note that super.title localizes `this.options.title`; IMHO it shouldn't.    *
    *
    * @returns Title.
    */
   get title(): string { return this.#application.title; }

   /**
    * Sets `this.options.draggable` which is reactive for application shells.
    *
    * @param draggable - Sets the draggable option.
    */
   set draggable(draggable: boolean)
   {
      if (typeof draggable === 'boolean') { this.setOptions('draggable', draggable); }
   }

   /**
    * Sets `this.options.focusAuto` which is reactive for application shells.
    *
    * @param focusAuto - Sets the focusAuto option.
    */
   set focusAuto(focusAuto: boolean)
   {
      if (typeof focusAuto === 'boolean') { this.setOptions('focusAuto', focusAuto); }
   }

   /**
    * Sets `this.options.focusKeep` which is reactive for application shells.
    *
    * @param focusKeep - Sets the focusKeep option.
    */
   set focusKeep(focusKeep: boolean)
   {
      if (typeof focusKeep === 'boolean') { this.setOptions('focusKeep', focusKeep); }
   }

   /**
    * Sets `this.options.focusTrap` which is reactive for application shells.
    *
    * @param focusTrap - Sets the focusTrap option.
    */
   set focusTrap(focusTrap: boolean)
   {
      if (typeof focusTrap === 'boolean') { this.setOptions('focusTrap', focusTrap); }
   }

   /**
    * Sets `this.options.headerButtonNoClose` which is reactive for application shells.
    *
    * @param headerButtonNoClose - Sets the headerButtonNoClose option.
    */
   set headerButtonNoClose(headerButtonNoClose: boolean)
   {
      if (typeof headerButtonNoClose === 'boolean') { this.setOptions('headerButtonNoClose', headerButtonNoClose); }
   }

   /**
    * Sets `this.options.headerButtonNoLabel` which is reactive for application shells.
    *
    * @param headerButtonNoLabel - Sets the headerButtonNoLabel option.
    */
   set headerButtonNoLabel(headerButtonNoLabel: boolean)
   {
      if (typeof headerButtonNoLabel === 'boolean') { this.setOptions('headerButtonNoLabel', headerButtonNoLabel); }
   }

   /**
    * Sets `this.options.headerIcon` which is reactive for application shells.
    *
    * @param headerIcon - Sets the headerButtonNoLabel option.
    */
   set headerIcon(headerIcon: string | undefined)
   {
      if (headerIcon === void 0 || typeof headerIcon === 'string') { this.setOptions('headerIcon', headerIcon); }
   }

   /**
    * Sets `this.options.headerNoTitleMinimized` which is reactive for application shells.
    *
    * @param headerNoTitleMinimized - Sets the headerNoTitleMinimized option.
    */
   set headerNoTitleMinimized(headerNoTitleMinimized: boolean)
   {
      if (typeof headerNoTitleMinimized === 'boolean')
      {
         this.setOptions('headerNoTitleMinimized', headerNoTitleMinimized);
      }
   }

   /**
    * Sets `this.options.minimizable` which is reactive for application shells that are also pop out.
    *
    * @param minimizable - Sets the minimizable option.
    */
   set minimizable(minimizable: boolean)
   {
      if (typeof minimizable === 'boolean') { this.setOptions('minimizable', minimizable); }
   }

   /**
    * Sets `this.options.popOut` which is reactive for application shells. This will add / remove this application
    * from `ui.windows`.
    *
    * @param popOut - Sets the popOut option.
    */
   set popOut(popOut: boolean)
   {
      if (typeof popOut === 'boolean') { this.setOptions('popOut', popOut); }
   }

   /**
    * Sets `this.options.positionable` enabling / disabling {@link SvelteApplication.position}.
    *
    * @param positionable - Sets the positionable option.
    */
   set positionable(positionable: boolean)
   {
      if (typeof positionable === 'boolean') { this.setOptions('positionable', positionable); }
   }

   /**
    * Sets `this.options.resizable` which is reactive for application shells.
    *
    * @param resizable - Sets the resizable option.
    */
   set resizable(resizable: boolean)
   {
      if (typeof resizable === 'boolean') { this.setOptions('resizable', resizable); }
   }

   /**
    * Sets `this.options.title` which is reactive for application shells.
    *
    * Note: Will set empty string if title is undefined or null.
    *
    * @param title - Application title; will be localized, so a translation key is fine.
    */
   set title(title: string | undefined | null)
   {
      if (typeof title === 'string')
      {
         this.setOptions('title', title);
      }
      else if (title === void 0 || title === null)
      {
         this.setOptions('title', '');
      }
   }

   // Reactive Options API -------------------------------------------------------------------------------------------

   /**
    * Provides a way to safely get this applications options given an accessor string which describes the
    * entries to walk. To access deeper entries into the object format the accessor string with `.` between entries
    * to walk.
    *
    * // TODO DOCUMENT the accessor in more detail.
    *
    * @param accessor - The path / key to set. You can set multiple levels.
    *
    * @param [defaultValue] - A default value returned if the accessor is not found.
    *
    * @returns Value at the accessor.
    */
   getOptions(accessor: string, defaultValue?: any): any
   {
      return safeAccess(this.#application.options, accessor, defaultValue);
   }

   /**
    * Provides a way to merge `options` into this applications options and update the appOptions store.
    *
    * @param {object}   options - The options object to merge with `this.options`.
    */
   mergeOptions(options: object)
   {
      this.#storeAppOptionsUpdate((instanceOptions: object): object => deepMerge(instanceOptions, options));
   }

   /**
    * Provides a way to safely set this applications options given an accessor string which describes the
    * entries to walk. To access deeper entries into the object format the accessor string with `.` between entries
    * to walk.
    *
    * Additionally if an application shell Svelte component is mounted and exports the `appOptions` property then
    * the application options is set to `appOptions` potentially updating the application shell / Svelte component.
    *
    * // TODO DOCUMENT the accessor in more detail.
    *
    * @param accessor - The path / key to set. You can set multiple levels.
    *
    * @param value - Value to set.
    */
   setOptions(accessor: string, value: any): void
   {
      const success: boolean = safeSet(this.#application.options, accessor, value);

      // If `this.options` modified then update the app options store.
      if (success)
      {
         this.#storeAppOptionsUpdate(() => this.#application.options);
      }
   }

   /**
    * Serializes the main {@link SvelteApp.Options} for common application state.
    *
    * @returns Common application state.
    */
   toJSON(): SvelteReactiveData
   {
      return {
         draggable: this.#application?.options?.draggable ?? true,
         focusAuto: this.#application?.options?.focusAuto ?? true,
         focusKeep: this.#application?.options?.focusKeep ?? false,
         focusTrap: this.#application?.options?.focusTrap ?? true,
         headerButtonNoClose: this.#application?.options?.headerButtonNoClose ?? false,
         headerButtonNoLabel: this.#application?.options?.headerButtonNoLabel ?? false,
         headerNoTitleMinimized: this.#application?.options?.headerNoTitleMinimized ?? false,
         minimizable: this.#application?.options?.minimizable ?? true,
         positionable: this.#application?.options?.positionable ?? true,
         resizable: this.#application?.options?.resizable ?? true
      };
   }

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
    * @param {object} [opts] - Optional parameters (for internal use)
    *
    * @param {boolean} [opts.headerButtonNoClose] - The value for `headerButtonNoClose`.
    *
    * @param {boolean} [opts.headerButtonNoLabel] - The value for `headerButtonNoLabel`.
    */
   updateHeaderButtons({ headerButtonNoClose = this.#application.options.headerButtonNoClose,
    headerButtonNoLabel = this.#application.options.headerButtonNoLabel } = {})
   {
      // @ts-ignore
      let buttons = this.#application._getHeaderButtons();

      // Remove close button if this.options.headerButtonNoClose is true;
      if (typeof headerButtonNoClose === 'boolean' && headerButtonNoClose)
      {
         buttons = buttons.filter((button) => button.class !== 'close');
      }

      // Remove labels if this.options.headerButtonNoLabel is true;
      if (typeof headerButtonNoLabel === 'boolean' && headerButtonNoLabel)
      {
         for (const button of buttons) { button.label = void 0; }
      }

      this.#storeUIStateUpdate((options) =>
      {
         options.headerButtons = buttons;
         return options;
      });
   }

   // Internal implementation ----------------------------------------------------------------------------------------

   /**
    * Initializes the Svelte stores and derived stores for the application options and UI state.
    *
    * While writable stores are created the update method is stored in private variables locally and derived Readable
    * stores are provided for essential options which are commonly used.
    *
    * These stores are injected into all Svelte components mounted under the `external` context: `storeAppOptions` and
    * `storeUIState`.
    */
   #storesInitialize()
   {
      const writableAppOptions = writable(this.#application.options);

      // Keep the update function locally, but make the store essentially readable.
      this.#storeAppOptionsUpdate = writableAppOptions.update;

      /**
       * Create custom store. The main subscribe method for all app options changes is provided along with derived
       * writable stores for all reactive options.
       *
       * @type {import('./types').StoreAppOptions}
       */
      const storeAppOptions = {
         subscribe: writableAppOptions.subscribe,

         draggable: propertyStore(writableAppOptions, 'draggable'),
         focusAuto: propertyStore(writableAppOptions, 'focusAuto'),
         focusKeep: propertyStore(writableAppOptions, 'focusKeep'),
         focusTrap: propertyStore(writableAppOptions, 'focusTrap'),
         headerButtonNoClose: propertyStore(writableAppOptions, 'headerButtonNoClose'),
         headerButtonNoLabel: propertyStore(writableAppOptions, 'headerButtonNoLabel'),
         headerIcon: propertyStore(writableAppOptions, 'headerIcon'),
         headerNoTitleMinimized: propertyStore(writableAppOptions, 'headerNoTitleMinimized'),
         minimizable: propertyStore(writableAppOptions, 'minimizable'),
         popOut: propertyStore(writableAppOptions, 'popOut'),
         positionable: propertyStore(writableAppOptions, 'positionable'),
         resizable: propertyStore(writableAppOptions, 'resizable'),
         title: propertyStore(writableAppOptions, 'title')
      };

      Object.freeze(storeAppOptions);

      this.#storeAppOptions = storeAppOptions;

      this.#dataUIState = {
         activeWindow: globalThis,
         dragging: false,
         headerButtons: [],
         minimized: this.#application._minimized,
         resizing: false
      };

      // Create a store for UI state data.
      const writableUIOptions = writable(this.#dataUIState);

      // Keep the update function locally, but make the store essentially readable.
      this.#storeUIStateUpdate = writableUIOptions.update;

      /**
       * @type {import('./types').StoreUIOptions}
       */
      const storeUIState = {
         subscribe: writableUIOptions.subscribe,

         // activeWindow: propertyStore(writableUIOptions, 'activeWindow'),
         activeWindow: derived(writableUIOptions, ($options, set) => set($options.activeWindow)),
         dragging: propertyStore(writableUIOptions, 'dragging'),
         headerButtons: derived(writableUIOptions, ($options, set) => set($options.headerButtons)),
         minimized: derived(writableUIOptions, ($options, set) => set($options.minimized)),
         resizing: propertyStore(writableUIOptions, 'resizing')
      };

      Object.freeze(storeUIState);

      // Initialize the store with options set in the Application constructor.
      this.#storeUIState = storeUIState;
   }

   /**
    * Registers local store subscriptions for app options. `popOut` controls registering this app with `ui.windows`.
    *
    * @see SvelteApplication._injectHTML
    */
   #storesSubscribe()
   {
      // Register local subscriptions.

      // Handles updating header buttons to add / remove the close button.
      this.#storeUnsubscribe.push(subscribeIgnoreFirst(this.#storeAppOptions.headerButtonNoClose, (value) =>
      {
         this.updateHeaderButtons({ headerButtonNoClose: value });
      }));

      // Handles updating header buttons to add / remove button labels.
      this.#storeUnsubscribe.push(subscribeIgnoreFirst(this.#storeAppOptions.headerButtonNoLabel, (value) =>
      {
         this.updateHeaderButtons({ headerButtonNoLabel: value });
      }));

      // Handles adding / removing this application from `ui.windows` when popOut changes.
      this.#storeUnsubscribe.push(subscribeIgnoreFirst(this.#storeAppOptions.popOut, (value) =>
      {
         if (value && this.#application.rendered)
         {
            globalThis.ui.windows[this.#application.appId] = this.#application;
         }
         else
         {
            delete globalThis.ui.windows[this.#application.appId];
         }
      }));
   }

   /**
    * Unsubscribes from any locally monitored stores.
    *
    * @see SvelteApplication.close
    */
   #storesUnsubscribe()
   {
      this.#storeUnsubscribe.forEach((unsubscribe) => unsubscribe());
      this.#storeUnsubscribe = [];
   }
}
