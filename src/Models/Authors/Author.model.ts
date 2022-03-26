import {
  BelongsToMany,
  Column,
  Model,
  PrimaryKey,
  Table,
  Unique,
} from 'sequelize-typescript';
import LoggingModel from '../Logging/Log.model';
import Manga from '../Mangas/Manga.model';
import AuthorLink from './AuthorLink.model';

export type Author = {
  name: string;
};
export type AuthorTree = Author & { manga: string };

@Table
export default class AuthorModel extends Model<Author> implements Author {
  @Unique
  @PrimaryKey
  @Column
  name!: string;

  @BelongsToMany(() => Manga, () => AuthorLink)
  manga!: (Manga & { AuthorLink: AuthorLink })[];

  static async updateWithLog(newAuthor: AuthorTree, verbose = false) {
    const oldAuthor = await AuthorModel.findByPk(newAuthor.name);
    if (oldAuthor === null) {
      await AuthorModel.create({ name: newAuthor.name });
      await AuthorLink.create({
        authorName: newAuthor.name,
        mangaName: newAuthor.manga,
      });
      if (verbose) {
        await LoggingModel.create({
          type: 'New Author',
          value: newAuthor.name,
          targetID: newAuthor.name,
        });
        console.log(`Created Author: ${newAuthor.name}`);
      }
    } else {
      const link = await AuthorLink.findOne({
        where: { authorName: newAuthor.name, mangaName: newAuthor.manga },
      });
      if (!link) {
        await AuthorLink.create({
          authorName: newAuthor.name,
          mangaName: newAuthor.manga,
        });
      }
    }
  }
}
