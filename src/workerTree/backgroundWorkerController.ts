import 'dotenv/config';

import { Axios } from 'axios';
import { Sequelize, SequelizeOptions } from 'sequelize-typescript';
import { expose } from 'threads/worker';

import { workerData } from 'worker_threads';
import { FunctionThread, Pool } from 'threads';
import { runInWorker } from '../workerSetup';
import ClientController from '../utils/ClientController';
import { defaultSqliteSettings } from '../utils/defaultSettings';

export interface controller {
  connect: (options: SequelizeOptions) => void;
  start: (client: Axios) => void;
  stop: () => void;
}

export class BackgroundRunner implements controller {
  running = false;
  database: Sequelize;
  client: Axios;
  pool: Pool<FunctionThread<Parameters<runInWorker>>>;

  constructor(client: Axios) {
    this.client = client;
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
  }

  stop() {
    this.running = false;
  }
}

const worker = new BackgroundRunner(ClientController.parseClient(workerData));

worker.connect(defaultSqliteSettings);

expose({ connect: worker.connect, start: worker.start, stop: worker.stop });
