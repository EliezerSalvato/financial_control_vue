<script setup lang="ts">
import type { CreditCardForm, CreditCardUpdatePayload } from '@/types/credit_card';
import type { ColorOption } from '@/components/inputs/ColorSelect.vue';
import type { LogoOption } from '@/components/inputs/LogoSelect.vue';
import { getAccount, listAccounts } from '@/api/accounts';
import { getCreditCard, updateCreditCard } from '@/api/credit_cards';
import { getInstitution, listInstitutions } from '@/api/institutions';
import { useI18n } from 'vue-i18n';
import { useNotificationStore } from '@/stores/notification';
import { useFormErrors } from '@/composables/useFormErrors';
import { institutionLogoUrl } from '@/utils/institutionLogos';
import { listNetworkLogos } from '@/utils/networkLogos';
import { useRoute, useRouter } from 'vue-router';
import { computed, nextTick, onMounted, reactive, ref, useTemplateRef, watch } from 'vue';
import AccountSelect from '@/components/inputs/AccountSelect.vue';
import InstitutionSelect from '@/components/inputs/InstitutionSelect.vue';
import CheckBox from '@/components/inputs/CheckBox.vue';
import FormPanel from '@/components/FormPanel.vue';
import InputNumber from '@/components/inputs/InputNumber.vue';
import InputNumeric from '@/components/inputs/InputNumeric.vue';
import InputText from '@/components/inputs/InputText.vue';
import LogoSelect from '@/components/inputs/LogoSelect.vue';
import NotificationMessage from '@/components/NotificationMessage.vue';

const { t, te } = useI18n();
const route = useRoute();
const router = useRouter();
const notificationStore = useNotificationStore();

const nameInput = useTemplateRef<{ focus: () => void }>('nameInput');
const loading = ref(true);
const institutionItems = ref<LogoOption[]>([]);
const accountItems = ref<ColorOption[]>([]);
const initialTotalLimit = ref<number | null>(null);
const initialAvailableLimit = ref(0);

const form = reactive<CreditCardForm>({
  institutionId: '',
  defaultPaymentAccountId: '',
  name: '',
  totalLimit: 0,
  availableLimit: 0,
  allowNegativeAvailableLimit: false,
  closingDay: null,
  dueDay: null,
  network: '',
  active: true,
});

const { errors, validateWith, applyCatch } = useFormErrors(form);
const networkItems = computed(() =>
  listNetworkLogos().map((logo) => {
    const translationKey = `creditCards.networks.${logo.key}`;

    return {
      ...logo,
      label: te(translationKey) ? t(translationKey) : logo.label,
    };
  }),
);

function validate(): boolean {
  return validateWith((handler) => handler.checkBlank(['institutionId', 'defaultPaymentAccountId', 'name', 'network']));
}

function buildPayload(): CreditCardUpdatePayload {
  return {
    creditCard: {
      institutionId: form.institutionId,
      defaultPaymentAccountId: form.defaultPaymentAccountId,
      name: form.name,
      totalLimit: form.totalLimit ?? 0,
      allowNegativeAvailableLimit: form.allowNegativeAvailableLimit,
      network: form.network,
      active: form.active,
    },
  };
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

async function loadAccounts() {
  try {
    const result = await listAccounts({
      perPage: 100,
      sort: 'name asc',
      filters: { activeEq: true },
    });

    accountItems.value = result.accounts.map((account) => ({
      key: account.id,
      label: account.name,
      color: account.color,
    }));
  } catch {
    accountItems.value = [];
  }
}

function hasInstitutionOption(institutionId: string) {
  return institutionItems.value.some((item) => item.key === institutionId);
}

function hasAccountOption(accountId: string) {
  return accountItems.value.some((item) => item.key === accountId);
}

function addInstitutionOption(id: string, label: string, url?: string | null) {
  if (hasInstitutionOption(id)) return;

  institutionItems.value = [...institutionItems.value, { key: id, label, url }].sort((a, b) => a.label.localeCompare(b.label));
}

function addAccountOption(id: string, label: string, color?: string | null) {
  if (hasAccountOption(id)) return;

  accountItems.value = [...accountItems.value, { key: id, label, color }].sort((a, b) => a.label.localeCompare(b.label));
}

async function ensureInstitutionOption(institutionId: string) {
  if (!institutionId || hasInstitutionOption(institutionId)) {
    return;
  }

  try {
    const institution = await getInstitution(institutionId);

    addInstitutionOption(institution.id, institution.name, institutionLogoUrl(institution.logoKey));
  } catch {
    addInstitutionOption(institutionId, institutionId);
  }
}

async function ensureAccountOption(accountId: string) {
  if (!accountId || hasAccountOption(accountId)) {
    return;
  }

  try {
    const account = await getAccount(accountId);

    addAccountOption(account.id, account.name, account.color);
  } catch {
    addAccountOption(accountId, accountId);
  }
}

async function loadCreditCard() {
  const id = String(route.params.id);

  try {
    const result = await getCreditCard(id);

    form.institutionId = result.institutionId;
    form.defaultPaymentAccountId = result.defaultPaymentAccountId;
    form.name = result.name;
    initialTotalLimit.value = result.totalLimit;
    initialAvailableLimit.value = result.availableLimit;
    form.totalLimit = result.totalLimit;
    form.availableLimit = result.availableLimit;
    form.allowNegativeAvailableLimit = result.allowNegativeAvailableLimit;
    form.closingDay = result.closingDay;
    form.dueDay = result.dueDay;
    form.network = result.network;
    form.active = result.active;

    await Promise.all([ensureInstitutionOption(result.institutionId), ensureAccountOption(result.defaultPaymentAccountId)]);
  } catch (error) {
    applyCatch(error);
  }
}

async function save() {
  if (!validate()) return;

  loading.value = true;

  try {
    const result = await updateCreditCard(String(route.params.id), buildPayload());

    await router.push({ name: 'creditCards' });
    notificationStore.setCurrentMessage(result.message, 'success');
  } catch (error) {
    applyCatch(error);
  } finally {
    loading.value = false;
  }
}

watch(
  () => form.totalLimit,
  (totalLimit) => {
    if (initialTotalLimit.value == null) return;

    form.availableLimit = initialAvailableLimit.value + ((totalLimit ?? 0) - initialTotalLimit.value);
  },
);

onMounted(async () => {
  try {
    await Promise.all([loadInstitutions(), loadAccounts()]);
    await loadCreditCard();
  } finally {
    loading.value = false;
  }

  await nextTick();
  nameInput.value?.focus();
});
</script>

<template>
  <FormPanel type="edit" model-name="credit_card" gender="male" :show-loading="loading" @call:save="save">
    <template #form>
      <NotificationMessage v-if="errors.base.length" type="danger" @close="errors.base = []">
        <p v-for="error in errors.base" :key="error">{{ error }}</p>
      </NotificationMessage>

      <InputText ref="nameInput" v-model="form.name" name="name" :label="t('creditCards.form.name')" required :errors="errors.name" />

      <InstitutionSelect
        v-model="form.institutionId"
        v-model:items="institutionItems"
        name="institutionId"
        :label="t('creditCards.form.institutionId')"
        :placeholder="t('creditCards.form.institutionIdPlaceholder')"
        required
        :error="errors.institutionId[0]"
      />

      <AccountSelect
        v-model="form.defaultPaymentAccountId"
        v-model:items="accountItems"
        name="defaultPaymentAccountId"
        :label="t('creditCards.form.defaultPaymentAccountId')"
        :placeholder="t('creditCards.form.defaultPaymentAccountIdPlaceholder')"
        required
        :error="errors.defaultPaymentAccountId[0]"
      />

      <LogoSelect
        v-model="form.network"
        name="network"
        :label="t('creditCards.form.network')"
        :placeholder="t('creditCards.form.networkPlaceholder')"
        :items="networkItems"
        required
        :error="errors.network[0]"
      />

      <div class="field">
        <InputNumeric v-model="form.totalLimit" name="totalLimit" :label="t('creditCards.form.totalLimit')" :error="errors.totalLimit[0]" />
      </div>

      <div class="field">
        <InputNumeric
          v-model="form.availableLimit"
          name="availableLimit"
          :label="t('creditCards.form.availableLimit')"
          :error="errors.availableLimit[0]"
          disabled
        />
      </div>

      <div class="field">
        <div class="control">
          <CheckBox
            v-model="form.allowNegativeAvailableLimit"
            name="allowNegativeAvailableLimit"
            :label="t('creditCards.form.allowNegativeAvailableLimit')"
          />
        </div>
      </div>

      <div class="field">
        <InputNumber
          v-model="form.closingDay"
          name="closingDay"
          :label="t('creditCards.form.closingDay')"
          :min-value="1"
          :max-value="31"
          disabled
          :error="errors.closingDay[0]"
        />
      </div>

      <div class="field">
        <InputNumber
          v-model="form.dueDay"
          name="dueDay"
          :label="t('creditCards.form.dueDay')"
          :min-value="1"
          :max-value="31"
          disabled
          :error="errors.dueDay[0]"
        />
      </div>

      <div class="field">
        <div class="control">
          <CheckBox v-model="form.active" name="active" :label="t('creditCards.form.active')" />
        </div>
      </div>
    </template>
  </FormPanel>
</template>
