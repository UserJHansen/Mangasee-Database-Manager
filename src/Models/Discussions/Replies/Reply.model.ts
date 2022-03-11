import {
  BelongsTo,
  Column,
  CreatedAt,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  Unique,
} from 'sequelize-typescript';

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

  @CreatedAt
  @Column
  timestamp!: Date;

  @Column
  @ForeignKey(() => Comment)
  commentID!: number;

  @BelongsTo(() => Comment)
  parent!: Comment;
}
