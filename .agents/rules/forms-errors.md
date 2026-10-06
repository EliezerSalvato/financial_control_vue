# Forms, validation & errors

Use `@/utils/errorsHandler`:

- `buildFormErrors(form)` for error maps
- `ErrorsHandler` for blank/email/length/confirmation and `applyApiDetails()`
- Field validators in `@/utils/validators`

Catch `ApiError` from `@/api/client`; map `details` to fields and/or notifications. Never silently ignore errors — handle, display, or propagate.

Notifications: `useNotificationStore().setCurrentMessage(message, type?)` (`success` | `danger`).

Reference forms: `pages/tags/New.vue`, `pages/tags/Edit.vue`.
