import {
  Column,
  ForeignKey,
  Table,
  Model,
  Unique,
  PrimaryKey,
} from 'sequelize-typescript';
import MangaModel from './Manga.model';

export type AltTitle = {
  title: string;
  manga: string;
};

@Table({
  modelName: 'AlternateTitle',
  tableName: 'AlternateTitles',
})
export default class AlternateTitleModel
  extends Model<AltTitle>
  implements AltTitle
{
  @Unique
  @PrimaryKey
  @Column
  title!: string;

  @ForeignKey(() => MangaModel)
  @Column
  manga!: string;

  static async updateWithLog(newAltTitle: AltTitle, verbose = false) {
    const altTitle = await AlternateTitleModel.findOne({
      where: newAltTitle,
    });
    if (altTitle === null) {
      await AlternateTitleModel.create(newAltTitle);
      if (verbose) {
        console.log(`${newAltTitle.title} added`);
      }
    }
  }
}
