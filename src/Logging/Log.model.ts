import { AllowNull, Column, Model, Table } from 'sequelize-typescript';

export type Log = {
  type:
    | 'Username Update'
    | 'New Discussion'
    | 'New Comment'
    | 'New Reply'
    | 'Unexpected Event'
    | 'Notify Updated'
    | 'Likes Update';
  value: string;
  previousValue?: string;
  targetID: number;
};

@Table
export default class LoggingModel extends Model<Log> implements Log {
  @Column
  type!:
    | 'Username Update'
    | 'New Discussion'
    | 'New Comment'
    | 'New Reply'
    | 'Unexpected Event'
    | 'Notify Updated'
    | 'Likes Update';

  @AllowNull(true)
  @Column
  previousValue: string;

  @Column
  targetID: number;

  @Column
  value!: string;
}
