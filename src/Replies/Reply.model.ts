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

import User from '../Users/User.model';
import ReplyParent from './ReplyParent.model';

@Table
export default class Reply<T> extends Model {
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
  content: string;

  @CreatedAt
  @Column
  timestamp: Date;

  @Column
  @ForeignKey(() => ReplyParent)
  parentID: number;

  @BelongsTo(() => ReplyParent)
  parent: ReplyParent<T>;
}
