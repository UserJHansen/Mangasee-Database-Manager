import { Axios } from 'axios';
import { Sequelize } from 'sequelize-typescript';
import { CookieJar } from 'tough-cookie';
import ClientController from '../utils/ClientController';
import { defaultSqliteSettings } from '../utils/defaultSettings';

export default class subWorker {
  running = false;
  verbose = false;

  client: Axios;
  database: Sequelize;

  interval = 0;
  timerID?: NodeJS.Timeout;

  constructor(jar: CookieJar.Serialized, verbose: boolean, interval: number) {
    this.client = ClientController.parseClient(jar);
    this.verbose = verbose;
    this.interval = interval;
  }

  async connect() {
    console.log(`[${this.constructor.name}] Connecting to database...`);

    this.database = new Sequelize(defaultSqliteSettings);
    await this.database.authenticate();
  }

  async start() {
    if (this.running) return;
    this.running = true;

    this.onInterval();
    this.timerID = setInterval(() => this.onInterval(), this.interval);
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
