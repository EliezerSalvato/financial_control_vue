import type { ProfileUpdatePayload, ProfileUpdatePayloadApi } from '@/types/user';

export const profileTransformer = {
  toApi(payload: ProfileUpdatePayload): ProfileUpdatePayloadApi {
    const api: ProfileUpdatePayloadApi = {};

    if (payload.firstName !== undefined) {
      api.first_name = payload.firstName;
    }

    if (payload.lastName !== undefined) {
      api.last_name = payload.lastName;
    }

    if (payload.configs !== undefined) {
      api.configs = payload.configs;
    }

    return api;
  },
};
