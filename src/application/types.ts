import type { A11yFocusSource }     from '#runtime/util/a11y';

import type {
   System,
   ValidatorAPI,
   TransformAPI }                   from '#runtime/svelte/store/position';

import type { WebStorage }          from '#runtime/svelte/store/web-storage';

import { TJSSvelteConfig }          from '#runtime/svelte/util';

declare namespace SvelteApp {
   /**
    * Svelte context interfaces for {@link SvelteApplication}.
    */
   export namespace Context {
      /**
       * The `#external` context.
       */
      export interface External<App extends import('./SvelteApplication').SvelteApplication = import('./SvelteApplication').SvelteApplication> {
         /**
          * The external application instance.
          */
         application: App;

         /**
          * Create a function to generate a callback for Svelte components to invoke to update the tracked elements for
          * application shells in the external application instance. There are rare cases that the main element root
          * changes in a mounted application component. The update is only triggered on successive changes of
          * `elementRoot`. Returns a boolean to indicate the element roots are updated.
          */
         elementRootUpdate: () => (elementRoot: HTMLElement) => boolean;

         /**
          * The session storage store manager associated with the external application.
          */
         sessionStorage: WebStorage;
      }
   }

   /**
    * Options for SvelteApplication. Note: that this extends the Foundry `ApplicationOptions`.
    */
   interface Options extends ApplicationOptions
   {
      /**
       * If false the default slide close animation is not run.
       *
       * @defaultValue true
       */
      defaultCloseAnimation: boolean;

      /**
       * If true then application shells are draggable.
       *
       * @defaultValue true
       */
      draggable: boolean;

      /**
       * When true auto-management of app focus is enabled.
       *
       * @defaultValue true
       */
      focusAuto: boolean;

      /**
       * When `focusAuto` and `focusKeep` is true; keeps internal focus.
       *
       * @defaultValue false
       */
      focusKeep: boolean;

      /**
       * Defines A11yHelper focus source to apply when application closes.
       *
       * @defaultValue: undefined
       */
      focusSource: A11yFocusSource;

      /**
       * When true focus trapping / wrapping is enabled keeping focus inside app.
       *
       * @defaultValue true
       */
      focusTrap: boolean;

      /**
       * If true then the close header button is removed.
       *
       * @defaultValue false
       */
      headerButtonNoClose: boolean;

      /**
       * If true then header button labels are removed.
       *
       * @defaultValue false
       */
      headerButtonNoLabel: boolean;

      /**
       * Sets a header icon given an image URL.
       *
       * @defaultValue undefined
       */
      headerIcon: string;

      /**
       * If true then header title is hidden when minimized.
       *
       * @defaultValue false
       */
      headerNoTitleMinimized: boolean;

      /**
       * Assigned to position. Number specifying minimum window height.
       *
       * @defaultValue 50
       */
      minHeight: number;

      /**
       * Assigned to position. Number specifying minimum window width.
       *
       * @defaultValue 200
       */
      minWidth: number;

      /**
       * If false then `position.set` does not take effect.
       *
       * @defaultValue true
       */
      positionable: boolean;

      /**
       * A helper for initial position placement.
       *
       * @defaultValue TJSPosition.Initial.browserCentered
       */
      positionInitial: System.Initial.InitialSystem;

      /**
       * When true TJSPosition is optimized for orthographic use.
       *
       * @defaultValue true
       */
      positionOrtho: boolean;

      /**
       * A validator function or data or list of validators.
       *
       * @defaultValue TJSPosition.Validators.transformWindow
       */
      positionValidator: ValidatorAPI.ValidatorOption;

      /**
       * An instance of WebStorage (session) to share across SvelteApplications. This is only required to share a
       * WebStorage instance across multiple SvelteApplications. By default, a unique
       * {@link #runtime/svelte/store/web-storage!TJSSessionStorage} instance is created per SvelteApplication.
       *
       * @defaultValue TJSSessionStorage
       */
      sessionStorage: WebStorage;

      /**
       * A Svelte configuration object defining the main component loaded.
       *
       * Note: that `svelte.class` and `svelte.target` is required and will cause an error if missing.
       * `Partial<TJSSvelteConfig>` is used for the types to allow any sort of late binding to the options defining the
       * required SvelteComponent `class` and `target` properties.
       */
      svelte: Partial<TJSSvelteConfig>;

      /**
       * By default, 'top / left' respects rotation when minimizing.
       *
       * @defaultValue 'top left'
       */
      transformOrigin: TransformAPI.TransformOrigin;

      /**
       *
       */
      zIndex: number;

      // The following are overrides of core Foundry `ApplicationOptions` providing type expansion and comments.

      /**
       * The default pixel height for app. You may also use relative units including percentages.
       *
       * {@link #runtime/svelte/store/position!Data.TJSPositionDataRelative}.
       *
       * @defaultValue `null`
       */
      width: number | string | null;

      /**
       * The default pixel height for app. You may also use relative units including percentages.
       *
       * {@link #runtime/svelte/store/position!Data.TJSPositionDataRelative}.
       *
       * @defaultValue `null`
       */
      height: number | string | null;

      /**
       * The default top offset position for app. You may also use relative units including percentages.
       *
       * {@link #runtime/svelte/store/position!Data.TJSPositionDataRelative}.
       *
       * @defaultValue `null`
       */
      top: number | string | null;

      /**
       * The default left offset position for app. You may also use relative units including percentages.
       *
       * {@link #runtime/svelte/store/position!Data.TJSPositionDataRelative}.
       *
       * @defaultValue `null`
       */
      left: number | string |  null;
   }
}

export { SvelteApp };
