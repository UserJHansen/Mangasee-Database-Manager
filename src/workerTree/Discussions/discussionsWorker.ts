import AdjustedDate from '../../utils/AdjustedDate';
import { RawDiscussionT, RawPostT } from '../../utils/types';
import User from '../../Models/Users/User.model';
import DiscussionModel from '../../Models/Discussions/Discussion.model';
import DiscussionReply from '../../Models/Discussions/Replies/Reply.model';
import { workerData } from 'worker_threads';
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

  constructor(client: string | CookieJar.Serialized, interval: number) {
    this.client = ClientController.parseClient(client);
    this.interval = interval;
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

    this.timer = setInterval(() => this.takeCapture(), this.interval);

    this.running = true;
  }

  stop() {
    this.running = false;

    if (!this.running) return;

    clearInterval(this.timer);

    this.running = false;
  }

  private async takeCapture() {
    console.log('[DISCUSSIONS] Taking capture...');

    const rawData = (await this.client.get('/discussion/index.get.php')).data
        .val as RawDiscussionT[],
      users = new Map<string, number>(),
      quietCreate = workerData.quietCreate;

    for (const data of rawData) {
      const post = (
        await this.client.post('/discussion/post.get.php', {
          id: parseInt(data.PostID),
        })
      ).data.val as RawPostT;

      users.set(post.Username, parseInt(post.UserID));

      await DiscussionModel.updateWithLog(
        {
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
              discussionID: parseInt(post.PostID),
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
        },
        !quietCreate,
      );
    }

    for (const [key, value] of users) {
      await User.checkUser({ username: key, id: value });
    }
  }
}
