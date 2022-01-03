import 'svelte/store';
import 'svelte/internal';

/**
 * Subscribes to the given store with two update functions provided. The first function is invoked on the initial
 * subscription. All future updates are dispatched to the update function.
 *
 * @param {import('svelte/store').Readable | import('svelte/store').Writable} store -
 *  Store to subscribe to...
 *
 * @param {function} first - Function to receive first update.
 *
 * @param {function} update - Function to receive future updates.
 *
 * @returns {function} Store unsubscribe function.
 */

function subscribeFirstRest(store, first, update) {
  let firedFirst = false;
  return store.subscribe(value => {
    if (!firedFirst) {
      firedFirst = true;
      first(value);
    } else {
      update(value);
    }
  });
}

/**
 * Provides an action to apply style properties provided as an object.
 *
 * @param {HTMLElement} node - Target element
 *
 * @param {object}      properties - Key / value object of properties to set.
 *
 * @returns {Function} Update function.
 */
function applyStyles(node, properties)
{
   /** Sets properties on node. */
   function setProperties()
   {
      if (typeof properties !== 'object') { return; }

      for (const prop of Object.keys(properties))
      {
         node.style.setProperty(`${prop}`, properties[prop]);
      }
   }

   setProperties();

   return {
      update(newProperties)
      {
         properties = newProperties;
         setProperties();
      }
   };
}

/**
 * Provides a toggle action for `details` HTML elements. The boolean store provided controls animation.
 *
 * It is not necessary to bind the store to the `open` attribute of the associated details element.
 *
 * When the action is triggered to close the details element a data attribute `closing` is set to `true`. This allows
 * any associated closing transitions to start immediately.
 *
 * @param {HTMLDetailsElement} details - The details element.
 *
 * @param {import('svelte/store').Writable<boolean>} booleanStore - A boolean store.
 *
 * @returns {object} Destroy callback.
 */
function toggleDetails(details, booleanStore)
{
   /** @type {HTMLElement} */
   const summary = details.querySelector('summary');

   /** @type {Animation} */
   let animation;

   /** @type {boolean} */
   let open = details.open;

   // The booleanStore sets initial open state and handles animation on further changes.
   const unsubscribe = subscribeFirstRest(booleanStore, (value) => { open = value; details.open = open; }, (value) =>
   {
      open = value;
      handleAnimation();
   });

   /**
    * @param {number} a -
    *
    * @param {number} b -
    *
    * @param {boolean} value -
    */
   function animate(a, b, value)
   {
      details.style.overflow = 'hidden';

      // Must guard when `b - a === 0`; add a small epsilon and wrap with Math.max.
      const duration = Math.max(0, 30 * Math.log(Math.abs(b - a) + Number.EPSILON));

      animation = details.animate(
       {
          height: [`${a}px`, `${b}px`]
       },
       {
          duration,
          easing: 'ease-out'
       }
      );

      animation.onfinish = () =>
      {
         details.open = value;
         details.dataset.closing = 'false';
         details.style.overflow = '';
      };
   }

   /**
    * Handles animation coordination based on current state.
    */
   function handleAnimation()
   {
      if (open)
      {
         const a = details.offsetHeight;
         if (animation) { animation.cancel(); }
         details.open = true;
         const b = details.offsetHeight;

         animate(a, b, true);
      }
      else
      {
         const a = details.offsetHeight;
         const b = summary.offsetHeight;

         details.dataset.closing = 'true';

         animate(a, b, false);
      }
   }

   /**
    * @param {MouseEvent} e - A mouse event.
    */
   function handleClick(e)
   {
      e.preventDefault();

      // Simply set the store to the opposite of current open state and the callback above handles animation.
      booleanStore.set(!open);
   }

   summary.addEventListener('click', handleClick);

   return {
      destroy()
      {
         unsubscribe();
         summary.removeEventListener('click', handleClick);
      }
   };
}

/**
 * Provides an action to enable pointer dragging of an HTMLElement and invoke `setPosition` on given Positionable
 * object provided. When the attached boolean store state changes the draggable action is enabled or disabled.
 *
 * @param {HTMLElement}       node - The node associated with the action.
 *
 * @param {object}            params - Required parameters.
 *
 * @param {Positionable}      params.positionable - A positionable object.
 *
 * @param {Readable<boolean>} params.booleanStore - A Svelte store that contains a boolean.
 *
 * @returns {{update: Function, destroy: Function}} The action lifecycle methods.
 */
function draggable(node, { positionable, booleanStore })
{
   /**
    * Duplicate the app / Positionable starting position to track differences.
    *
    * @type {object}
    */
   let position = null;

   /**
    * Stores the initial X / Y on drag down.
    *
    * @type {object}
    */
   let initialPosition = {};

   /**
    * Throttle mousemove event handling to 60fps
    *
    * @type {number}
    */
   let moveTime = 0;

   /**
    * Stores the active state and is used to cut off any active dragging when the store value changes.
    *
    * @type {Readable<boolean>}
    */
   let active = booleanStore;

   /**
    * Remember event handlers associated with this action so they may be later unregistered.
    *
    * @type {object}
    */
   const handlers = {
      dragDown: ['pointerdown', (e) => onDragPointerDown(e), false],
      dragMove: ['pointermove', (e) => onDragPointerMove(e), false],
      dragUp: ['pointerup', (e) => onDragPointerUp(e), false]
   };

   /**
    * Activates listeners.
    */
   function activateListeners()
   {
      active = true;

      // Drag handlers
      node.addEventListener(...handlers.dragDown);
      node.classList.add('draggable');
   }

   /**
    * Removes listeners.
    */
   function removeListeners()
   {
      active = false;

      // Drag handlers
      node.removeEventListener(...handlers.dragDown);
      node.removeEventListener(...handlers.dragMove);
      node.removeEventListener(...handlers.dragUp);
      node.classList.remove('draggable');
   }

   if (active)
   {
      activateListeners();
   }

   /**
    * Handle the initial pointer down which activates dragging behavior for the positionable.
    *
    * @param {PointerEvent} event - The pointer down event.
    */
   function onDragPointerDown(event)
   {
      event.preventDefault();

      // Record initial position
      position = foundry.utils.duplicate(positionable.position);
      initialPosition = { x: event.clientX, y: event.clientY };

      // Add temporary handlers
      globalThis.addEventListener(...handlers.dragMove);
      globalThis.addEventListener(...handlers.dragUp);
   }

   /**
    * Move the positionable.
    *
    * @param {PointerEvent} event - The pointer move event.
    */
   function onDragPointerMove(event)
   {
      event.preventDefault();

      if (!active) { return; }

      // Limit dragging to 60 updates per second
      const now = Date.now();

      if ((now - moveTime) < (1000 / 60)) { return; }

      moveTime = now;

      // Update application position
      positionable.setPosition({
         left: position.left + (event.clientX - initialPosition.x),
         top: position.top + (event.clientY - initialPosition.y)
      });
   }

   /**
    * Conclude the dragging behavior when the mouse is release, setting the final position and removing listeners
    *
    * @param {PointerEvent} event - The pointer up event.
    */
   function onDragPointerUp(event)
   {
      event.preventDefault();
      globalThis.removeEventListener(...handlers.dragMove);
      globalThis.removeEventListener(...handlers.dragUp);
   }

   return {
      update: ({ booleanStore }) =>  // eslint-disable-line no-shadow
      {
         if (booleanStore) { activateListeners(); }
         else { removeListeners(); }
      },

      destroy: () => removeListeners()
   };
}

export { applyStyles, draggable, toggleDetails };
//# sourceMappingURL=index.js.map
