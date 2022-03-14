import 'dotenv/config';

import { Axios } from 'axios';
import { Sequelize, SequelizeOptions } from 'sequelize-typescript';
import { expose } from 'threads/worker';

import { workerData } from 'worker_threads';
import { ModuleThread, spawn, Worker } from 'threads';
import ClientController from '../utils/ClientController';
import { defaultSqliteSettings } from '../utils/defaultSettings';
import { controller } from './workerTypes';

export class backgroundController implements controller<backgroundController> {
  running = false;
  database: Sequelize;
  client: Axios;
  discussionWorker: ModuleThread<controller<backgroundController>>;
  mangaWorker: ModuleThread<controller<backgroundController>>;

  private constructor(
    client: Axios,
    discussionWorker: ModuleThread<controller<backgroundController>>,
    mangaWorker: ModuleThread<controller<backgroundController>>,
  ) {
    this.client = client;
    this.discussionWorker = discussionWorker;
    this.mangaWorker = mangaWorker;
  }

  static async generate(client: Axios) {
    const discussionWorker = await spawn<controller<backgroundController>>(
        new Worker('./Discussions/discussionsWorker', {
          workerData,
        }),
      ),
      mangaWorker = await spawn<controller<backgroundController>>(
        new Worker('./Manga/mangaWorker', {
          workerData,
        }),
      );

    return new backgroundController(client, discussionWorker, mangaWorker);
  }

  connect(options: SequelizeOptions) {
    return new Promise<backgroundController>((resolve, reject) => {
      this.database = new Sequelize(options);

      try {
        this.database.authenticate().then(() => resolve(this));
      } catch (error) {
        reject(error);
      }
    });
  }

  start() {
    this.running = true;

    this.discussionWorker.start();
    this.mangaWorker.start();
  }

  stop() {
    this.running = false;

    this.discussionWorker.stop();
    this.mangaWorker.stop();
  }
}

backgroundController
  .generate(ClientController.parseClient(workerData.client))
  .then((worker) => worker.connect(defaultSqliteSettings))
  .then((worker) =>
    expose({ start: worker.start, stop: worker.stop, connect: worker.connect }),
  );

