import { TJSSvelteConfigUtil }      from '#runtime/svelte/util';
import { CrossWindow }              from '#runtime/util/browser';
import { isObject }                 from '#runtime/util/object';

import { isApplicationShell }       from './isApplicationShell';

import type {
   ComponentConstructorOptions,
   SvelteComponent }                from 'svelte';
import type { TJSSvelteConfig }     from '#runtime/svelte/util';
import type { SvelteData }          from '../state-svelte/types';
import type { SvelteApplication }   from '../../SvelteApplication';

/**
 * Instantiates and attaches a Svelte component to the main inserted HTML.
 *
 * @param [opts] - Optional parameters.
 *
 * @param [opts.app] - The target application
 *
 * @param [opts.config] - Svelte component options
 *
 * @param [opts.elementRootUpdate] - A callback to assign to the external context.
 *
 * @returns {SvelteData} The config + instantiated Svelte component.
 */
export function loadSvelteConfig({ app, config, elementRootUpdate }:
 { app?: SvelteApplication; config?: TJSSvelteConfig; elementRootUpdate: Function; }): SvelteData
{
   let target: HTMLElement;

   // A specific HTMLElement to append Svelte component.
   if (CrossWindow.isHTMLElement(config.target))
   {
      target = config.target;
   }
   else if (typeof config.target === 'string')
   {
      // Attempt to find target from query selector string.
      const activeWindow = app?.reactive?.activeWindow;
      target = activeWindow?.document?.querySelector(config.target);
   }

   if (!CrossWindow.isHTMLElement(target))
   {
      console.log(
       `%c[TRL] loadSvelteConfig error - Could not find target, '${config.target}', for config:\n`,
        'background: rgb(57,34,34)', config);

      throw new Error();
   }

   const NewSvelteComponent: { new (options: ComponentConstructorOptions): SvelteComponent } = config.class;

   const svelteConfig: TJSSvelteConfig = TJSSvelteConfigUtil.parseConfig({ ...config, target }, app);

   const externalContext: any = (svelteConfig.context as Map<string, any>).get('#external');

   // Inject the Foundry application instance and `elementRootUpdate` to the external context.
   externalContext.application = app;
   externalContext.elementRootUpdate = elementRootUpdate;
   externalContext.sessionStorage = app.reactive.sessionStorage;

   let eventbus;

   // Potentially inject any TyphonJS eventbus and track the proxy in the SvelteData instance.
   // @ts-ignore
   if (isObject(app._eventbus) && typeof app._eventbus.createProxy === 'function')
   {
      // @ts-ignore
      eventbus = app._eventbus.createProxy();
      externalContext.eventbus = eventbus;
   }

   // Seal external context so that it can't be extended.
   Object.seal(externalContext);

   // Create the Svelte component.
   const component: SvelteComponent = new NewSvelteComponent(svelteConfig as ComponentConstructorOptions);

   // Set any eventbus to the config.
   // @ts-ignore
   svelteConfig.eventbus = eventbus;

   let element: HTMLElement;

   // We can directly get the root element from components which follow the application store contract.
   if (isApplicationShell(component)) { element = component.elementRoot; }

   if (!CrossWindow.isHTMLElement(element))
   {
      console.log(
       `%c[TRL] loadSvelteConfig error - No application shell contract found. Did you bind and export a HTMLElement ` +
        `as 'elementRoot' and include '<svelte:options accessors={true}/>'?\n` +
         `\nOffending config:\n`, 'background: rgb(57,34,34)', config);

      throw new Error();
   }

   return { config: svelteConfig, component, element };
}
