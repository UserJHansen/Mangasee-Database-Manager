import {
  BelongsTo,
  Column,
  CreatedAt,
  ForeignKey,
  PrimaryKey,
  Table,
  Unique,
} from 'sequelize-typescript';

import ReplyParent from '../Replies/ReplyParent.model';
import User from '../Users/User.model';
import CommentParent from './CommentParent.model';

@Table
export default class Comment<T> extends ReplyParent<Comment<T>> {
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
  likes!: number;

  @Column
  hasLiked!: boolean;

  @CreatedAt
  @Column
  timestamp!: Date;

  @Column
  @ForeignKey(() => CommentParent)
  parentID!: number;

  @BelongsTo(() => CommentParent)
  parent!: CommentParent<T>;
}
