export type controller = {
  start: () => void;
  stop: () => void;
};

export type workerENV = {
  client: string;
  safemode: boolean;
  verbose: boolean;
};
