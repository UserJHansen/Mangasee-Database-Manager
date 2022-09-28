import AdjustedDate from '../utils/AdjustedDate';
import { RawDiscussionT, RawPostT } from '../utils/types';
import User from '../Models/Users/User.model';
import DiscussionModel from '../Models/Discussions/Discussion.model';
import DiscussionReply from '../Models/Discussions/Replies/Reply.model';
import subWorker from './subWorker';

export class discussionController extends subWorker {
  async capturePost(id: number) {
    try {
      const users = new Map<string, number>(),
        post = (
          await this.client.post('/discussion/post.get.php', {
            id,
          })
        ).data.val as RawPostT;

      users.set(post.Username, parseInt(post.UserID));
      post.Comments.forEach((comment) => {
        users.set(comment.Username, parseInt(comment.UserID));
        comment.Replies.forEach((reply) => {
          users.set(reply.Username, parseInt(reply.UserID));
        });
      });

      const discussion = {
        id,
        title: post.PostTitle,
        type: post.PostType,
        timestamp: new AdjustedDate(post.TimePosted),
        userID: parseInt(post.UserID),
        shouldNotify: post.Notification === '1',
        comments: post.Comments.map((comment) => ({
          id: parseInt(comment.CommentID),
          content: comment.CommentContent,
          timestamp: new AdjustedDate(comment.TimeCommented),
          userID: parseInt(comment.UserID),
          likes: parseInt(comment.LikeCount),
          hasLiked: comment.Liked,
          discussionID: id,
          replies: comment.Replies.map(
            (reply) =>
              ({
                id: parseInt(reply.CommentID),
                content: reply.CommentContent,
                timestamp: new AdjustedDate(reply.TimeCommented),
                userID: parseInt(reply.UserID),
                commentID: parseInt(comment.CommentID),
              } as DiscussionReply),
          ),
        })),
      };

      const userPromises = Array.from(users.keys()).map((username) =>
        User.checkUser({ username, id: users.get(username) ?? 0 }),
      );
      await Promise.all(userPromises);
      await DiscussionModel.updateWithLog(discussion, this.verbose);
    } catch (e) {
      console.error(`Error while capturing post ${id}`, e);
    }
  }

  async onInterval(): Promise<void> {
    console.log('[DISCUSSIONS] Taking capture...');
    let rawData: RawDiscussionT[] = [];
    try {
      rawData = (await this.client.get('/discussion/index.get.php')).data.val;
    } catch (e) {
      console.error(
        '[DISCUSSIONS] Failed to capture discussions. Quiting this time...',
      );
    }

    for (const data of rawData) {
      try {
        await this.capturePost(parseInt(data.PostID));
      } catch (e) {
        console.error(
          `Failed to capture post ${data.PostID} (${data.PostTitle})`,
          e,
        );
      }
    }
    console.log('[DISCUSSIONS] Capture complete.');
  }
}
