import 'dotenv/config';
import { Sequelize } from 'sequelize-typescript';
import { threadedClass } from 'threadedclass';
import { CookieJar } from 'tough-cookie';

import clientController, { ENV } from './utils/ClientController';
import { defaultSqliteSettings } from './utils/defaultSettings';
import { discussionController } from './workers/discussionsWorker';
import { mangaController } from './workers/mangaWorker';

async function main() {
  const safemode = process.env.SAFE?.toLocaleLowerCase() !== 'false',
    verbose = process.env.VERBOSE?.toLocaleLowerCase() === 'true';

  if (safemode) {
    console.error(
      "The new version of the scraper will make changes to your account, safe mode cannot be used. If you're sure you want to continue, set the SAFE environment variable to false.",
    );
    process.exit(1);
  }

  if (
    typeof process.env.MANGASEE_USERNAME !== 'string' ||
    typeof process.env.MANGASEE_PASSWORD !== 'string'
  ) {
    console.error(
      'Please set MANGASEE_USERNAME and MANGASEE_PASSWORD in your .env file.',
    );
    return;
  }

  const [success, client] = await clientController.generateClient(
    process.env as ENV,
  );

  if (success) {
    const subscriptions = (
        (await client.get('/user/subscription.get.php')).data.val as {
          IndexName: string;
        }[]
      ).map((m) => m.IndexName), // There is more but this is all we need
      allManga = (
        (await client.get('/_search.php')).data as {
          i: string;
        }[]
      ).map((m) => m.i), // again, there is more
      totalManga = allManga.length;

    let numberSubscribed = subscriptions.length;

    if (numberSubscribed < totalManga) {
      console.log(
        '[INFO] Subscribing to all manga... This will only happen once and will take a while',
        numberSubscribed + '/' + totalManga,
      );
      const toSubscribe = allManga.filter(
        (manga) => !subscriptions.includes(manga),
      );

      for (const manga of toSubscribe) {
        try {
          const res = await client.post('/manga/subscribe.php', {
            IndexName: manga,
          });
          if (res.data.success) {
            console.log(
              '[INFO] Subscribed to',
              manga,
              ++numberSubscribed + '/' + totalManga,
            );
          } else {
            console.error('[ERROR] Failed to subscribe to', manga, res.data);
          }
        } catch (e) {
          console.error('[ERROR] Failed to subscribe to', manga, e);
        }
      }
    }

    console.log(
      'Creating database connection and starting scraper. This may take a while...',
    );
    const db = new Sequelize(defaultSqliteSettings);

    db.authenticate()
      .then(() => db.sync())
      .then(() => db.close());

    console.log('[MAIN] Spawning Workers.');
    const discussionWorker = await threadedClass<
      discussionController,
      typeof discussionController
    >(
      './workers/discussionsWorker',
      'discussionController',
      [
        (client.defaults.jar as CookieJar).toJSON(),
        verbose,
        15 * 60 * 1000, // 15 minutes
      ],
      { freezeLimit: 1000000 },
    );
    await discussionWorker.connect();

    const mangaWorker = await threadedClass<
      mangaController,
      typeof mangaController
    >(
      './workers/mangaWorker',
      'mangaController',
      [
        (client.defaults.jar as CookieJar).toJSON(),
        verbose,
        5 * 60 * 1000, // 5 minutes
      ],
      { freezeLimit: 1000000 },
    );
    await mangaWorker.connect();

    console.log('[MAIN] Workers spawned.');
    await discussionWorker.start();
    await mangaWorker.start();
    process.on('beforeExit', async () => {
      await discussionWorker.stop();
      await mangaWorker.stop();
    });
  }
}

main();
