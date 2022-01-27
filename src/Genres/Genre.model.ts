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

@Table
export default class Genre extends Model<Genre> {
  @Unique
  @PrimaryKey
  @Column
  id!: GenreT;

  @BelongsToMany(() => Manga, () => GenreLink)
  manga!: Manga[];
}
