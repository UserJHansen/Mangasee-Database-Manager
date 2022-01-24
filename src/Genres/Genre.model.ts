import {
  Column,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  Unique,
} from 'sequelize-typescript';

import Manga from '../Mangas/Manga.model';
import { GenreT } from '../types';

@Table
export default class Genre extends Model<Genre> {
  @Unique
  @PrimaryKey
  @Column
  id!: GenreT;

  @HasMany(() => Manga)
  manga!: Manga[];
}
