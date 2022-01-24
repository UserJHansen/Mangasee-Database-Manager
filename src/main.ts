import 'dotenv/config';

import { Sequelize } from 'sequelize-typescript';
// import Discussion from './Discussions/Discussion.model';
// import User from './Users/User.model';

export async function MAIN() {
  const database = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
    models: [__dirname + '/**/*.model.*s'],
  });
  try {
    await database.authenticate();
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }

  console.log(process.env.MANGASEE_USERNAME);
  console.log(process.env.MANGASEE_PASSWORD);

  database.sync();

  // const user = new User({ id: 1, username: 'admin' });

  // user.save();

  // // const discussion = new Discussion({
  // //   id: 168,
  // //   userID: 1,
  // //   title: 'test',
  // //   type: 'Request',
  // //   timestamp: new Date(),
  // //   shouldNotify: true,
  // // });

  // discussion.save();
}

MAIN();
