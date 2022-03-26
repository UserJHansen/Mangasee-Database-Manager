import {
  BeforeCreate,
  BeforeUpdate,
  Column,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  Unique,
} from 'sequelize-typescript';
import LoggingModel from '../Logging/Log.model';
import Manga from '../Mangas/Manga.model';
import PageModel from '../Pages/Page.model';

import { Page } from '../Pages/Page.model';

export type Chapter = {
  chapter: number;
  type: string;
  directory: string;
  chapterName: string;
  mangaName: string;
  isBookmarked: boolean;
  releaseDate: Date;
};
export type ChapterTree = Chapter & { pages: Page[] };

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

  @HasMany(() => PageModel)
  pages!: Page[];

  @Column
  releaseDate!: Date;

  static async updateWithLog(newChapter: ChapterTree, verbose = false) {
    const title = newChapter.mangaName,
      oldChapter = await ChapterModel.findByPk(
        newChapter.mangaName + '-' + newChapter.chapter,
      );

    if (oldChapter === null) {
      await ChapterModel.create(newChapter);
      if (verbose) {
        await LoggingModel.create({
          type: 'New Chapter',
          value: JSON.stringify(newChapter),
          targetID: title,
        });
        console.log('New Chapter: ' + title);
      }
    } else {
      if (
        (await PageModel.count({
          where: {
            chapter: newChapter.mangaName + '-' + newChapter.chapter,
            mangaName: newChapter.mangaName,
          },
        })) !== newChapter.pages.length
      ) {
        await LoggingModel.create({
          type: 'Page Count Update',
          value: newChapter.pages.length.toString(),
          previousValue: (
            await PageModel.count({
              where: {
                chapter: newChapter.mangaName + '-' + newChapter.chapter,
                mangaName: newChapter.mangaName,
              },
            })
          ).toString(),
          targetID: `${title}-${newChapter.chapter}`,
        });
      }

      if (
        oldChapter.type !== newChapter.type ||
        oldChapter.directory !== newChapter.directory ||
        oldChapter.chapterName !== newChapter.chapterName ||
        oldChapter.releaseDate.toLocaleString() !==
          newChapter.releaseDate.toLocaleString()
      ) {
        await LoggingModel.create({
          type: 'Unexpected Event',
          value: JSON.stringify(newChapter),
          previousValue: JSON.stringify(oldChapter),
          targetID: newChapter.chapter.toString(),
        });
        await oldChapter.update({
          type: newChapter.type,
          directory: newChapter.directory,
          chapterName: newChapter.chapterName,
          releaseDate: newChapter.releaseDate,
        });
      }
    }

    for (const page of newChapter.pages) {
      await PageModel.updateWithLog(page, verbose);
    }
  }
}
