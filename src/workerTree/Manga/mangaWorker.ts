import { Sequelize } from 'sequelize-typescript';
import { expose } from 'threads';
import { workerData } from 'worker_threads';
import fillManga from '../../fillManga';
import ClientController from '../../utils/ClientController';
import { defaultSqliteSettings } from '../../utils/defaultSettings';
import { RawMangaT, RawBookmarkT } from '../../utils/types';

const client = ClientController.parseClient(workerData.client);

export type runInWorker = (
  manga: RawMangaT,
  quietCreate: boolean,
  safemode: boolean,
  verbose: boolean,
  bookmarked: RawBookmarkT[],
) => Promise<void>;

new Sequelize(defaultSqliteSettings).authenticate().then(async function () {
  expose(((...args) => {
    return fillManga(...args, client);
  }) as runInWorker);
});
