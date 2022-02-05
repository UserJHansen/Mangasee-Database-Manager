import { AxiosInstance } from 'axios';
import AdjustedDate from '../AdjustedDate';
import { FindVariable } from '../getJsVar';
import LoggingModel from '../Logging/Log.model';
import { RawChapterT, RawMangaCommentT, RawMangaT } from '../types.d';
import User from '../Users/User.model';
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
            targetID: reply.id,
          });
        }
      } else {
        await MangaReply.create(newReply);
        if (!quietCreate) {
          await LoggingModel.create({
            type: 'New Reply',
            value: JSON.stringify(newReply),
            targetID: newReply.id,
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
          targetID: comment.id,
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
          targetID: newcomment.id,
        });
      }
    } else {
      await MangaComment.create(newcomment);
      if (!quietCreate) {
        await LoggingModel.create({
          type: 'New Comment',
          value: JSON.stringify(newcomment),
          targetID: newcomment.id,
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
          targetID: value,
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
    genres = new Map<string, string[]>(),
    parsedData: Manga[] = await Promise.all(
      rawData.map(async (data) => {
        const rawHTML = (await client.get(`/manga/${data.i}`)).data,
          chapters: RawChapterT[] = JSON.parse(
            FindVariable('vm.Chapters', rawHTML),
          ),
          manga: Manga = {
            title: data.i,
            type: data.t,
            releaseYear: parseInt(data.y),
            scanStatus: data.ss,
            publishStatus: data.ps,
            lastReadID: parseInt(FindVariable('vm.LastChapterRead', rawHTML)),
            isSubscribed: FindVariable('vm.Subbed', rawHTML) === 'true',
            numSubscribed: parseInt(FindVariable('vm.NumSubs', rawHTML)),
            shouldNotify: FindVariable('vm.Notification', rawHTML) === 'true',
          };
        extractComments(client, data.i, quietCreate);

        let i = chapters.length;
        for (i; i; i--) {
          const newchapter = chapters[i];

          
        }

        data.a.forEach((author) => {
          authors.set(author, [...(authors.get(author) || []), data.i]);
        });
        data.g.forEach((genre) => {
          genres.set(genre, [...(genres.get(genre) || []), data.i]);
        });
      }),
    );
}
