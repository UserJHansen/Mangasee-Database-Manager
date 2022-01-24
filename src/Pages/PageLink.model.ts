import { Column, ForeignKey, Model, Table } from 'sequelize-typescript';
import Chapter from '../Chapters/Chapter.model';
import Page from './Page.model';

@Table
export default class PageLink extends Model<PageLink> {
  @ForeignKey(() => Page)
  @Column
  Page!: number;

  @ForeignKey(() => Chapter)
  @Column
  ChapterId!: number;
}
