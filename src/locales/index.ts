import { createI18n } from 'vue-i18n';
import { resolveLocale } from './locale';
import { en as errorsHandlerEn, ptBr as errorsHandlerPtBr } from './utils/errorsHandler';
import { en as validatorsEn, ptBr as validatorsPtBr } from './utils/validators';
import commonEn from './common/en';
import commonPtBr from './common/pt-BR';
import accountsEn from './accounts/en';
import accountsPtBr from './accounts/pt-BR';
import categoriesEn from './categories/en';
import categoriesPtBr from './categories/pt-BR';
import tagsEn from './tags/en';
import tagsPtBr from './tags/pt-BR';
import institutionsEn from './institutions/en';
import institutionsPtBr from './institutions/pt-BR';
import creditCardsEn from './creditCards/en';
import creditCardsPtBr from './creditCards/pt-BR';
import transactionsEn from './transactions/en';
import transactionsPtBr from './transactions/pt-BR';
import monthlyStatementsEn from './monthlyStatements/en';
import monthlyStatementsPtBr from './monthlyStatements/pt-BR';
import goalsEn from './goals/en';
import goalsPtBr from './goals/pt-BR';
import notificationsEn from './notifications/en';
import notificationsPtBr from './notifications/pt-BR';
import authEn from './auth/en';
import authPtBr from './auth/pt-BR';
import userEn from './user/en';
import userPtBr from './user/pt-BR';

const locale = resolveLocale();

const i18n = createI18n({
  legacy: false,
  locale,
  fallbackLocale: 'en',
  messages: {
    en: {
      ...commonEn,
      accounts: accountsEn,
      categories: categoriesEn,
      tags: tagsEn,
      institutions: institutionsEn,
      creditCards: creditCardsEn,
      transactions: transactionsEn,
      monthlyStatements: monthlyStatementsEn,
      goals: goalsEn,
      notifications: notificationsEn,
      auth: authEn,
      user: userEn,
      utils: {
        validators: validatorsEn,
        errorsHandler: errorsHandlerEn,
      },
    },
    'pt-BR': {
      ...commonPtBr,
      accounts: accountsPtBr,
      categories: categoriesPtBr,
      tags: tagsPtBr,
      institutions: institutionsPtBr,
      creditCards: creditCardsPtBr,
      transactions: transactionsPtBr,
      monthlyStatements: monthlyStatementsPtBr,
      goals: goalsPtBr,
      notifications: notificationsPtBr,
      auth: authPtBr,
      user: userPtBr,
      utils: {
        validators: validatorsPtBr,
        errorsHandler: errorsHandlerPtBr,
      },
    },
  },
});

export default i18n;
