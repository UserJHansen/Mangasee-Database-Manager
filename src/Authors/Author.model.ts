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

export type Author = {
  name: string;
};

@Table
export default class AuthorModel extends Model<Author> implements Author {
  @Unique
  @PrimaryKey
  @Column
  name!: string;

  @BelongsToMany(() => Manga, () => AuthorLink)
  manga!: Manga[];
}
