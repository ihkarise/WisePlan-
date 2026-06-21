/**
 * photoQueue.js
 * Photography queue: groups with PhotoStatus = Waiting. Done/Skip both advance
 * the group into the food queue.
 */

import { renderQueue } from './queueView.js';

export function renderPhotoQueue() {
  return renderQueue({
    title: 'Photography Queue',
    statusField: 'PhotoStatus',
    doneAction: 'photoDone',
    skipAction: 'photoSkip',
    doneLabel: 'Photo Done',
    emptyHint: 'No groups are waiting for photography.',
    serviceField: 'PhotographyOpen',
    pausedMessage: 'Photography Temporarily Paused'
  });
}
