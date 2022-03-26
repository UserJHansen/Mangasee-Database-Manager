import {
  BelongsTo,
  Column,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  Unique,
} from 'sequelize-typescript';

import Reply from '../Replies/Reply.model';
import User from '../../Users/User.model';
import Manga from '../Manga.model';
import LoggingModel from '../../Logging/Log.model';

export type Comment = {
  id: number;
  userID: number;
  content: string;
  likes: number;
  hasLiked: boolean;
  timestamp: Date;
  mangaName: string;
};
export type CommentTree = Comment & {
  replies: Reply[];
};
@Table
export default class MangaComment extends Model<Comment> implements Comment {
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

  @Column
  timestamp!: Date;

  @Column
  @ForeignKey(() => Manga)
  mangaName!: string;

  @BelongsTo(() => Manga)
  manga!: Manga;

  @HasMany(() => Reply)
  replys!: Reply[];

  static async updateWithLog(newComment: CommentTree, verbose = false) {
    const comment = await MangaComment.findByPk(newComment.id);
    if (comment === null) {
      if (verbose)
        await LoggingModel.create({
          type: 'New Comment',
          value: newComment.content,
          targetID: newComment.id.toString(),
        });
      await MangaComment.create(newComment);
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
        newComment.mangaName !== comment.mangaName ||
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
}
