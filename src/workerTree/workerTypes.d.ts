import { SequelizeOptions } from 'sequelize-typescript';

export type controller<T> = {
  start: () => void;
  stop: () => void;
  connect: (options: SequelizeOptions) => Promise<T>;
};

export type workerENV = {
  client: string;
  safemode: boolean;
  verbose: boolean;
};
