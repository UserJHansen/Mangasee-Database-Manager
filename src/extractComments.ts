import { AxiosInstance } from 'axios';
import { setTimeout } from 'timers/promises';

import AdjustedDate from './utils/AdjustedDate';
import LoggingModel from './Models/Logging/Log.model';
import { RawMangaCommentT } from './utils/types';
import MangaComment, { Comment } from './Models/Mangas/Comments/Comment.model';
import MangaReply, { Reply } from './Models/Mangas/Replies/Reply.model';
import UserModel from './Models/Users/User.model';

export default async function extractComments(
  client: AxiosInstance,
  name: string,
  quietCreate: boolean,
) {
  let rawData: RawMangaCommentT[] | null = null;
  while (rawData === null) {
    try {
      rawData = (
        await client.post('/manga/comment.get.php', { IndexName: name })
      ).data.val;
    } catch (error) {
      console.log('Getting Comments failed, retrying', error.message);
      await setTimeout(1000);
    }
  }

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
    await UserModel.checkUser({
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
      await UserModel.checkUser({
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
