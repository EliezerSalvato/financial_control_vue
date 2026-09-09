import type { Transformer } from '@/transformers/types';
import type { User, UserAttributesApi, UserConfigs, UserResource } from '@/types/user';
import { keysToCamelCase, keysToSnakeCase } from '@/utils/case';

type UserApi = Required<Pick<UserAttributesApi, 'id' | 'first_name' | 'last_name' | 'email'>> & {
  configs?: UserConfigs;
};

type UserWithoutDerived = Omit<User, 'fullName'>;

function buildFullName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim();
}

export const userTransformer: Transformer<UserApi, User> = {
  fromApi(data) {
    const camel = keysToCamelCase<UserWithoutDerived>(data);

    return {
      ...camel,
      configs: camel.configs ?? {},
      fullName: buildFullName(camel.firstName, camel.lastName),
    };
  },

  toApi(data) {
    const { fullName: _fullName, ...rest } = data;

    return keysToSnakeCase<UserApi>(rest);
  },
};

export function userFromResource(resource: UserResource): User {
  const { attributes } = resource.data;

  return userTransformer.fromApi({
    id: attributes.id ?? resource.data.id,
    first_name: attributes.first_name,
    last_name: attributes.last_name,
    email: attributes.email,
    configs: attributes.configs ?? {},
  });
}
