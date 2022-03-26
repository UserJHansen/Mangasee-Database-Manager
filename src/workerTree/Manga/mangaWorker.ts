import { Axios } from 'axios';
import { Sequelize } from 'sequelize-typescript';
import { defaultSqliteSettings } from '../../utils/defaultSettings';
import { RawMangaT, RawBookmarkT, MangaSplitT } from '../../utils/types';

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

  constructor(
    client: Axios,
    split: MangaSplitT,
    safeMode: boolean,
    verbose: boolean,
  ) {
    this.client = client;
    this.safeMode = safeMode;
    this.verbose = verbose;

    if (split.reduce((a, b) => a + b, 0) !== 1) {
      throw new Error('Manga split must add up to 1.');
    }
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
