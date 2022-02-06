import {
  BelongsToMany,
  Column,
  Model,
  PrimaryKey,
  Table,
  Unique,
} from 'sequelize-typescript';

import Manga from '../Mangas/Manga.model';
import { GenreT } from '../types.d';
import GenreLink from './GenreLink.model';

export type Genre = {
  genre: GenreT;
};

@Table
export default class GenreModel extends Model<Genre> implements Genre {
  @Unique
  @PrimaryKey
  @Column
  genre!: GenreT;

  @BelongsToMany(() => Manga, () => GenreLink)
  manga!: Manga[];
}
