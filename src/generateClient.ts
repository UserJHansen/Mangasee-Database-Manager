import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';

export type ENV = { MANGASEE_USERNAME: string; MANGASEE_PASSWORD: string };
export default async function generateClient(
  env: ENV,
): Promise<[boolean, AxiosInstance]> {
  const jar = new CookieJar();
  const client = wrapper(
    axios.create({
      jar,
      withCredentials: true,
      baseURL: 'https://mangasee123.com/',
      timeout: 5000,
    }),
  );

  let loginRes:
    | AxiosResponse
    | { data: { success: false; val: 'Connection Timed out' } } = {
    data: { success: false, val: 'Connection Timed out' },
  };
  try {
    loginRes = await client.post('https://mangasee123.com/auth/login.php', {
      EmailAddress: env.MANGASEE_USERNAME,
      Password: env.MANGASEE_PASSWORD,
    });
  } catch (e) {
    console.error(e);
  }

  console.log(
    `Login ${loginRes.data.success ? 'succeeded' : 'failed'}${
      !loginRes.data.success ? ` with message: ${loginRes.data.val}` : ''
    }`,
  );

  return [loginRes.data.success, client];
}
