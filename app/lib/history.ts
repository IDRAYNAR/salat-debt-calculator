export type MutationApplier<TState> = (current: TState) => TState;

export type HistoryEntry<TState, TAction> = {
  before: TState;
  after: TState;
  action: TAction;
};

export type HistoryStacks<TState, TAction> = {
  past: Array<HistoryEntry<TState, TAction>>;
  future: Array<HistoryEntry<TState, TAction>>;
};

export type CommitMutationArgs<TState, TAction> = {
  current: TState;
  history: HistoryStacks<TState, TAction>;
  action: TAction;
  apply: MutationApplier<TState>;
  maxHistory?: number;
  isEqual?: (a: TState, b: TState) => boolean;
};

export type CommitMutationResult<TState, TAction> = {
  current: TState;
  history: HistoryStacks<TState, TAction>;
  committed: boolean;
};

export type UndoRedoResult<TState, TAction> = {
  current: TState;
  history: HistoryStacks<TState, TAction>;
  changed: boolean;
  action: TAction | null;
};

export function applyMutation<TState>(current: TState, applier: MutationApplier<TState>): TState {
  return applier(current);
}

export function clampHistory<TState, TAction>(
  past: Array<HistoryEntry<TState, TAction>>,
  max = 50
): Array<HistoryEntry<TState, TAction>> {
  if (!Number.isFinite(max) || max <= 0) return [];
  if (past.length <= max) return past;
  return past.slice(past.length - max);
}

export function commitMutation<TState, TAction>({
  current,
  history,
  action,
  apply,
  maxHistory = 50,
  isEqual
}: CommitMutationArgs<TState, TAction>): CommitMutationResult<TState, TAction> {
  const next = applyMutation(current, apply);
  const equals = isEqual ?? ((left: TState, right: TState) => Object.is(left, right));

  if (equals(current, next)) {
    return {
      current,
      history,
      committed: false
    };
  }

  const entry: HistoryEntry<TState, TAction> = {
    before: current,
    after: next,
    action
  };

  return {
    current: next,
    history: {
      past: clampHistory([...history.past, entry], maxHistory),
      future: []
    },
    committed: true
  };
}

export function undoMutation<TState, TAction>(
  current: TState,
  history: HistoryStacks<TState, TAction>
): UndoRedoResult<TState, TAction> {
  if (history.past.length === 0) {
    return {
      current,
      history,
      changed: false,
      action: null
    };
  }

  const entry = history.past[history.past.length - 1];
  return {
    current: entry.before,
    history: {
      past: history.past.slice(0, -1),
      future: [...history.future, entry]
    },
    changed: true,
    action: entry.action
  };
}

export function redoMutation<TState, TAction>(
  current: TState,
  history: HistoryStacks<TState, TAction>
): UndoRedoResult<TState, TAction> {
  if (history.future.length === 0) {
    return {
      current,
      history,
      changed: false,
      action: null
    };
  }

  const entry = history.future[history.future.length - 1];
  return {
    current: entry.after,
    history: {
      past: [...history.past, entry],
      future: history.future.slice(0, -1)
    },
    changed: true,
    action: entry.action
  };
}
