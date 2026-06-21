/**
 * foodQueue.js
 * Food queue: groups with FoodStatus = Waiting. Done/Skip both complete the
 * group's journey.
 */

import { renderQueue } from './queueView.js';

export function renderFoodQueue() {
  return renderQueue({
    title: 'Food Queue',
    statusField: 'FoodStatus',
    doneAction: 'foodDone',
    skipAction: 'foodSkip',
    doneLabel: 'Food Done',
    emptyHint: 'No groups are waiting for food.',
    serviceField: 'FoodOpen',
    pausedMessage: 'Food Service Temporarily Paused'
  });
}
