export type ApiErrorBody = {
  status: 'error';
  message: string;
  details: Record<string, string[]>;
};
