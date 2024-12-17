/**
 * Defines the application shell contract. If Svelte components export getter / setters for the following properties
 * then that component is considered an application shell.
 */
const applicationShellContract: string[] = ['elementRoot'];

Object.freeze(applicationShellContract);

export { applicationShellContract };
