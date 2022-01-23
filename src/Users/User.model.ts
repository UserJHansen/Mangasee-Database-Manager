import {
  Column,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  Unique,
} from 'sequelize-typescript';

import Discussion from '../Discussions/Discussion.model';
import Comment from '../Comments/Comment.model';

@Table
export default class User extends Model {
  @Unique
  @PrimaryKey
  @Column
  id!: number;

  @Column
  username!: string;

  @HasMany(() => Discussion)
  discussions: Discussion[];

  @HasMany(() => Comment)
  discussionComments: Comment<Discussion>[];
}
