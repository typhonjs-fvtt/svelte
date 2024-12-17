import { DialogShell }        from '#svelte-fvtt/component/internal';

import { ManagedPromise }     from '#runtime/util/async';

import {
   deepMerge,
   isObject }                 from '#runtime/util/object';

import { TJSDialogDataImpl }  from './internal/state-dialog';
import { SvelteApplication }  from './SvelteApplication';

import type {
   TJSDialogData,
    TJSDialogOptions }         from './internal/state-dialog/types';

/**
 * Provides a reactive dialog implementation configured from a unique dialog options object. The dialog features a
 * bottom button bar for user selection.
 *
 * A glasspane / modal option with various styling and transition capabilities is available when setting `modal: true`.
 *
 * Most importantly the `content` attribute of dialog data can be a Svelte component configuration object to render
 * your custom component as the dialog content. When using a Svelte component as the content you can assign a string
 * to the various `on<XXX>` dialog callbacks and an exported function from your component will be invoked to handle the
 * button callback. All dialog button callbacks and `onClose` callback receive a single argument which is the dialog /
 * application instance.
 *
 * When making a form with form validation or other dialog that you don't want to close immediately on button press you
 * can set `autoClose: false`, however you are 100% in control of resolving any Promise callbacks from button presses
 * and also closing the application. Each button can also be configured with `autoClose: false` in the button data.
 *
 * There is a handy Promise management capability to track a single Promise for the lifetime of a dialog available
 * at {@link TJSDialog.managedPromise}. By default when the user closes the dialog / application any managed Promise is
 * resolved with `null`. The managed Promise is available in any Svelte content component by using
 * `const managedPromise = getContext('#managedPromise')`. When handling any custom resolution particularly when
 * setting `autoClose: false` for a given button you are 100% in control of resolving or rejecting asynchronous data to
 * return from the dialog.
 *
 * To create and wait upon a managed promise for asynchronous return results use the static or member variation of
 * {@link TJSDialog.wait}.
 *
 * Please refer to {@link TJSDialogOptions} for the various options used to construct the dialog.
 *
 * There are a couple of static helper methods to quickly create standard dialogs such as a 'yes' / 'no' confirmation
 * dialog with {@link TJSDialog.confirm} and an 'ok' single button dialog with {@link TJSDialog.prompt}.
 *
 * @template [Options = import('./types').SvelteApp.Options]
 * @augments {SvelteApplication<Options>}
 */
export class TJSDialog extends SvelteApplication
{
   readonly #data: TJSDialogData;

   readonly #managedPromise: ManagedPromise;

   /**
    * @param {import('./internal/state-dialog/types').TJSDialogOptions} data - Dialog options.
    *
    * @param {Options}   [options] - SvelteApplication options.
    */
   constructor(data, options = {})
   {
      // Note: explicit setting of `popOutModuleDisable` to prevent the PopOut! module from acting on modal dialogs.
      // @ts-expect-error
      super({ popOutModuleDisable: data?.modal ?? false, ...options });

      this.#managedPromise = new ManagedPromise();

      this.#data = new TJSDialogDataImpl(this);
      this.#data.replace(data);

      /**
       * @member {object} dialogComponent - A getter to SvelteData to retrieve any mounted Svelte component as the
       *                                    dialog content.
       *
       * @memberof GetSvelteData#
       * @readonly
       */
      Object.defineProperty(this.svelte, 'dialogComponent', {
         get: () => this.svelte?.applicationShell?.dialogComponent,
      });
   }

   /**
    * Default options for TJSDialog. Provides a default width and setting `height` to `auto` to always display dialog
    * content even if it changes. The default `DialogShell` / `svelte` options should not be changed and instead mount
    * the dialog content component by supplying a Svelte configuration object to dialog data `content` field.
    *
    * @returns {import('./types').SvelteApp.Options} Default options
    */
   static get defaultOptions()
   {
      return deepMerge(super.defaultOptions, {
         classes: ['dialog', 'tjs-dialog'],
         width: 400,
         height: 'auto',
         svelte: {
            class: DialogShell,
            intro: true,
            target: document.body,
            /**
             * `this` is the TJSDialog instance when invoked.
             *
             * @this {TJSDialog}
             *
             * @returns {{data: import('./types').TJSDialogOptions, managedPromise: ManagedPromise}} Props
             */
            props: function()
            {
               return {
                  data: this.#data.clone(),
                  managedPromise: this.#managedPromise
               };
            }
         }
      });
   }

   /**
    * Returns the dialog data.
    *
    * @returns {import('./internal/state-dialog/types').TJSDialogData} Dialog data.
    */
   get data() { return this.#data; }

   /**
    * @returns {import('#runtime/util/async').ManagedPromise} Returns the managed promise.
    */
   get managedPromise() { return this.#managedPromise; }

   /**
    * Close the dialog and un-register references to it within UI mappings.
    * This function returns a Promise which resolves once the window closing animation concludes.
    *
    * @param {object}   [options] - Optional parameters.
    *
    * @param {boolean}  [options.force] - Force close regardless of render state.
    *
    * @returns {Promise<void>} A Promise which resolves once the application is closed with the callback value or
    *                          `true`.
    */
   async close(options)
   {
      try
      {
         // Note: When handling a managed promise if a button selection has already been made the managed promise is
         // already processing and the resolution below is skipped.
         if (this.#managedPromise.isActive && !this.#managedPromise.isProcessing)
         {
            const result = TJSDialog.#invokeFn(this.#data.onClose, this, null);
            const rejectClose = typeof this.#data.rejectClose === 'boolean' ? this.#data.rejectClose : false;

            if (rejectClose && result === null)
            {
               this.#managedPromise.reject(new Error('TJSDialog was closed without a choice being made.'));
            }
            else
            {
               this.#managedPromise.resolve(result);
            }
         }
      }
      catch (err)
      {
         const notifyError = typeof this.#data.notifyError === 'boolean' ? this.#data.notifyError : true;
         if (notifyError)
         {
            // TODO: When app eventbus is available send event for UI notification instead of Foundry API usage.
            globalThis.ui.notifications.error(err, { console: false });
         }

         // If there is a managed Promise reject it or re-throw error.
         if (!this.#managedPromise.reject(err)) { throw err; }
      }
      finally
      {
         await super.close(options);
      }
   }

   /**
    * Brings to top or renders this dialog returning a Promise that is resolved any button pressed or when the dialog
    * is closed.
    *
    * Creates an anonymous data defined TJSDialog returning a Promise that can be awaited upon for the user to make a
    * choice.
    *
    * Note: `null` is returned if the dialog is closed without a user making a choice.
    *
    * @template T
    *
    * @param {object}   [options] - Options.
    *
    * @param {boolean}  [options.reuse=false] - When true if there is an existing managed Promise this allows multiple
    *        sources to await on the same result.
    *
    * @returns {Promise<T>} A promise for dialog resolution.
    */
   async wait(options)
   {
      // TODO: Direct usage of Foundry core Application API.
      if (this.rendered)
      {
         this.bringToTop();
      }
      else
      {
         this.render(true, { focus: true });
      }

      // Return a managed Promise which is automatically resolved on button press via `DialogContent` component or when
      // the dialog is closed.
      return this.#managedPromise.create(options);
   }

   // ---------------------------------------------------------------------------------------------------------------

   /**
    * A helper factory method to create simple confirmation dialog windows which consist of simple yes / no prompts.
    * If you require more flexibility, a custom TJSDialog instance is preferred. The default focused button is 'yes'.
    * You can change the default focused button by setting `default` to `yes` or `no`.
    *
    * @template T
    *
    * @param {import('./internal/state-dialog/types').TJSDialogOptions & {
    *    onYes?: string | ((data?: { application?: TJSDialog }) => any),
    *    onNo?: string | ((data?: { application?: TJSDialog }) => any)
    * }} [data] - Confirm dialog options.
    *
    * @param {string|((data?: { application?: TJSDialog }) => any)} [data.onYes] - Callback function upon `yes`; may be
    *        an async function. When defined as a string any matching function by name exported from content Svelte
    *        component is invoked.
    *
    * @param {string|((data?: { application?: TJSDialog }) => any)} [data.onNo] - Callback function upon `no`; may be an
    *        async function. When defined as a string any matching function by name exported from content Svelte
    *        component is invoked.
    *
    * @param {import('./types').SvelteApp.Options}  [options]  SvelteApplication options passed to the TJSDialog
    *        constructor.
    *
    * @returns {Promise<T>} A promise which resolves with result of yes / no callbacks or true / false.
    *
    * @example
    * const result = await TJSDialog.confirm({
    *  title: 'A Yes or No Question',
    *  content: '<p>Choose wisely.</p>',
    *  onYes: () => 'YES Result',
    *  onNo: () => 'NO Result'
    * });
    *
    * // Logs 'YES result', 'NO Result', or null if the user closed the dialog without making a selection.
    * console.log(result);
    */
   static async confirm({ onYes, onNo, ...data } = {}, options = {})
   {
      // Allow overwriting of default icon and labels.
      const mergedButtons = deepMerge({
         yes: {
            icon: 'fas fa-check',
            label: 'Yes'
         },
         no: {
            icon: 'fas fa-times',
            label: 'No',
         }
      }, data.buttons ?? {});

      return this.wait({
         ...data,
         buttons: deepMerge(mergedButtons, {
            yes: {
               onPress: ({ application }) => this.#invokeFn(onYes, application, true)
            },
            no: {
               onPress: ({ application }) => this.#invokeFn(onNo, application, false)
            }
         }),
         default: data.default ?? 'yes'
      }, options);
   }

   /**
    * A helper method to invoke a callback function directly or lookup an exported function with the same name from any
    * content Svelte component to invoke. This is used internally to apply default values for `confirm` and `prompt`.
    *
    * @param {string|((data?: { application?: TJSDialog }) => any)} callback - Callback function to invoke; may be an
    *        async function. When defined as a string any matching function by name exported from content Svelte
    *        component is invoked.
    *
    * @param {TJSDialog} application - TJSDialog instance passed to callback.
    *
    * @param {*} [defaultResult] - An optional default result to return; undefined if not specified.
    *
    * @returns {*} Result.
    *
    * @internal
    */
   static #invokeFn(callback, application, defaultResult = void 0)
   {
      let result = defaultResult;

      switch (typeof callback)
      {
         case 'function':
            // Pass the dialog instance to the callback.
            result = callback({ application });
            break;

         case 'string':
         {
            const dialogComponent = application?.svelte?.dialogComponent;

            // Attempt lookup by function name in dialog instance component.
            if (dialogComponent !== void 0 && typeof dialogComponent?.[callback] === 'function')
            {
               result = dialogComponent?.[callback]({ application });
            }
            else
            {
               if (dialogComponent === void 0)
               {
                  console.warn(`[TRL] TJSDialog warning: 'onPress' defined as a string with no ` +
                   `associated content Svelte component.`);
               }
               else if (typeof dialogComponent?.[callback] !== 'function')
               {
                  console.warn(`[TRL] TJSDialog warning: The content Svelte component does not contain ` +
                   `an associated function '${callback}'. Did you remember to add ` +
                   `'<svelte:options accessors={true} />' and export the function?`);
               }
            }
            break;
         }
      }

      return result;
   }

   /**
    * A helper factory method to display a basic "prompt" style TJSDialog with a single button.
    *
    * @template T
    *
    * @param {import('./internal/state-dialog/types').TJSDialogOptions & {
    *    onOk?: string | ((data?: { application?: TJSDialog }) => any),
    *    label?: string,
    *    icon?: string
    * }} [data] - Prompt dialog options that includes any TJSDialog options along with the following optional fields:
    *
    * @param {string|((data?: { application?: TJSDialog }) => any)} [data.onOk] - Callback function upon `ok`; may be
    *        an async function. When defined as a string any matching function by name exported from content Svelte
    *        component is invoked.
    *
    * @param {string}   [data.label] - The OK prompt button text.
    *
    * @param {string}   [data.icon="fas fa-check"] - Set another icon besides `fas fa-check` for button.
    *
    * @param {import('./types').SvelteApp.Options}  [options]  SvelteApplication options passed to the TJSDialog
    *        constructor.
    *
    * @returns {Promise<T>} The returned value from the provided callback function or `true` if the button
    *          is pressed.
    *
    * @example
    * const result = await TJSDialog.prompt({
    *  title: 'Are you OK?',
    *  content: '<p>Are you OK?.</p>',
    *  label: 'Feeling Fine!',
    *  onOk: () => 'OK'
    * });
    *
    * // Logs 'OK' or null if the user closed the dialog without making a selection.
    * console.log(result);
    */
   static async prompt({ onOk, label, icon = 'fas fa-check', ...data } = {}, options = {})
   {
      return this.wait({
         ...data,
         buttons: {
            ok: {
               icon,
               label,
               onPress: ({ application }) => this.#invokeFn(onOk, application, true)
            }
         },
         default: 'ok'
      }, options);
   }

   /**
    * Creates an anonymous data defined TJSDialog returning a Promise that can be awaited upon for the user to make a
    * choice.
    *
    * Note: By default `null` is returned if the dialog is closed without a user making a choice.
    *
    * @template T
    *
    * @param {import('./internal/state-dialog/types').TJSDialogOptions}  data - Dialog data passed to the TJSDialog
    *        constructor.
    *
    * @param {import('./types').SvelteApp.Options}  [options]  SvelteApplication options passed to the TJSDialog
    *        constructor.
    *
    * @returns {Promise<T>} A Promise that resolves to the chosen result.
    */
   static async wait(data, options = {})
   {
      if (!isObject(data)) { throw new TypeError(`TJSDialog.wait error: 'data' is not an object'.`); }

      // Instantiate and render the dialog.
      return new this({ ...data }, options).wait();
   }
}
