import subWorker from '../../subWorker';

export class readWorker extends subWorker {
  async start() {
    await super.start();

    while (this.running) {}
  }
}
