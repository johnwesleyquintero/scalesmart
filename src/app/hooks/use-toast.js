'use client';
var __rest =
  (typeof self !== 'undefined' && self.__rest) ||
  function (s, e) {
    var t = {};
    for (var p in s)
      if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s !== undefined && typeof Object.getOwnPropertySymbols === 'function')
      for (let i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
        if (
          e.indexOf(p[i]) < 0 &&
          Object.prototype.propertyIsEnumerable.call(s, p[i])
        )
          t[p[i]] = s[p[i]];
      }
    return t;
  };
// Inspired by react-hot-toast library
import * as React from 'react';
const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1000;
function genId() {
  const array = new Uint32Array(1);
  window.crypto.getRandomValues(array);
  return array[0].toString(36);
}
const toastTimeouts = new Map();
const addToRemoveQueue = (toastId) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }
  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: 'REMOVE_TOAST',
      toastId: toastId,
    });
  }, TOAST_REMOVE_DELAY);
  toastTimeouts.set(toastId, timeout);
};
export const reducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };
    case 'UPDATE_TOAST':
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t,
        ),
      };
    case 'DISMISS_TOAST': {
      const { toastId } = action;
      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id);
        });
      }
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined ? { ...t, open: false } : t,
        ),
      };
    }
    case 'REMOVE_TOAST':
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
};
const listeners = [];
let memoryState = { toasts: [] };
function dispatch(action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}
function toast(_a) {
  var props = __rest(_a, []);
  const id = genId();
  const update = (props) =>
    dispatch({
      type: 'UPDATE_TOAST',
      toast: Object.assign(Object.assign({}, props), { id }),
    });
  const dismiss = () => dispatch({ type: 'DISMISS_TOAST', toastId: id });
  dispatch({
    type: 'ADD_TOAST',
    toast: Object.assign(Object.assign({}, props), {
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    }),
  });
  return {
    id: id,
    dismiss,
    update,
  };
}
function useToast() {
  const [state, setState] = React.useState(memoryState);
  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);
  return Object.assign(Object.assign({}, state), {
    toast,
    dismiss: (toastId) => dispatch({ type: 'DISMISS_TOAST', toastId }),
  });
}
export { toast, useToast };
