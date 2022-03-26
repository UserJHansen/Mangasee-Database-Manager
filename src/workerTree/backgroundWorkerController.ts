import 'dotenv/config';

import { Axios } from 'axios';
import { Sequelize } from 'sequelize-typescript';

import { ThreadedClass, threadedClass } from 'threadedclass';
import { discussionController } from './Discussions/discussionsWorker';
import { mangaController } from './Manga/mangaWorker';
import ClientController from '../utils/ClientController';
import { MangaSplitT } from '../utils/types';
import { defaultSqliteSettings } from '../utils/defaultSettings';

export class backgroundController {
  running = false;
  safeMode = true;
  verbose = false;

  client: Axios;
  discussionWorker: ThreadedClass<discussionController>;
  mangaWorker: ThreadedClass<mangaController>;

  constructor(client: string, safeMode: boolean, verbose: boolean) {
    this.client = ClientController.parseClient(client);
    this.safeMode = safeMode;
    this.verbose = verbose;
  }

  async spawnWorkers(mangaSplit: MangaSplitT) {
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
      [this.client, mangaSplit, this.safeMode, this.verbose],
      { freezeLimit: 1000000 },
    );
    await this.mangaWorker.connect();
  }

  async connect() {
    const database = new Sequelize(defaultSqliteSettings);

    await database.authenticate();
    await database.sync();

    await database.close();
  }

  start() {
    this.discussionWorker.start();
    this.mangaWorker.start();

    this.running = true;
  }

  stop() {
    this.discussionWorker.stop();
    this.mangaWorker.stop();

    this.running = false;
  }
}
