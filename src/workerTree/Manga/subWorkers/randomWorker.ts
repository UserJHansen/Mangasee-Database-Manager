import { CookieJar } from 'tough-cookie';
import subWorker from '../../subWorker';

export class randomWorker extends subWorker {
  array: SharedArrayBuffer;

  constructor(
    jar: CookieJar.Serialized,
    safe: boolean,
    verbose: boolean,
    array: SharedArrayBuffer,
  ) {
    super(jar, safe, verbose);
    this.array = array;
  }

  async start() {
    await super.start();

    while (this.running) {}
  }
}
