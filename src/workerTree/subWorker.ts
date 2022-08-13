import { Axios } from 'axios';
import { CookieJar } from 'tough-cookie';
import ClientController from '../utils/ClientController';

export default class subWorker {
  running = false;
  safeMode = true;
  verbose = false;

  client: Axios;

  interval = 0;
  timerID?: NodeJS.Timeout;

  constructor(jar: CookieJar.Serialized, safe: boolean, verbose: boolean) {
    this.client = ClientController.parseClient(jar);
    this.safeMode = safe;
    this.verbose = verbose;
  }

  async connect() {
    throw new Error('Method not implemented.');
  }

  async start() {
    if (this.running) return;
    this.running = true;

    if (this.interval !== 0) {
      this.onInterval();
      this.timerID = setInterval(() => this.onInterval(), this.interval);
    }
  }

  async onInterval() {
    throw new Error('Method not implemented.');
  }

  async stop() {
    if (!this.running) return;
    this.running = false;

    if (this.timerID) {
      clearInterval(this.timerID);

      this.timerID = undefined;
    }
  }
}
