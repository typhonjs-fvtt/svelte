import type {
   EasingFunction,
   EasingFunctionName } from '#runtime/svelte/easing';

import type { Data }    from '#runtime/svelte/store/position';

/**
 * Provides the ability the save / restore / serialize application state for positional and UI state such as minimized
 * status.
 *
 * You can restore a saved state with animation; please see the options of {@link ApplicationState.restore}.
 */
declare interface ApplicationState {
   /**
    * Clears all saved application state.
    */
   clear(): void;

   /**
    * Returns current application state along with any extra data passed into method.
    *
    * @param {object} [extra] - Extra data to add to application state.
    *
    * @returns {ApplicationStateData} Passed in object with current application state.
    */
   current(extra?: object): ApplicationStateData;

   /**
    * Gets any saved application state by name.
    *
    * @param {object}   options - Options.
    *
    * @param {string}   options.name - Saved data set name.
    *
    * @returns {ApplicationStateData | undefined} Any saved application state.
    */
   get({ name }: {
      name: string;
   }): ApplicationStateData | undefined;

   /**
    * @returns {IterableIterator<string>} The saved application state names / keys.
    */
   keys(): IterableIterator<string>;

   /**
    * Removes and returns any saved application state by name.
    *
    * @param {object}   options - Options.
    *
    * @param {string}   options.name - Name to remove and retrieve.
    *
    * @returns {ApplicationStateData | undefined} Any saved application state.
    */
   remove({ name }: {
      name: string;
   }): ApplicationStateData | undefined;

   /**
    * Restores a previously saved application state by `name` returning the data. Several optional parameters are
    * available to animate / tween to the new state. When `animateTo` is true an animation is scheduled via
    * {@link AnimationAPI.to} and the duration and easing name or function may be specified.
    *
    * @param {object}            params - Parameters
    *
    * @param {string}            params.name - Saved data set name.
    *
    * @param {boolean}           [params.remove=false] - Remove data set.
    *
    * @param {boolean}           [params.animateTo=false] - Animate to restore data.
    *
    * @param {number}            [params.duration=0.1] - Duration in seconds.
    *
    * @param {EasingFunctionName | EasingFunction} [params.ease='linear'] - Easing function name or function.
    *
    * @returns {ApplicationStateData | undefined} Any saved application state.
    */
   restore({ name, remove, animateTo, duration, ease }: {
      name: string;
      remove?: boolean;
      animateTo?: boolean;
      duration?: number;
      ease?: EasingFunctionName | EasingFunction;
   }): ApplicationStateData | undefined;

   /**
    * Saves current application state with the opportunity to add extra data to the saved state.
    *
    * @param {object}   options - Options.
    *
    * @param {string}   options.name - Name to index this saved state.
    *
    * @param {...*}     [options.extra] - Extra data to add to saved state.
    *
    * @returns {ApplicationStateData} Current saved application state.
    */
   save({ name, ...extra }: {
      name: string;
      extra?: any[];
   }): ApplicationStateData;

   /**
    * Sets application state from the given {@link ApplicationStateData} instance. Several optional parameters are
    * available to animate / tween to the new state. When `animateTo` is true an animation is scheduled via
    * {@link AnimationAPI.to} and the duration and easing name or function may be specified.
    *
    * Note: If serializing application state any minimized apps will use the before minimized state on initial render
    * of the app as it is currently not possible to render apps with Foundry VTT core API in the minimized state.
    *
    * @param {ApplicationStateData}   data - Saved data set name.
    *
    * @param {object}         [options] - Optional parameters
    *
    * @param {boolean}        [options.animateTo=false] - Animate to restore data.
    *
    * @param {number}         [options.duration=0.1] - Duration in seconds.
    *
    * @param {EasingFunctionName | EasingFunction} [options.ease='linear'] - Easing function.
    */
   set(data: ApplicationStateData, { animateTo, duration, ease }?: {
      async?: boolean;
      animateTo?: boolean;
      duration?: number;
      ease?: EasingFunctionName | EasingFunction;
   }): void;
}

type ApplicationStateData = {
   /**
    * Application position.
    */
   position: Data.TJSPositionDataExtra;
   /**
    * Any application saved position state for #beforeMinimized
    */
   beforeMinimized: object;
   /**
    * Application options.
    */
   options: object;
   /**
    * Application UI state.
    */
   ui: object;
};

export { ApplicationState, ApplicationStateData }
