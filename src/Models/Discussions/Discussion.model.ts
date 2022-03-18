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
import LoggingModel from '../Logging/Log.model';

import User from '../Users/User.model';
import CommentModel from './Comments/Comment.model';
import Comment, { CommentTree } from './Comments/Comment.model';

export type Discussion = {
  id: number;
  userID: number;
  title: string;
  type: '' | 'Request' | 'Question' | 'Announcement';
  timestamp: Date;
  shouldNotify: boolean;
};

export type DiscussionTree = Discussion & {
  comments: CommentTree[];
};

@Table
export default class DiscussionModel
  extends Model<Discussion>
  implements Discussion
{
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
  title!: string;

  @Column
  type!: '' | 'Request' | 'Question' | 'Announcement';

  @CreatedAt
  @Column
  timestamp!: Date;

  @Column
  shouldNotify!: boolean;

  @HasMany(() => Comment)
  comments!: Comment[];

  static async updateWithLog(newDiscussion: DiscussionTree, verbose = false) {
    const Discussion = await DiscussionModel.findByPk(newDiscussion.id);
    if (Discussion === null) {
      if (verbose)
        await LoggingModel.create({
          type: 'New Discussion',
          value: newDiscussion.title,
          targetID: newDiscussion.id.toString(),
        });
      await DiscussionModel.create(newDiscussion);
    } else {
      if (newDiscussion.shouldNotify !== Discussion.shouldNotify) {
        await Discussion.update({ shouldNotify: newDiscussion.shouldNotify });
      }

      if (
        newDiscussion.title !== Discussion.title ||
        newDiscussion.type !== Discussion.type ||
        newDiscussion.userID !== Discussion.userID ||
        newDiscussion.timestamp.toLocaleString() !==
          Discussion.timestamp.toLocaleString()
      ) {
        await LoggingModel.create({
          type: 'Unexpected Event',
          value: 'Discussion Changed',
          targetID: newDiscussion.id.toString(),
        });
      }
    }
    for (const comment of newDiscussion.comments) {
      await CommentModel.updateWithLog(comment, verbose);
    }
  }
}
