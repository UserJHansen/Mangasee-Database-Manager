import {
  Column,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  Unique,
} from 'sequelize-typescript';
import Chapter from '../Chapters/Chapter.model';

@Table
export default class Page extends Model<Page> {
  @PrimaryKey
  @Unique
  @Column
  id!: number;

  @ForeignKey(() => Chapter)
  chapter!: number;
}
