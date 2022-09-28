import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import { defaultClientSettings } from './defaultSettings';

export type ENV = { MANGASEE_USERNAME: string; MANGASEE_PASSWORD: string };

export default class ClientController {
  static async generateClient(env: ENV): Promise<[boolean, AxiosInstance]> {
    const jar = new CookieJar();
    const client = wrapper(axios.create({ ...defaultClientSettings, jar }));

    let loginRes:
      | AxiosResponse
      | { data: { success: false; val: 'Connection Timed out' } } = {
      data: { success: false, val: 'Connection Timed out' },
    };
    try {
      loginRes = await client.post('/auth/login.php', {
        EmailAddress: env.MANGASEE_USERNAME,
        Password: env.MANGASEE_PASSWORD,
      });
    } catch (e) {
      console.error(e);
    }

    console.log(
      `[MAIN] Login ${loginRes.data.success ? 'succeeded' : 'failed'}${
        !loginRes.data.success ? ` with message: ${loginRes.data.val}` : ''
      }`,
    );

    return [loginRes.data.success, client];
  }

  static parseClient(jar: string | CookieJar.Serialized) {
    return wrapper(
      axios.create({
        ...defaultClientSettings,
        jar: CookieJar.deserializeSync(jar),
      }),
    );
  }
}
