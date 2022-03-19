import { Axios } from 'axios';
import EventEmitter from 'events';
import { Sequelize, SequelizeOptions } from 'sequelize-typescript';
import { RawMangaT, RawBookmarkT } from '../../utils/types';

export type runInWorker = (
  manga: RawMangaT,
  quietCreate: boolean,
  safemode: boolean,
  verbose: boolean,
  bookmarked: RawBookmarkT[],
) => Promise<void>;

export class mangaController extends EventEmitter {
  running = false;
  safeMode = true;
  verbose = false;

  database: Sequelize;
  client: Axios;

  constructor(client: Axios, safeMode: boolean, verbose: boolean) {
    super();

    this.client = client;
    this.safeMode = safeMode;
    this.verbose = verbose;
  }

  connect(options: SequelizeOptions) {
    console.log('[MANGA] Connecting to database...');
    return new Promise<mangaController>((resolve, reject) => {
      this.database = new Sequelize(options);

      try {
        this.database.authenticate().then(() => resolve(this));
      } catch (error) {
        reject(error);
      }
    });
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
