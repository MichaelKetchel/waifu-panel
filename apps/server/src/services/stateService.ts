import { queueService } from './queueService.js';
import { getCurrentRound } from './roundService.js';
import { getSubmissionLimit, VOTE_MODES } from '../utils/constants.js';

interface StateSnapshotOptions {
  approvedQueueOnly?: boolean;
}

export async function getStateSnapshot(options: StateSnapshotOptions = {}) {
  const [queue, activeRound] = await Promise.all([
    queueService.snapshot({ approvedOnly: options.approvedQueueOnly }),
    getCurrentRound()
  ]);

  return {
    schemaVersion: 1,
    queue,
    activeRound,
    upcoming: queue.slice(0, 3).map((entry) => ({
      id: entry.id,
      name: entry.name,
      series: entry.series,
      imagePath: entry.imagePath,
      status: entry.status
    })),
    settings: {
      submissionLimit: getSubmissionLimit(),
      voteModeDefault: VOTE_MODES.YES_NO,
      requirePasscode: Boolean(process.env.CONTROL_PASSCODE)
    }
  };
}
