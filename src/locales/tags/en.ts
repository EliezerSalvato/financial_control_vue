export default {
  columns: {
    name: 'Name',
    color: 'Color',
    active: 'Active',
  },
  form: {
    name: 'Name',
    color: 'Color',
    active: 'Active',
  },
  modalDelete: {
    confirm: `
      Are you sure you want to delete the tag{itemName}?\n
      It will be removed from all transactions where it was used.\n
      If you only want to stop using it and keep it on existing transactions, inactivate the tag instead.
    `,
  },
};
