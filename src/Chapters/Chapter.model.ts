import {
  Column,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  Unique,
} from 'sequelize-typescript';
import Manga from '../Mangas/Manga.model';

import Page from '../Pages/Page.model';

@Table
export default class Chapter extends Model<Chapter> {
  @Unique
  @PrimaryKey
  @Column
  id!: number;

  @ForeignKey(() => Manga)
  @Column
  mangaName!: string;

  @HasMany(() => Page)
  pages!: Page[];
}
