"use client";

import { useCallback, useEffect, useMemo, useState, startTransition } from "react";

export type QadaState = {
  initialized: boolean;
  totalTarget: number;
  completed: number;
};

const STORAGE_KEY = "qada-tracker:v1";

const DEFAULT_STATE: QadaState = {
  initialized: false,
  totalTarget: 0,
  completed: 0
};

function safeParse(json: string): unknown {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function isValidState(v: unknown): v is QadaState {
  if (!v || typeof v !== "object") return false;
  const s = v as Record<string, unknown>;
  return (
    typeof s.initialized === "boolean" &&
    typeof s.totalTarget === "number" &&
    Number.isFinite(s.totalTarget) &&
    typeof s.completed === "number" &&
    Number.isFinite(s.completed)
  );
}

export function useQadaStorage() {
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<QadaState>(DEFAULT_STATE);

  const loadState = useCallback(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      setState(DEFAULT_STATE);
      return;
    }

    const parsed = safeParse(raw);
    if (!isValidState(parsed)) {
      setState(DEFAULT_STATE);
      return;
    }

    const totalTarget = Math.max(0, Math.floor(parsed.totalTarget));
    const completed = Math.max(0, Math.min(Math.floor(parsed.completed), totalTarget));

    setState({
      initialized: Boolean(parsed.initialized) && totalTarget > 0,
      totalTarget,
      completed
    });
  }, []);

  useEffect(() => {
    setMounted(true);
    loadState();
  }, [loadState]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        startTransition(() => {
          loadState();
        });
      }
    };

    const handleCustomStorageChange = () => {
      queueMicrotask(() => {
        startTransition(loadState);
      });
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("qada-storage-change", handleCustomStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("qada-storage-change", handleCustomStorageChange);
    };
  }, [loadState]);

  const persist = useCallback((next: QadaState) => {
    setState(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("qada-storage-change"));
  }, []);

  const actions = useMemo(() => {
    return {
      start(totalTarget: number) {
        const cleanTarget = Math.max(0, Math.floor(totalTarget));
        persist({
          initialized: cleanTarget > 0,
          totalTarget: cleanTarget,
          completed: 0
        });
      },
      incrementDay() {
        setState((prev) => {
          const next = {
            ...prev,
            completed: Math.min(prev.totalTarget, prev.completed + 1)
          };
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          window.dispatchEvent(new Event("qada-storage-change"));
          return next;
        });
      },
      decrementDay() {
        setState((prev) => {
          const next = {
            ...prev,
            completed: Math.max(0, prev.completed - 1)
          };
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          window.dispatchEvent(new Event("qada-storage-change"));
          return next;
        });
      },
      addDebt(daysToAdd: number) {
        const add = Math.max(0, Math.floor(daysToAdd));
        setState((prev) => {
          const nextTarget = prev.totalTarget + add;
          const next = {
            ...prev,
            initialized: nextTarget > 0,
            totalTarget: nextTarget,
            completed: Math.min(prev.completed, nextTarget)
          };
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          window.dispatchEvent(new Event("qada-storage-change"));
          return next;
        });
      },
      reset() {
        window.localStorage.removeItem(STORAGE_KEY);
        setState(DEFAULT_STATE);
        window.dispatchEvent(new Event("qada-storage-change"));
      }
    };
  }, [persist]);

  return { mounted, state, actions, storageKey: STORAGE_KEY };
}

