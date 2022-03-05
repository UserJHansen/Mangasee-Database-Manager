import { AxiosInstance } from 'axios';

import { SingleBar } from 'cli-progress';
import { spawn, Pool, Worker, FunctionThread } from 'threads';
import { setTimeout } from 'timers/promises';

import MangaModel from './Manga.model';
import AuthorModel from '../Authors/Author.model';
import AuthorLink from '../Authors/AuthorLink.model';
import GenreModel from '../Genres/Genre.model';
import GenreLinkModel from '../Genres/GenreLink.model';
import LoggingModel from '../Logging/Log.model';

import { GenreT, RawBookmarkT, RawMangaT } from '../types.d';
import { runInWorker } from '../workerSetup';
import { QueuedTask } from 'threads/dist/master/pool-types';

export default async function fillManga(
  client: AxiosInstance,
  safemode: boolean,
  verbose: boolean,
) {
  const quietCreate = !(await MangaModel.findOne());

  let rawData: RawMangaT[] | null = null;
  while (rawData === null) {
    try {
      rawData = (await client.get('/search/search.php')).data;
    } catch (err) {
      console.log('failed to get list of manga, retrying: ', err.message);
      await setTimeout(1000);
    }
  }
  rawData = rawData as RawMangaT[];

  const authors = new Map<string, string[]>(),
    genres = new Map<GenreT, string[]>();

  let bookmarked: RawBookmarkT[] | null = null;
  while (bookmarked === null) {
    try {
      bookmarked = (await client.get(`/user/bookmark.get.php`)).data.val;
    } catch (err) {
      console.log(
        'failed to get list of bookmarked manga, retrying: ',
        err.message,
      );
      await setTimeout(1000);
    }
  }

  rawData.forEach((rawManga) => {
    rawManga.a.forEach((author) => {
      authors.set(author, [...(authors.get(author) || []), rawManga.i]);
    });
    rawManga.g.forEach((genre) => {
      genres.set(genre, [...(genres.get(genre) || []), rawManga.i]);
    });
  });

  const progress = new SingleBar({
    format: ' {bar} {percentage}% | ETA: {eta_formatted} | {value}/{total}',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    etaBuffer: 100,
    forceRedraw: true,
  });
  progress.start(rawData.length, 0);
  let completed = 0;
  const pool = Pool(() =>
      spawn<runInWorker>(
        new Worker('../workerSetup', {
          workerData: JSON.stringify(client.defaults.jar?.toJSON?.()),
        }),
      ),
    ),
    tasks: QueuedTask<
      FunctionThread<
        [
          manga: RawMangaT,
          quietCreate: boolean,
          safemode: boolean,
          verbose: boolean,
          bookmarked: RawBookmarkT[],
          json: string,
        ],
        void
      >,
      void
    >[] = [];

  for (let num = 0, l = rawData.length; num < l; num++) {
    tasks.push(
      pool.queue((worker) => {
        return worker(
          rawData?.[num] as RawMangaT,
          quietCreate,
          safemode,
          verbose,
          bookmarked as RawBookmarkT[],
        ).then(() => {
          progress.update(++completed);
          delete rawData?.[num];
        });
      }),
    );
  }
  await pool.completed();
  await pool.terminate();

  for (const [authorName, mangas] of authors) {
    const author = await AuthorModel.findByPk(authorName),
      links = await AuthorLink.findAll({
        where: {
          authorName,
        },
      });

    if (author === null) {
      await AuthorModel.create({
        name: authorName,
      });
      if (!quietCreate)
        await LoggingModel.create({
          type: 'New Author',
          value: authorName,
          targetID: authorName,
        });
    }

    for (const manga of mangas) {
      if (!links.some((link) => link.mangaName === manga)) {
        await AuthorLink.create({
          authorName,
          mangaName: manga,
        });
      }
    }
  }

  for (const [genreName, mangas] of genres) {
    const genre = await GenreModel.findByPk(genreName),
      links = await GenreLinkModel.findAll({
        where: {
          genre: genreName,
        },
      });

    if (genre === null) {
      await GenreModel.create({
        genre: genreName,
      });
      if (!quietCreate)
        await LoggingModel.create({
          type: 'New Author',
          value: genreName,
          targetID: genreName,
        });
    }

    for (const manga of mangas) {
      if (links.every((link) => link.mangaName !== manga)) {
        await GenreLinkModel.create({
          genre: genreName,
          mangaName: manga,
        });
      }
    }
  }
}
