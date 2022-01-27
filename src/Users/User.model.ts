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

export type User = {
  id: number;
  username: string;
};
@Table
export default class UserModel extends Model<User> implements User {
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
