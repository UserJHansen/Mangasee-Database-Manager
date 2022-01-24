import { Column, ForeignKey, Model, Table } from 'sequelize-typescript';
import Manga from '../Mangas/Manga.model';
import Author from './Author.model';

@Table
export default class AuthorLink extends Model<AuthorLink> {
  @ForeignKey(() => Author)
  @Column
  authorName!: string;

  @ForeignKey(() => Manga)
  @Column
  mangaName!: string;
}
