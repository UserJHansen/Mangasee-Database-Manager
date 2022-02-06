import {
  BeforeCreate,
  BeforeUpdate,
  Column,
  CreatedAt,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import Manga from '../Mangas/Manga.model';

import Page from '../Pages/Page.model';

export type Chapter = {
  chapter: number;
  type: string;
  directory: string;
  chapterName: string;
  mangaName: string;
  isBookmarked: boolean;
  releaseDate: Date;
};

@Table
export default class ChapterModel extends Model<Chapter> implements Chapter {
  @PrimaryKey
  @Unique
  @Column
  indexName!: string;

  @BeforeUpdate
  @BeforeCreate
  static updateIndexName(instance: ChapterModel) {
    instance.indexName = `${instance.mangaName}-${instance.chapter}`;
  }

  @Column
  chapter!: number;

  @Column
  type!: string;

  @Column
  directory!: string;

  @Column
  chapterName!: string;

  @ForeignKey(() => Manga)
  @Column
  mangaName!: string;

  @Column
  isBookmarked!: boolean;

  @HasMany(() => Page)
  pages!: Page[];

  @CreatedAt
  @Column
  releaseDate!: Date;
}
