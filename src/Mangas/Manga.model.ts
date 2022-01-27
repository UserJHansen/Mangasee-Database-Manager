import {
  BelongsToMany,
  Column,
  CreatedAt,
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

@Table
export default class Manga extends Model<Manga> {
  @Unique
  @PrimaryKey
  @Column
  title!: string;

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

  @HasOne(() => Chapter)
  lastReadChapter!: Chapter;

  @Column
  isSubscribed!: boolean;
}
