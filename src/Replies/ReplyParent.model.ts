import { HasMany, Model, Table } from 'sequelize-typescript';

import Reply from './Reply.model';

@Table
export default class ReplyParent<T> extends Model {
  @HasMany(() => Reply)
  replys: Reply<T>[];
}
