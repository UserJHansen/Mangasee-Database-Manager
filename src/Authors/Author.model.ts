import {
  BelongsToMany,
  Column,
  Model,
  PrimaryKey,
  Table,
  Unique,
} from 'sequelize-typescript';
import Manga from '../Mangas/Manga.model';
import AuthorLink from './AuthorLink.model';

@Table
export default class Author extends Model<Author> {
  @Unique
  @PrimaryKey
  @Column
  name!: string;

  @BelongsToMany(() => Manga, () => AuthorLink)
  manga!: Manga[];
}
