import { Column, HasMany, Model, Unique } from 'sequelize-typescript';

import { Discussion } from '../Discussions/Discussion.model';
import { DiscussionComment } from '../Discussions/DiscussionComment.model';

export class User extends Model {
  @Unique
  @Column
  ID: number;

  @Column
  Username: string;

  @HasMany(() => Discussion)
  Discussions: Discussion[];

  @HasMany(() => DiscussionComment)
  DiscussionComments: DiscussionComment[];
}
