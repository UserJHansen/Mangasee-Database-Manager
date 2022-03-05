import 'dotenv/config';
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
import LoggingModel from './Logging/Log.model';
import AlternateTitleModel from './Mangas/AlternateTitle.model';
import MangaComment from './Mangas/Comments/Comment.model';
import MangaReply from './Mangas/Replies/Reply.model';
import fillDiscussions from './Discussions/fill';
import fillManga from './Mangas/fill';
import generateClient, { ENV } from './generateClient';

async function main() {
  const safemode = process.env.SAFE?.toLocaleLowerCase() !== 'false',
    verbose = process.env.VERBOSE?.toLocaleLowerCase() === 'true';

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

  const [success, client] = await generateClient(process.env as ENV);

  if (success) {
    console.log('Filling Manga');
    await fillManga(client, safemode, verbose);
    console.log('Filled Manga');

    console.log('Filling Discussions');
    await fillDiscussions(client);
    console.log('Filled Discussions');
  }
}

main();
