import { HasMany, Model, Table } from 'sequelize-typescript';

import Comment from './Comment.model';

@Table
export default class CommentParent<T> extends Model {
  @HasMany(() => Comment)
  comments: Comment<T>[];
}
