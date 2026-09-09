<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import Loading from '@/components/Loading.vue';
import NotificationMessage from '@/components/NotificationMessage.vue';
import { pluralize } from '@/utils/pluralize';

const props = withDefaults(
  defineProps<{
    type: 'new' | 'edit';
    modelName: string;
    gender?: 'male' | 'female';
    hiddenBack?: boolean;
    showLoading?: boolean;
  }>(),
  {
    gender: 'male',
    hiddenBack: false,
    showLoading: false,
  },
);

const emit = defineEmits<{
  'call:save': [];
}>();

const { t } = useI18n();

const pluralizedName = computed(() => pluralize(props.modelName, 'en').replaceAll('_', '-'));

const title = computed(() => t(`buttons.${props.type}.${props.gender}`, { name: t(`models.${props.modelName}`) }));

function save() {
  emit('call:save');
}
</script>

<template>
  <div class="columns">
    <Loading v-show="showLoading" />

    <div v-show="!showLoading" class="column">
      <NotificationMessage />

      <nav class="panel">
        <p class="panel-heading">
          <span class="panel-heading-title">{{ title }}</span>
          <span v-if="$slots.heading" class="panel-heading-aside">
            <slot name="heading" />
          </span>
        </p>

        <div class="panel-block">
          <form class="form">
            <slot name="form" />

            <div class="field form-actions">
              <input type="submit" :value="t('buttons.save')" class="button is-link" @click.prevent="save" />
              <router-link v-if="!hiddenBack" class="button" :to="`/${pluralizedName}`">
                {{ t('buttons.back') }}
              </router-link>
            </div>
          </form>
        </div>
      </nav>
    </div>
  </div>
</template>

<style scoped>
.columns {
  margin: 0 auto;
  max-width: 1344px;
}

.panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.panel-heading-title {
  text-transform: capitalize;
}

.form {
  flex: 1;
}

.field .button + .button {
  margin-left: 7px;
}
</style>
