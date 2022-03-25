import 'dotenv/config';

import { Axios } from 'axios';
import { Sequelize, SequelizeOptions } from 'sequelize-typescript';

import { ThreadedClass, threadedClass } from 'threadedclass';
import { discussionController } from './Discussions/discussionsWorker';
import { mangaController } from './Manga/mangaWorker';
import ClientController from '../utils/ClientController';
import { defaultSqliteSettings } from '../utils/defaultSettings';

export class backgroundController {
  running = false;
  safeMode = true;
  verbose = false;

  database: Sequelize;
  client: Axios;
  discussionWorker: ThreadedClass<discussionController>;
  mangaWorker: ThreadedClass<mangaController>;

  constructor(client: string, safeMode: boolean, verbose: boolean) {
    // super();

    this.client = ClientController.parseClient(client);
    this.safeMode = safeMode;
    this.verbose = verbose;
  }

  async spawnWorkers() {
    this.discussionWorker = await await threadedClass<
      discussionController,
      typeof discussionController
    >(
      './Discussions/discussionsWorker',
      'discussionController',
      [this.client.defaults.jar?.toJSON?.() || '', 300000],
      { freezeLimit: 1000000 },
    );
    await this.discussionWorker.connect();
    this.mangaWorker = await threadedClass<
      mangaController,
      typeof mangaController
    >(
      './Manga/mangaWorker',
      'mangaController',
      [this.client, this.safeMode, this.verbose],
      { freezeLimit: 1000000 },
    );
    await this.mangaWorker.connect();
  }

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

