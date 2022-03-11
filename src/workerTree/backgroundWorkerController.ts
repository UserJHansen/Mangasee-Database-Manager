import 'dotenv/config';

import { Axios } from 'axios';
import { Sequelize, SequelizeOptions } from 'sequelize-typescript';
import { expose } from 'threads/worker';

import { workerData } from 'worker_threads';
import { FunctionThread, ModuleThread, Pool, spawn } from 'threads';
import { runInWorker } from '../workerSetup';
import ClientController from '../utils/ClientController';
import { defaultSqliteSettings } from '../utils/defaultSettings';
import { controller } from './workerTypes';

export class BackgroundRunner implements controller {
  running = false;
  database: Sequelize;
  client: Axios;
  discussionWorker: ModuleThread<controller>;
  mangaWorker: ModuleThread<controller>;

  constructor(client: Axios) {
    this.client = client;

    return Promise.resolve(async () => {
      this.discussionWorker() = await spawn<controller>(
        new Worker('./Discussions/discussionsWorker', {
          workerData: workerENV,
        }),
      );

      return this;
    });
  }

  connect(options: SequelizeOptions) {
    return new Promise((resolve, reject) => {
      this.database = new Sequelize(options);

      try {
        this.database.authenticate().then(resolve);
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

const worker = new BackgroundRunner(ClientController.parseClient(workerData));

worker.connect(defaultSqliteSettings);

expose({ start: worker.start, stop: worker.stop });
