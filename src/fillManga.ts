import { AxiosInstance } from 'axios';
import { setTimeout } from 'timers/promises';

import AdjustedDate from './utils/AdjustedDate';
import ChapterModel, { Chapter } from './Models/Chapters/Chapter.model';
import chapterURLEncode from './utils/ChapterURLEncode';
import { FindVariable } from './utils/getJsVar';
import LoggingModel from './Models/Logging/Log.model';
import PageModel from './Models/Pages/Page.model';
import { RawBookmarkT, RawChapterT, RawMangaT } from './utils/types';
import AlternateTitleModel from './Models/Mangas/AlternateTitle.model';
import extractComments from './extractComments';
import MangaModel, { Manga } from './Models/Mangas/Manga.model';

export default async function fillManga(
  data: RawMangaT | RawMangaT[],
  quietCreate: boolean,
  safemode: boolean,
  verbose: boolean,
  bookmarked: RawBookmarkT[],
  client: AxiosInstance,
) {
  if (Array.isArray(data)) {
    for (const manga of data) {
      await fillManga(
        manga,
        quietCreate,
        safemode,
        verbose,
        bookmarked,
        client,
      );
    }
    return;
  }

  verbose && console.log('Filling', data.i);
  let rawHTML: string | null = null;

  while (rawHTML === null) {
    try {
      rawHTML = (await client.get(`/manga/${data.i}`)).data;
    } catch (err) {
      console.log('failed to get html, retrying: ', err.message);
      await setTimeout(1000);
    }
  }

  const lastChapterRead =
    FindVariable('vm.LastChapterRead', rawHTML).replace(/"/g, '') !== ''
      ? FindVariable('vm.LastChapterRead', rawHTML).replace(/"/g, '')
      : safemode
      ? ''
      : (JSON.parse(FindVariable('vm.Chapters', rawHTML)) as RawChapterT[])[
          JSON.parse(FindVariable('vm.Chapters', rawHTML)).length - 1
        ].Chapter;
  if (FindVariable('vm.LastChapterRead', rawHTML) === '') return;
  let hasRead = lastChapterRead !== '' || !safemode;
  const newmanga: Manga = {
    title: data.i,
    fullTitle: data.s,
    hasRead,
    type: data.t,
    releaseYear: parseInt(data.y),
    scanStatus: data.ss,
    publishStatus: data.ps,
    lastReadID: hasRead ? data.i + '-' + lastChapterRead : '',
    isSubscribed: FindVariable('vm.Subbed', rawHTML) === 'true',
    numSubscribed: parseInt(FindVariable('vm.NumSubs', rawHTML)),
    shouldNotify: FindVariable('vm.Notification', rawHTML) === 'true',
  };

  const manga = await MangaModel.findByPk(data.i);
  if (manga !== null) {
    if (newmanga.hasRead && !manga.hasRead) {
      await LoggingModel.create({
        type: 'Read Manga',
        value: newmanga.title,
        targetID: newmanga.title,
      });
      hasRead = true;
      await manga.update({ hasRead });
    }

    if (manga.scanStatus !== newmanga.scanStatus) {
      await LoggingModel.create({
        type: 'Scan Status Changed',
        value: newmanga.scanStatus,
        previousValue: manga.scanStatus,
        targetID: newmanga.title,
      });
      await manga.update({ scanStatus: newmanga.scanStatus });
    }
    if (manga.publishStatus !== newmanga.publishStatus) {
      await LoggingModel.create({
        type: 'Publish Status Changed',
        value: newmanga.publishStatus,
        previousValue: manga.publishStatus,
        targetID: newmanga.title,
      });
      await manga.update({ publishStatus: newmanga.publishStatus });
    }

    if (manga.lastReadID !== newmanga.lastReadID) {
      await LoggingModel.create({
        type: 'Last Read Update',
        value: newmanga.lastReadID.toString(),
        previousValue: manga.lastReadID.toString(),
        targetID: data.i,
      });
      await manga.update({ lastReadID: newmanga.lastReadID });
    }

    if (manga.isSubscribed !== newmanga.isSubscribed) {
      await LoggingModel.create({
        type: 'Subscription Update',
        value: newmanga.isSubscribed.toString(),
        previousValue: manga.isSubscribed.toString(),
        targetID: data.i,
      });
      await manga.update({ isSubscribed: newmanga.isSubscribed });
    }

    if (manga.numSubscribed !== newmanga.numSubscribed) {
      await LoggingModel.create({
        type: 'Subscription Number Update',
        value: newmanga.numSubscribed.toString(),
        previousValue: manga.numSubscribed.toString(),
        targetID: data.i,
      });
      await manga.update({ numSubscribed: newmanga.numSubscribed });
    }

    if (manga.shouldNotify !== newmanga.shouldNotify) {
      await LoggingModel.create({
        type: 'Notification Pref Update',
        value: newmanga.shouldNotify.toString(),
        previousValue: manga.shouldNotify.toString(),
        targetID: data.i,
      });
      await manga.update({ shouldNotify: newmanga.shouldNotify });
    }

    if (
      manga.type !== newmanga.type ||
      manga.releaseYear !== newmanga.releaseYear ||
      manga.shouldNotify !== newmanga.shouldNotify
    ) {
      await LoggingModel.create({
        type: 'Unexpected Event',
        value: JSON.stringify(newmanga),
        previousValue: JSON.stringify(manga),
        targetID: manga.title,
      });
    }
  } else {
    await MangaModel.create(newmanga);
    if (!quietCreate) {
      await LoggingModel.create({
        type: 'New Manga',
        value: JSON.stringify(newmanga),
        targetID: newmanga.title,
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
      if (alternate.manga !== newmanga.title) {
        await LoggingModel.create({
          type: 'Alternate Title Mismatch',
          value: alternateName,
          previousValue: alternate.manga,
          targetID: alternate.id.toString(),
        });
        await alternate.update({ manga: newmanga.title });
      }
    } else {
      await AlternateTitleModel.create({
        title: alternateName,
        manga: newmanga.title,
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