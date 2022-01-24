import {
  Table,
  Column,
  Unique,
  PrimaryKey,
  CreatedAt,
  ForeignKey,
  BelongsTo,
  HasMany,
  Model,
} from 'sequelize-typescript';

import User from '../Users/User.model';
import Comment from './Comments/Comment.model';

// export interface

@Table
export default class Discussion extends Model<Discussion> {
  @Unique
  @PrimaryKey
  @Column
  id: number;

  @Column
  @ForeignKey(() => User)
  userID: number;

  @BelongsTo(() => User)
  user: User;

  @Column
  title: string;

  @Column
  type: '' | 'Request' | 'Question' | 'Announcement';

  @CreatedAt
  @Column
  timestamp: Date;

  @Column
  shouldNotify: boolean;

  @HasMany(() => Comment)
  comments: Comment[];
}
