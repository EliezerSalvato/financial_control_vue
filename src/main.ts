import 'bulma/css/bulma.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './assets/main.css';

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { applyDocumentLocale, DEFAULT_LOCALE, isAppLocale } from './locales/locale';
import App from './App.vue';
import i18n from './locales';
import router from './router';

const app = createApp(App);

app.use(createPinia());
app.use(i18n);
app.use(router);

const currentLocale = i18n.global.locale.value;
applyDocumentLocale(isAppLocale(currentLocale) ? currentLocale : DEFAULT_LOCALE);

app.mount('#app');
