import { TJSPosition }     from '#runtime/svelte/store/position';
import { TJSSvelteUtil }   from '#runtime/svelte/util';
import { A11yHelper }      from '#runtime/util/a11y';
import { CrossWindow }     from '#runtime/util/browser';

import {
   deepMerge,
   hasGetter,
   isObject }              from '#runtime/util/object';

import {
   ApplicationStateImpl,
   GetSvelteData,
   loadSvelteConfig,
   SvelteReactive,
   TJSAppIndex }           from './internal/index.js';

import type { TJSPositionTypes } from '#runtime/svelte/store/position';

import type { MountedAppShell }  from './internal/state-svelte/types';

/**
 * Provides a Svelte aware extension to the Foundry {@link Application} class to manage the app lifecycle
 * appropriately. You can declaratively load one or more components from `defaultOptions` using a
 * {@link #runtime/svelte/util!TJSSvelteConfig} object in the {@link SvelteApp.Options.svelte} property.
 *
 * @template [Options = import('./types').SvelteApp.Options]
 * @augments {Application<Options>}
 */
export class SvelteApplication extends Application implements TJSPositionTypes.Positionable
{
   /**
    * Stores the first mounted component which follows the application shell contract.
    */
   #applicationShellHolder: MountedAppShell[] | null[] = [null];

   /**
    * Stores and manages application state for saving / restoring / serializing.
    */
   #applicationState: ApplicationStateImpl;

   /**
    * Stores the target element which may not necessarily be the main element.
    */
   #elementTarget: HTMLElement = null;

   /**
    * Stores the content element which is set for application shells.
    */
   #elementContent: HTMLElement = null;

   /**
    * On initial render gating of `setPosition` invoked by `Application._render` occurs, so that percentage values
    * can correctly be positioned with initial helper constraints (centered).
    *
    * @type {boolean}
    */
   #gateSetPosition = false;

   /**
    * Stores initial z-index from `_renderOuter` to set to target element / Svelte component.
    *
    * @type {number}
    */
   #initialZIndex = 95;

   /**
    * Stores on mount state which is checked in _render to trigger onSvelteMount callback.
    *
    * @type {boolean}
    */
   #onMount = false;

   /**
    * The position store.
    *
    * @type {TJSPosition}
    */
   #position;

   /**
    * Contains the Svelte stores and reactive accessors.
    *
    * @type {SvelteReactive}
    */
   #reactive;

   /**
    * Stores SvelteData entries with instantiated Svelte components.
    *
    * @type {import('./internal/state-svelte/types').SvelteData[]}
    */
   #svelteData = [];

   /**
    * Provides a helper class that combines multiple methods for interacting with the mounted components tracked in
    * #svelteData.
    *
    * @type {GetSvelteData}
    */
   #getSvelteData = new GetSvelteData(this.#applicationShellHolder, this.#svelteData);

   /**
    * Contains methods to interact with the Svelte stores.
    *
    * @type {import('./internal/state-reactive/types-local').SvelteReactiveStores}
    */
   #stores;

   /**
    * @param {Partial<Options>} [options] - The options for the application.
    */
   constructor(options = {})
   {
      super(options);

      if (!isObject(this.options.svelte))
      {
         throw new Error(`SvelteApplication - constructor - No Svelte configuration object found in 'options'.`);
      }

      /** @type {ApplicationStateImpl} */
      this.#applicationState = new ApplicationStateImpl(this);

      // Initialize TJSPosition with the position object set by Application.
      this.#position = new TJSPosition(this, {
         ...this.position,
         ...this.options,
         initial: this.options.positionInitial,
         ortho: this.options.positionOrtho,
         validator: this.options.positionValidator
      });

      // Remove old position field.
      delete this.position;

      /**
       * Define accessors to retrieve TJSPosition by `this.position`.
       *
       * @member {TJSPosition} position - Adds accessors to SvelteApplication to get / set the position data.
       *
       * @memberof SvelteApplication#
       */
      Object.defineProperty(this, 'position', {
         get: () => this.#position,
         set: (position) => { if (isObject(position)) { this.#position.set(position); } }
      });

      this.#reactive = new SvelteReactive(this);

      this.#stores = this.#reactive.initialize();
   }

   /**
    * Specifies the default options that SvelteApplication supports.
    *
    * @returns {import('./types').SvelteApp.Options} options - Application options.
    * @see https://foundryvtt.com/api/interfaces/client.ApplicationOptions.html
    */
   static get defaultOptions()
   {
      return /** @type {import('./types').SvelteApp.Options} */ deepMerge(super.defaultOptions, {
         defaultCloseAnimation: true,     // If false the default slide close animation is not run.
         draggable: true,                 // If true then application shells are draggable.
         focusAuto: true,                 // When true auto-management of app focus is enabled.
         focusKeep: false,                // When `focusAuto` and `focusKeep` is true; keeps internal focus.
         focusSource: void 0,             // Stores any A11yFocusSource data that is applied when app is closed.
         focusTrap: true,                 // When true focus trapping / wrapping is enabled keeping focus inside app.
         headerButtonNoClose: false,      // If true then the close header button is removed.
         headerButtonNoLabel: false,      // If true then header button labels are removed for application shells.
         headerIcon: void 0,              // Sets a header icon given an image URL.
         headerNoTitleMinimized: false,   // If true then header title is hidden when application is minimized.
         minHeight: MIN_WINDOW_HEIGHT,    // Assigned to position. Number specifying minimum window height.
         minWidth: MIN_WINDOW_WIDTH,      // Assigned to position. Number specifying minimum window width.
         positionable: true,              // If false then `position.set` does not take effect.
         positionInitial: TJSPosition.Initial.browserCentered,      // A helper for initial position placement.
         positionOrtho: true,             // When true TJSPosition is optimized for orthographic use.
         positionValidator: TJSPosition.Validators.transformWindow, // A function providing the default validator.
         sessionStorage: void 0,          // An instance of WebStorage (session) to share across SvelteApplications.
         svelte: void 0,                  // A Svelte configuration object.
         transformOrigin: 'top left'      // By default, 'top / left' respects rotation when minimizing.
      });
   }

   /**
    * Returns the content element if an application shell is mounted.
    *
    * @returns {HTMLElement} Content element.
    */
   get elementContent() { return this.#elementContent; }

   /**
    * Returns the target element or main element if no target defined.
    *
    * @returns {HTMLElement} Target element.
    */
   get elementTarget() { return this.#elementTarget; }

   /**
    * Returns the reactive accessors & Svelte stores for SvelteApplication.
    *
    * @returns {import('./internal/state-reactive/types').SvelteReactive} The reactive accessors & Svelte stores.
    */
   get reactive() { return this.#reactive; }

   /**
    * Returns the application state manager.
    *
    * @returns {import('./internal/state-app/types').ApplicationState} The application state manager.
    */
   get state() { return this.#applicationState; }

   /**
    * Returns the Svelte helper class w/ various methods to access mounted Svelte components.
    *
    * @returns {import('./internal/state-svelte/types').GetSvelteData} GetSvelteData
    */
   get svelte() { return this.#getSvelteData; }

   /**
    * In this case of when a template is defined in app options `html` references the inner HTML / template. However,
    * to activate classic v1 tabs for a Svelte component the element target is passed as an array simulating JQuery as
    * the element is retrieved immediately and the core listeners use standard DOM queries.
    *
    * @protected
    * @ignore
    * @internal
    */
   _activateCoreListeners(html)
   {
      super._activateCoreListeners(typeof this.options.template === 'string' ? html :
       [this.popOut ? this.#elementTarget?.firstChild : this.#elementTarget]);
   }

   /**
    * Provide an override to set this application as the active window regardless of z-index. Changes behaviour from
    * Foundry core.
    *
    * @param {object} [opts] - Optional parameters.
    *
    * @param {boolean} [opts.focus=true] - When true and the active element is not contained in the app `elementTarget`
    *        is focused..
    *
    * @param {boolean} [opts.force=false] - Force bring to top; will increment z-index by popOut order.
    *
    * @ignore
    * @internal
    */
   bringToTop({ focus = true, force = false } = {})
   {
      // Only perform bring to top when the active window is the main Foundry window instance.
      if (this.reactive.activeWindow !== globalThis) { return; }

      if (force || this.popOut) { super.bringToTop(); }

      const elementTarget = this.elementTarget;
      const activeElement = document.activeElement;

      // If the activeElement is not contained in this app via elementTarget then blur the current active element
      // and make elementTarget focused.
      if (focus && elementTarget && activeElement !== elementTarget && !elementTarget?.contains(activeElement))
      {
         // Blur current active element.
         if (A11yHelper.isFocusTarget(activeElement))
         {
            activeElement.blur();
         }

         elementTarget?.focus();
      }

      globalThis.ui.activeWindow = this;
   }

   /**
    * Note: This method is fully overridden and duplicated as Svelte components need to be destroyed manually and the
    * best visual result is to destroy them after the default slide up animation occurs, but before the element
    * is removed from the DOM.
    *
    * If you destroy the Svelte components before the slide up animation the Svelte elements are removed immediately
    * from the DOM. The purpose of overriding ensures the slide up animation is always completed before
    * the Svelte components are destroyed and then the element is removed from the DOM.
    *
    * Close the application and unregisters references to it within UI mappings.
    * This function returns a Promise which resolves once the window closing animation concludes.
    *
    * @param {object}   [options] - Optional parameters.
    *
    * @param {boolean}  [options.force] - Force close regardless of render state.
    *
    * @returns {Promise<void>}    A Promise which resolves once the application is closed.
    *
    * @ignore
    * @internal
    */
   async close(options = {})
   {
      const states = Application.RENDER_STATES;

      if (!options.force && ![states.RENDERED, states.ERROR].includes(this._state)) { return; }

      /**
       * Get the element.
       *
       * @type {HTMLElement}
       */
      const el = this.#elementTarget;
      if (!el)
      {
         /**
          * @ignore
          * @internal
          */
         this._state = states.CLOSED;

         return;
      }

      // Support for PopOut! module; `close` is double invoked; once before the element is rejoined to the main window.
      // Reject close invocations when the element window is not the main originating window / globalThis.
      if (CrossWindow.getWindow(el, { throws: false }) !== globalThis) { return; }

      /**
       * @ignore
       * @internal
       */
      this._state = states.CLOSING;

      // Unsubscribe from any local stores.
      this.#stores.unsubscribe();

      // Make any window content overflow hidden to avoid any scrollbars appearing in default or Svelte outro
      // transitions.
      const content = el.querySelector('.window-content');
      if (content)
      {
         content.style.overflow = 'hidden';

         // Set all children of content to overflow hidden as if there is going to be additional scrolling elements
         // they are likely one level deep.
         for (let cntr = content.children.length; --cntr >= 0;)
         {
            content.children[cntr].style.overflow = 'hidden';
         }
      }

      // Dispatch Hooks for closing the base and subclass applications
      for (const cls of this.constructor._getInheritanceChain())
      {
         /**
          * A hook event that fires whenever this Application is closed.
          *
          * Note: JQuery wrapping as Foundry event arguments uses JQuery.
          */
         Hooks.call(`close${cls.name}`, this, $(el));
      }

      // If options `defaultCloseAnimation` is false then do not execute the standard slide up animation.
      // This allows Svelte components to provide any out transition. Application shells will automatically set
      // `defaultCloseAnimation` based on any out transition set or unset.
      const animate = typeof this.options.defaultCloseAnimation === 'boolean' ? this.options.defaultCloseAnimation :
       true;

      if (animate)
      {
         // Set min height for full slide.
         el.style.minHeight = '0';

         const { paddingBottom, paddingTop } = globalThis.getComputedStyle(el);

         // Slide-up application.
         await el.animate([
            { maxHeight: `${el.clientHeight}px`, paddingTop, paddingBottom },
            { maxHeight: 0, paddingTop: 0, paddingBottom: 0 }
         ], { duration: 250, easing: 'ease-in', fill: 'forwards' }).finished;
      }

      // Stores the Promises returned from running outro transitions and destroying each Svelte component.
      const svelteDestroyPromises = [];

      // Manually invoke the destroy callbacks for all Svelte components.
      for (const entry of this.#svelteData)
      {
         // Use `outroAndDestroy` to run outro transitions before destroying.
         svelteDestroyPromises.push(TJSSvelteUtil.outroAndDestroy(entry.component));

         // If any proxy eventbus has been added then remove all event registrations from the component.
         const eventbus = entry.config.eventbus;
         if (isObject(eventbus) && typeof eventbus.off === 'function')
         {
            eventbus.off();
            entry.config.eventbus = void 0;
         }
      }

      // Await all Svelte components to destroy.
      await Promise.allSettled(svelteDestroyPromises);

      // Remove from all visible apps tracked.
      TJSAppIndex.delete(this);

      // Reset SvelteData like this to maintain reference to GetSvelteData / `this.svelte`.
      this.#svelteData.length = 0;

      // Remove element from the DOM. Most SvelteComponents have already removed it.
      el.remove();

      // Silently restore any width / height state before minimized as applicable.
      this.position.state.restore({
         name: '#beforeMinimized',
         properties: ['width', 'height'],
         silent: true,
         remove: true
      });

      // Clean up data
      this.#applicationShellHolder[0] = null;

      /**
       * @ignore
       * @internal
       */
      this._element = null;
      this.#elementContent = null;
      this.#elementTarget = null;

      delete globalThis.ui.windows[this.appId];

      /**
       * @ignore
       * @internal
       */
      this._minimized = false;

      /**
       * @ignore
       * @internal
       */
      this._scrollPositions = null;

      /**
       * @ignore
       * @internal
       */
      this._state = states.CLOSED;

      this.#onMount = false;

      // Update the minimized UI store state.
      this.#stores.uiStateUpdate((storeOptions) => deepMerge(storeOptions, { minimized: this._minimized }));

      // Apply any stored focus options and then remove them from options.
      A11yHelper.applyFocusSource(this.options.focusSource);

      delete this.options.focusSource;
   }

   /**
    * Inject the Svelte components defined in `this.options.svelte`. The Svelte component can attach to the existing
    * pop-out of Application or provide no template and render into a document fragment which is then attached to the
    * DOM.
    *
    * @protected
    * @ignore
    * @internal
    */
   _injectHTML()
   {
      // Make sure the store is updated with the latest header buttons. Also allows filtering buttons before display.
      this.reactive.updateHeaderButtons();

      // Create a function to generate a callback for Svelte components to invoke to update the tracked elements for
      // application shells in the rare cases that the main element root changes. The update is only triggered on
      // successive changes of `elementRoot`. Returns a boolean to indicate the element roots are updated.
      const elementRootUpdate = () =>
      {
         let cntr = 0;

         return (elementRoot) =>
         {
            if (elementRoot !== null && elementRoot !== void 0 && cntr++ > 0)
            {
               this.#updateApplicationShell();
               return true;
            }

            return false;
         };
      };

      // A sanity check; absence should be detected in constructor.
      if (!isObject(this.options.svelte))
      {
         throw new Error(`SvelteApplication - _injectHTML - No Svelte configuration object found in 'options'.`);
      }

      const svelteData = loadSvelteConfig({
         app: this,
         config: this.options.svelte,
         elementRootUpdate
      });

      // A sanity check as shouldn't hit this case as only one component is being mounted.
      if (this.svelte.applicationShell !== null)
      {
         throw new Error(
          `SvelteApplication - _injectHTML - An application shell is already mounted; offending config:\n` +
           `${JSON.stringify(this.options.svelte)}`);
      }

      this.#applicationShellHolder[0] = svelteData.component;

      // If Vite / HMR / svelte_hmr is enabled then add a hook to receive callbacks when the ProxyComponent
      // refreshes. Update the element root accordingly and force an update to TJSPosition.
      // See this issue for info about `on_hmr`:
      // https://github.com/sveltejs/svelte-hmr/issues/57
      if (TJSSvelteUtil.isHMRProxy(svelteData.component) && Array.isArray(svelteData.component?.$$?.on_hmr))
      {
         svelteData.component.$$.on_hmr.push(() => () => this.#updateApplicationShell());
      }

      this.#svelteData.push(svelteData);

      // Wrap `elementRoot` as a JQuery object and set to AppV1 / Application element.
      this._element = $(this.svelte.applicationShell.elementRoot);

      // Detect if the application shell exports an `elementContent` accessor.
      this.#elementContent = hasGetter(this.svelte.applicationShell, 'elementContent') ?
       this.svelte.applicationShell.elementContent : null;

      // Detect if the application shell exports an `elementTarget` accessor if not set `elementTarget` to
      // `elementRoot`.
      this.#elementTarget = hasGetter(this.svelte.applicationShell, 'elementTarget') ?
       this.svelte.applicationShell.elementTarget : this.svelte.applicationShell.elementRoot;

      // The initial zIndex may be set in application options or for popOut applications is stored by `_renderOuter`
      // in `this.#initialZIndex`.
      if (typeof this.options.positionable === 'boolean' && this.options.positionable)
      {
         this.#elementTarget.style.zIndex = typeof this.options.zIndex === 'number' ? this.options.zIndex :
          this.#initialZIndex ?? 95;
      }

      // Subscribe to local store handling.
      this.#stores.subscribe();
   }

   /**
    * Provides a mechanism to update the UI options store for maximized.
    *
    * Note: the sanity check is duplicated from {@link Application.maximize} the store is updated _before_
    * performing the rest of animations. This allows application shells to remove / show any resize handlers
    * correctly. Extra constraint data is stored in a saved position state in {@link SvelteApplication.minimize}
    * to animate the content area.
    *
    * @param {object}   [opts] - Optional parameters.
    *
    * @param {boolean}  [opts.animate=true] - When true perform default maximizing animation.
    *
    * @param {number}   [opts.duration=0.1] - Controls content area animation duration in seconds.
    */
   async maximize({ animate = true, duration = 0.1 } = {})
   {
      if (!this.popOut || [false, null].includes(this._minimized)) { return; }

      this._minimized = null;

      const durationMS = duration * 1000; // For WAAPI.

      // Get content
      const element = this.elementTarget;
      const header = element.querySelector('.window-header');
      const content = element.querySelector('.window-content');

      // Get the complete position before minimized. Used to reset min width & height to initial values later.
      const positionBefore = this.position.state.get({ name: '#beforeMinimized' });

      // First animate / restore width / async.
      if (animate)
      {
         await this.position.state.restore({
            name: '#beforeMinimized',
            async: true,
            animateTo: true,
            properties: ['width'],
            duration: 0.1
         });
      }

      element.classList.remove('minimized');

      // Reset display none on all children of header.
      for (let cntr = header.children.length; --cntr >= 0;) { header.children[cntr].style.display = null; }

      content.style.display = null;

      let constraints;

      if (animate)
      {
         // Next animate / restore height synchronously and remove key. Retrieve constraints data for slide up animation
         // below.
         ({ constraints } = this.position.state.restore({
            name: '#beforeMinimized',
            animateTo: true,
            properties: ['height'],
            remove: true,
            duration
         }));
      }
      else
      {
         ({ constraints } = this.position.state.remove({ name: '#beforeMinimized' }));
      }

      // Slide down content with stored constraints.
      await content.animate([
         { maxHeight: 0, paddingTop: 0, paddingBottom: 0, offset: 0 },
         { ...constraints, offset: 1 },
         { maxHeight: '100%', offset: 1 },
      ], { duration: durationMS, fill: 'forwards' }).finished; // WAAPI in ms.

      // Restore previous min width & height from saved data, app options, or default Foundry values.
      this.position.set({
         minHeight: positionBefore.minHeight ?? this.options?.minHeight ?? MIN_WINDOW_HEIGHT,
         minWidth: positionBefore.minWidth ?? this.options?.minWidth ?? MIN_WINDOW_WIDTH,
      });

      // Remove inline styles that override any styles assigned to the app.
      element.style.minWidth = null;
      element.style.minHeight = null;

      this._minimized = false;

      // Using a 50ms timeout prevents any instantaneous display of scrollbars with the above maximize animation.
      setTimeout(() =>
      {
         content.style.overflow = null;

         // Reset all children of content removing overflow hidden.
         for (let cntr = content.children.length; --cntr >= 0;)
         {
            content.children[cntr].style.overflow = null;
         }
      }, 50);

      this.#stores.uiStateUpdate((options) => deepMerge(options, { minimized: false }));
   }

   /**
    * Provides a mechanism to update the UI options store for minimized.
    *
    * Note: the sanity check is duplicated from {@link Application.minimize} the store is updated _before_
    * performing the rest of animations. This allows application shells to remove / show any resize handlers
    * correctly. Extra constraint data is stored in a saved position state in {@link SvelteApplication.minimize}
    * to animate the content area.
    *
    * @param {object}   [opts] - Optional parameters.
    *
    * @param {boolean}  [opts.animate=true] - When true perform default minimizing animation.
    *
    * @param {number}   [opts.duration=0.1] - Controls content area animation duration in seconds.
    */
   async minimize({ animate = true, duration = 0.1 } = {})
   {
      if (!this.rendered || !this.popOut || [true, null].includes(this._minimized)) { return; }

      this.#stores.uiStateUpdate((options) => deepMerge(options, { minimized: true }));

      this._minimized = null;

      const durationMS = duration * 1000; // For WAAPI.

      const element = this.elementTarget;

      // Get content
      const header = element.querySelector('.window-header');
      const content = element.querySelector('.window-content');

      // Save current max / min height & width.
      const beforeMinWidth = this.position.minWidth;
      const beforeMinHeight = this.position.minHeight;

      // Set minimized min width & height for header bar.
      this.position.set({ minWidth: 100, minHeight: 30 });

      // Also set inline styles to override any styles scoped to the app.
      element.style.minWidth = '100px';
      element.style.minHeight = '30px';

      if (content)
      {
         content.style.overflow = 'hidden';

         // Set all children of content to overflow hidden as if there is going to be additional scrolling elements
         // they are likely one level deep.
         for (let cntr = content.children.length; --cntr >= 0;)
         {
            content.children[cntr].style.overflow = 'hidden';
         }
      }

      const { paddingBottom, paddingTop } = globalThis.getComputedStyle(content);

      // Extra data that is saved with the current position. Used during `maximize`.
      const constraints = {
         maxHeight: `${content.clientHeight}px`,
         paddingTop,
         paddingBottom
      };

      // Slide-up content
      if (animate)
      {
         const animation = content.animate([
            constraints,
            { maxHeight: 0, paddingTop: 0, paddingBottom: 0 }
         ], { duration: durationMS, fill: 'forwards' }); // WAAPI in ms.

         // Set display style to none when animation finishes.
         animation.finished.then(() => content.style.display = 'none');
      }
      else
      {
         setTimeout(() => content.style.display = 'none', durationMS);
      }

      // Save current position state and add the constraint data to use in `maximize`.
      const saved = this.position.state.save({ name: '#beforeMinimized', constraints });

      // Set the initial before min width & height.
      saved.minWidth = beforeMinWidth;
      saved.minHeight = beforeMinHeight;

      const headerOffsetHeight = header.offsetHeight;

      // minHeight needs to be adjusted to header height.
      this.position.minHeight = headerOffsetHeight;

      if (animate)
      {
         // First await animation of height upward.
         await this.position.animate.to({ height: headerOffsetHeight }, { duration }).finished;
      }

      // Set all header buttons besides close and the window title to display none.
      for (let cntr = header.children.length; --cntr >= 0;)
      {
         const className = header.children[cntr].className;

         if (className.includes('window-title') || className.includes('close')) { continue; }

         // v10+ of Foundry core styles automatically hides anything besides the window title and close button, so
         // explicitly set display to block.
         if (className.includes('keep-minimized'))
         {
            header.children[cntr].style.display = 'block';
            continue;
         }

         header.children[cntr].style.display = 'none';
      }

      if (animate)
      {
         // Await animation of width to the left / minimum width.
         await this.position.animate.to({ width: MIN_WINDOW_WIDTH }, { duration: 0.1 }).finished;
      }

      element.classList.add('minimized');

      this._minimized = true;
   }

   /**
    * Provides a callback after all Svelte components are initialized.
    *
    * @param {import('./internal/state-svelte/types').MountedAppShell} [mountedAppShell] - The mounted app shell
    *        elements.
    */
   onSvelteMount(mountedAppShell) {} // eslint-disable-line no-unused-vars

   /**
    * Provides a callback after the main application shell is remounted. This may occur during HMR / hot module
    * replacement or directly invoked from the `elementRootUpdate` callback passed to the application shell component
    * context.
    *
    * @param {import('./internal/state-svelte/types').MountedAppShell} [mountedAppShell] - The mounted app shell
    *        elements.
    */
   onSvelteRemount(mountedAppShell) {} // eslint-disable-line no-unused-vars

   /**
    * Override replacing HTML as Svelte components control the rendering process. Only potentially change the outer
    * application frame / title for pop-out applications.
    *
    * @protected
    * @ignore
    * @internal
    */
   _replaceHTML(element, html)  // eslint-disable-line no-unused-vars
   {
      if (!element.length) { return; }

      this.reactive.updateHeaderButtons();
   }

   /**
    * Provides an override verifying that a new Application being rendered for the first time doesn't have a
    * corresponding DOM element already loaded. This is a check that only occurs when `this._state` is
    * `Application.RENDER_STATES.NONE`. It is useful in particular when SvelteApplication has a static ID
    * explicitly set in `this.options.id` and long intro / outro transitions are assigned. If a new application
    * sharing this static ID attempts to open / render for the first time while an existing DOM element sharing
    * this static ID exists then the initial render is cancelled below rather than crashing later in the render
    * cycle {@link TJSPosition.set}.
    *
    * @protected
    * @ignore
    * @internal
    */
   async _render(force = false, options = {})
   {
      // Store any focusSource instance.
      if (isObject(options?.focusSource)) { this.options.focusSource = options.focusSource; }

      const activeWindow = this.reactive.activeWindow;

      try
      {
         if (this._state === Application.RENDER_STATES.NONE &&
          A11yHelper.isFocusTarget(activeWindow.document.querySelector(`#${this.id}`)))
         {
            console.warn(`SvelteApplication - _render: A DOM element already exists for CSS ID '${this.id
             }'. Cancelling initial render for new application with appId '${this.appId}'.`);

            return;
         }
      }
      catch (err)
      {
         console.warn(`SvelteApplication - _render: Potentially malformed application ID '${this.id
          }'. Cancelling initial render for new application with appId '${this.appId}'.`);

         return;
      }

      // On initial render gating of `setPosition` invoked by `Application._render` occurs, so that percentage values
      // can correctly be positioned with initial helper constraints (centered).
      this.#gateSetPosition = true;

      await super._render(force, options);

      this.#gateSetPosition = false;

      // Handle the same render exclusion tests that reject a render in Application.

      // Do not render under certain conditions.
      if ([Application.RENDER_STATES.CLOSING, Application.RENDER_STATES.RENDERING].includes(this._state)) { return; }

      // Applications which are not currently rendered must be forced.
      if (!force && (this._state <= Application.RENDER_STATES.NONE)) { return; }

      // It is necessary to directly invoke `position.set` as TJSPosition uses accessors and is not a bare object, so
      // the merging that occurs in `Application._render` does not take effect. Additionally, any of the main
      // positional properties that are defined as strings such as percentage values need to be set after the element
      // is mounted.
      if (!this._minimized)
      {
         this.#position.set({
            left: typeof this.options?.left === 'string' ? this.options.left : void 0,
            height: typeof this.options?.height === 'string' ? this.options.height : void 0,
            maxHeight: typeof this.options?.maxHeight === 'string' ? this.options.maxHeight : void 0,
            maxWidth: typeof this.options?.maxWidth === 'string' ? this.options.maxWidth : void 0,
            minHeight: typeof this.options?.minHeight === 'string' ? this.options.minHeight : void 0,
            minWidth: typeof this.options?.minWidth === 'string' ? this.options.minWidth : void 0,
            rotateX: typeof this.options?.rotateX === 'string' ? this.options.rotateX : void 0,
            rotateY: typeof this.options?.rotateY === 'string' ? this.options.rotateY : void 0,
            rotateZ: typeof this.options?.rotateZ === 'string' ? this.options.rotateZ : void 0,
            rotation: typeof this.options?.rotation === 'string' ? this.options.rotation : void 0,
            top: typeof this.options?.top === 'string' ? this.options.top : void 0,
            width: typeof this.options?.width === 'string' ? this.options.width : void 0,

            ...options
         });
      }

      if (!this.#onMount)
      {
         // Add to visible apps tracked.
         TJSAppIndex.add(this);

         this.onSvelteMount({
            elementRoot: /** @type {HTMLElement} */ this._element[0],
            elementContent: this.#elementContent,
            elementTarget: this.#elementTarget
         });

         this.#onMount = true;
      }
   }

   /**
    * Render the inner application content. Provide an empty JQuery element per the core Foundry API.
    *
    * @protected
    * @ignore
    * @internal
    */
   async _renderInner()
   {
      const activeWindow = this.reactive.activeWindow;

      const html = activeWindow.document.createDocumentFragment();

      return $(html);
   }

   /**
    * Stores the initial z-index set in `_renderOuter` which is used in `_injectHTML` to set the target element
    * z-index after the Svelte component is mounted.
    *
    * @protected
    * @ignore
    * @internal
    */
   async _renderOuter()
   {
      const html = await super._renderOuter();
      this.#initialZIndex = html[0].style.zIndex;
      return html;
   }

   /**
    * All calculation and updates of position are implemented in {@link #runtime/svelte/store/position!TJSPosition.set}.
    * This allows position to be fully reactive and in control of updating inline styles for the application.
    *
    * This method remains for backward compatibility with Foundry. If you have a custom override quite likely you need
    * to update to using the {@link TJSPosition.validators} / ValidatorAPI functionality.
    *
    * @param {import('#runtime/svelte/store/position').Data.TJSPositionDataRelative}   [position] - TJSPosition data.
    *
    * @returns {TJSPosition} The updated position object for the application containing the new values.
    * @ignore
    */
   setPosition(position)
   {
      return !this.#gateSetPosition ? this.position.set(position) : this.position;
   }

   /**
    * This method is invoked by the `elementRootUpdate` callback that is added to the external context passed to
    * Svelte components. When invoked it updates the local element roots tracked by SvelteApplication.
    *
    * This method may also be invoked by HMR / hot module replacement via `svelte-hmr`.
    */
   #updateApplicationShell()
   {
      const applicationShell = this.svelte.applicationShell;

      if (applicationShell !== null)
      {
         this._element = $(applicationShell.elementRoot);

         // Detect if the application shell exports an `elementContent` accessor.
         this.#elementContent = hasGetter(applicationShell, 'elementContent') ?
          applicationShell.elementContent : null;

         // Detect if the application shell exports an `elementTarget` accessor.
         this.#elementTarget = hasGetter(applicationShell, 'elementTarget') ?
          applicationShell.elementTarget : null;

         if (this.#elementTarget === null)
         {
            this.#elementTarget = typeof this.options.selectorTarget === 'string' ?
             this._element[0].querySelector(this.options.selectorTarget) : this._element[0];
         }

         // The initial zIndex may be set in application options or for popOut applications is stored by `_renderOuter`
         // in `this.#initialZIndex`.
         if (typeof this.options.positionable === 'boolean' && this.options.positionable)
         {
            this.#elementTarget.style.zIndex = typeof this.options.zIndex === 'number' ? this.options.zIndex :
             this.#initialZIndex ?? 95;

            super.bringToTop();

            // Ensure that new root element has inline position styles set.
            this.position.set(this.position.get());
         }

         super._activateCoreListeners([this.popOut ? this.#elementTarget?.firstChild : this.#elementTarget]);

         this.onSvelteRemount({
            elementRoot: /** @type {HTMLElement} */ this._element[0],
            elementContent: this.#elementContent,
            elementTarget: this.#elementTarget
         });
      }
   }
}
