import type { UserConfigs } from './user';

export type ProfileUpdatePayload = {
  firstName?: string;
  lastName?: string;
  configs?: UserConfigs;
};

export type ProfileUpdatePayloadApi = {
  first_name?: string;
  last_name?: string;
  configs?: UserConfigs;
};

export type ProfileUpdateSuccessResponse = {
  status: 'success';
  message: string;
};

export type NameForm = {
  firstName: string;
  lastName: string;
};
