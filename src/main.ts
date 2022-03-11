import 'dotenv/config';

import { spawn, Worker } from 'threads';
import clientController, { ENV } from './utils/ClientController';
import { controller, workerENV } from './workerTree/workerTypes';

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
    const worker = await spawn<controller>(
      new Worker('./workerTree/backgroundWorkerController', {
        workerData: {
          client: JSON.stringify(client.defaults.jar?.toJSON?.()),
          safemode,
          verbose,
        } as workerENV,
      }),
    );

    worker.start();
    process.on('beforeExit', () => worker.stop());
  }
}

main();
