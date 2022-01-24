import {
  BelongsToMany,
  Column,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  Unique,
} from 'sequelize-typescript';
import Manga from '../Mangas/Manga.model';

import Page from '../Pages/Page.model';
import PageLink from '../Pages/PageLink.model';

@Table
export default class Chapter extends Model<Chapter> {
  @Unique
  @PrimaryKey
  @Column
  id!: number;

  @ForeignKey(() => Manga)
  @Column
  mangaName!: string;

  @BelongsToMany(() => Page, () => PageLink)
  pages!: Page[];
}
