import {
  BelongsToMany,
  Column,
  ForeignKey,
  HasMany,
  HasOne,
  Model,
  PrimaryKey,
  Table,
  Unique,
} from 'sequelize-typescript';

import Author from '../Authors/Author.model';
import AuthorLink from '../Authors/AuthorLink.model';

import Chapter from '../Chapters/Chapter.model';

import MangaComment, { CommentTree } from './Comments/Comment.model';

import Genre from '../Genres/Genre.model';
import GenreLink from '../Genres/GenreLink.model';

import { MangaStatusT, MangaTypeT } from '../../utils/types';
import AlternateTitle from './AlternateTitle.model';
import LoggingModel from '../Logging/Log.model';
import AuthorModel from '../Authors/Author.model';
import GenreModel from '../Genres/Genre.model';
import ChapterModel from '../Chapters/Chapter.model';

export type Manga = {
  title: string;
  fullTitle: string;
  type: MangaTypeT;
  releaseYear: number;
  scanStatus: MangaStatusT;
  publishStatus: MangaStatusT;
  lastReadID: string;
  isSubscribed: boolean;
  numSubscribed: number;
  shouldNotify: boolean;
};

export type MangaTree = Manga & {
  authors: Author[];
  genres: Genre[];
  chapters: Chapter[];
  comments: CommentTree[];
  alternateTitles: AlternateTitle[];
};

@Table
export default class MangaModel extends Model<Manga> implements Manga {
  @Unique
  @PrimaryKey
  @Column
  title!: string;

  @Unique
  @Column
  fullTitle!: string;

  @HasMany(() => AlternateTitle)
  alternateTitles!: AlternateTitle[];

  @BelongsToMany(() => Author, () => AuthorLink)
  authors!: (Author & { AuthorLink: AuthorLink })[];

  @BelongsToMany(() => Genre, () => GenreLink)
  genres!: (Genre & { GenreLink: GenreLink })[];

  @Column
  type!: MangaTypeT;

  @Column
  releaseYear!: number;

  @Column
  scanStatus!: MangaStatusT;

  @Column
  publishStatus!: MangaStatusT;

  @HasMany(() => Chapter)
  chapters!: Chapter[];

  @ForeignKey(() => Chapter)
  @Column
  lastReadID!: string;

  @HasOne(() => Chapter)
  lastReadChapter!: Chapter;

  @HasMany(() => MangaComment)
  comments!: MangaComment[];

  @Column
  isSubscribed!: boolean;

  @Column
  numSubscribed!: number;

  @Column
  shouldNotify!: boolean;

  static async updateWithLog(newManga: MangaTree, verbose = false) {
    if (verbose) console.log('Filling ' + newManga.title);

    const { title } = newManga,
      oldManga = await MangaModel.findByPk(newManga.title);
    if (oldManga === null) {
      if (verbose) {
        console.log('New Manga: ' + title);

        await LoggingModel.create({
          type: 'New Manga',
          value: JSON.stringify(newManga),
          targetID: title,
        });
      }
      await MangaModel.create(newManga);
    } else {
      if (oldManga.lastReadID !== newManga.lastReadID) {
        await LoggingModel.create({
          type: 'Last Read Update',
          value: newManga.lastReadID.toString(),
          previousValue: oldManga.lastReadID.toString(),
          targetID: title,
        });
        await oldManga.update({ lastReadID: newManga.lastReadID });
      }

      if (oldManga.scanStatus !== newManga.scanStatus) {
        await LoggingModel.create({
          type: 'Scan Status Changed',
          value: newManga.scanStatus,
          previousValue: oldManga.scanStatus,
          targetID: title,
        });
        await oldManga.update({ scanStatus: newManga.scanStatus });
      }

      if (oldManga.publishStatus !== newManga.publishStatus) {
        await LoggingModel.create({
          type: 'Publish Status Changed',
          value: newManga.publishStatus,
          previousValue: oldManga.publishStatus,
          targetID: title,
        });
        await oldManga.update({ publishStatus: newManga.publishStatus });
      }

      if (oldManga.isSubscribed !== newManga.isSubscribed) {
        await LoggingModel.create({
          type: 'Subscription Update',
          value: newManga.isSubscribed.toString(),
          previousValue: oldManga.isSubscribed.toString(),
          targetID: title,
        });
        await oldManga.update({ isSubscribed: newManga.isSubscribed });
      }

      if (oldManga.numSubscribed !== newManga.numSubscribed) {
        const logged = await LoggingModel.findOne({
          where: { targetID: title, type: 'Subscription Number Update' },
        });
        if (logged)
          await logged.update({
            value: newManga.numSubscribed.toString(),
          });
        else
          await LoggingModel.create({
            type: 'Subscription Number Update',
            value: newManga.numSubscribed.toString(),
            previousValue: oldManga.numSubscribed.toString(),
            targetID: title,
          });
        await oldManga.update({ numSubscribed: newManga.numSubscribed });
      }

      if (oldManga.shouldNotify !== newManga.shouldNotify) {
        await LoggingModel.create({
          type: 'Notification Pref Update',
          value: newManga.shouldNotify.toString(),
          previousValue: oldManga.shouldNotify.toString(),
          targetID: title,
        });
        await oldManga.update({ shouldNotify: newManga.shouldNotify });
      }

      if (
        oldManga.type !== newManga.type ||
        oldManga.releaseYear !== newManga.releaseYear
      ) {
        await LoggingModel.create({
          type: 'Unexpected Event',
          value: JSON.stringify(newManga),
          previousValue: JSON.stringify(oldManga),
          targetID: title,
        });
        await oldManga.update(newManga);
      }
    }

    for (const author of newManga.authors) {
      await AuthorModel.updateWithLog(
        { name: author.name, manga: title },
        verbose,
      );
    }

    for (const genre of newManga.genres) {
      await GenreModel.updateWithLog(
        { genre: genre.genre, manga: title },
        verbose,
      );
    }

    for (const chapter of newManga.chapters) {
      await ChapterModel.updateWithLog(chapter, verbose);
    }

    for (const comment of newManga.comments) {
      await MangaComment.updateWithLog(comment, verbose);
    }

    for (const altTitle of newManga.alternateTitles) {
      await AlternateTitle.updateWithLog(altTitle, verbose);
    }

    if (verbose) console.log('Done with ' + title);
  }
}
