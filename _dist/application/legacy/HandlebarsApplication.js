import { SvelteApplication }  from '@typhonjs-fvtt/svelte/application';

import {
   ApplicationShell,
   EmptyApplicationShell }    from '@typhonjs-fvtt/svelte/component/core';

import {
   deepMerge,
   isObject }                 from '@typhonjs-fvtt/svelte/util';

export class HandlebarsApplication extends SvelteApplication
{
   /**
    * Temporarily holds the inner HTML.
    *
    * @type {JQuery}
    */
   #innerHTML;

   /**
    * @inheritDoc
    */
   constructor(options)
   {
      super(options);

      this.options.svelte = deepMerge(isObject(this.options.svelte) ?
       this.options.svelte : {}, {
         class: this.popOut ? ApplicationShell : EmptyApplicationShell,
         intro: true,
         target: document.body
      });
   }

   /**
    * Append HTML to application shell content area.
    *
    * @param {JQuery}   html - new content; is ignored
    *
    * @private
    * @ignore
    */
   _injectHTML(html) // eslint-disable-line no-unused-vars
   {
      // Mounts any Svelte components.
      super._injectHTML(this.#innerHTML);

      // Appends inner HTML content to application shell content element.
      if (this.svelte?.applicationShell?.elementContent)
      {
         this.svelte.applicationShell.elementContent.appendChild(...this.#innerHTML);
      }

      this.#innerHTML = void 0;
   }

   async _renderInner(data)
   {
      this.#innerHTML = await super._renderInner(data);
      return this.#innerHTML;
   }

   /**
    * Override replacing HTML as Svelte components control the rendering process. Only potentially change the outer
    * application frame / title for pop-out applications.
    *
    * @inheritDoc
    * @ignore
    */
   _replaceHTML(element, html)  // eslint-disable-line no-unused-vars
   {
      if (!element.length) { return; }

      super._replaceHTML(element, html);

      if (this.svelte?.applicationShell?.elementContent)
      {
         const elementContent = this.svelte.applicationShell.elementContent;

         // Remove existing children.
         while (elementContent.firstChild && !elementContent.lastChild.remove()) {} // eslint-disable-line no-empty

         elementContent.appendChild(...html);

         // Use the reactive setter from `SvelteApplication` to set the title store.
         /** @ignore */
         this.reactive.title = this.reactive.title; // eslint-disable-line no-self-assign
      }
      else
      {
         console.warn(`HandlebarsApplication warning: No application shell mounted with 'elementContent' accessor`);
      }
   }
}
