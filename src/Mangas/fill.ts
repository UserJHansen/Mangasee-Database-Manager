import { AxiosInstance } from 'axios';

import MangaModel from './Manga.model';
import AuthorModel from '../Authors/Author.model';
import AuthorLink from '../Authors/AuthorLink.model';
import GenreModel from '../Genres/Genre.model';
import GenreLinkModel from '../Genres/GenreLink.model';
import LoggingModel from '../Logging/Log.model';

import { GenreT, RawBookmarkT, RawMangaT } from '../types.d';
import fillIndividual from './fillIndividual';

export default async function fillManga(
  client: AxiosInstance,
  safemode: boolean,
) {
  const quietCreate = !(await MangaModel.findOne());

  const rawData = (await client.get('/search/search.php')).data as RawMangaT[],
    authors = new Map<string, string[]>(),
    genres = new Map<GenreT, string[]>(),
    bookmarked: RawBookmarkT[] = (await client.get(`/user/bookmark.get.php`))
      .data.val;

  console.log(await client.get('/search/search.php'));

  rawData.forEach((rawManga) => {
    rawManga.a.forEach((author) => {
      authors.set(author, [...(authors.get(author) || []), rawManga.i]);
    });
    rawManga.g.forEach((genre) => {
      genres.set(genre, [...(genres.get(genre) || []), rawManga.i]);
    });
  });

  let bottom = 0;
  while (bottom < rawData.length) {
    const tasks: Promise<void>[] = [];
    for (let num = 0, l = rawData.splice(bottom, 100).length; num < l; num++) {
      tasks.push(
        fillIndividual(
          rawData.splice(bottom, 100)[num],
          quietCreate,
          safemode,
          bookmarked,
          client,
        ),
      );
    }
    await Promise.all(tasks);
    bottom += 100;
  }

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
      if (!links.some((link) => link.mangaName === manga)) {
        await GenreLinkModel.create({
          genre: genreName,
          mangaName: manga,
        });
      }
    }
  }
}
