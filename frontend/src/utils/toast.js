export let toastFn = null;

export const setToastFn = (fn) => {
  toastFn = fn;
};

export const toast = (msg, type = 'success') => {
  if (toastFn) toastFn(msg, type);
};
