import type { Activity, Plan } from './public-api';
const act = (
  id: string,
  title: string,
  place: string,
  duration: number,
  deadline: number,
  priority: Activity['priority'] = 'essential',
  deadlineType: Activity['deadlineType'] = 'finish',
): Activity => ({
  id,
  title,
  place,
  duration,
  earliest: 0,
  deadline,
  deadlineType,
  priority,
  fixedOrder: false,
});
export const profiles: { id: string; name: string; role: string; initials: string; plan: Plan }[] =
  [
    {
      id: 'emma',
      name: 'Emma',
      role: 'Working parent',
      initials: 'EM',
      plan: {
        startPlace: 'work',
        startTime: 960,
        activities: [
          act('hall', 'Collect official document', 'hall', 20, 1020),
          act('child', 'Pick up child', 'child', 5, 1040, 'essential', 'arrival'),
          act('pharmacy', 'Visit pharmacy', 'pharmacy', 10, 1140, 'flexible'),
        ],
      },
    },
    {
      id: 'noah',
      name: 'Noah',
      role: 'Shift worker',
      initials: 'NO',
      plan: {
        startPlace: 'home',
        startTime: 930,
        activities: [
          act('hall', 'Register address', 'hall', 20, 1020),
          act('clinic', 'Clinic appointment', 'clinic', 25, 1080),
          act('market', 'Buy groceries', 'market', 15, 1200, 'flexible'),
        ],
      },
    },
    {
      id: 'maya',
      name: 'Maya',
      role: 'Student commuter',
      initials: 'MA',
      plan: {
        startPlace: 'work',
        startTime: 960,
        activities: [
          act('hall', 'Collect student certificate', 'hall', 15, 1020),
          act('library', 'Return library books', 'library', 10, 1080, 'flexible'),
          act('market', 'Collect supplies', 'market', 15, 1200, 'flexible'),
        ],
      },
    },
  ];
