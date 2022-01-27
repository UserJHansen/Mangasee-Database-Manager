import { Column, ForeignKey, Model, Table } from 'sequelize-typescript';
import Manga from '../Mangas/Manga.model';
import { GenreT } from '../types.d';
import Genre from './Genre.model';

@Table
export default class GenreLink extends Model<GenreLink> {
  @ForeignKey(() => Genre)
  @Column
  Genre!: GenreT;

  @ForeignKey(() => Manga)
  @Column
  mangaName!: string;
}
