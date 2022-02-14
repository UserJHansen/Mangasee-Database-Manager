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
import UserModel, { User } from '../Users/User.model';
import AlternateTitleModel from './AlternateTitle.model';
import MangaComment, { Comment } from './Comments/Comment.model';
import MangaModel, { Manga } from './Manga.model';
import MangaReply, { Reply } from './Replies/Reply.model';

async function checkUser(userDetails: User) {
  const { id, username } = userDetails;
  const user = await UserModel.findByPk(id);
  if (user !== null) {
    if (user.username !== username) {
      await LoggingModel.create({
        type: 'Username Update',
        value: username,
        previousValue: user.username,
        targetID: id.toString(),
      });
      await user.update({ username });
    }
  } else {
    await UserModel.create(userDetails);
  }
}

async function extractComments(
  client: AxiosInstance,
  name: string,
  quietCreate: boolean,
) {
  const rawData = (
    await client.post('/manga/comment.get.php', { IndexName: name })
  ).data.val as RawMangaCommentT[];

  for (const key in rawData) {
    const rawComment = rawData[key];

    const comment = await MangaComment.findByPk(parseInt(rawComment.CommentID));
    const newcomment: Comment = {
      id: parseInt(rawComment.CommentID),
      userID: parseInt(rawComment.UserID),
      content: rawComment.CommentContent,
      likes: parseInt(rawComment.LikeCount),
      hasLiked: rawComment.Liked,
      timestamp: new AdjustedDate(rawComment.TimeCommented),
      mangaName: name,
    };
    await checkUser({
      id: parseInt(rawComment.UserID),
      username: rawComment.Username,
    });
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
        comment.mangaName !== newcomment.mangaName ||
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

    for (let i = 0, l = rawComment.Replies.length; i < l; i++) {
      const reply = await MangaReply.findByPk(
          parseInt(rawComment.Replies[i].CommentID),
        ),
        newReply: Reply = {
          id: parseInt(rawComment.Replies[i].CommentID),
          userID: parseInt(rawComment.Replies[i].UserID),
          content: rawComment.Replies[i].CommentContent,
          timestamp: new AdjustedDate(rawComment.Replies[i].TimeCommented),
          commentID: parseInt(rawComment.CommentID),
        };
      await checkUser({
        id: parseInt(rawComment.Replies[i].UserID),
        username: rawComment.Replies[i].Username,
      });

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
  }
}

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

  for (let num = 0, l = rawData.length; num < l; num++) {
    console.log('Filling', rawData[num].i);
    const data = rawData[num],
      rawHTML = (await client.get(`/manga/${data.i}`)).data,
      lastChapterRead =
        FindVariable('vm.LastChapterRead', rawHTML).replace(/"/g, '') !== ''
          ? FindVariable('vm.LastChapterRead', rawHTML).replace(/"/g, '')
          : safemode
          ? ''
          : (JSON.parse(FindVariable('vm.Chapters', rawHTML)) as RawChapterT[])[
              JSON.parse(FindVariable('vm.Chapters', rawHTML)).length - 1
            ].Chapter;
    if (FindVariable('vm.LastChapterRead', rawHTML) === '') continue;
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
      chapters = JSON.parse(
        hasRead
          ? (console.log(
              'get',
              `/read-online/${data.i}${chapterURLEncode(lastChapterRead)}`,
              'from chapter',
              lastChapterRead,
            ),
            FindVariable(
              'vm.CHAPTERS',
              (
                await client.get(
                  `/read-online/${data.i}${chapterURLEncode(lastChapterRead)}`,
                )
              ).data,
            ))
          : FindVariable('vm.Chapters', rawHTML),
      );
    } catch (e) {
      hasRead = false;
      console.log(e);
      console.log('invalid chapter');
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

    if (!hasRead) console.log('Manga Unread, skipping pages -', data.i);
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
          },
          chapter = await ChapterModel.findByPk(
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
