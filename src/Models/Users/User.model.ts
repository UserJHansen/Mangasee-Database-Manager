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
import LoggingModel from '../Logging/Log.model';

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

  static async checkUser(userDetails: User) {
    const { id, username } = userDetails;
    const user = await UserModel.findByPk(id);
    if (user !== null) {
      if (user.username !== username) {
        await LoggingModel.create({
          type: 'Username Update',
          value: username,
          previousValue: user.username,
          targetID: id.toString(),
        });
        await user.update({ username });
      }
    } else {
      try {
        await UserModel.create(userDetails);
      } catch (e) {
        UserModel.checkUser(userDetails);
      }
    }
  }
}
