import {
  BeforeCreate,
  BeforeUpdate,
  Column,
  CreatedAt,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  Unique,
} from 'sequelize-typescript';
// import LoggingModel from '../Logging/Log.model';
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
  // async updateWithLog(newchapter: Chapter, verbose = false) {
  //   const chapter = await ChapterModel.findByPk(
  //     newchapter.mangaName + '-' + newchapter.chapter,
  //   );

  //   if (chapter !== null) {
  //     if (
  //       parseInt(chap.Page || '0') !==
  //       (await PageModel.count({
  //         where: {
  //           chapter: newchapter.mangaName + '-' + newchapter.chapter,
  //           mangaName: newchapter.mangaName,
  //         },
  //       }))
  //     ) {
  //       await LoggingModel.create({
  //         type: 'Page Count Update',
  //         value: chap.Page || '0',
  //         previousValue: (
  //           await PageModel.count({
  //             where: {
  //               chapter: newchapter.mangaName + '-' + newchapter.chapter,
  //               mangaName: newchapter.mangaName,
  //             },
  //           })
  //         ).toString(),
  //         targetID: `${data.i}-${newchapter.chapter}`,
  //       });
  //     }

  //     if (
  //       chapter.type !== newchapter.type ||
  //       chapter.directory !== newchapter.directory ||
  //       chapter.chapterName !== newchapter.chapterName ||
  //       chapter.releaseDate.toLocaleString() !==
  //         newchapter.releaseDate.toLocaleString()
  //     ) {
  //       await LoggingModel.create({
  //         type: 'Unexpected Event',
  //         value: JSON.stringify(newchapter),
  //         previousValue: JSON.stringify(chapter),
  //         targetID: newchapter.chapter.toString(),
  //       });
  //     }
  //   } else {
  //     await ChapterModel.create(newchapter);
  //     if (!verbose)
  //       await LoggingModel.create({
  //         type: 'New Chapter',
  //         value: JSON.stringify(newchapter),
  //         targetID: data.i,
  //       });

  //     for (
  //       let index =
  //           (await PageModel.count({
  //             where: {
  //               chapter: newchapter.mangaName + '-' + newchapter.chapter,
  //               mangaName: newchapter.mangaName,
  //             },
  //           })) + 1,
  //         l = parseInt(chap.Page || '0');
  //       index - 1 < l;
  //       index++
  //     ) {
  //       await PageModel.create({
  //         chapter: newchapter.mangaName + '-' + newchapter.chapter,
  //         mangaName: newchapter.mangaName,
  //         pageNum: index,
  //         isBookmarked: bookmarked.some(
  //           (bookmark) =>
  //             bookmark.Page === index.toString() &&
  //             bookmark.Chapter === chap.Chapter &&
  //             bookmark.IndexName === data.i,
  //         ),
  //       });
  //     }
  //   }
  // }

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
