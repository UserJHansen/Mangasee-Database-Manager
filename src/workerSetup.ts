import 'dotenv/config';

import { Sequelize } from 'sequelize-typescript';
import { expose } from 'threads/worker';

import { RawBookmarkT, RawMangaT } from './utils/types';
import fillManga from './fillManga';
import { workerData } from 'worker_threads';
import ClientController from './utils/ClientController';
import { defaultSqliteSettings } from './utils/defaultSettings';

export type runInWorker = (
  manga: RawMangaT,
  quietCreate: boolean,
  safemode: boolean,
  verbose: boolean,
  bookmarked: RawBookmarkT[],
) => Promise<void>;

(async () => {
  const database = new Sequelize(defaultSqliteSettings);
  try {
    await database.authenticate();
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }

  const client = ClientController.parseClient(workerData);

  expose(((...args) => {
    return fillManga(...args, client);
  }) as runInWorker);
})();
