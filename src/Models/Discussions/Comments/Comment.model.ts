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
import LoggingModel from '../../Logging/Log.model';

export type Comment = {
  id: number;
  userID: number;
  content: string;
  likes: number;
  hasLiked: boolean;
  timestamp: Date;
  discussionID: number;
};

export type CommentTree = Comment & {
  replies: Reply[];
};

@Table
export default class DiscussionComment
  extends Model<Comment>
  implements Comment
{
  static async updateWithLog(newComment: CommentTree, verbose = false) {
    const comment = await DiscussionComment.findByPk(newComment.id);
    if (comment === null) {
      if (verbose)
        await LoggingModel.create({
          type: 'New Comment',
          value: newComment.content,
          targetID: newComment.id.toString(),
        });
      await DiscussionComment.create(newComment);
    } else {
      if (
        newComment.likes !== comment.likes ||
        newComment.hasLiked !== comment.hasLiked
      ) {
        const logged = await LoggingModel.findOne({
          where: { targetID: newComment.id.toString(), type: 'Likes Update' },
        });
        if (logged === null) {
          await LoggingModel.create({
            type: 'Likes Update',
            value: newComment.likes.toString(),
            previousValue: comment.likes.toString(),
            targetID: newComment.id.toString(),
          });
        } else {
          await logged.update({
            value: newComment.likes.toString(),
          });
        }
        await comment.update({
          likes: newComment.likes,
          hasLiked: newComment.hasLiked,
        });
      }

      if (
        newComment.content !== comment.content ||
        newComment.discussionID !== comment.discussionID ||
        newComment.timestamp.toLocaleString() !==
          comment.timestamp.toLocaleString() ||
        newComment.userID !== comment.userID
      ) {
        await LoggingModel.create({
          type: 'Unexpected Event',
          value: 'Comment Changed',
          targetID: newComment.id.toString(),
        });
      }
    }

    for (const reply of newComment.replies) {
      await Reply.updateWithLog(reply, verbose);
    }
  }

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
  replys!: Reply[];
}
