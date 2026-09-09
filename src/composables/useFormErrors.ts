import type { FormErrors, FormFields } from '@/utils/errorsHandler';
import { ApiError } from '@/api/client';
import { ref } from 'vue';
import { ErrorsHandler, buildFormErrors } from '@/utils/errorsHandler';

type FormSource<T extends FormFields> = T | (() => T);

export function useFormErrors<T extends FormFields>(form: FormSource<T>) {
  const resolveForm = () => (typeof form === 'function' ? form() : form);
  const errors = ref<FormErrors<T>>(buildFormErrors(resolveForm()));

  function createHandler() {
    return new ErrorsHandler(resolveForm());
  }

  function validateWith(configure: (handler: ErrorsHandler<T>) => ErrorsHandler<T>): boolean {
    const handler = configure(createHandler());

    errors.value = handler.all;

    return handler.isValid;
  }

  function applyCatch(error: unknown) {
    if (error instanceof ApiError) {
      errors.value = createHandler().applyApiDetails(error.details, error.message).all;
      return;
    }

    errors.value = createHandler().addSomethingWentWrong().all;
  }

  function resetErrors() {
    errors.value = buildFormErrors(resolveForm());
  }

  return {
    errors,
    createHandler,
    validateWith,
    applyCatch,
    resetErrors,
  };
}
