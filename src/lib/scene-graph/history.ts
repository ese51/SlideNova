import { SceneNode } from "./types";

export interface HistoryState {
  past: SceneNode[][];
  present: SceneNode[];
  future: SceneNode[][];
}

export function createHistory(initialNodes: SceneNode[]): HistoryState {
  return {
    past: [],
    present: initialNodes,
    future: [],
  };
}

export function pushState(history: HistoryState, nextNodes: SceneNode[]): HistoryState {
  // If the new state is identical to the present state, do nothing
  if (JSON.stringify(history.present) === JSON.stringify(nextNodes)) {
    return history;
  }

  return {
    past: [...history.past, history.present],
    present: nextNodes,
    future: [], // Clearing redo stack on new action
  };
}

export function undo(history: HistoryState): HistoryState {
  if (history.past.length === 0) return history;

  const previous = history.past[history.past.length - 1];
  const newPast = history.past.slice(0, history.past.length - 1);

  return {
    past: newPast,
    present: previous,
    future: [history.present, ...history.future],
  };
}

export function redo(history: HistoryState): HistoryState {
  if (history.future.length === 0) return history;

  const next = history.future[0];
  const newFuture = history.future.slice(1);

  return {
    past: [...history.past, history.present],
    present: next,
    future: newFuture,
  };
}
