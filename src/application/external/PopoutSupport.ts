import { SvelteApplication } from '../SvelteApplication';

/**
 * Handle `PopOut!` module hooks to allow applications to popout to their own browser window.
 */
export class PopoutSupport
{
   static initialize()
   {
      Hooks.on('PopOut:loading', (app, popout) =>
      {
         if (app instanceof SvelteApplication)
         {
            // Disable app position system.
            app.position.enabled = false;

            // Save current `headerButtonNoClose` state.
            app.state.save({
               name: '#beforePopout',
               headerButtonNoClose: app.reactive.headerButtonNoClose
            });

            // Set the apps active window to the popout browser window.
            app.reactive.activeWindow = popout;

            // Disable the close button.
            app.reactive.headerButtonNoClose = true;
         }
      });

      Hooks.on('PopOut:popin', (app) => this.#handleRejoin(app));
      Hooks.on('PopOut:close', (app) => this.#handleRejoin(app));
   }

   /**
    * Handles rejoining the app to main browser window.
    *
    * @param {Application} app - The target app.
    */
   static #handleRejoin(app)
   {
      if (app instanceof SvelteApplication)
      {
         // Enable the app position system.
         app.position.enabled = true;

         // Restore the initial header button no close state.
         const beforeData = app.state.remove({ name: '#beforePopout' });
         if (beforeData) { app.reactive.headerButtonNoClose = beforeData?.headerButtonNoClose ?? false; }

         // Reset the apps active window to the main `globalThis` reference.
         app.reactive.activeWindow = void 0;
      }
   }
}
