export default {
  columns: {
    name: 'Nome',
    color: 'Cor',
    goal: 'Meta atual',
    active: 'Ativo',
  },
  form: {
    name: 'Nome',
    color: 'Cor',
    active: 'Ativo',
    goalStartsOn: 'Início da meta',
    goalValue: 'Meta',
    goalEndsOn: 'Fim da meta',
    change: 'Alterar',
    showChangeHistory: 'Mostrar histórico de alterações',
  },
  goalHistory: {
    title: 'Histórico da meta',
    month: 'Mês',
    value: 'Valor',
  },
  changeGoal: {
    title: 'Alterar meta',
    value: 'Novo valor',
    startsOn: 'A partir de',
    changeForNextMonths: 'Alterar valor para os próximos meses',
  },
  errors: {
    endsOnBeforeStartsOn: 'deve ser igual ou posterior ao mês de início',
    endsOnExistingGoalMonth: 'deve ser posterior a um mês que já possui meta',
    startsOnAfterEndsOn: 'deve ser igual ou anterior ao mês de fim',
    valueMustDifferFromPreviousGoal: 'deve ser diferente do valor da meta anterior',
  },
};
