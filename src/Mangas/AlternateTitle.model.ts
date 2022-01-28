import { Table } from 'sequelize-typescript';

export type AltTitle = {
  title: string;
  manga: string;
};

@Table
export default class AlternateTitle
  extends Model<AltTitle>
  implements AltTitle {}
