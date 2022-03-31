import 'dotenv/config';

import { Sequelize } from 'sequelize-typescript';

import { ThreadedClass, threadedClass } from 'threadedclass';
import { discussionController } from './Discussions/discussionsWorker';
import { mangaController } from './Manga/mangaWorker';
import { MangaSplitT } from '../utils/types';
import { defaultSqliteSettings } from '../utils/defaultSettings';
import { CookieJar } from 'tough-cookie';
import subWorker from './subWorker';

export class backgroundController extends subWorker {
  discussionWorker: ThreadedClass<discussionController>;
  mangaWorker: ThreadedClass<mangaController>;

  async spawnWorkers(mangaSplit: MangaSplitT) {
    this.discussionWorker = await threadedClass<
      discussionController,
      typeof discussionController
    >(
      './Discussions/discussionsWorker',
      'discussionController',
      [(this.client.defaults.jar as CookieJar).toJSON(), this.verbose, 300000],
      { freezeLimit: 1000000 },
    );
    await this.discussionWorker.connect();

    this.mangaWorker = await threadedClass<
      mangaController,
      typeof mangaController
    >(
      './Manga/mangaWorker',
      'mangaController',
      [
        (this.client.defaults.jar as CookieJar).toJSON(),
        mangaSplit,
        this.safeMode,
        this.verbose,
      ],
      { freezeLimit: 1000000 },
    );
    await this.mangaWorker.connect();

    await this.mangaWorker.startWorkers();
  }

  async connect() {
    const database = new Sequelize(defaultSqliteSettings);

    await database.authenticate();
    await database.sync();

    await database.close();
  }

  async start() {
    await super.start();

    this.discussionWorker.start();
    this.mangaWorker.start();
  }

  async stop() {
    await super.stop();

    this.discussionWorker.stop();
    this.mangaWorker.stop();
  }
}
