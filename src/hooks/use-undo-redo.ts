import { useState, useCallback, useRef } from 'react';

interface UndoRedoState<T> {
  past: T[];
  present: T;
  future: T[];
}

interface UseUndoRedoOptions<T> {
  maxHistory?: number;
  onUndo?: (state: T) => void;
  onRedo?: (state: T) => void;
}

export function useUndoRedo<T>(
  initialState: T,
  options: UseUndoRedoOptions<T> = {},
) {
  const { maxHistory = 50, onUndo, onRedo } = options;
  const [state, setState] = useState<UndoRedoState<T>>({
    past: [],
    present: initialState,
    future: [],
  });

  const isUpdatingRef = useRef(false);

  const canUndo = state.past.length > 0;
  const canRedo = state.future.length > 0;

  const undo = useCallback(() => {
    if (!canUndo || isUpdatingRef.current) return;

    isUpdatingRef.current = true;
    const previous = state.past[state.past.length - 1];
    const newPast = state.past.slice(0, state.past.length - 1);

    setState({
      past: newPast,
      present: previous,
      future: [state.present, ...state.future],
    });

    onUndo?.(previous);
    isUpdatingRef.current = false;
  }, [state, canUndo, onUndo]);

  const redo = useCallback(() => {
    if (!canRedo || isUpdatingRef.current) return;

    isUpdatingRef.current = true;
    const next = state.future[0];
    const newFuture = state.future.slice(1);

    setState({
      past: [...state.past, state.present],
      present: next,
      future: newFuture,
    });

    onRedo?.(next);
    isUpdatingRef.current = false;
  }, [state, canRedo, onRedo]);

  const update = useCallback(
    (newState: T | ((prevState: T) => T)) => {
      if (isUpdatingRef.current) return;

      const finalState =
        typeof newState === 'function'
          ? (newState as (prevState: T) => T)(state.present)
          : newState;

      // Don't update if state hasn't changed
      if (JSON.stringify(finalState) === JSON.stringify(state.present)) {
        return;
      }

      setState((prevState) => {
        const newPast = [...prevState.past, prevState.present];

        // Limit history size
        const limitedPast =
          newPast.length > maxHistory
            ? newPast.slice(newPast.length - maxHistory)
            : newPast;

        return {
          past: limitedPast,
          present: finalState,
          future: [], // Clear future when making a new change
        };
      });
    },
    [state.present, maxHistory],
  );

  const reset = useCallback((newInitialState: T) => {
    setState({
      past: [],
      present: newInitialState,
      future: [],
    });
  }, []);

  const clearHistory = useCallback(() => {
    setState((prevState) => ({
      past: [],
      present: prevState.present,
      future: [],
    }));
  }, []);

  return {
    state: state.present,
    past: state.past,
    future: state.future,
    canUndo,
    canRedo,
    undo,
    redo,
    update,
    reset,
    clearHistory,
  };
}
