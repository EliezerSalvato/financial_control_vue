import type { AppLocale } from '@/locales/locale';
import type { JsonApiResource } from '@/types/api';

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
  data: JsonApiResource<'user', UserAttributesApi>;
};
