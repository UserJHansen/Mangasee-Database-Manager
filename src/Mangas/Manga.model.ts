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

import Genre from '../Genres/Genre.model';
import GenreLink from '../Genres/GenreLink.model';

import { MangaStatusT, MangaTypeT } from '../types.d';

export type Manga = {
  title: string;
  type: MangaTypeT;
  releaseDate: Date;
  scanStatus: MangaStatusT;
  lastReadID: number;
  isSubscribed: boolean;
};
@Table
export default class MangaModel extends Model<Manga> implements Manga {
  @Unique
  @PrimaryKey
  @Column
  title!: string;

  @Column
  fullTitle!: string;

  @HasMany(() => AlternateTitle)
  @BelongsToMany(() => Author, () => AuthorLink)
  authors!: Author[];

  @BelongsToMany(() => Genre, () => GenreLink)
  genres!: Genre[];

  @Column
  type!: MangaTypeT;

  @CreatedAt
  @Column
  releaseDate!: Date;

  @Column
  scanStatus!: MangaStatusT;

  @HasMany(() => Chapter)
  chapters!: Chapter[];

  @ForeignKey(() => Chapter)
  @Column
  lastReadID!: number;

  @HasOne(() => Chapter)
  lastReadChapter!: Chapter;

  @Column
  isSubscribed!: boolean;
}
