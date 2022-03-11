import { Column, ForeignKey, Model, Table } from 'sequelize-typescript';
import Manga from '../Mangas/Manga.model';
import { GenreT } from '../../utils/types';
import Genre from './Genre.model';

export type GenreLink = {
  genre: GenreT;
  mangaName: string;
};

@Table
export default class GenreLinkModel
  extends Model<GenreLink>
  implements GenreLink
{
  @ForeignKey(() => Genre)
  @Column
  genre!: GenreT;

  @ForeignKey(() => Manga)
  @Column
  mangaName!: string;
}
