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
  verbose: boolean,
  bookmarked: RawBookmarkT[],
  client: AxiosInstance,
) {
  if (Array.isArray(data)) {
    for (const manga of data) {
      await fillManga(manga, quietCreate, verbose, bookmarked, client);
    }
    return;
  }
}
