/**
 * Real loading progress for the first screen. Each critical resource is a
 * task with a weight; parts of the site report progress and completion as
 * the resource actually loads. Nothing here advances on a timer.
 *
 *   expect("hero-scene", 3)   declare a task the loader must wait for
 *   report("hero-scene", 0.5) partial progress, 0..1
 *   complete("hero-scene")    the resource is loaded and ready
 *   onLoaded(cb)              run once the loader has finished and left
 */
type Task = { weight: number; progress: number; label: string };

const tasks = new Map<string, Task>();
/** Progress reported before a task was declared, so an early report is never lost. */
const early = new Map<string, number>();
const listeners = new Set<() => void>();
const doneCallbacks = new Set<() => void>();
let loaded = false;

function emit() {
  listeners.forEach((l) => l());
}

export function expect(id: string, weight: number, label: string) {
  if (!tasks.has(id)) tasks.set(id, { weight, progress: early.get(id) ?? 0, label });
  emit();
}

export function report(id: string, progress: number) {
  const t = tasks.get(id);
  if (!t) {
    early.set(id, Math.max(early.get(id) ?? 0, progress));
    return;
  }
  const p = Math.min(1, Math.max(t.progress, progress));
  if (p === t.progress) return;
  t.progress = p;
  emit();
}

export function complete(id: string) {
  report(id, 1);
}

/** True if the loader is waiting on this task (so callers can skip work when it is not). */
export function isExpected(id: string) {
  return tasks.has(id);
}

export function snapshot() {
  let total = 0;
  let done = 0;
  let current = "";
  for (const t of tasks.values()) {
    total += t.weight;
    done += t.weight * t.progress;
    if (!current && t.progress < 1) current = t.label;
  }
  return { progress: total ? done / total : 0, current, count: tasks.size };
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Called by the loader once it has finished its exit. */
export function markLoaded() {
  if (loaded) return;
  loaded = true;
  doneCallbacks.forEach((cb) => cb());
  doneCallbacks.clear();
}

export function isLoaded() {
  return loaded;
}

/** Run `cb` when the site is revealed (immediately if it already has been). Returns an unsubscribe. */
export function onLoaded(cb: () => void) {
  if (loaded) {
    cb();
    return () => {};
  }
  doneCallbacks.add(cb);
  return () => {
    doneCallbacks.delete(cb);
  };
}
