import {
  Table,
  Column,
  Unique,
  PrimaryKey,
  CreatedAt,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';

import CommentParent from '../Comments/CommentParent.model';
import User from '../Users/User.model';

// export interface 

@Table
export default class Discussion extends CommentParent<Discussion> {
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
}
