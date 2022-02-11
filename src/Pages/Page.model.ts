import {
  BeforeCreate,
  BeforeUpdate,
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
  chapter: string;
  mangaName: string;
  isBookmarked: boolean;
  pageNum: number;
};

@Table
export default class PageModel extends Model<Page> implements Page {
  @PrimaryKey
  @Unique
  @AutoIncrement
  @Column
  indexableID!: string;

  @BeforeCreate
  @BeforeUpdate
  static updateIndexableID(instance: PageModel) {
    instance.indexableID = `${instance.mangaName}-${instance.chapter}-${instance.pageNum}`;
  }

  @ForeignKey(() => Chapter)
  @Column
  chapter!: string;

  @ForeignKey(() => MangaModel)
  @Column
  mangaName!: string;

  @Column
  pageNum!: number;

  @Column
  isBookmarked!: boolean;
}
