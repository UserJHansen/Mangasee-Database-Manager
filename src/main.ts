import 'dotenv/config';
import { Sequelize } from 'sequelize-typescript';
// import fillDiscussions from './workerTree/Discussions/discussionsWorker';
import fillManga from './fillMangas';
import clientController, { ENV } from './utils/ClientController';
import { defaultSqliteSettings } from './utils/defaultSettings';

async function main() {
  const safemode = process.env.SAFE?.toLocaleLowerCase() !== 'false',
    verbose = process.env.VERBOSE?.toLocaleLowerCase() === 'true';

  const database = new Sequelize(defaultSqliteSettings);
  try {
    await database.authenticate();
    verbose && console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
  database.sync();

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
    console.log('Filling Manga');
    await fillManga(client, safemode, verbose);
    console.log('Filled Manga');

    console.log('Filling Discussions');
    // await fillDiscussions(client);
    console.log('Filled Discussions');
  }
}

main();
