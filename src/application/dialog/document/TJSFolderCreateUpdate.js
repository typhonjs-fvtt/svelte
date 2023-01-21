import { TJSDialog }                from '@typhonjs-fvtt/svelte/application';
import { TJSFolderCreateUpdate
    as TJSFolderCreateUpdateImpl }  from '@typhonjs-fvtt/svelte/component/dialog';
import { localize }                 from '@typhonjs-fvtt/svelte/helper';
import { hasSetter }                from '@typhonjs-fvtt/svelte/util';

/**
 * Provides a reactive dialog for modifying folders that by default is modal and not draggable. An additional set of
 * accessors for the folder assigned are available via the `this.reactive.document`. You may swap out the folder at
 * any time by setting it to a different folder document.
 */
export class TJSFolderCreateUpdate extends TJSDialog
{
   /**
    * Updates an existing Folder by rendering a dialog window with basic details.
    *
    * @param {Folder} document - The folder to edit.
    *
    * @param {object} [options] - Options to pass to TJSDialog / Application.
    *
    * @param {TJSDialogOptions} [dialogData] - Optional data to modify dialog.
    */
   constructor(document, options = {}, dialogData = {})
   {
      super({
         modal: typeof dialogData?.modal === 'boolean' ? dialogData.modal : true,
         draggable: typeof options?.draggable === 'boolean' ? options.draggable : false,
         focusFirst: true,
         minimizable: false,
         ...dialogData,
         content: {
            class: TJSFolderCreateUpdateImpl,
            props: { document }
         },
         title: document.id ? `${localize('FOLDER.Update')}: ${document.name}` : localize('FOLDER.Create'),
         buttons: {
            submit: {
               autoClose: false,
               icon: 'fas fa-check',
               label: localize(document?.id ? 'FOLDER.Update' : 'FOLDER.Create'),
               onPress: 'requestSubmit'
            }
         },
         default: 'submit'
      }, options);

      /**
       * @member {Folder} document - Adds accessors to SvelteReactive to get / set the document associated with
       *                           TJSFolderDialog.
       *
       * @memberof SvelteReactive#
       */
      Object.defineProperty(this.reactive, 'document', {
         get: () => this.svelte?.dialogComponent?.document,
         set: (document) =>  // eslint-disable-line no-shadow
         {
            const dialogComponent = this.svelte.dialogComponent;
            if (hasSetter(dialogComponent, 'document')) { dialogComponent.document = document; }
         }
      });
   }

   /**
    * Create a new Folder by rendering a dialog window to provide basic creation details.
    *
    * @param {object} folderData - Initial data with which to populate the creation form.
    *
    * @param {object} [options] - Options to pass to TJSDialog / Application.
    *
    * @param {object} [dialogData] - Optional data to modify dialog.
    *
    * @returns {Promise<Folder|null>} The newly created Folder or null if the dialog is closed.
    */
   static async showCreate(folderData, options = {}, dialogData = {})
   {
      if (!(folderData?.type in globalThis.CONFIG))
      {
         console.warn(
          `TJSFolderCreateUpdate - showCreate - warning: 'type' attribute of folderData is not a Document.`);
         return null;
      }

      const label = localize(Folder.metadata.label);

      const data = globalThis.foundry.utils.mergeObject({
         name: localize('DOCUMENT.New', { type: label }),
         sorting: 'a',
      }, folderData);

      const document = new Folder(data);

      const dialog = new TJSFolderCreateUpdate(document, options, dialogData);

      dialog.render(true, { focus: true });

      return dialog.state.promises.create();
   }

   /**
    * Updates an existing Folder by rendering a dialog window with basic details.
    *
    * @param {Folder} document - The folder to edit.
    *
    * @param {object} [options] - Options to pass to TJSDialog / Application.
    *
    * @param {TJSDialogOptions} [dialogData] - Optional data to modify dialog.
    *
    * @returns {Promise<Folder|null>} The modified Folder or null if the dialog is closed.
    */
   static async showUpdate(document, options = {}, dialogData = {})
   {
      if (!(document instanceof Folder))
      {
         console.warn(`TJSFolderCreateUpdate - show - warning: 'document' is not a Folder.`);
         return null;
      }

      const dialog = new TJSFolderCreateUpdate(document, options, dialogData);

      dialog.render(true, { focus: true });

      return dialog.state.promises.create();
   }
}
