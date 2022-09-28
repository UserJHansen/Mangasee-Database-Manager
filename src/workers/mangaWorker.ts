import { verbose } from 'sequelize-typescript';
import extractComments from '../extractComments';
import ChapterModel, { Chapter } from '../Models/Chapters/Chapter.model';
import LoggingModel from '../Models/Logging/Log.model';
import AlternateTitleModel from '../Models/Mangas/AlternateTitle.model';
import MangaModel, { Manga } from '../Models/Mangas/Manga.model';
import PageModel from '../Models/Pages/Page.model';
import AdjustedDate from '../utils/AdjustedDate';
import chapterURLEncode from '../utils/ChapterURLEncode';
import { FindVariable } from '../utils/getJsVar';
import { RawChapterT, RawSubscriptionT } from '../utils/types';
import subWorker from './subWorker';

export class mangaController extends subWorker {
  async process(data: RawSubscriptionT, lastRead: number | null) {
    this.verbose && console.log('Filling', data.IndexName);
    const rawHTML: string | null = null;

    const newManga: Manga = {
      title: data.IndexName,
      fullTitle: data.SeriesName,
      type: data.t,
      releaseYear: parseInt(data.y),
      scanStatus: data.ss,
      publishStatus: data.ps,
      lastReadID: hasRead ? data.i + '-' + lastChapterRead : '',
      isSubscribed: FindVariable('vm.Subbed', rawHTML) === 'true',
      numSubscribed: parseInt(FindVariable('vm.NumSubs', rawHTML)),
      shouldNotify: FindVariable('vm.Notification', rawHTML) === 'true',
    };

    const oldManga = await MangaModel.findByPk(data.i);
    if (oldManga !== null) {
      if (newManga.hasRead && !oldManga.hasRead) {
        await LoggingModel.create({
          type: 'Read Manga',
          value: newManga.title,
          targetID: newManga.title,
        });
        hasRead = true;
        await oldManga.update({ hasRead });
      }

      if (oldManga.scanStatus !== newManga.scanStatus) {
        await LoggingModel.create({
          type: 'Scan Status Changed',
          value: newManga.scanStatus,
          previousValue: oldManga.scanStatus,
          targetID: newManga.title,
        });
        await oldManga.update({ scanStatus: newManga.scanStatus });
      }
      if (oldManga.publishStatus !== newManga.publishStatus) {
        await LoggingModel.create({
          type: 'Publish Status Changed',
          value: newManga.publishStatus,
          previousValue: oldManga.publishStatus,
          targetID: newManga.title,
        });
        await oldManga.update({ publishStatus: newManga.publishStatus });
      }

      if (oldManga.lastReadID !== newManga.lastReadID) {
        await LoggingModel.create({
          type: 'Last Read Update',
          value: newManga.lastReadID.toString(),
          previousValue: oldManga.lastReadID.toString(),
          targetID: data.i,
        });
        await oldManga.update({ lastReadID: newManga.lastReadID });
      }

      if (oldManga.isSubscribed !== newManga.isSubscribed) {
        await LoggingModel.create({
          type: 'Subscription Update',
          value: newManga.isSubscribed.toString(),
          previousValue: oldManga.isSubscribed.toString(),
          targetID: data.i,
        });
        await oldManga.update({ isSubscribed: newManga.isSubscribed });
      }

      if (oldManga.numSubscribed !== newManga.numSubscribed) {
        await LoggingModel.create({
          type: 'Subscription Number Update',
          value: newManga.numSubscribed.toString(),
          previousValue: oldManga.numSubscribed.toString(),
          targetID: data.i,
        });
        await oldManga.update({ numSubscribed: newManga.numSubscribed });
      }

      if (oldManga.shouldNotify !== newManga.shouldNotify) {
        await LoggingModel.create({
          type: 'Notification Pref Update',
          value: newManga.shouldNotify.toString(),
          previousValue: oldManga.shouldNotify.toString(),
          targetID: data.i,
        });
        await oldManga.update({ shouldNotify: newManga.shouldNotify });
      }

      if (
        oldManga.type !== newManga.type ||
        oldManga.releaseYear !== newManga.releaseYear ||
        oldManga.shouldNotify !== newManga.shouldNotify
      ) {
        await LoggingModel.create({
          type: 'Unexpected Event',
          value: JSON.stringify(newManga),
          previousValue: JSON.stringify(oldManga),
          targetID: oldManga.title,
        });
      }
    } else {
      await MangaModel.create(newManga);
      if (!quietCreate) {
        await LoggingModel.create({
          type: 'New Manga',
          value: JSON.stringify(newManga),
          targetID: newManga.title,
        });
      }
    }

    let chapters: RawChapterT[] = JSON.parse(
      FindVariable('vm.Chapters', rawHTML),
    );

    try {
      let result = '';
      if (hasRead) {
        if (verbose)
          console.log(
            'get',
            `/read-online/${data.i}${chapterURLEncode(lastChapterRead)}`,
            'from chapter',
            lastChapterRead,
          );

        while (result === '') {
          try {
            result = (
              await client.get(
                `/read-online/${data.i}${chapterURLEncode(lastChapterRead)}`,
              )
            ).data;
          } catch (err) {
            console.log('failed to get chapters, retrying: ', err.message);
            await setTimeout(1000);
          }
        }
      }
      chapters = JSON.parse(
        hasRead
          ? FindVariable('vm.CHAPTERS', result)
          : FindVariable('vm.Chapters', rawHTML),
      );
    } catch (e) {
      hasRead = false;
      verbose && console.error(e);
      console.log('invalid chapter: ', data, ', message: ', e.message);
    }

    await extractComments(client, data.i, quietCreate);

    for (let i = 0, l = data.al.length; i < l; i++) {
      const alternateName = data.al[i],
        alternate = await AlternateTitleModel.findByPk(alternateName);

      if (alternate !== null) {
        if (alternate.manga !== newManga.title) {
          await LoggingModel.create({
            type: 'Alternate Title Mismatch',
            value: alternateName,
            previousValue: alternate.manga,
            targetID: alternate.id.toString(),
          });
          await alternate.update({ manga: newManga.title });
        }
      } else {
        await AlternateTitleModel.create({
          title: alternateName,
          manga: newManga.title,
        });
        if (!quietCreate)
          await LoggingModel.create({
            type: 'New Alternate Title',
            value: alternateName,
            targetID: alternateName,
          });
      }
    }

    if (!hasRead)
      verbose && console.log('Manga Unread, skipping pages -', data.i);
    else {
      let i = chapters.length;
      for (i; i; i--) {
        const chap = chapters[i - 1],
          newchapter: Chapter = {
            chapter: parseInt(chap.Chapter),
            type: chap.Type,
            directory: chap.Directory || 'Unread',
            chapterName: chap.ChapterName ?? '',
            mangaName: data.i,
            isBookmarked: bookmarked.some(
              (bookmark) =>
                bookmark.Page === '0' &&
                bookmark.Chapter === chap.Chapter &&
                bookmark.IndexName === data.i,
            ),
            releaseDate: new AdjustedDate(chap.Date),
          };

        const chapter = await ChapterModel.findByPk(
          newchapter.mangaName + '-' + newchapter.chapter,
        );

        if (chapter !== null) {
          if (
            parseInt(chap.Page || '0') !==
            (await PageModel.count({
              where: {
                chapter: newchapter.mangaName + '-' + newchapter.chapter,
                mangaName: newchapter.mangaName,
              },
            }))
          ) {
            await LoggingModel.create({
              type: 'Page Count Update',
              value: chap.Page || '0',
              previousValue: (
                await PageModel.count({
                  where: {
                    chapter: newchapter.mangaName + '-' + newchapter.chapter,
                    mangaName: newchapter.mangaName,
                  },
                })
              ).toString(),
              targetID: `${data.i}-${newchapter.chapter}`,
            });
          }

          if (
            chapter.type !== newchapter.type ||
            chapter.directory !== newchapter.directory ||
            chapter.chapterName !== newchapter.chapterName ||
            chapter.releaseDate.toLocaleString() !==
              newchapter.releaseDate.toLocaleString()
          ) {
            await LoggingModel.create({
              type: 'Unexpected Event',
              value: JSON.stringify(newchapter),
              previousValue: JSON.stringify(chapter),
              targetID: newchapter.chapter.toString(),
            });
          }
        } else {
          await ChapterModel.create(newchapter);
          if (!quietCreate)
            await LoggingModel.create({
              type: 'New Chapter',
              value: JSON.stringify(newchapter),
              targetID: data.i,
            });
        }

        for (
          let index =
              (await PageModel.count({
                where: {
                  chapter: newchapter.mangaName + '-' + newchapter.chapter,
                  mangaName: newchapter.mangaName,
                },
              })) + 1,
            l = parseInt(chap.Page || '0');
          index - 1 < l;
          index++
        ) {
          await PageModel.create({
            chapter: newchapter.mangaName + '-' + newchapter.chapter,
            mangaName: newchapter.mangaName,
            pageNum: index,
            isBookmarked: bookmarked.some(
              (bookmark) =>
                bookmark.Page === index.toString() &&
                bookmark.Chapter === chap.Chapter &&
                bookmark.IndexName === data.i,
            ),
          });
        }
      }
    }
  }

  onInterval(): Promise<void> {}
}
