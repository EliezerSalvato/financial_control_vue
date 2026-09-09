<script setup lang="ts">
import type { AccountCreatePayload, AccountForm, AccountKind, BankAccountType } from '@/types/account';
import type { LogoOption } from '@/components/inputs/LogoSelect.vue';
import { getAccount, updateAccount } from '@/api/accounts';
import { getInstitution, listInstitutions } from '@/api/institutions';
import { useI18n } from 'vue-i18n';
import { useNotificationStore } from '@/stores/notification';
import { useFormErrors } from '@/composables/useFormErrors';
import { institutionLogoUrl } from '@/utils/institutionLogos';
import { useRoute, useRouter } from 'vue-router';
import { computed, nextTick, onMounted, reactive, ref, useTemplateRef, watch } from 'vue';
import CheckBox from '@/components/inputs/CheckBox.vue';
import ColorPicker from '@/components/inputs/ColorPicker.vue';
import FormPanel from '@/components/FormPanel.vue';
import InputNumeric from '@/components/inputs/InputNumeric.vue';
import InputText from '@/components/inputs/InputText.vue';
import InstitutionSelect from '@/components/inputs/InstitutionSelect.vue';
import NotificationMessage from '@/components/NotificationMessage.vue';
import Select from '@/components/inputs/Select.vue';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const notificationStore = useNotificationStore();

const nameInput = useTemplateRef<{ focus: () => void }>('nameInput');
const loading = ref(true);
const institutionItems = ref<LogoOption[]>([]);

const form = reactive<AccountForm>({
  name: '',
  kind: '',
  institutionId: '',
  bankAccountType: '',
  currentBalance: 0,
  allowNegativeBalance: false,
  color: '',
  active: true,
});

const { errors, validateWith, applyCatch } = useFormErrors(form);

const isBankAccount = computed(() => form.kind === 'bank_account');

const kindItems = computed(() => ({
  bank_account: t('accounts.kinds.bankAccount'),
  cash: t('accounts.kinds.cash'),
}));

const bankAccountTypeItems = computed(() => ({
  checking: t('accounts.bankAccountTypes.checking'),
  savings: t('accounts.bankAccountTypes.savings'),
  investment: t('accounts.bankAccountTypes.investment'),
  salary: t('accounts.bankAccountTypes.salary'),
}));

function validate(): boolean {
  return validateWith((handler) => {
    handler.checkBlank(['name', 'kind', 'color']);

    if (form.kind === 'bank_account') {
      handler.checkBlank(['institutionId', 'bankAccountType']);
    }

    return handler;
  });
}

function buildPayload(): AccountCreatePayload {
  const kind = form.kind as AccountKind;
  const account: AccountCreatePayload['account'] = {
    name: form.name,
    kind,
    color: form.color,
    currentBalance: form.currentBalance ?? 0,
    allowNegativeBalance: form.allowNegativeBalance,
    active: form.active,
  };

  if (kind === 'bank_account') {
    account.institutionId = form.institutionId;
    account.bankAccountType = form.bankAccountType as BankAccountType;
  }

  return { account };
}

async function loadInstitutions() {
  try {
    const result = await listInstitutions({
      perPage: 100,
      sort: 'name asc',
      filters: { activeEq: true },
    });

    institutionItems.value = result.institutions.map((institution) => ({
      key: institution.id,
      label: institution.name,
      url: institutionLogoUrl(institution.logoKey),
    }));
  } catch {
    institutionItems.value = [];
  }
}

function hasInstitutionOption(institutionId: string) {
  return institutionItems.value.some((item) => item.key === institutionId);
}

function addInstitutionOption(id: string, label: string, url?: string | null) {
  if (hasInstitutionOption(id)) return;

  institutionItems.value = [...institutionItems.value, { key: id, label, url }].sort((a, b) => a.label.localeCompare(b.label));
}

async function ensureInstitutionOption(institutionId: string) {
  if (!institutionId || hasInstitutionOption(institutionId)) {
    return;
  }

  try {
    const institution = await getInstitution(institutionId);

    addInstitutionOption(institution.id, institution.name, institutionLogoUrl(institution.logoKey));
  } catch {
    // Keep the id selectable even if the institution cannot be loaded.
    addInstitutionOption(institutionId, institutionId);
  }
}

async function loadAccount() {
  const id = String(route.params.id);

  try {
    const result = await getAccount(id);

    form.name = result.name;
    form.kind = result.kind;
    form.institutionId = result.institutionId ?? '';
    form.bankAccountType = result.bankAccountType ?? '';
    form.currentBalance = result.currentBalance;
    form.allowNegativeBalance = result.allowNegativeBalance;
    form.color = result.color;
    form.active = result.active;

    if (result.institutionId) {
      await ensureInstitutionOption(result.institutionId);
    }
  } catch (error) {
    applyCatch(error);
  }
}

async function save() {
  if (!validate()) return;

  loading.value = true;

  try {
    const result = await updateAccount(String(route.params.id), buildPayload());

    await router.push({ name: 'accounts' });
    notificationStore.setCurrentMessage(result.message, 'success');
  } catch (error) {
    applyCatch(error);
  } finally {
    loading.value = false;
  }
}

watch(
  () => form.kind,
  (kind) => {
    if (kind !== 'bank_account') {
      form.institutionId = '';
      form.bankAccountType = '';
      errors.value.institutionId = [];
      errors.value.bankAccountType = [];
    }
  },
);

onMounted(async () => {
  try {
    await loadInstitutions();
    await loadAccount();
  } finally {
    loading.value = false;
  }

  await nextTick();
  nameInput.value?.focus();
});
</script>

<template>
  <FormPanel type="edit" model-name="account" gender="female" :show-loading="loading" @call:save="save">
    <template #form>
      <NotificationMessage v-if="errors.base.length" type="danger" @close="errors.base = []">
        <p v-for="error in errors.base" :key="error">{{ error }}</p>
      </NotificationMessage>

      <InputText ref="nameInput" v-model="form.name" name="name" :label="t('accounts.form.name')" required :errors="errors.name" />

      <div class="field">
        <Select
          v-model="form.kind"
          name="kind"
          :label="t('accounts.form.kind')"
          :placeholder="t('accounts.form.kindPlaceholder')"
          :items="kindItems"
          required
          :error="errors.kind[0]"
        />
      </div>

      <template v-if="isBankAccount">
        <InstitutionSelect
          v-model="form.institutionId"
          v-model:items="institutionItems"
          name="institutionId"
          :label="t('accounts.form.institutionId')"
          :placeholder="t('accounts.form.institutionIdPlaceholder')"
          required
          :error="errors.institutionId[0]"
        />

        <div class="field">
          <Select
            v-model="form.bankAccountType"
            name="bankAccountType"
            :label="t('accounts.form.bankAccountType')"
            :placeholder="t('accounts.form.bankAccountTypePlaceholder')"
            :items="bankAccountTypeItems"
            required
            :error="errors.bankAccountType[0]"
          />
        </div>
      </template>

      <div class="field">
        <InputNumeric
          v-model="form.currentBalance"
          name="currentBalance"
          :label="t('accounts.form.currentBalance')"
          :error="errors.currentBalance[0]"
        />
      </div>

      <div class="field">
        <div class="control">
          <CheckBox v-model="form.allowNegativeBalance" name="allowNegativeBalance" :label="t('accounts.form.allowNegativeBalance')" />
        </div>
      </div>

      <ColorPicker v-model="form.color" name="color" :label="t('accounts.form.color')" required :errors="errors.color" />

      <div class="field">
        <div class="control">
          <CheckBox v-model="form.active" name="active" :label="t('accounts.form.active')" />
        </div>
      </div>
    </template>
  </FormPanel>
</template>
