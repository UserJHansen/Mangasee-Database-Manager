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
import Manga from '../Manga.model';

export type Comment = {
  id: number;
  userID: number;
  content: string;
  likes: number;
  hasLiked: boolean;
  timestamp: Date;
  mangaID: string;
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

  @CreatedAt
  @Column
  timestamp!: Date;

  @Column
  @ForeignKey(() => Manga)
  mangaID!: string;

  @BelongsTo(() => Manga)
  parent!: Manga;

  @HasMany(() => Reply)
  replys!: Reply[];
}
