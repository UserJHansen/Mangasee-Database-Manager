import 'dotenv/config';
import { threadedClass } from 'threadedclass';

import clientController, { ENV } from './utils/ClientController';
import { backgroundController } from './workerTree/backgroundWorkerController';

async function main() {
  const safemode = process.env.SAFE?.toLocaleLowerCase() !== 'false',
    verbose = process.env.VERBOSE?.toLocaleLowerCase() === 'true';

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
    const worker = await threadedClass<
      backgroundController,
      typeof backgroundController
    >(
      './workerTree/backgroundWorkerController',
      'backgroundController',
      [JSON.stringify(client.defaults.jar?.toJSON?.()), safemode, verbose],
      { freezeLimit: 1000000 },
    );

    console.log('Spawning Workers.');
    await worker.spawnWorkers();
    console.log('Workers spawned.');
    await worker.start();
    process.on('beforeExit', () => worker.stop());
  }
}

main();
