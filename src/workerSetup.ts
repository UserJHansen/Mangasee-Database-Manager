import 'dotenv/config';

import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import { Sequelize } from 'sequelize-typescript';
import { expose } from 'threads/worker';

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
import LoggingModel from './Logging/Log.model';
import AlternateTitleModel from './Mangas/AlternateTitle.model';
import MangaComment from './Mangas/Comments/Comment.model';
import MangaReply from './Mangas/Replies/Reply.model';
import { RawBookmarkT, RawMangaT } from './types';
import fillIndividual from './Mangas/fillIndividual';

export type runInWorker = (
  manga: RawMangaT,
  quietCreate: boolean,
  safemode: boolean,
  verbose: boolean,
  bookmarked: RawBookmarkT[],
  json: string,
) => Promise<void>;

(async () => {
  const database = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: console.log,
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

  const client = wrapper(
    axios.create({
      withCredentials: true,
      baseURL: 'https://mangasee123.com/',
      timeout: 5000,
    }),
  );

  expose(((manga, quietCreate, safemode, verbose, bookmarked, json) => {
    const jar = CookieJar.deserializeSync(json);
    client.defaults.jar = jar;

    return fillIndividual(
      manga,
      quietCreate,
      safemode,
      verbose,
      bookmarked,
      client,
    );
  }) as runInWorker);
})();
