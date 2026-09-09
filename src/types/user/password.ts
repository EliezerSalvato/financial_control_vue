export type PasswordResetPayload = {
  email: string;
};

export type PasswordResetUpdatePayload = {
  token: string;
  password: string;
  passwordConfirmation: string;
};

export type PasswordResetUpdatePayloadApi = {
  token: string;
  password: string;
  password_confirmation: string;
};

export type PasswordChangePayload = {
  currentPassword: string;
  password: string;
  passwordConfirmation: string;
};

export type PasswordChangePayloadApi = {
  current_password: string;
  password: string;
  password_confirmation: string;
};

export type ForgotPasswordForm = {
  email: string;
};

export type ResetPasswordForm = {
  password: string;
  passwordConfirmation: string;
};

export type PasswordForm = {
  currentPassword: string;
  password: string;
  passwordConfirmation: string;
};
