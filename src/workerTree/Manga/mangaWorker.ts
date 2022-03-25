import { Axios } from 'axios';
import { Sequelize } from 'sequelize-typescript';
import { defaultSqliteSettings } from '../../utils/defaultSettings';
import { RawMangaT, RawBookmarkT } from '../../utils/types';

export type runInWorker = (
  manga: RawMangaT,
  quietCreate: boolean,
  safemode: boolean,
  verbose: boolean,
  bookmarked: RawBookmarkT[],
) => Promise<void>;

export class mangaController {
  running = false;
  safeMode = true;
  verbose = false;

  database: Sequelize;
  client: Axios;

  constructor(client: Axios, safeMode: boolean, verbose: boolean) {
    // super();

    this.client = client;
    this.safeMode = safeMode;
    this.verbose = verbose;
  }

  async connect() {
    console.log('[MANGA] Connecting to database...');

    this.database = new Sequelize(defaultSqliteSettings);

    await this.database.authenticate();
  }

  start() {
    if (this.running) return;

    this.running = true;
  }

  stop() {
    this.running = false;

    if (!this.running) return;

    this.running = false;
  }

  async startWorkers() {
    // new Sequelize(defaultSqliteSettings).authenticate().then(async function () {
    //   expose(((...args) => {
    //     return fillManga(...args, client);
    //   }) as runInWorker);
    // });
    return;
  }
}
