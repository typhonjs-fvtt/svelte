import { gsap, gsapLoadPlugin } from '@typhonjs-fvtt/svelte/gsap';

const SplitText = await gsapLoadPlugin('SplitText');

gsap.registerPlugin(SplitText);

export { SplitText };
