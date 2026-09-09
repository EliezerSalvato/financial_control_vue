import type { UserResource } from './user';

export type RegistrationPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  passwordConfirmation: string;
};

export type RegistrationPayloadApi = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password_confirmation: string;
};

export type RegistrationSuccessResponse = {
  status: 'success';
  message: string;
  type: 'object';
  data: {
    user: UserResource;
  };
};

export type RegistrationForm = RegistrationPayload;
