import subWorker from '../../subWorker';

export class genreWorker extends subWorker {
  async start() {
    await super.start();

    while (this.running) {}
  }
}
