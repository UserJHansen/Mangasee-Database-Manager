import { AllowNull, Column, Model, Table } from 'sequelize-typescript';

export type Log = {
  type:
    | 'Username Update'
    | 'New Discussion'
    | 'New Comment'
    | 'New Reply'
    | 'Unexpected Event'
    | 'Notify Updated'
    | 'Likes Update'
    | 'New Chapter'
    | 'Page Count Update'
    | 'New Manga'
    | 'Scan Status Changed'
    | 'Publish Status Changed'
    | 'Last Read Update'
    | 'Subscription Update'
    | 'Subscription Number Update'|'Notification Pref Update';
  value: string;
  previousValue?: string;
  targetID: string;
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
  targetID: string;

  @Column
  value!: string;
}
