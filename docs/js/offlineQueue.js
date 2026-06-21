/**
 * offlineQueue.js
 * Durable queue of pending writes for offline use. Operations are persisted to
 * localStorage (survive reloads), de-duplicated by a stable id (prevents double
 * submission), and replayed in order on reconnect. The queue stores plain data;
 * actions.js supplies the runner that knows how to perform each operation.
 */

import { CONFIG } from './config.js';
import { readJson, writeJson } from './utils/storage.js';

let queue = readJson(CONFIG.STORAGE.PENDING, []);
let flushing = false;

/**
 * Add an operation unless one with the same id is already queued.
 * @param {{id:string, type:string, payload:Object}} op
 * @return {boolean} true if newly enqueued, false if a duplicate was ignored.
 */
export function enqueue(op) {
  if (!op || !op.id || queue.some((o) => o.id === op.id)) {
    return false;
  }
  queue.push({ id: op.id, type: op.type, payload: op.payload });
  persist();
  return true;
}

/** Number of operations still pending. */
export function size() {
  return queue.length;
}

/** True if a given operation id is already queued. */
export function has(id) {
  return queue.some((o) => o.id === id);
}

/**
 * Replay queued operations in order using the supplied runner.
 * @param {(op:Object)=>Promise<void>} runner resolves on success; throws an
 *   ApiError on failure. Errors with code NETWORK/TIMEOUT stop the flush (still
 *   offline); any other error drops the operation (permanent failure).
 * @return {Promise<number>} how many operations were successfully drained.
 */
export async function flush(runner) {
  if (flushing) {
    return 0;
  }
  flushing = true;
  let drained = 0;
  try {
    for (const op of queue.slice()) {
      const outcome = await runOne(runner, op);
      if (outcome === 'stop') {
        break;
      }
      if (outcome === 'done') {
        drained += 1;
      }
    }
  } finally {
    flushing = false;
  }
  return drained;
}

/** Run a single op; returns 'done', 'drop', or 'stop'. */
async function runOne(runner, op) {
  try {
    await runner(op);
    remove(op.id);
    return 'done';
  } catch (err) {
    if (err && (err.code === 'NETWORK' || err.code === 'TIMEOUT')) {
      return 'stop';
    }
    remove(op.id); // permanent failure — drop so it cannot block the queue
    return 'drop';
  }
}

function remove(id) {
  queue = queue.filter((o) => o.id !== id);
  persist();
}

function persist() {
  writeJson(CONFIG.STORAGE.PENDING, queue);
}
