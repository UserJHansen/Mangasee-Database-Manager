import 'dotenv/config';

import axios from 'axios';
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

export async function MAIN() {
  const database = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
    models: [
      Author,
      AuthorLink,
      GenreLink,
      Chapter,
      DiscussionComment,
      DiscussionReply,
      Discussion,
      Genre,
      Manga,
      Page,
      User,
    ],
  });
  try {
    await database.authenticate();
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
  database.sync();
  // const user = new User({ id: 1, username: 'admin' });
  // user.save();
  // // const discussion = new Discussion({
  // //   id: 168,
  // //   userID: 1,
  // //   title: 'test',
  // //   type: 'Request',
  // //   timestamp: new Date(),
  // //   shouldNotify: true,
  // // });
  // discussion.save();

  const jar = new CookieJar();
  const client = wrapper(
    axios.create({
      jar,
      withCredentials: true,
      baseURL: 'https://mangasee123.com/',
    }),
  );

  await client.post('https://mangasee123.com/auth/login.php', {
    EmailAddress: process.env.MANGASEE_USERNAME,
    Password: process.env.MANGASEE_PASSWORD,
  });

  fillDiscussions(client);
}

MAIN();
