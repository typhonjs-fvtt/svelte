import { isObject }                 from '#runtime/util/object';

import type { EasingReference }     from '#runtime/svelte/easing';

import type {
   Data,
   TJSPositionTypes }               from '#runtime/svelte/store/position';

import type { SvelteApplication }   from '../../SvelteApplication';

import type {
   ApplicationState,
   ApplicationStateData }           from './types';

/**
 * Provides the ability the save / restore / serialize application state for positional and UI state such as minimized
 * status.
 *
 * You can restore a saved state with animation; please see the options of {@link ApplicationStateImpl.restore}.
 */
export class ApplicationStateImpl implements ApplicationState
{
   readonly #application: SvelteApplication;

   /**
    * Stores the current save state key being restored by animating. When a restore is already being animated with the
    * same name the subsequent restore animation is ignored.
    */
   #currentRestoreKey: string | undefined;

   #dataSaved: Map<string, ApplicationStateData> = new Map();

   /**
    * @param application - The application.
    */
   constructor(application: SvelteApplication)
   {
      this.#application = application;

      Object.seal(this);
   }

   /**
    * Clears all saved application state.
    */
   clear(): void
   {
      this.#dataSaved.clear();
   }

   /**
    * Returns current application state along with any extra data passed into method.
    *
    * @param [extra] - Extra data to add to application state.
    *
    * @returns Passed in object with current application state.
    */
   current(extra: object = {}): ApplicationStateData
   {
      return Object.assign(extra, {
         position: this.#application?.position?.get() as Data.TJSPositionData,
         beforeMinimized: this.#application?.position?.state.get({ name: '#beforeMinimized' }),
         options: this.#application?.reactive?.toJSON(),
         ui: { minimized: this.#application?.reactive?.minimized }
      });
   }

   /**
    * Gets any saved application state by name.
    *
    * @param options - Options.
    *
    * @param options.name - Saved data set name.
    *
    * @returns Any saved application state.
    */
   get({ name }: { name: string }): ApplicationStateData | undefined
   {
      if (typeof name !== 'string')
      {
         throw new TypeError(`ApplicationState - get error: 'name' is not a string.`);
      }

      return this.#dataSaved.get(name);
   }

   /**
    * @returns The saved application state names / keys.
    */
   keys(): IterableIterator<string>
   {
      return this.#dataSaved.keys();
   }

   /**
    * Removes and returns any saved application state by name.
    *
    * @param options - Options.
    *
    * @param options.name - Name to remove and retrieve.
    *
    * @returns Any saved application state.
    */
   remove({ name }: { name: string }): ApplicationStateData | undefined
   {
      if (typeof name !== 'string') { throw new TypeError(`ApplicationState - remove: 'name' is not a string.`); }

      const data: ApplicationStateData = this.#dataSaved.get(name);
      this.#dataSaved.delete(name);

      return data;
   }

   /**
    * Restores a previously saved application state by `name` returning the data. Several optional parameters are
    * available to animate / tween to the new state. When `animateTo` is true an animation is scheduled via
    * {@link #runtime/svelte/store/position!AnimationAPI.to} and the duration and easing name or function may be
    * specified.
    *
    * @param options - Options.
    *
    * @param options.name - Saved data set name.
    *
    * @param [options.remove=false] - Remove data set.
    *
    * @param [options.animateTo=false] - Animate to restore data.
    *
    * @param [options.duration=0.1] - Duration in seconds.
    *
    * @param [options.ease='linear'] - Easing function or easing function name.
    *
    * @returns Any saved application state.
    */
   restore({ name, remove = false, animateTo = false, duration = 0.1, ease = 'linear' }:
    { name: string, remove?: boolean, animateTo?: boolean, duration?: number, ease?: EasingReference }):
     ApplicationStateData | undefined
   {
      if (typeof name !== 'string')
      {
         throw new TypeError(`ApplicationState - restore error: 'name' is not a string.`);
      }

      const dataSaved: ApplicationStateData = this.#dataSaved.get(name);

      if (dataSaved)
      {
         if (remove) { this.#dataSaved.delete(name); }

         // Multiple invocations for animated restores are skipped when one is already in progress.
         if (animateTo && name !== this.#currentRestoreKey)
         {
            // Track current restore key name.
            this.#currentRestoreKey = name;

            this.#setImpl(dataSaved, {
               animateTo,
               async: true,
               duration,
               ease
            }).then(() =>
            {
               // Reset current restore key name for animation if the same as initial animation initiation.
               if (name === this.#currentRestoreKey) { this.#currentRestoreKey = void 0; }
            });
         }
      }

      return dataSaved;
   }

   /**
    * Saves current application state with the opportunity to add extra data to the saved state.
    *
    * @param {object}   options - Options.
    *
    * @param {string}   options.name - Name to index this saved state.
    *
    * @returns {import('./types').ApplicationStateData} Current saved application state.
    */
   save({ name, ...extra })
   {
      if (typeof name !== 'string') { throw new TypeError(`ApplicationState - save error: 'name' is not a string.`); }

      const data = this.current(extra);

      this.#dataSaved.set(name, data);

      return data;
   }

   /**
    * Sets application state from the given {@link ApplicationStateData} instance. Several optional parameters are
    * available to animate / tween to the new state. When `animateTo` is true an animation is scheduled via
    * {@link #runtime/svelte/store/position!AnimationAPI.to} and the duration and easing name or function may be
    * specified.
    *
    * Note: If serializing application state any minimized apps will use the before minimized state on initial render
    * of the app as it is currently not possible to render apps with Foundry VTT core API in the minimized state.
    *
    * @param {import('./types').ApplicationStateData}   data - Saved data set name.
    *
    * @param {object}         [options] - Optional parameters
    *
    * @param {boolean}        [options.animateTo=false] - Animate to restore data.
    *
    * @param {number}         [options.duration=0.1] - Duration in seconds.
    *
    * @param {import('#runtime/svelte/easing').EasingReference} [options.ease='linear'] - Easing function or easing
    *        function name.
    */
   set(data, options = {})
   {
      this.#setImpl(data, { ...options, async: false });
   }

   // Internal implementation ----------------------------------------------------------------------------------------

   /**
    * Sets application state from the given {@link ApplicationStateData} instance. Several optional parameters are
    * available to animate / tween to the new state. When `animateTo` is true an animation is scheduled via
    * {@link #runtime/svelte/store/position!AnimationAPI.to} and the duration and easing name or function may be
    * specified.
    *
    * Note: If serializing application state any minimized apps will use the before minimized state on initial render
    * of the app as it is currently not possible to render apps with Foundry VTT core API in the minimized state.
    *
    * @privateRemarks
    * TODO: THIS METHOD NEEDS TO BE REFACTORED WHEN TRL IS MADE INTO A STANDALONE FRAMEWORK.
    *
    * @param data - Saved data set name.
    *
    * @param [opts] - Optional parameters
    *
    * @param [opts.async=false] - If animating return a Promise that resolves with any saved data.
    *
    * @param [opts.animateTo=false] - Animate to restore data.
    *
    * @param [opts.duration=0.1] - Duration in seconds.
    *
    * @param [opts.ease='linear'] - Easing function or easing function name.
    *
    * @returns {undefined | Promise<void>} When asynchronous the animation Promise.
    */
   #setImpl(data: ApplicationStateData, { async = false, animateTo = false, duration = 0.1, ease = 'linear' }:
    { async?: boolean; animateTo?: boolean; duration?: number; ease?: EasingReference; } = {}):
     Promise<void> | undefined {
      if (!isObject(data))
      {
         throw new TypeError(`ApplicationState - restore error: 'data' is not an object.`);
      }

      const application = this.#application;

      if (!isObject(data?.position))
      {
         console.warn(`ApplicationState.set warning: 'data.position' is not an object.`);
         return;
      }

      // TODO: TAKE NOTE THAT WE ARE ACCESSING A FOUNDRY APP v1 GETTER HERE TO DETERMINE IF APPLICATION IS RENDERED.
      // TODO: THIS NEEDS TO BE REFACTORED WHEN CONVERTING TRL TO A GENERIC FRAMEWORK.
      const rendered = application.rendered;

      // Update data directly with no store or inline style updates.
      if (animateTo)  // Animate to saved data.
      {
         if (!rendered)
         {
            console.warn(`ApplicationState.set warning: Application is not rendered and 'animateTo' is true.`);
            return;
         }

         // Provide special handling to potentially change transform origin as this parameter is not animated.
         if (data.position.transformOrigin !== application.position.transformOrigin)
         {
            application.position.transformOrigin = data.position.transformOrigin;
         }

         if (isObject(data?.ui))
         {
            const minimized = typeof data.ui?.minimized === 'boolean' ? data.ui.minimized : false;

            if (application?.reactive?.minimized && !minimized)
            {
               application.maximize({ animate: false, duration: 0 });
            }
         }

         const promise = application.position.animate.to(data.position, {
            duration,
            ease,
            strategy: 'cancelAll'
         }).finished.then(({ cancelled }) =>
         {
            if (cancelled) { return; }

            // Merge in saved options to application.
            if (isObject(data?.options))
            {
               application?.reactive.mergeOptions(data.options);
            }

            if (isObject(data?.ui))
            {
               const minimized = typeof data.ui?.minimized === 'boolean' ? data.ui.minimized : false;

               // Application is currently minimized and stored state is not, so reset minimized state without
               // animation.
               if (!application?.reactive?.minimized && minimized)
               {
                  application.minimize({ animate: false, duration: 0 });
               }
            }

            if (isObject(data?.beforeMinimized))
            {
               application.position.state.set({ name: '#beforeMinimized', ...data.beforeMinimized });
            }
         });

         // Return a Promise with the application that resolves after animation ends.
         if (async) { return promise; }
      }
      else
      {
         if (rendered)
         {
            // Merge in saved options to application.
            if (isObject(data?.options))
            {
               application?.reactive.mergeOptions(data.options);
            }

            if (isObject(data?.ui))
            {
               const minimized = typeof data.ui?.minimized === 'boolean' ? data.ui.minimized : false;

               // Application is currently minimized and stored state is not, so reset minimized state without
               // animation.
               if (application?.reactive?.minimized && !minimized)
               {
                  application.maximize({ animate: false, duration: 0 });
               }
               else if (!application?.reactive?.minimized && minimized)
               {
                  application.minimize({ animate: false, duration });
               }
            }

            if (isObject(data?.beforeMinimized))
            {
               application.position.state.set({ name: '#beforeMinimized', ...data.beforeMinimized });
            }

            // Default options is to set data for an immediate update.
            application.position.set(data.position);
         }
         else
         {
            // When not rendered set position to the 'beforeMinimized' data if it exists otherwise set w/ 'position'.
            // Currently, w/ Foundry core Application API it is impossible to initially render an app in the minimized
            // state.

            let positionData = data.position;

            if (isObject(data.beforeMinimized))
            {
               // Take before minimized data.
               positionData = data.beforeMinimized;

               // Apply position left / top to before minimized data. This covers the case when an app is minimized,
               // but then moved. This allows restoration of the before minimized parameters w/ the last position
               // location.
               positionData.left = data.position.left;
               positionData.top = data.position.top;
            }

            application.position.set(positionData);
         }
      }
   }
}
