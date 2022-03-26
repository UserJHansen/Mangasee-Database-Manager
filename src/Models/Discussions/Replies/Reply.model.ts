import {
  BelongsTo,
  Column,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  Unique,
} from 'sequelize-typescript';
import LoggingModel from '../../Logging/Log.model';

import User from '../../Users/User.model';
import Comment from '../Comments/Comment.model';

export type Reply = {
  id: number;
  userID: number;
  content: string;
  timestamp: Date;
  commentID: number;
};

@Table
export default class DiscussionReply extends Model<Reply> implements Reply {
  @Unique
  @PrimaryKey
  @Column
  id!: number;

  @Column
  @ForeignKey(() => User)
  userID!: number;

  @BelongsTo(() => User)
  user!: User;

  @Column
  content!: string;

  @Column
  timestamp!: Date;

  @Column
  @ForeignKey(() => Comment)
  commentID!: number;

  @BelongsTo(() => Comment)
  parent!: Comment;

  static async updateWithLog(newReply: Reply, verbose = false) {
    const reply = await DiscussionReply.findByPk(newReply.id);
    if (reply === null) {
      if (verbose)
        await LoggingModel.create({
          type: 'New Reply',
          value: newReply.content,
          targetID: newReply.id.toString(),
        });
      await DiscussionReply.create(newReply);
    } else {
      if (
        newReply.commentID !== reply.commentID ||
        newReply.userID !== reply.userID ||
        newReply.timestamp.toLocaleString() !==
          reply.timestamp.toLocaleString() ||
        newReply.content !== reply.content
      ) {
        await LoggingModel.create({
          type: 'Unexpected Event',
          value: 'Reply Changed',
          targetID: newReply.id.toString(),
        });
      }
    }
  }
}
