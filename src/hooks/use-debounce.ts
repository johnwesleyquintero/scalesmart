import { useRef, useEffect, useCallback, useState } from 'react';

// Combined interface for the hook, defining its overloaded behavior
interface UseDebounce {
  // Overload for debouncing values: preserves the value's type
  <TValue>(value: TValue, delay?: number): TValue;

  // Overload for debouncing functions: preserves the function's signature
  // TFunc must be a function type.
  <TFunc extends (...args: unknown[]) => unknown>(
    callback: TFunc,
    delay?: number,
  ): TFunc;
}

/**
 * A custom React Hook for debouncing values or functions.
 * It provides overloaded behavior:
 * - When debouncing a value, it returns the debounced value.
 * - When debouncing a function, it returns a debounced version of the function.
 *
 * @param valueOrFunction The value or function to debounce.
 * @param delay The debounce delay in milliseconds (default: 500).
 * @returns The debounced value or function.
 */
const useDebounce: UseDebounce = (<TParam>(
  valueOrFunction: TParam,
  delay: number = 500,
): TParam => {
  // --- Case 1: Debouncing a value ---
  if (typeof valueOrFunction !== 'function') {
    // In this branch, TParam represents the type of the value (e.g., string, number).
    const [debouncedValue, setDebouncedValue] =
      useState<TParam>(valueOrFunction);

    useEffect(() => {
      const timerId = setTimeout(() => {
        setDebouncedValue(valueOrFunction);
      }, delay);

      // Cleanup function for the effect: clear the timeout.
      return () => {
        clearTimeout(timerId);
      };
    }, [valueOrFunction, delay]); // Re-run effect if value or delay changes.

    return debouncedValue;
  }

  // --- Case 2: Debouncing a function ---
  // In this branch, TParam represents a function type (e.g., (arg1: string) => void).
  // `valueOrFunction` is the actual callback function passed to the hook.
  const callback = valueOrFunction;

  // Ref to store the latest version of the callback.
  // This is important if the callback is defined inline and changes on re-renders.
  // The ref's type is TParam, which is a function type here.
  const callbackRef = useRef<TParam>(callback);

  useEffect(() => {
    // Update the ref with the latest callback instance when it changes.
    callbackRef.current = callback;
  }, [callback]); // Re-run effect if the callback function instance changes.

  // `useCallback` memoizes the debounced function that will be returned.
  const debouncedFunction = useCallback(
    // `Parameters<...>` extracts argument types from TParam (which is a function type).
    // The conditional type `TParam extends (...a: any[]) => any ? TParam : never`
    // helps TypeScript ensure TParam is treated as a function type for `Parameters`.
    (
      ...args: Parameters<
        TParam extends (...a: unknown[]) => unknown ? TParam : never
      >
    ) => {
      let timerId: ReturnType<typeof setTimeout>;
      let effectCleanup: (() => void) | undefined; // To store cleanup from user's callback

      // Schedule the execution of the user's callback.
      timerId = setTimeout(() => {
        // Execute the latest callback stored in the ref.
        // `callbackRef.current` is of type TParam (a function type).
        // It's callable with `...args`.
        const result = (callbackRef.current as (...a: unknown[]) => unknown)(
          ...args,
        );

        // If the user's callback returns a function, treat it as a cleanup function.
        if (typeof result === 'function') {
          effectCleanup = result as () => void;
        }
      }, delay);

      // The debounced function (created by `useCallback`) returns a master cleanup function.
      // This master cleanup cancels the scheduled execution and runs any cleanup
      // returned by the user's callback *if it had executed*.
      return () => {
        clearTimeout(timerId);
        effectCleanup?.(); // Call the user callback's cleanup, if it exists.
      };
    },
    [delay], // Dependency: only `delay`. `callbackRef` itself is stable.
    // The `useEffect` above handles updating `callbackRef.current`.
  );

  // The debouncedFunction currently has a signature like:
  // `(...args: Parameters<TParam>) => (() => void)`
  // We cast this to `TParam` (the original function type).
  // This cast implies that `ReturnType<TParam>` is expected to be `() => void`
  // for this specific debouncing pattern to be fully type-safe.
  // This resolves the TypeScript errors you reported by ensuring internal types
  // are consistent, but this final cast carries assumptions.
  return debouncedFunction as TParam;
}) as UseDebounce;

export default useDebounce;
