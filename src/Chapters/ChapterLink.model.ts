import { Column, ForeignKey, Model, Table } from 'sequelize-typescript';
import Manga from '../Mangas/Manga.model';
import Chapter from './Chapter.model';

@Table
export default class ChapterLink extends Model<ChapterLink> {
  @ForeignKey(() => Manga)
  @Column
  mangaName!: string;

  @ForeignKey(() => Chapter)
  @Column
  chapterId!: number;
}
