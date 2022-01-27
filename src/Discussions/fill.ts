import { AxiosInstance } from 'axios';
import AdjustedDate from '../AdjustedDate';
import { RawDiscussionT, RawPostT } from '../types.d';
import User from '../Users/User.model';
import DiscussionComment, { Comment } from './Comments/Comment.model';
import DiscussionModel, { Discussion } from './Discussion.model';
import DiscussionReply, { Reply } from './Replies/Reply.model';

export default async function fillDiscussions(client: AxiosInstance) {
  const rawData = (await client.get('/discussion/index.get.php')).data
      .val as RawDiscussionT[],
    users = new Map<string, number>(),
    parsedData: Discussion[] = rawData.map((data) => {
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
    const count = await User.findOne({ where: { id: value } });
    if (count !== null) {
      await new User({
        id: value,
        username: key,
      }).save();
    } else {
      await User.create({
        id: value,
        username: key,
      });
    }
  }
  for (const discussion in parsedData) {
    const count = await DiscussionModel.findOne({
      where: { id: parsedData[discussion].id },
    });
    if (count !== null) {
      await DiscussionModel.create(parsedData[discussion]);
    } else {
      await new DiscussionModel(parsedData[discussion]).save();
    }
  }
  for (const comment of comments.values()) {
    const count = await DiscussionComment.findOne({
      where: { id: comment.id },
    });
    if (count !== null) {
      await DiscussionComment.create(comment);
    } else {
      await new DiscussionComment(comment).save();
    }
  }
  for (const reply of replies.values()) {
    const count = await DiscussionReply.findOne({ where: { id: reply.id } });
    if (count !== null) {
      await DiscussionReply.create(reply);
    } else {
      await new DiscussionReply(reply).save();
    }
  }

  console.log(users, parsedData, comments, replies);
}
