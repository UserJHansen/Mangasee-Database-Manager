import AdjustedDate from '../../utils/AdjustedDate';
import { RawDiscussionT, RawPostT } from '../../utils/types';
import User from '../../Models/Users/User.model';
import DiscussionModel from '../../Models/Discussions/Discussion.model';
import DiscussionReply from '../../Models/Discussions/Replies/Reply.model';
import { Sequelize } from 'sequelize-typescript';
import { Axios } from 'axios';
import ClientController from '../../utils/ClientController';
import { CookieJar } from 'tough-cookie';
import { defaultSqliteSettings } from '../../utils/defaultSettings';

export class discussionController {
  running = false;
  interval = 0;
  timer: NodeJS.Timer;

  database: Sequelize;
  client: Axios;
  verbose: boolean;

  constructor(
    client: CookieJar.Serialized,
    verbose: boolean,
    interval: number,
  ) {
    this.client = ClientController.parseClient(client);
    this.interval = interval;
    this.verbose = verbose;
  }

  async connect() {
    console.log('[DISCUSSIONS] Connecting to database...');
    this.database = new Sequelize(defaultSqliteSettings);

    await this.database.authenticate();
  }

  start() {
    console.log(
      `[DISCUSSIONS] Started taking discussions at ${
        this.interval / 1000 / 60
      }m intervals`,
    );
    if (this.running) return;

    this.takeCapture();
    this.timer = setInterval(() => this.takeCapture(), this.interval);

    this.running = true;
  }

  stop() {
    this.running = false;

    if (!this.running) return;

    clearInterval(this.timer);

    this.running = false;
  }

  private async capturePost(data: RawDiscussionT) {
    try {
      const users = new Map<string, number>(),
        post = (
          await this.client.post('/discussion/post.get.php', {
            id: parseInt(data.PostID),
          })
        ).data.val as RawPostT;

      users.set(post.Username, parseInt(post.UserID));

      const discussion = {
        id: parseInt(data.PostID),
        title: data.PostTitle,
        type: data.PostType,
        timestamp: new AdjustedDate(data.TimePosted),
        userID: parseInt(post.UserID),
        shouldNotify: post.Notification === '1',
        comments: post.Comments.map((comment) => {
          users.set(comment.Username, parseInt(comment.UserID));
          return {
            id: parseInt(comment.CommentID),
            content: comment.CommentContent,
            timestamp: new AdjustedDate(comment.TimeCommented),
            userID: parseInt(comment.UserID),
            likes: parseInt(comment.LikeCount),
            hasLiked: comment.Liked,
            discussionID: parseInt(data.PostID),
            replies: comment.Replies.map((reply) => {
              users.set(reply.Username, parseInt(reply.UserID));
              return {
                id: parseInt(reply.CommentID),
                content: reply.CommentContent,
                timestamp: new AdjustedDate(reply.TimeCommented),
                userID: parseInt(reply.UserID),
                commentID: parseInt(comment.CommentID),
              } as DiscussionReply;
            }),
          };
        }),
      };

      for (const [key, value] of users) {
        await User.checkUser({ username: key, id: value });
      }
      await DiscussionModel.updateWithLog(discussion, this.verbose);
    } catch (e) {
      console.error(e);
      this.capturePost(data);
    }
  }

  private async takeCapture() {
    console.log('[DISCUSSIONS] Taking capture...');

    try {
      const rawData = (await this.client.get('/discussion/index.get.php')).data
        .val as RawDiscussionT[];

      for (const data of rawData) {
        await this.capturePost(data);
      }
    } catch (e) {
      console.error(e);
      await this.takeCapture();
    }

    console.log('[DISCUSSIONS] Capture complete!');
  }
}
