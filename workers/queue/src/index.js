export default {
  async queue(batch, env, ctx) {
    for (const message of batch.messages) {
      console.log('xhalo-blog queue message', JSON.stringify(message.body));
      message.ack();
    }
  }
};
