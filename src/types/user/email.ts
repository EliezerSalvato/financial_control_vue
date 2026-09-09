export type EmailChangePayload = {
  newEmail: string;
  currentPassword: string;
};

export type EmailChangePayloadApi = {
  new_email: string;
  current_password: string;
};

export type EmailChangeSuccessResponse = {
  status: 'success';
  message: string;
};

export type EmailConfirmationPayload = {
  token: string;
};

export type EmailConfirmationSuccessResponse = {
  status: 'success';
  message: string;
};

export type EmailForm = {
  currentPassword: string;
  newEmail: string;
};
