import { AxiosInstance } from 'axios';
import AdjustedDate from '../AdjustedDate';
import LoggingModel from '../Logging/Log.model';
import { RawMangaCommentT, RawMangaT, RawPostT } from '../types.d';
import User from '../Users/User.model';
import DiscussionComment, { Comment } from './Comments/Comment.model';
import MangaModel, { Manga } from './Manga.model';
import DiscussionReply, { Reply } from './Replies/Reply.model';

function extractComments(
  client: AxiosInstance,
  name: string,
  quietCreate: boolean,
) {
  const rawData = (await client.post('/manga/comment.get.php', { IndexName }))
      .data.val as RawMangaCommentT[],
    users = new Map<string, number>(),
    parsedData: Manga[] = rawData.map((data) => {
      return {
        id: parseInt(data.PostID),

        userID: 0,
        title: data.PostTitle,
        type: data.PostType,
        timestamp: new AdjustedDate(data.TimePosted),

        shouldNotify: true,
      };
    }),
    comments = new Map<number, Comment>(),
    replies = new Map<number, Reply>();

  for (const Discussion of parsedData) {
    const post = (
      await client.post('/discussion/post.get.php', {
        id: Discussion.id,
      })
    ).data.val as RawPostT;

    users.set(post.Username, parseInt(post.UserID));
    Discussion.userID = parseInt(post.UserID);
    Discussion.shouldNotify = post.Notification === '1';
    Discussion.id = parseInt(post.PostID);

    for (const Comment of post.Comments) {
      users.set(Comment.Username, parseInt(Comment.UserID));
      comments.set(parseInt(Comment.CommentID), {
        id: parseInt(Comment.CommentID),
        content: Comment.CommentContent,
        timestamp: new AdjustedDate(Comment.TimeCommented),
        userID: parseInt(Comment.UserID),
        likes: parseInt(Comment.LikeCount),
        hasLiked: Comment.Liked,
        discussionID: parseInt(post.PostID),
      });

      for (const Reply of Comment.Replies) {
        users.set(Reply.Username, parseInt(Reply.UserID));

        replies.set(parseInt(Reply.CommentID), {
          id: parseInt(Reply.CommentID),
          content: Reply.CommentContent,
          timestamp: new AdjustedDate(Reply.TimeCommented),
          userID: parseInt(Reply.UserID),
          commentID: parseInt(Comment.CommentID),
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
  for (const discussion in parsedData) {
    const Discussion = await DiscussionModel.findByPk(
      parsedData[discussion].id,
    );
    if (Discussion === null) {
      if (!quietCreate)
        await LoggingModel.create({
          type: 'New Discussion',
          value: parsedData[discussion].title,
          targetID: parsedData[discussion].id,
        });
      await DiscussionModel.create(parsedData[discussion]);
    } else {
      const data = parsedData[discussion];

      if (data.shouldNotify !== Discussion.shouldNotify) {
        await Discussion.update({ shouldNotify: data.shouldNotify });

        break;
      }

      if (
        data.title !== Discussion.title ||
        data.type !== Discussion.type ||
        data.userID !== Discussion.userID ||
        data.timestamp.toLocaleString() !==
          Discussion.timestamp.toLocaleString()
      ) {
        await LoggingModel.create({
          type: 'Unexpected Event',
          value: 'Discussion Changed',
          targetID: parsedData[discussion].id,
        });
      }
    }
  }
  for (const comment of comments.values()) {
    const Comment = await DiscussionComment.findByPk(comment.id);
    if (Comment === null) {
      if (!quietCreate)
        await LoggingModel.create({
          type: 'New Comment',
          value: comment.content,
          targetID: comment.id,
        });
      await DiscussionComment.create(comment);
    } else {
      if (
        comment.likes !== Comment.likes ||
        comment.hasLiked !== Comment.hasLiked
      ) {
        await LoggingModel.create({
          type: 'Likes Update',
          value: comment.likes.toString(),
          previousValue: Comment.likes.toString(),
          targetID: comment.id,
        });
        await Comment.update({
          likes: comment.likes,
          hasLiked: comment.hasLiked,
        });

        break;
      }

      if (
        comment.content !== Comment.content ||
        comment.discussionID !== Comment.discussionID ||
        comment.timestamp.toLocaleString() !==
          Comment.timestamp.toLocaleString() ||
        comment.userID !== Comment.userID
      ) {
        await LoggingModel.create({
          type: 'Unexpected Event',
          value: 'Comment Changed',
          targetID: comment.id,
        });
      }
    }
  }
  for (const reply of replies.values()) {
    const Reply = await DiscussionReply.findByPk(reply.id);
    if (Reply === null) {
      if (!quietCreate)
        await LoggingModel.create({
          type: 'New Reply',
          value: reply.content,
          targetID: reply.id,
        });
      await DiscussionReply.create(reply);
    } else {
      if (
        reply.commentID !== Reply.commentID ||
        reply.userID !== Reply.userID ||
        reply.timestamp.toLocaleString() !== Reply.timestamp.toLocaleString() ||
        reply.content !== Reply.content
      ) {
        await LoggingModel.create({
          type: 'Unexpected Event',
          value: 'Reply Changed',
          targetID: reply.id,
        });
      }
    }
  }
}

export default async function fillManga(client: AxiosInstance) {
  const quietCreate = !(await MangaModel.findOne());

  const rawData = (await client.get('/search/search.php')).data
      .val as RawMangaT[],
    authors = new Map<string, string[]>(),
    genres = new Map<string, string[]>(),
    parsedData: Manga[] = rawData.map((data) => {
      data.a.forEach((author) => {
        authors.set(author, [...(authors.get(author) || []), data.i]);
      });
      data.g.forEach((genre) => {
        genres.set(genre, [...(genres.get(genre) || []), data.i]);
      });
    });
}
