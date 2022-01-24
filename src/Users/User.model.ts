import {
  Column,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  Unique,
} from 'sequelize-typescript';

import Discussion from '../Discussions/Discussion.model';
import DiscussionComment from '../Discussions/Comments/Comment.model';

@Table
export default class User extends Model<User> {
  @Unique
  @PrimaryKey
  @Column
  id!: number;

  @Column
  username!: string;

  @HasMany(() => Discussion)
  discussions!: Discussion[];

  @HasMany(() => DiscussionComment)
  discussionComments!: DiscussionComment[];
}
