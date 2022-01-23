import {
  BelongsToMany,
  Column,
  CreatedAt,
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

import MangaComment from './Comments/Comment.model';

import Genre from '../Genres/Genre.model';
import GenreLink from '../Genres/GenreLink.model';

import { MangaStatusT, MangaTypeT } from '../types.d';
import AlternateTitle from './AlternateTitle.model';

export type Manga = {
  title: string;
  fullTitle: string;
  type: MangaTypeT;
  releaseYear: number;
  scanStatus: MangaStatusT;
  publishStatus: MangaStatusT;
  lastReadID: number;
  isSubscribed: boolean;
  numSubscribed: number;
  shouldNotify: boolean;
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
  authors!: Author[];

  @BelongsToMany(() => Genre, () => GenreLink)
  genres!: Genre[];

  @Column
  type!: MangaTypeT;

  @CreatedAt
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
  lastReadID!: number;

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
}
