/**
 * Provides a Svelte aware extension to Application to control the app lifecycle appropriately.
 */
export default class SvelteApplication extends Application
{
   /**
    * Stores instantiated Svelte components.
    *
    * @type {object[]}
    * @private
    */
   #svelteComponents = [];

   /**
    * @inheritDoc
    */
   constructor(options)
   {
      super(options);
   }

   /**
    * Note: This method is fully overridden and duplicated as Svelte components need to be destroyed manually and the
    * best visual result is to destroy them after the default JQuery slide up animation occurs, but before the element
    * is removed from the DOM.
    *
    * If you destroy the Svelte components before the slide up animation the Svelte elements are removed immediately
    * from the DOM. The purpose of overriding ensures the slide up animation is always completed before
    * the Svelte components are destroyed and then the element is removed from the DOM.
    *
    * Close the application and un-register references to it within UI mappings.
    * This function returns a Promise which resolves once the window closing animation concludes
    *
    * @param {object}   options - Optional parameters.
    *
    * @param {boolean}  options.force - Force close regardless of render state.
    *
    * @returns {Promise<void|number>}    A Promise which resolves once the application is closed
    */
   async close(options = {})
   {
      const states = Application.RENDER_STATES;
      if (!options.force && ![states.RENDERED, states.ERROR].includes(this._state)) { return; }

      this._state = states.CLOSING;

      /**
       * Get the element.
       *
       * @type {JQuery}
       */
      const el = this.element;
      if (!el) { return this._state = states.CLOSED; }

      el.css({ minHeight: 0 });

      // Dispatch Hooks for closing the base and subclass applications
      for (const cls of this.constructor._getInheritanceChain())
      {
         /**
          * A hook event that fires whenever this Application is closed.
          *
          * @param {Application} app                     The Application instance being closed
          *
          * @param {jQuery[]} html                       The application HTML when it is closed
          *
          * @function closeApplication
          *
          * @memberof hookEvents
          */
         Hooks.call(`close${cls.name}`, this, el);
      }

      // Animate closing the element
      return new Promise((resolve) =>
      {
         el.slideUp(200, () =>
         {
            // Manually invoke the destroy callbacks for all Svelte components.
            for (const entry of this.#svelteComponents)
            {
               entry.component?.$destroy();
            }

            this.#svelteComponents = [];

            el.remove();

            // Clean up data
            this._element = null;
            delete ui.windows[this.appId];
            this._minimized = false;
            this._scrollPositions = null;
            this._state = states.CLOSED;
            resolve();
         });
      });
   }

   /**
    * Returns the indexed Svelte component
    * @param {number}   index -
    *
    * @returns {object}
    */
   getSvelteComponent(index)
   {
      return this.#svelteComponents[index];
   }

   /**
    * Inject the Svelte components defined in `this.options.svelte`.
    *
    * @param {JQuery} html -
    *
    * @override
    * @inheritDoc
    */
   _injectHTML(html)
   {
      if (this.popOut && html.length === 0 && Array.isArray(this.options.svelte))
      {
         throw new Error(
          'SvelteApplication - _injectHTML - A popout app with no template can only support one Svelte component.');
      }

      if (Array.isArray(this.options.svelte))
      {
         for (const svelteConfig of this.options.svelte)
         {
            this.#svelteComponents.push(s_LOAD_CONFIG(this, html, svelteConfig));
         }
      }
      else if (typeof this.options.svelte === 'object')
      {
         this.#svelteComponents.push(s_LOAD_CONFIG(this, html, this.options.svelte));
      }
      else
      {
         throw new TypeError(`SvelteApplication - _injectHTML - this.options.svelte not an array or object.`);
      }

      // Detect if this is a synthesized DocumentFragment.
      const isDocumentFragment = html.length && html[0] instanceof DocumentFragment && html[0].firstElementChild;

      // Store first child element if DocumentFragment.
      const newElement = isDocumentFragment ? $(html[0].firstElementChild) : void 0;

      super._injectHTML(html);

      // Set the element of the app to the first child of any document fragment.
      if (isDocumentFragment)
      {
         this._element = newElement;
      }

      this.onSvelteMount(this.element);
   }

   /**
    * Provides a callback after all Svelte components are initialized.
    *
    * @param {JQuery} element - JQuery container for main application element.
    */
   onSvelteMount(element) {} // eslint-disable-line no-unused-vars

   /**
    * Override replacing HTML as Svelte components control the rendering process. Only potentially change the outer
    * application frame / title for popout applications.
    *
    * @override
    * @inheritDoc
    */
   _replaceHTML(element, html)  // eslint-disable-line no-unused-vars
   {
      if (!element.length) { return; }

      // For pop-out windows update the window title
      if (this.popOut)
      {
         element.find('.window-title').text(this.title);
      }
   }

   /**
    * Render the inner application content. Only render a template if one is defined otherwise provide an empty
    * JQuery element.
    *
    * @param {Object} data         The data used to render the inner template
    *
    * @returns {Promise.<JQuery>}   A promise resolving to the constructed jQuery object
    *
    * @override
    * @private
    */
   async _renderInner(data)
   {
      const html = typeof this.template === 'string' ? await renderTemplate(this.template, data) :
       document.createDocumentFragment();

      return $(html);
   }
}

/**
 * Instantiates and attaches a Svelte component to the main inserted HTML.
 *
 * @param {Application} app - The application
 *
 * @param {JQuery}      html - The inserted HTML.
 *
 * @param {object}      config - Svelte component options
 *
 * @returns {object} The config + instantiated Svelte component.
 */
function s_LOAD_CONFIG(app, html, config)
{
   const svelteOptions = typeof config.options === 'object' ? config.options : {};
   const injectApp = typeof svelteOptions.injectApp === 'boolean' ? svelteOptions.injectApp : false;
   const injectEventbus = typeof svelteOptions.injectEventbus === 'boolean' ? svelteOptions.injectEventbus : false;
   const hasTemplate = typeof app.template === 'string';
   const hasTarget = typeof config.target === 'string';

   if (typeof config.class !== 'function')
   {
      throw new TypeError(
       `SvelteApplication - s_LOAD_CONFIG - class not a constructor for config:\n${JSON.stringify(config)}.`);
   }

   if (hasTemplate && !hasTarget)
   {
      throw new TypeError(`SvelteApplication - s_LOAD_CONFIG - target selector not a string for config:\n${
       JSON.stringify(config)}`);
   }

   // If a target selector is defined then find it in the JQuery `html` otherwise create an empty fragment.
   const target = hasTarget ? html.find(config.target).get(0) : document.createDocumentFragment();

   if (target === void 0)
   {
      throw new Error(
       `SvelteApplication - s_LOAD_CONFIG - could not find target selector: ${config.target} for config:\n${
        JSON.stringify(config)}`);
   }

   const SvelteComponent = config.class;

   const svelteConfig = { ...config, target  };

   const externalContext = {};

   // If a context callback function is provided then invoke it with `this` being the Foundry app.
   // If an object is returned it adds the entries to external context.
   if (typeof svelteConfig.context === 'function')
   {
      const result = svelteConfig.context.call(app);
      if (typeof result === 'object')
      {
         Object.assign(externalContext, result);
      }
   }

   // Process children components attaching to external context.
   if (Array.isArray(svelteConfig.children))
   {
      externalContext.children = svelteConfig.children;
   }
   else if (typeof svelteConfig.children === 'object')
   {
      externalContext.children = [svelteConfig.children];
   }

   // Potentially inject the Foundry application instance as a Svelte prop.
   if (injectApp)
   {
      externalContext.foundryApp = app;
   }

   // Potentially inject any TyphonJS eventbus.
   // TODO: Verify TyphonJS eventbus and create a proxy for the component. Listen to onDestroy to cleanup resources.
   if (injectEventbus)
   {
      externalContext.eventbus = app._eventbus;
   }

   // If there is a context object then set it to props.
   if (Object.keys(externalContext).length > 0)
   {
      // Add props object if not defined.
      if (typeof svelteConfig.props !== 'object') { svelteConfig.props = {}; }

      svelteConfig.props.context = externalContext;
   }

   const result = { config: svelteConfig, component: new SvelteComponent(svelteConfig) };

   if (!hasTarget)
   {
      html.append(target);
   }

   return result;
}