export const seedData = {
  users: [
    { id: 1, nickname: 'John_Vancheti', email: 'john.vancheti@rp.local', role: 'player', status: 'active', lastLogin: '2026-05-01 19:30' },
    { id: 2, nickname: 'Henry_Orlov', email: 'henry.orlov@rp.local', role: 'admin', status: 'active', lastLogin: '2026-05-02 10:10' },
    { id: 3, nickname: 'Alex_Moreno', email: 'alex.moreno@rp.local', role: 'leader', status: 'active', lastLogin: '2026-05-01 21:05' },
    { id: 4, nickname: 'Mark_Daniels', email: 'mark.daniels@rp.local', role: 'player', status: 'banned', lastLogin: '2026-04-25 15:40' },
    { id: 5, nickname: 'Olivia_Stone', email: 'olivia.stone@rp.local', role: 'player', status: 'active', lastLogin: '2026-05-02 08:15' },
    { id: 6, nickname: 'Victor_Rossi', email: 'victor.rossi@rp.local', role: 'leader', status: 'active', lastLogin: '2026-04-30 22:00' }
  ],
  players: [
    { id: 1, userId: 1, level: 18, experience: 4520, reputation: 87, organizationId: 1 },
    { id: 2, userId: 4, level: 9, experience: 1480, reputation: 21, organizationId: null },
    { id: 3, userId: 5, level: 14, experience: 3210, reputation: 74, organizationId: 2 }
  ],
  admins: [
    { id: 1, userId: 2, accessLevel: 5, permissions: ['users', 'roles', 'rules', 'punishments', 'logs'], superAdmin: true }
  ],
  leaders: [
    { id: 1, userId: 3, organizationId: 1, rank: 'Director', membersCount: 12 },
    { id: 2, userId: 6, organizationId: 2, rank: 'Captain', membersCount: 8 }
  ],
  organizations: [
    { id: 1, name: 'Los Santos Police Department', type: 'state', rating: 4.8, createdAt: '2025-09-10', members: 12 },
    { id: 2, name: 'Emergency Medical Service', type: 'state', rating: 4.6, createdAt: '2025-10-02', members: 8 },
    { id: 3, name: 'Vanchetti Family', type: 'family', rating: 4.1, createdAt: '2025-11-15', members: 16 },
    { id: 4, name: 'MerryWeather Security', type: 'private', rating: 4.3, createdAt: '2025-12-21', members: 10 }
  ],
  rules: [
    { id: 1, category: 'Загальні правила', title: 'Поважна поведінка', text: 'Користувачі повинні дотримуватися правил RP та поважати інших гравців.', access: 'all', updatedAt: '2026-04-20' },
    { id: 2, category: 'Role Play', title: 'Дотримання ролі', text: 'Усі дії персонажа мають відповідати логіці обраної ролі та ситуації.', access: 'all', updatedAt: '2026-04-22' },
    { id: 3, category: 'Організації', title: 'Вступ до організації', text: 'Вступ можливий після подання заявки та її схвалення лідером або адміністратором.', access: 'player', updatedAt: '2026-04-24' },
    { id: 4, category: 'Адміністрація', title: 'Видача покарань', text: 'Покарання фіксуються у журналі дій із зазначенням причини та відповідальної особи.', access: 'admin', updatedAt: '2026-04-27' },
    { id: 5, category: 'Лідери', title: 'Керування складом', text: 'Лідер відповідає за актуальність складу організації та внутрішні ролі учасників.', access: 'leader', updatedAt: '2026-04-29' }
  ],
  applications: [
    { id: 1, applicantId: 1, organizationId: 1, type: 'join_organization', status: 'pending', submittedAt: '2026-05-01 17:30' },
    { id: 2, applicantId: 5, organizationId: 2, type: 'join_organization', status: 'approved', submittedAt: '2026-04-28 13:20' },
    { id: 3, applicantId: 4, organizationId: 3, type: 'join_organization', status: 'rejected', submittedAt: '2026-04-22 18:45' }
  ],
  punishments: [
    { id: 1, userId: 4, type: 'ban', reason: 'Порушення правил сервера', startDate: '2026-04-25', endDate: '2026-05-25' },
    { id: 2, userId: 1, type: 'warning', reason: 'Некоректна поведінка у чаті', startDate: '2026-04-18', endDate: '2026-05-18' }
  ],
  logs: [
    { id: 1, userId: 2, action: 'Видав покарання користувачу Mark_Daniels', timestamp: '2026-04-25 15:42' },
    { id: 2, userId: 3, action: 'Схвалив заявку Olivia_Stone до EMS', timestamp: '2026-04-28 13:40' },
    { id: 3, userId: 1, action: 'Подав заявку до LSPD', timestamp: '2026-05-01 17:30' },
    { id: 4, userId: 2, action: 'Оновив правило: Видача покарань', timestamp: '2026-04-27 11:15' }
  ]
};
