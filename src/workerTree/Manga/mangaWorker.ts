import { Sequelize } from 'sequelize-typescript';
import { defaultSqliteSettings } from '../../utils/defaultSettings';
import { RawMangaT, RawBookmarkT, MangaSplitT } from '../../utils/types';

import { cpus } from 'os';
import { threadedClass, ThreadedClass } from 'threadedclass';
import subWorker from './subWorkers/subWorker';
import { CookieJar } from 'tough-cookie';
import readWorker from './subWorkers/readWorker';

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

export class mangaController {
  running = false;
  safeMode = true;
  verbose = false;

  database: Sequelize;
  client: CookieJar.Serialized;

  split: MangaSplitT;
  workerRefs: ThreadedClass<subWorker>[];

  constructor(
    client: CookieJar.Serialized,
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
    this.split = split;
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
    const workers = this.split.map((part) => Math.ceil(part * cpus().length));

    console.log(workers);
    console.log('[MANGA] Starting workers...');

    for (let number = 0; number < workers.length; number++) {
      const type = workers[number];

      for (let i = 0; i < number; i++) {
        switch (type) {
          case WorkerType.Read:
            this.workerRefs.push(
              await threadedClass<readWorker, typeof readWorker>(
                './subWorkers/readWorker',
                'readWorker',
                [this.client, this.safeMode, this.verbose],
                { freezeLimit: 1000000 },
              ),
            );

            break;
          case WorkerType.Subscribed:
            break;
          case WorkerType.GenreSimilar:
            break;
          case WorkerType.Random:
            break;
        }
      }
    }
  }
}
