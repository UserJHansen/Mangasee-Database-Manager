import {
  Table,
  Model,
  Column,
  HasMany,
  Unique,
  PrimaryKey,
  CreatedAt,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';

import { User } from '../Users/User.model';
import { DiscussionComment } from './DiscussionComment.model';

@Table
export class Discussion extends Model {
  @Column
  @Unique
  @PrimaryKey
  ID: number;

  @Column
  @ForeignKey(() => User)
  UserID: number;

  @BelongsTo(() => User)
  User: User;

  @Column
  Title: number;

  @Column
  Type: '' | 'Request' | 'Question' | 'Announcement';

  @CreatedAt
  @Column
  Timestamp: Date;

  @Column
  ShouldNotify: boolean;

  @HasMany(() => DiscussionComment)
  Comments: DiscussionComment[];
}
