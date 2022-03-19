import 'dotenv/config';

import { Axios } from 'axios';
import { Sequelize, SequelizeOptions } from 'sequelize-typescript';

import { ThreadedClass, threadedClass } from 'threadedclass';
import { discussionController } from './Discussions/discussionsWorker';
import { mangaController } from './Manga/mangaWorker';
import ClientController from '../utils/ClientController';
import EventEmitter from 'events';

export class backgroundController extends EventEmitter {
  running = false;
  safeMode = true;
  verbose = false;

  database: Sequelize;
  client: Axios;
  discussionWorker: ThreadedClass<discussionController>;
  mangaWorker: ThreadedClass<mangaController>;

  constructor(
    client: string,
    safeMode: boolean,
    verbose: boolean,
  ) {
    super()

    this.client = ClientController.parseClient(client);
    this.safeMode = safeMode;
    this.verbose = verbose;
  }

  async spawnWorkers() {
    this.discussionWorker = await threadedClass<
    discussionController,
    typeof discussionController
  >('./Discussions/discussionsWorker', 'discussionController', [
    this.client,
    10000,
  ]);
    this.mangaWorker = await threadedClass<
    mangaController,
    typeof mangaController
  >('./Manga/mangaWorker', 'mangaController', [
    this.client,
    this.safeMode,this.verbose,
  ]);}

  connect(options: SequelizeOptions) {
    return new Promise<backgroundController>((resolve, reject) => {
      this.database = new Sequelize(options);

      try {
        this.database
          .authenticate()
          .then(() => this.database.sync())
          .then(() => resolve(this));
      } catch (error) {
        reject(error);
      }
    });
  }

  start() {
    this.discussionWorker.start();
    this.mangaWorker.start();

    this.running = true;
  }

  stop() {
    this.running = false;

    this.discussionWorker.stop();
    this.mangaWorker.stop();
  }
}

// backgroundController
//   .generate()
//   .then((worker) => worker.connect(defaultSqliteSettings));

