import {
  AutoIncrement,
  Column,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  Unique,
} from 'sequelize-typescript';
import Chapter from '../Chapters/Chapter.model';
import MangaModel from '../Mangas/Manga.model';

export type Page = {
  id: number;
  chapter: string;
  mangaName: string;
  isBookmarked: boolean;
};

@Table
export default class PageModel extends Model<Page> implements Page {
  @PrimaryKey
  @Unique
  @AutoIncrement
  @Column
  id!: number;

  @ForeignKey(() => Chapter)
  @Column
  chapter!: string;

  @ForeignKey(() => MangaModel)
  @Column
  mangaName!: string;

  @Column
  isBookmarked!: boolean;
}
