<script setup lang="ts">
import type { CreditCard, CreditCardCreatePayload, CreditCardForm } from '@/types/credit_card';
import type { ColorOption } from '@/components/inputs/ColorSelect.vue';
import type { LogoOption } from '@/components/inputs/LogoSelect.vue';
import { createCreditCard } from '@/api/credit_cards';
import { listAccounts } from '@/api/accounts';
import { listInstitutions } from '@/api/institutions';
import { useI18n } from 'vue-i18n';
import { useNotificationStore } from '@/stores/notification';
import { useRouter } from 'vue-router';
import { useFormErrors } from '@/composables/useFormErrors';
import { institutionLogoUrl } from '@/utils/institutionLogos';
import { listNetworkLogos } from '@/utils/networkLogos';
import { computed, onMounted, reactive, ref, useTemplateRef, watch } from 'vue';
import AccountSelect from '@/components/inputs/AccountSelect.vue';
import CheckBox from '@/components/inputs/CheckBox.vue';
import InstitutionSelect from '@/components/inputs/InstitutionSelect.vue';
import FormPanel from '@/components/FormPanel.vue';
import InputNumber from '@/components/inputs/InputNumber.vue';
import InputNumeric from '@/components/inputs/InputNumeric.vue';
import InputText from '@/components/inputs/InputText.vue';
import LogoSelect from '@/components/inputs/LogoSelect.vue';
import NotificationMessage from '@/components/NotificationMessage.vue';

const props = withDefaults(
  defineProps<{
    modal?: boolean;
  }>(),
  {
    modal: false,
  },
);

const emit = defineEmits<{
  'new:creditCard': [creditCard: CreditCard];
}>();

const { t, te } = useI18n();
const router = useRouter();
const notificationStore = useNotificationStore();

const nameInput = useTemplateRef<{ focus: () => void }>('nameInput');
const loading = ref(false);
const institutionItems = ref<LogoOption[]>([]);
const accountItems = ref<ColorOption[]>([]);

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
  return validateWith((handler) => handler.checkBlank(['institutionId', 'defaultPaymentAccountId', 'name', 'closingDay', 'dueDay', 'network']));
}

function buildPayload(): CreditCardCreatePayload {
  return {
    creditCard: {
      institutionId: form.institutionId,
      defaultPaymentAccountId: form.defaultPaymentAccountId,
      name: form.name,
      totalLimit: form.totalLimit ?? 0,
      allowNegativeAvailableLimit: form.allowNegativeAvailableLimit,
      closingDay: form.closingDay as number,
      dueDay: form.dueDay as number,
      network: form.network,
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

async function save() {
  if (!validate()) return;

  loading.value = true;

  try {
    const result = await createCreditCard(buildPayload());

    if (props.modal) {
      emit('new:creditCard', result.creditCard);
      return;
    }

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
    form.availableLimit = totalLimit ?? 0;
  },
);

onMounted(() => {
  nameInput.value?.focus();
  void loadInstitutions();
  void loadAccounts();
});
</script>

<template>
  <FormPanel type="new" model-name="credit_card" gender="male" :hidden-back="modal" :show-loading="loading" @call:save="save">
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
          required
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
          required
          :error="errors.dueDay[0]"
        />
      </div>
    </template>
  </FormPanel>
</template>
