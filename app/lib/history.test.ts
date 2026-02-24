import { describe, expect, it } from "vitest";
import { commitMutation, redoMutation, undoMutation, type HistoryStacks } from "./history";

type Action = { type: string; step?: number };

function emptyHistory(): HistoryStacks<number, Action> {
  return { past: [], future: [] };
}

describe("history engine", () => {
  it("commits a standard mutation", () => {
    const result = commitMutation<number, Action>({
      current: 2,
      history: emptyHistory(),
      action: { type: "inc" },
      apply: (state) => state + 1,
      isEqual: (a, b) => a === b
    });

    expect(result.committed).toBe(true);
    expect(result.current).toBe(3);
    expect(result.history.past).toHaveLength(1);
    expect(result.history.past[0]).toEqual({
      before: 2,
      after: 3,
      action: { type: "inc" }
    });
    expect(result.history.future).toHaveLength(0);
  });

  it("ignores no-op mutation", () => {
    const initialHistory: HistoryStacks<number, Action> = {
      past: [{ before: 1, after: 2, action: { type: "inc" } }],
      future: []
    };

    const result = commitMutation<number, Action>({
      current: 2,
      history: initialHistory,
      action: { type: "noop" },
      apply: (state) => state,
      isEqual: (a, b) => a === b
    });

    expect(result.committed).toBe(false);
    expect(result.current).toBe(2);
    expect(result.history).toBe(initialHistory);
  });

  it("caps history to the last 50 entries", () => {
    let current = 0;
    let history = emptyHistory();

    for (let step = 1; step <= 60; step += 1) {
      const result = commitMutation<number, Action>({
        current,
        history,
        action: { type: "inc", step },
        apply: (state) => state + 1,
        maxHistory: 50,
        isEqual: (a, b) => a === b
      });
      current = result.current;
      history = result.history;
    }

    expect(history.past).toHaveLength(50);
    expect(history.past[0].action.step).toBe(11);
    expect(history.past[49].action.step).toBe(60);
  });

  it("supports undo then redo", () => {
    const committed = commitMutation<number, Action>({
      current: 5,
      history: emptyHistory(),
      action: { type: "inc" },
      apply: (state) => state + 1,
      isEqual: (a, b) => a === b
    });

    const undone = undoMutation(committed.current, committed.history);
    expect(undone.changed).toBe(true);
    expect(undone.current).toBe(5);
    expect(undone.history.past).toHaveLength(0);
    expect(undone.history.future).toHaveLength(1);
    expect(undone.action?.type).toBe("inc");

    const redone = redoMutation(undone.current, undone.history);
    expect(redone.changed).toBe(true);
    expect(redone.current).toBe(6);
    expect(redone.history.past).toHaveLength(1);
    expect(redone.history.future).toHaveLength(0);
    expect(redone.action?.type).toBe("inc");
  });

  it("clears redo stack when committing after undo", () => {
    const first = commitMutation<number, Action>({
      current: 0,
      history: emptyHistory(),
      action: { type: "inc1" },
      apply: (state) => state + 1,
      isEqual: (a, b) => a === b
    });
    const second = commitMutation<number, Action>({
      current: first.current,
      history: first.history,
      action: { type: "inc2" },
      apply: (state) => state + 1,
      isEqual: (a, b) => a === b
    });

    const undone = undoMutation(second.current, second.history);
    expect(undone.history.future).toHaveLength(1);

    const committedAfterUndo = commitMutation<number, Action>({
      current: undone.current,
      history: undone.history,
      action: { type: "inc3" },
      apply: (state) => state + 5,
      isEqual: (a, b) => a === b
    });

    expect(committedAfterUndo.committed).toBe(true);
    expect(committedAfterUndo.current).toBe(6);
    expect(committedAfterUndo.history.future).toHaveLength(0);
  });
});
