import { defineStore } from 'pinia';
import { useUserStore } from '@/stores/user';
import { computed, ref } from 'vue';
import { refreshSession, revokeSessions } from '@/api/auth';

const REMEMBER_ME_STORAGE_KEY = 'rememberMe';

function readRememberMe(): boolean {
  return localStorage.getItem(REMEMBER_ME_STORAGE_KEY) === 'true';
}

function writeRememberMe(value: boolean) {
  if (value) {
    localStorage.setItem(REMEMBER_ME_STORAGE_KEY, 'true');
  } else {
    localStorage.removeItem(REMEMBER_ME_STORAGE_KEY);
  }
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null);
  const rememberMe = ref(readRememberMe());

  const isAuthenticated = computed(() => !!token.value);

  function setToken(value: string | null) {
    token.value = value;
  }

  function setRememberMe(value: boolean) {
    rememberMe.value = value;
    writeRememberMe(value);
  }

  function clearSession() {
    setToken(null);
    setRememberMe(false);
    useUserStore().clearUser();
  }

  async function refreshToken() {
    const response = await refreshSession({ rememberMe: rememberMe.value });
    setToken(response.data.token);
    useUserStore().setUser(response.data.user);
  }

  async function logout() {
    try {
      await revokeSessions();
    } finally {
      clearSession();
    }
  }

  return {
    token,
    rememberMe,
    isAuthenticated,
    setToken,
    setRememberMe,
    clearSession,
    refreshToken,
    logout,
  };
});
