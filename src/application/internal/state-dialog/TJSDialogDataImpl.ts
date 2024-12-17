import {
   deepMerge,
   isObject,
   klona,
   safeAccess,
   safeSet }                        from '#runtime/util/object';

import type {
   TJSDialogButtonData,
   TJSDialogData,
   TJSDialogOptions }               from './types';

import type { SvelteApplication }   from '../../SvelteApplication';

/**
 * Provides storage for all dialog options through individual accessors and `get`, `merge`, `replace` and `set` methods
 * that safely access and update data changed to the mounted DialogShell component reactively.
 */
export class TJSDialogDataImpl implements TJSDialogData
{
   readonly #application: SvelteApplication;

   /**
    * Stores the dialog options data.
    */
   #internal: TJSDialogOptions = {};

   /**
    * @param application - The host SvelteApplication instance.
    */
   constructor(application: SvelteApplication)
   {
      this.#application = application;

      Object.seal(this);
   }

   /**
    * @returns The dialog button configuration.
    */
   get buttons(): { [key: string]: TJSDialogButtonData }
   {
      return this.#internal.buttons;
   }

   /**
    * Set the dialog button configuration.
    *
    * @param buttons - New dialog button configuration.
    */
   set buttons(buttons: { [key: string]: TJSDialogButtonData })
   {
      this.#internal.buttons = buttons;
      this.#updateComponent();
   }

   /**
    * @returns {import('#runtime/svelte/util').TJSSvelteConfig | string} The Svelte configuration object or HTML string
    *          content.
    */
   get content()
   {
      return this.#internal.content;
   }

   /**
    * Set the Svelte configuration object or HTML string content.
    *
    * @param {import('#runtime/svelte/util').TJSSvelteConfig | string} content - New Svelte configuration object or
    *        HTML string content.
    */
   set content(content)
   {
      this.#internal.content = content;
      this.#updateComponent();
   }

   /**
    * @returns {string} The default button ID to focus initially.
    */
   get default()
   {
      return this.#internal.default;
   }

   /**
    * Set the default button ID to focus initially.
    *
    * @param {string} newDefault - New default button ID to focus initially.
    */
   set default(newDefault)
   {
      this.#internal.default = newDefault;
      this.#updateComponent();
   }

   /**
    * @returns {boolean} The dialog draggable state; draggable when true.
    */
   get draggable()
   {
      return this.#internal.draggable;
   }

   /**
    * Set the dialog state; draggable when true.
    *
    * @param {boolean} draggable - New dialog draggable state; draggable when true.
    */
   set draggable(draggable)
   {
      this.#internal.draggable = draggable;
      this.#updateComponent();
   }

   /**
    * @returns {boolean} When true auto-management of app focus is enabled.
    */
   get focusAuto()
   {
      return this.#internal.focusAuto;
   }

   /**
    * Set the dialog auto-management of app focus.
    *
    * @param {boolean} focusAuto - New dialog auto-management of app focus.
    */
   set focusAuto(focusAuto)
   {
      this.#internal.focusAuto = focusAuto;
      this.#updateComponent();
   }

   /**
    * @returns {boolean} When true the first focusable element that isn't a button is focused.
    */
   get focusFirst()
   {
      return this.#internal.focusFirst;
   }

   /**
    * Set the dialog first focusable element state.
    *
    * @param {boolean} focusFirst - New dialog first focusable element state.
    */
   set focusFirst(focusFirst)
   {
      this.#internal.focusFirst = focusFirst;
      this.#updateComponent();
   }

   /**
    * @returns {boolean} When `focusAuto` and `focusKeep` is true; keeps internal focus.
    */
   get focusKeep()
   {
      return this.#internal.focusKeep;
   }

   /**
    * Set the dialog `focusKeep` state. When `focusAuto` and `focusKeep` is true; keeps internal focus.
    *
    * @param {boolean} focusKeep - New dialog `focusKeep` state.
    */
   set focusKeep(focusKeep)
   {
      this.#internal.focusKeep = focusKeep;
      this.#updateComponent();
   }

   /**
    * @returns {boolean} When true the dialog is minimizable.
    */
   get minimizable()
   {
      return this.#internal.minimizable;
   }

   /**
    * Set the dialog `minimizable` state. When true the dialog is minimizable.
    *
    * @param {boolean} minimizable - New dialog `minimizable` state.
    */
   set minimizable(minimizable)
   {
      this.#internal.minimizable = minimizable;
      this.#updateComponent();
   }

   /**
    * @returns {boolean} When true a modal dialog is displayed.
    */
   get modal()
   {
      return this.#internal.modal;
   }

   /**
    * Set the dialog `modal` state. When true a modal dialog is displayed.
    *
    * @param {boolean} modal - New dialog `modal` state.
    */
   set modal(modal)
   {
      this.#internal.modal = modal;
      this.#updateComponent();
   }

   /**
    * @returns {import('./types').TJSDialogModalOptions} Additional options for modal dialog display.
    */
   get modalOptions()
   {
      return this.#internal.modalOptions;
   }

   /**
    * Set additional options for modal dialog display.
    *
    * @param {import('./types').TJSDialogModalOptions} modalOptions - New additional options for modal dialog display.
    */
   set modalOptions(modalOptions)
   {
      this.#internal.modalOptions = modalOptions;
      this.#updateComponent();
   }

   /**
    * @returns {boolean} When true and an error is raised in dialog callback functions post a UI error notification.
    */
   get notifyError()
   {
      return this.#internal.notifyError;
   }

   /**
    * Set the dialog `notifyError` state. When true and an error is raised in dialog callback functions post a UI error
    * notification.
    *
    * @param {boolean} notifyError - New dialog `notifyError` state.
    */
   set notifyError(notifyError)
   {
      this.#internal.notifyError = notifyError;
      this.#updateComponent();
   }

   /**
    * @returns {string | ((data?: { application?: import('../../index.js').TJSDialog }) => any)} Callback invoked when
    *          dialog is closed; no button option selected. When defined as a string any matching function by name
    *          exported from content Svelte component is invoked.
    */
   get onClose()
   {
      return this.#internal.onClose;
   }

   /**
    * Set callback invoked when dialog is closed; no button option selected. When defined as a string any matching
    * function by name exported from content Svelte component is invoked..
    *
    * @param {string | ((data?: { application?: import('../../index.js').TJSDialog }) => any)} onClose - New dialog
    *        `onClose` state.
    */
   set onClose(onClose)
   {
      this.#internal.onClose = onClose;
      this.#updateComponent();
   }

   /**
    * @returns {boolean} Dialog `rejectClose` state. When true and a Promise has been created by {@link TJSDialog.wait}
    *          and the Promise is not in the process of being resolved or rejected on close of the dialog any `onClose`
    *          function is invoked and any result that is undefined will cause the Promise to then be rejected..
    */
   get rejectClose()
   {
      return this.#internal.rejectClose;
   }

   /**
    * Set the dialog `rejectClose` state.
    *
    * @param {boolean} rejectClose - New dialog `rejectClose` state.
    */
   set rejectClose(rejectClose)
   {
      this.#internal.rejectClose = rejectClose;
      this.#updateComponent();
   }

   /**
    * @returns {boolean} When true the dialog is resizable.
    */
   get resizable()
   {
      return this.#internal.resizable;
   }

   /**
    * Set the dialog `resizable` state. When true the dialog is resizable.
    *
    * @param {boolean} resizable - New dialog `resizable` state.
    */
   set resizable(resizable)
   {
      this.#internal.resizable = resizable;
      this.#updateComponent();
   }

   /**
    * @returns {boolean} When true and resolving any Promises and there are undefined results from any button callbacks
    *          the button ID is resolved.
    */
   get resolveId()
   {
      return this.#internal.resolveId;
   }

   /**
    * Set the dialog `resolveId` state. When true and resolving any Promises and there are undefined results from any
    * button callbacks the button ID is resolved.
    *
    * @param {boolean} resolveId - New dialog `resolveId` state.
    */
   set resolveId(resolveId)
   {
      this.#internal.resolveId = resolveId;
      this.#updateComponent();
   }

   /**
    * @returns {string} The dialog window title.
    */
   get title()
   {
      return this.#internal.title;
   }

   /**
    * Set the dialog window title.
    *
    * @param {string} title - New dialog window title.
    */
   set title(title)
   {
      this.#internal.title = title;
      this.#updateComponent();
   }

   /**
    * @returns {import('./types').TJSDialogTransitionOptions} Transition options for the dialog.
    */
   get transition()
   {
      return this.#internal.transition;
   }

   /**
    * Set transition options for the dialog.
    *
    * @param {import('./types').TJSDialogTransitionOptions} transition - New transition options for the dialog.
    */
   set transition(transition)
   {
      this.#internal.transition = transition;
      this.#updateComponent();
   }

   /**
    * @returns {number | null} A specific z-index for the dialog. Pass null for the dialog to act like other
    *          applications in regard bringing to top when activated.
    */
   get zIndex()
   {
      return this.#internal.zIndex;
   }

   /**
    * Set specific z-index for the dialog.
    *
    * @param {number | null} zIndex - New z-index for the dialog.
    */
   set zIndex(zIndex)
   {
      this.#internal.zIndex = zIndex;
      this.#updateComponent();
   }

   /**
    * Provides a cloned copy of the dialog data.
    * Note: The content attribute is not cloned as complex / props may be present.
    *
    * @returns {import('./types').TJSDialogOptions} A clone of the dialog data.
    */
   clone()
   {
      // Make a shallow copy of internally stored data.
      const shallowCopy = { ...this.#internal };

      // Remove the content parameter as it may contain complex props sent to the hosted dialog component.
      delete shallowCopy.content;

      // Clone the internal data and then set the content directly.
      const cData = klona(shallowCopy);
      cData.content = this.#internal.content;

      return cData;
   }

   /**
    * Provides a way to safely get this dialogs data given an accessor string which describes the
    * entries to walk. To access deeper entries into the object format the accessor string with `.` between entries
    * to walk.
    *
    * @param {string}   accessor - The path / key to set. You can set multiple levels.
    *
    * @param {any}      [defaultValue] - A default value returned if the accessor is not found.
    *
    * @returns {any} Value at the accessor.
    */
   get(accessor, defaultValue)
   {
      return safeAccess(this.#internal, accessor, defaultValue);
   }

   /**
    * @param {import('./types').TJSDialogOptions} data - Merge provided data object into Dialog data.
    */
   merge(data)
   {
      deepMerge(this.#internal, data);
      this.#updateComponent();
   }

   /**
    * Sets the dialog data; this is reactive.
    *
    * @param {import('./types').TJSDialogOptions}   data - Dialog data.
    */
   replace(data)
   {
      if (!isObject(data)) { throw new TypeError(`TJSDialogData replace error: 'data' is not an object'.`); }

      this.#internal = {};

      // Merge new data and perform a reactive update.
      this.merge(data);
   }

   /**
    * Provides a way to safely set this dialogs data given an accessor string which describes the
    * entries to walk. To access deeper entries into the object format the accessor string with `.` between entries
    * to walk.
    *
    * Automatically the dialog data will be updated in the associated DialogShell Svelte component.
    *
    * @param {string}   accessor - The path / key to set. You can set multiple levels.
    *
    * @param {any}      value - Value to set.
    *
    * @returns {boolean} True if successful.
    */
   set(accessor, value)
   {
      const success = safeSet(this.#internal, accessor, value);

      // If `this.#internal` modified then update the app options store.
      if (success) { this.#updateComponent(); }

      return success;
   }

   /**
    * Updates the data in the Svelte dialog component.
    */
   #updateComponent()
   {
      const component = this.#application.svelte.component(0);
      if (component?.data) { component.data = this.clone(); }
   }
}
