import subWorker from '../../subWorker';

export class subscriptionWorker extends subWorker {
  async start() {
    await super.start();

    while (this.running) {}
  }
}
