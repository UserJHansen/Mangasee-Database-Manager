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

  static async updateWithLog(newPage: Page, verbose = false) {
    const page = await PageModel.findOne({
      where: {
        mangaName: newPage.mangaName,
        chapter: newPage.chapter,
        pageNum: newPage.pageNum,
      },
    });

    if (page) {
      if (page.isBookmarked !== newPage.isBookmarked) {
        page.update({ isBookmarked: newPage.isBookmarked });
        if (verbose) console.log(`Updated page ${page.indexableID}`);
      }
    } else {
      await PageModel.create(newPage);
      if (verbose)
        console.log(
          `Created page ${newPage.mangaName}-${newPage.chapter}-${newPage.pageNum}`,
        );
    }
  }
}
