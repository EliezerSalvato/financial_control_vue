export type EmailChangePayload = {
  newEmail: string;
  currentPassword: string;
};

export type EmailChangePayloadApi = {
  new_email: string;
  current_password: string;
};

export type EmailConfirmationPayload = {
  token: string;
};

export type EmailForm = EmailChangePayload;
