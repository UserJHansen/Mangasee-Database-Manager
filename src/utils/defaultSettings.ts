import Author from '../Models/Authors/Author.model';
import AuthorLink from '../Models/Authors/AuthorLink.model';
import Chapter from '../Models/Chapters/Chapter.model';
import DiscussionComment from '../Models/Discussions/Comments/Comment.model';
import Discussion from '../Models/Discussions/Discussion.model';
import DiscussionReply from '../Models/Discussions/Replies/Reply.model';
import Genre from '../Models/Genres/Genre.model';
import GenreLink from '../Models/Genres/GenreLink.model';
import Manga from '../Models/Mangas/Manga.model';
import Page from '../Models/Pages/Page.model';
import User from '../Models/Users/User.model';
import LoggingModel from '../Models/Logging/Log.model';
import AlternateTitleModel from '../Models/Mangas/AlternateTitle.model';
import MangaComment from '../Models/Mangas/Comments/Comment.model';
import MangaReply from '../Models/Mangas/Replies/Reply.model';
import { SequelizeOptions } from 'sequelize-typescript';
import { AxiosRequestConfig } from 'axios';

export const defaultSqliteSettings: SequelizeOptions = {
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
};

export const defaultClientSettings: AxiosRequestConfig = {
  withCredentials: true,
  baseURL: 'https://mangasee123.com/',
  timeout: 2000,
};
