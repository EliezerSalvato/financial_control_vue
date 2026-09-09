export default {
  columns: {
    name: 'Nome',
    color: 'Cor',
    active: 'Ativo',
  },
  form: {
    name: 'Nome',
    color: 'Cor',
    active: 'Ativo',
  },
  modalDelete: {
    confirm: `
      Tem certeza que deseja excluir a tag{itemName}?\n
      Ela será removida de todas as transações em que foi usada.\n
      Se a intenção é apenas deixar de usá-la e mantê-la nas transações existentes, inative a tag.
    `,
  },
};
