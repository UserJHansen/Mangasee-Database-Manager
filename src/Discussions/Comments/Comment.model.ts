import {
  BelongsTo,
  Column,
  CreatedAt,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  Unique,
} from 'sequelize-typescript';

import Reply from '../Replies/Reply.model';
import User from '../../Users/User.model';
import Discussion from '../Discussion.model';

@Table
export default class DiscussionComment extends Model<DiscussionComment> {
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
  @ForeignKey(() => Discussion)
  discussionID!: number;

  @BelongsTo(() => Discussion)
  parent!: Discussion;

  @HasMany(() => Reply)
  replys: Reply[];
}
