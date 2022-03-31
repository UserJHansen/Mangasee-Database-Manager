import { Sequelize } from 'sequelize-typescript';
import { defaultSqliteSettings } from '../../utils/defaultSettings';
import { RawMangaT, RawBookmarkT, MangaSplitT } from '../../utils/types';

import { cpus } from 'os';
import { threadedClass, ThreadedClass } from 'threadedclass';
import subWorker from '../subWorker';
import { CookieJar } from 'tough-cookie';

export type runInWorker = (
  manga: RawMangaT,
  quietCreate: boolean,
  safemode: boolean,
  verbose: boolean,
  bookmarked: RawBookmarkT[],
) => Promise<void>;

enum WorkerType {
  Read,
  Subscribed,
  GenreSimilar,
  Random,
}

export class mangaController extends subWorker {
  database: Sequelize;

  split: MangaSplitT;
  workerRefs: ThreadedClass<subWorker>[] = [];

  constructor(
    jar: CookieJar.Serialized,
    split: MangaSplitT,
    safeMode: boolean,
    verbose: boolean,
  ) {
    super(jar, safeMode, verbose);

    if (split.reduce((a, b) => a + b, 0) !== 1) {
      throw new Error('Manga split must add up to 1.');
    }
    this.split = split;
  }

  async connect() {
    console.log('[MANGA] Connecting to database...');

    this.database = new Sequelize(defaultSqliteSettings);

    await this.database.authenticate();
  }

  async start() {
    super.start();
  }

  async stop() {
    super.stop();
  }

  async startWorkers() {
    try {
      const workers = this.split.map((part) => Math.ceil(part * cpus().length));

      console.log('[MANGA] Starting workers...');

      for (let type = 0; type < workers.length; type++) {
        const number = workers[type];
        for (let i = 0; i < number; i++) {
          let workerInfo = '';
          switch (type) {
            case WorkerType.Read:
              workerInfo = 'readWorker';
              break;
            case WorkerType.Subscribed:
              workerInfo = 'subscriptionWorker';
              break;
            case WorkerType.GenreSimilar:
              workerInfo = 'genreWorker';
              break;
            case WorkerType.Random:
              workerInfo = 'randomWorker';
              break;
          }
          this.workerRefs.push(
            await threadedClass<subWorker, typeof subWorker>(
              './subWorkers/' + workerInfo,
              workerInfo,
              [
                (this.client.defaults.jar as CookieJar).toJSON(),
                this.safeMode,
                this.verbose,
              ],
              { freezeLimit: 1000000 },
            ),
          );
        }
      }

      console.log('[MANGA] Workers started.');
    } catch (err) {
      console.log(err);
    }
  }
}
