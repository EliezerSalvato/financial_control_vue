import type { AppLocale } from '@/locales/locale';

export type UserConfigs = {
  locale?: AppLocale;
};

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  fullName: string;
  configs: UserConfigs;
};

export type UserAttributesApi = {
  id?: string;
  first_name: string;
  last_name: string;
  email: string;
  configs?: UserConfigs;
};

export type UserResource = {
  data: {
    id: string;
    type: 'user';
    attributes: UserAttributesApi;
  };
};
