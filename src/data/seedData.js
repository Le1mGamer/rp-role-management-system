export const seedData = {
  users: [
    { id: 1, nickname: 'John_Vancheti', password: 'Player123!', email: 'john.vancheti@rp.local', role: 'player', status: 'active', lastLogin: '2026-05-01 19:30' },
    { id: 2, nickname: 'Henry_Orlov', password: 'Admin123!', email: 'henry.orlov@rp.local', role: 'admin', status: 'active', lastLogin: '2026-05-02 10:10' },
    { id: 3, nickname: 'Alex_Moreno', password: 'Leader123!', email: 'alex.moreno@rp.local', role: 'leader', status: 'active', lastLogin: '2026-05-01 21:05' },
    { id: 4, nickname: 'Mark_Daniels', password: 'Player456!', email: 'mark.daniels@rp.local', role: 'player', status: 'banned', lastLogin: '2026-04-25 15:40' },
    { id: 5, nickname: 'Olivia_Stone', password: 'Player789!', email: 'olivia.stone@rp.local', role: 'player', status: 'active', lastLogin: '2026-05-02 08:15' },
    { id: 6, nickname: 'Victor_Rossi', password: 'Leader456!', email: 'victor.rossi@rp.local', role: 'leader', status: 'active', lastLogin: '2026-04-30 22:00' },
    { id: 7, nickname: 'Daniel_Carter', password: 'Player321!', email: 'daniel.carter@rp.local', role: 'player', status: 'active', lastLogin: '2026-05-01 14:10' },
    { id: 8, nickname: 'Michael_Black', password: 'Player654!', email: 'michael.black@rp.local', role: 'player', status: 'active', lastLogin: '2026-04-29 18:25' },
    { id: 9, nickname: 'Sofia_Reed', password: 'Player987!', email: 'sofia.reed@rp.local', role: 'player', status: 'active', lastLogin: '2026-05-02 09:45' },
    { id: 10, nickname: 'Robert_Miles', password: 'Admin456!', email: 'robert.miles@rp.local', role: 'admin', status: 'active', lastLogin: '2026-05-01 23:30' },
    { id: 11, nickname: 'Emma_Walker', password: 'Player147!', email: 'emma.walker@rp.local', role: 'player', status: 'active', lastLogin: '2026-04-28 12:00' },
    { id: 12, nickname: 'Chris_Hunter', password: 'Leader789!', email: 'chris.hunter@rp.local', role: 'leader', status: 'active', lastLogin: '2026-04-30 16:55' },
    { id: 13, nickname: 'Laura_Fox', password: 'Player258!', email: 'laura.fox@rp.local', role: 'player', status: 'inactive', lastLogin: '2026-04-15 20:20' },
    { id: 14, nickname: 'Adam_King', password: 'Player369!', email: 'adam.king@rp.local', role: 'player', status: 'active', lastLogin: '2026-05-02 07:50' },
    { id: 15, nickname: 'Nina_Cross', password: 'Player741!', email: 'nina.cross@rp.local', role: 'player', status: 'active', lastLogin: '2026-05-01 11:10' }
  ],
  rolePermissions: {
    player: ['dashboard', 'rules', 'applications', 'organizations'],
    leader: ['dashboard', 'players', 'rules', 'applications', 'organizations', 'logs'],
    admin: ['dashboard', 'players', 'rules', 'applications', 'organizations', 'punishments', 'logs']
  },
  players: [
    { id: 1, userId: 1, level: 18, experience: 4520, reputation: 87, organizationId: 1 },
    { id: 2, userId: 4, level: 9, experience: 1480, reputation: 21, organizationId: null },
    { id: 3, userId: 5, level: 14, experience: 3210, reputation: 74, organizationId: 2 },
    { id: 4, userId: 7, level: 22, experience: 6400, reputation: 91, organizationId: 1 },
    { id: 5, userId: 8, level: 12, experience: 2700, reputation: 65, organizationId: 4 },
    { id: 6, userId: 9, level: 19, experience: 5100, reputation: 82, organizationId: 2 },
    { id: 7, userId: 11, level: 7, experience: 980, reputation: 53, organizationId: null },
    { id: 8, userId: 13, level: 11, experience: 2100, reputation: 48, organizationId: 3 },
    { id: 9, userId: 14, level: 16, experience: 3900, reputation: 78, organizationId: 4 },
    { id: 10, userId: 15, level: 13, experience: 2850, reputation: 69, organizationId: 3 }
  ],
  admins: [
    { id: 1, userId: 2, accessLevel: 5, permissions: ['users', 'roles', 'rules', 'punishments', 'logs'], superAdmin: true },
    { id: 2, userId: 10, accessLevel: 3, permissions: ['users', 'rules', 'logs'], superAdmin: false }
  ],
  leaders: [
    { id: 1, userId: 3, organizationId: 1, rank: 'Director', membersCount: 12 },
    { id: 2, userId: 6, organizationId: 2, rank: 'Captain', membersCount: 8 },
    { id: 3, userId: 12, organizationId: 4, rank: 'Commander', membersCount: 10 }
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
    { id: 5, category: 'Лідери', title: 'Керування складом', text: 'Лідер відповідає за актуальність складу організації та внутрішні ролі учасників.', access: 'leader', updatedAt: '2026-04-29' },
    { id: 6, category: 'Заявки', title: 'Розгляд заявок', text: 'Кожна заявка має отримати один із фінальних статусів: схвалено або відхилено.', access: 'leader', updatedAt: '2026-05-01' },
    { id: 7, category: 'Безпека', title: 'Доступ до адмін-панелі', text: 'Адміністративні функції доступні тільки користувачам із відповідним рівнем доступу.', access: 'admin', updatedAt: '2026-05-02' }
  ],
  applications: [
    { id: 1, applicantId: 1, organizationId: 1, type: 'join_organization', status: 'pending', submittedAt: '2026-05-01 17:30' },
    { id: 2, applicantId: 5, organizationId: 2, type: 'join_organization', status: 'approved', submittedAt: '2026-04-28 13:20' },
    { id: 3, applicantId: 4, organizationId: 3, type: 'join_organization', status: 'rejected', submittedAt: '2026-04-22 18:45' },
    { id: 4, applicantId: 7, organizationId: 1, type: 'rank_update', status: 'approved', submittedAt: '2026-04-29 12:30' },
    { id: 5, applicantId: 8, organizationId: 4, type: 'join_organization', status: 'pending', submittedAt: '2026-05-01 20:00' },
    { id: 6, applicantId: 11, organizationId: 2, type: 'join_organization', status: 'pending', submittedAt: '2026-05-02 09:30' },
    { id: 7, applicantId: 15, organizationId: 3, type: 'join_organization', status: 'approved', submittedAt: '2026-04-26 18:10' }
  ],
  punishments: [
    { id: 1, userId: 4, type: 'ban', reason: 'Порушення правил сервера', startDate: '2026-04-25', endDate: '2026-05-25' },
    { id: 2, userId: 1, type: 'warning', reason: 'Некоректна поведінка у чаті', startDate: '2026-04-18', endDate: '2026-05-18' },
    { id: 3, userId: 13, type: 'warning', reason: 'Порушення внутрішнього регламенту організації', startDate: '2026-04-20', endDate: '2026-05-05' }
  ],
  logs: [
    { id: 1, userId: 2, action: 'Видав покарання користувачу Mark_Daniels', timestamp: '2026-04-25 15:42' },
    { id: 2, userId: 3, action: 'Схвалив заявку Olivia_Stone до EMS', timestamp: '2026-04-28 13:40' },
    { id: 3, userId: 1, action: 'Подав заявку до LSPD', timestamp: '2026-05-01 17:30' },
    { id: 4, userId: 2, action: 'Оновив правило: Видача покарань', timestamp: '2026-04-27 11:15' },
    { id: 5, userId: 6, action: 'Переглянув список заявок EMS', timestamp: '2026-05-01 18:20' },
    { id: 6, userId: 10, action: 'Переглянув журнал дій системи', timestamp: '2026-05-02 09:55' },
    { id: 7, userId: 12, action: 'Оновив склад MerryWeather Security', timestamp: '2026-05-01 21:10' }
  ]
};
