import {
  BelongsTo,
  Column,
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
  @Column
  id!: number;

  @BelongsTo(() => Chapter)
  @Column
  chapter!: string;

  @BelongsTo(() => MangaModel)
  @Column
  mangaName!: string;

  @Column
  isBookmarked!: boolean;
}
