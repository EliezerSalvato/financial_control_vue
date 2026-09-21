export default {
  columns: {
    name: 'Name',
    color: 'Color',
    goal: 'Current goal',
    active: 'Active',
  },
  form: {
    name: 'Name',
    color: 'Color',
    active: 'Active',
    goalStartsOn: 'Goal starts on',
    goalValue: 'Goal',
    goalEndsOn: 'Goal ends on',
    change: 'Change',
    showChangeHistory: 'Show change history',
  },
  goalHistory: {
    title: 'Goal history',
    month: 'Month',
    value: 'Value',
  },
  changeGoal: {
    title: 'Change goal',
    value: 'New value',
    startsOn: 'Starting from',
    changeForNextMonths: 'Change value for next months',
  },
  errors: {
    endsOnBeforeStartsOn: 'must be on or after the start month',
    endsOnExistingGoalMonth: 'must be after a month that already has a goal',
    startsOnAfterEndsOn: 'must be on or before the end month',
    valueMustDifferFromPreviousGoal: 'must be different from the previous goal value',
  },
};
