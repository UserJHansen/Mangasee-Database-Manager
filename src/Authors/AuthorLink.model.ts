import { Column, ForeignKey, Model, Table } from 'sequelize-typescript';
import Manga from '../Mangas/Manga.model';
import Author from './Author.model';

export type AuthorLink = {
  authorName: string;
  mangaName: string;
};

@Table
export default class AuthorLinkModel
  extends Model<AuthorLink>
  implements AuthorLink
{
  @ForeignKey(() => Author)
  @Column
  authorName!: string;

  @ForeignKey(() => Manga)
  @Column
  mangaName!: string;
}
