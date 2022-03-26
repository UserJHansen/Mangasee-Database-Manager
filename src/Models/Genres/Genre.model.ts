import {
  BelongsToMany,
  Column,
  Model,
  PrimaryKey,
  Table,
  Unique,
} from 'sequelize-typescript';

import Manga from '../Mangas/Manga.model';
import { GenreT } from '../../utils/types';
import GenreLink from './GenreLink.model';

export type Genre = {
  genre: GenreT;
};
export type GenreTree = Genre & {
  manga: string;
};

@Table
export default class GenreModel extends Model<Genre> implements Genre {
  @Unique
  @PrimaryKey
  @Column
  genre!: GenreT;

  @BelongsToMany(() => Manga, () => GenreLink)
  manga!: (Manga & { GenreLink: GenreLink })[];

  static async updateWithLog(newGenre: GenreTree, verbose = false) {
    const oldAuthor = await GenreModel.findByPk(newGenre.genre);
    if (oldAuthor === null) {
      await GenreModel.create({ genre: newGenre.genre });
      await GenreLink.create({
        genre: newGenre.genre,
        mangaName: newGenre.manga,
      });
      if (verbose) {
        console.log(`Created Genre: ${newGenre.genre}`);
      }
    } else {
      const link = await GenreLink.findOne({
        where: { genre: newGenre.genre, mangaName: newGenre.manga },
      });
      if (!link) {
        await GenreLink.create({
          genre: newGenre.genre,
          mangaName: newGenre.manga,
        });
      }
    }
  }
}
