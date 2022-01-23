import 'dotenv/config';

import { Sequelize } from 'sequelize-typescript';

export async function MAIN() {
  const database = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
    models: [__dirname + '/**/*.model.ts'],
    // modelMatch: (filename, member) => {
    //   return (
    //     filename.substring(0, filename.indexOf('.model')) ===
    //     member.toLowerCase()
    //   );
    // },
  });
  try {
    await database.authenticate();
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }

  console.log(process.env.MANGASEE_USERNAME);
  console.log(process.env.MANGASEE_PASSWORD);
}

MAIN();
