import 'dotenv/config';

import axios, { AxiosResponse } from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import { Sequelize } from 'sequelize-typescript';

import Author from './Authors/Author.model';
import AuthorLink from './Authors/AuthorLink.model';
import Chapter from './Chapters/Chapter.model';
import DiscussionComment from './Discussions/Comments/Comment.model';
import Discussion from './Discussions/Discussion.model';
import DiscussionReply from './Discussions/Replies/Reply.model';
import Genre from './Genres/Genre.model';
import GenreLink from './Genres/GenreLink.model';
import Manga from './Mangas/Manga.model';
import Page from './Pages/Page.model';
import User from './Users/User.model';
import fillDiscussions from './Discussions/fill';
import LoggingModel from './Logging/Log.model';
import AlternateTitleModel from './Mangas/AlternateTitle.model';
import MangaComment from './Mangas/Comments/Comment.model';
import MangaReply from './Mangas/Replies/Reply.model';
import fillManga from './Mangas/fill';

export async function MAIN(safemode: boolean) {
  const database = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: false,
    models: [
      Author,
      AlternateTitleModel,
      AuthorLink,
      GenreLink,
      Chapter,
      DiscussionComment,
      DiscussionReply,
      Discussion,
      Genre,
      Manga,
      MangaComment,
      MangaReply,
      Page,
      User,
      LoggingModel,
    ],
  });
  try {
    await database.authenticate();
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
  database.sync();

  const jar = new CookieJar();
  const client = wrapper(
    axios.create({
      jar,
      withCredentials: true,
      baseURL: 'https://mangasee123.com/',
    }),
  );

  let loginRes:
    | AxiosResponse
    | { data: { success: false; val: 'Connection Timed out' } } = {
    data: { success: false, val: 'Connection Timed out' },
  };
  try {
    loginRes = await client.post('https://mangasee123.com/auth/login.php', {
      EmailAddress: process.env.MANGASEE_USERNAME,
      Password: process.env.MANGASEE_PASSWORD,
    });
  } catch (e) {
    console.error(e);
  }
  console.log(
    `Login ${loginRes.data.success ? 'succeeded' : 'failed'}${
      !loginRes.data.success ? ` with message: ${loginRes.data.val}` : ''
    }`,
  );
  if (!loginRes.data.success) return false;

  console.log('Filling Manga');
  await fillManga(client, safemode);
  console.log('Filled Manga');

  console.log('Filling Discussions');
  await fillDiscussions(client);
  console.log('Filled Discussions');

  return true;
}

MAIN(process.env.SAFE?.toLocaleLowerCase() !== 'false');
