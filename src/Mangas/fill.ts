import { AxiosInstance } from 'axios';
import AdjustedDate from '../AdjustedDate';
import AuthorModel from '../Authors/Author.model';
import AuthorLink from '../Authors/AuthorLink.model';
import ChapterModel, { Chapter } from '../Chapters/Chapter.model';
import chapterURLEncode from '../ChapterURLEncode';
import GenreModel from '../Genres/Genre.model';
import GenreLinkModel from '../Genres/GenreLink.model';
import { FindVariable } from '../getJsVar';
import LoggingModel from '../Logging/Log.model';
import PageModel from '../Pages/Page.model';
import {
  GenreT,
  RawBookmarkT,
  RawChapterT,
  RawMangaCommentT,
  RawMangaT,
} from '../types.d';
import User from '../Users/User.model';
import AlternateTitleModel from './AlternateTitle.model';
import MangaComment, { Comment } from './Comments/Comment.model';
import MangaModel, { Manga } from './Manga.model';
import MangaReply, { Reply } from './Replies/Reply.model';

async function extractComments(
  client: AxiosInstance,
  name: string,
  quietCreate: boolean,
) {
  const rawData = (
      await client.post('/manga/comment.get.php', { IndexName: name })
    ).data.val as RawMangaCommentT[],
    users = new Map<string, number>();

  for (const key in rawData) {
    const rawComment = rawData[key];

    let i = rawComment.Replies.length;
    for (i; i; i--) {
      const reply = await MangaReply.findByPk(parseInt(rawComment.CommentID)),
        newReply: Reply = {
          id: parseInt(rawComment.CommentID),
          userID: parseInt(rawComment.UserID),
          content: rawComment.CommentContent,
          timestamp: new AdjustedDate(rawComment.TimeCommented),
          commentID: parseInt(rawComment.CommentID),
        };

      if (reply !== null) {
        if (
          reply.userID !== newReply.userID ||
          reply.content !== newReply.content ||
          reply.timestamp.toLocaleString() !==
            newReply.timestamp.toLocaleString() ||
          reply.commentID !== newReply.commentID
        ) {
          await LoggingModel.create({
            type: 'Unexpected Event',
            value: JSON.stringify(newReply),
            previousValue: JSON.stringify(reply),
            targetID: reply.id.toString(),
          });
        }
      } else {
        await MangaReply.create(newReply);
        if (!quietCreate) {
          await LoggingModel.create({
            type: 'New Reply',
            value: JSON.stringify(newReply),
            targetID: newReply.id.toString(),
          });
        }
      }
    }

    const comment = await MangaComment.findByPk(parseInt(rawComment.CommentID));
    const newcomment: Comment = {
      id: parseInt(rawComment.CommentID),
      userID: parseInt(rawComment.UserID),
      content: rawComment.CommentContent,
      likes: parseInt(rawComment.LikeCount),
      hasLiked: rawComment.Liked,
      timestamp: new AdjustedDate(rawComment.TimeCommented),
      mangaID: name,
    };
    if (comment !== null) {
      if (
        comment.likes !== newcomment.likes ||
        comment.hasLiked !== newcomment.hasLiked
      ) {
        await LoggingModel.create({
          type: 'Likes Update',
          value: newcomment.likes.toString(),
          previousValue: comment.likes.toString(),
          targetID: comment.id.toString(),
        });
        await comment.update({
          likes: newcomment.likes,
          hasLiked: newcomment.hasLiked,
        });
      }
      if (
        comment.content !== newcomment.content ||
        comment.mangaID !== newcomment.mangaID ||
        comment.timestamp.toLocaleString() !==
          newcomment.timestamp.toLocaleString() ||
        comment.userID !== newcomment.userID
      ) {
        await LoggingModel.create({
          type: 'Unexpected Event',
          value: JSON.stringify(newcomment),
          previousValue: JSON.stringify(comment),
          targetID: newcomment.id.toString(),
        });
      }
    } else {
      await MangaComment.create(newcomment);
      if (!quietCreate) {
        await LoggingModel.create({
          type: 'New Comment',
          value: JSON.stringify(newcomment),
          targetID: newcomment.id.toString(),
        });
      }
    }
  }

  for (const [key, value] of users) {
    const user = await User.findByPk(value);
    if (user !== null) {
      if (user.username !== key) {
        await LoggingModel.create({
          type: 'Username Update',
          value: key,
          previousValue: user.username,
          targetID: value.toString(),
        });
        await user.update({ username: key });
      }
    } else {
      await User.create({
        id: value,
        username: key,
      });
    }
  }
}

export default async function fillManga(client: AxiosInstance) {
  const quietCreate = !(await MangaModel.findOne());

  const rawData = (await client.get('/search/search.php')).data
      .val as RawMangaT[],
    authors = new Map<string, string[]>(),
    genres = new Map<GenreT, string[]>();

  for (let num = 0, l = rawData.length; num < l; num++) {
    const data = rawData[num],
      rawHTML = (await client.get(`/manga/${data.i}`)).data,
      chapters: RawChapterT[] = JSON.parse(
        FindVariable(
          'vm.CHAPTERS',
          (
            await client.get(
              `/read-online/${data.i}/${chapterURLEncode(
                FindVariable('vm.LastChapterRead', rawHTML),
              )}`,
            )
          ).data,
        ),
      ),
      newmanga: Manga = {
        title: data.i,
        type: data.t,
        releaseYear: parseInt(data.y),
        scanStatus: data.ss,
        publishStatus: data.ps,
        lastReadID: FindVariable('vm.LastChapterRead', rawHTML),
        isSubscribed: FindVariable('vm.Subbed', rawHTML) === 'true',
        numSubscribed: parseInt(FindVariable('vm.NumSubs', rawHTML)),
        shouldNotify: FindVariable('vm.Notification', rawHTML) === 'true',
      },
      bookmarked: RawBookmarkT[] = (await client.get(`/user/bookmark.get.php`))
        .data.val;
    extractComments(client, data.i, quietCreate);

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
      }
    }

    const manga = await MangaModel.findByPk(data.i);
    if (manga !== null) {
      if (manga.scanStatus !== newmanga.scanStatus) {
        await LoggingModel.create({
          type: 'Scan Status Changed',
          value: newmanga.scanStatus,
          previousValue: manga.scanStatus,
          targetID: data.i,
        });
        await manga.update({ scanStatus: newmanga.scanStatus });
      }
      if (manga.publishStatus !== newmanga.publishStatus) {
        await LoggingModel.create({
          type: 'Publish Status Changed',
          value: newmanga.publishStatus,
          previousValue: manga.publishStatus,
          targetID: data.i,
        });
        await manga.update({ publishStatus: newmanga.publishStatus });
      }

      if (manga.lastReadID !== newmanga.lastReadID) {
        await LoggingModel.create({
          type: 'Last Read Update',
          value: newmanga.lastReadID,
          previousValue: manga.lastReadID,
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

    let i = chapters.length;
    for (i; i; i--) {
      const chap = chapters[i],
        newchapter: Chapter = {
          chapter: chap.Chapter,
          type: chap.Type,
          directory: chap.Directory,
          chapterName: chap.ChapterName,
          mangaName: data.i,
          isBookmarked: bookmarked.some(
            (bookmark) =>
              bookmark.Page === '0' &&
              bookmark.Chapter === chap.Chapter &&
              bookmark.IndexName === data.i,
          ),
          releaseDate: new AdjustedDate(chap.Date),
        },
        chapter = await ChapterModel.findOne({
          where: {
            chapter: newchapter.chapter,
            mangaName: newchapter.mangaName,
          },
        });

      if (chapter !== null) {
        if (
          parseInt(chap.Page) !==
          (await PageModel.count({
            where: {
              chapter: newchapter.chapter,
              mangaName: newchapter.mangaName,
            },
          }))
        ) {
          await LoggingModel.create({
            type: 'Page Count Update',
            value: chap.Page,
            previousValue: (
              await PageModel.count({
                where: {
                  chapter: newchapter.chapter,
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
            targetID: newchapter.chapter,
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

        for (let i = 1, l = parseInt(chap.Page); i - 1 < l; i++) {
          await PageModel.create({
            chapter: newchapter.chapter,
            mangaName: newchapter.mangaName,
            id: i,
            isBookmarked: bookmarked.some(
              (bookmark) =>
                bookmark.Page === i.toString() &&
                bookmark.Chapter === chap.Chapter &&
                bookmark.IndexName === data.i,
            ),
          });
        }
      }
    }

    data.a.forEach((author) => {
      authors.set(author, [...(authors.get(author) || []), data.i]);
    });
    data.g.forEach((genre) => {
      genres.set(genre, [...(genres.get(genre) || []), data.i]);
    });
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
