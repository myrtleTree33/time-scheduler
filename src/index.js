import Scheduler, { addDurations, addTalk } from './lib/Scheduler';

import * as talksJson from '../test/sample.json';

let talks = [...talksJson.talks];

addTalk(talks, {
  type: 'PANEL_DISCUSSION',
  description: 'Panel discussion with our selected hosts!',
  tags: ['panel_discussion'],
  title: 'Panel discussion'
});

addTalk(talks, {
  type: 'BREAK',
  description: 'Tea break',
  tags: ['meals'],
  title: 'Tea'
});

addTalk(talks, {
  type: 'LUNCH',
  description: 'Lunch',
  tags: ['meals'],
  title: 'Lunch'
});

talks = addDurations(talks);

const plan = Scheduler({
  talks,
  unitMins: 5,
  timeStart: '09:00',
  timeEnd: '17:30'
});

console.log(plan);
