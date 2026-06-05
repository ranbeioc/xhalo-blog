import { buildQueueTaskEnvelope } from '../../../packages/core/src/index.js';

export default {
  async queue(batch, env, ctx) {
    for (const message of batch.messages) {
      const task = buildQueueTaskEnvelope(message.body);

      switch (task.type) {
        case 'example':
          console.log('xhalo-blog queue example task', JSON.stringify(task));
          break;
        case 'draft_preview':
          console.log('xhalo-blog queue draft preview task', JSON.stringify({
            idempotency_key: task.idempotency_key,
            branch: task.payload?.preview?.branchName,
            file: task.payload?.preview?.filePath,
            repository: task.payload?.preview?.repository
          }));
          break;
        default:
          console.warn('xhalo-blog queue unknown task type', JSON.stringify(task));
          break;
      }

      message.ack();
    }
  }
};
