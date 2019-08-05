import moment from 'moment';
import _ from 'lodash';

export const calcNumBlocks = (timeStart, timeEnd, unit) => {
  const duration = moment.duration(timeEnd.diff(timeStart));
  return duration.asMinutes() / unit;
};

export const calcFreeSpaces = schedule => {
  const freeSpaces = [];
  let startIdx = null;
  let currLen = null;
  for (let i = 0; i < schedule.length; i++) {
    if (!schedule[i] && (startIdx === null || startIdx === undefined)) {
      startIdx = i;
      currLen = 1;
    } else if (!schedule[i] && currLen) {
      currLen++;
      if (i === schedule.length - 1) {
        freeSpaces.push({ startIdx, len: currLen });
      }
    } else if (schedule[i]) {
      if (startIdx !== null && startIdx !== undefined && currLen) {
        freeSpaces.push({ startIdx, len: currLen });
        startIdx = null;
        currLen = null;
      }
    }
  }
  return freeSpaces;
};

export const findNextFreeBlock = (schedule, numBlocks) => {
  const freeSpaces = calcFreeSpaces(schedule);
  for (let i = 0; i < freeSpaces.length; i++) {
    const { startIdx, len } = freeSpaces[i];
    if (numBlocks <= len) {
      return startIdx;
    }
  }
  return -1;
};

export const allocateSlot = ({ schedule, currTalk, startBlock }) => {
  const { numBlocks } = currTalk;
  let block;

  if (startBlock === 0 || startBlock) {
    block = startBlock;
  } else {
    block = findNextFreeBlock(schedule, numBlocks);
  }

  if (block < 0) {
    return false;
  }

  schedule[block] = currTalk;

  if (numBlocks === 1) {
    return true;
  }

  for (let i = block + 1; i < block + numBlocks; i++) {
    schedule[i] = 1; // Filled
  }

  return true;
};

// TODO implement calculate()

const calculateStartBlock = (timeStart, targetTimeStart, unitMins) => {
  const timeStartFormatted = moment(`2013-02-08 ${timeStart}`);
  const timeTargetFormatted = moment(`2013-02-08 ${targetTimeStart}`);
  return calcNumBlocks(timeStartFormatted, timeTargetFormatted, unitMins);
};

/**
 * Populates mandatory talks, returns unscheduled talks.
 *
 * @param {*} schedule
 * @param {*} timeStart
 * @param {*} unitMins
 * @param {*} remainingTalks
 */
const populateMandatoryTalks = (
  schedule,
  remainingTalks,
  timeStart,
  unitMins
) => {
  // Edit on copy of remaining talks
  const remainingTalksModified = [...remainingTalks];

  for (let i = 0; i < remainingTalksModified.length; i++) {
    const { type } = remainingTalksModified[i];
    let startBlock = null;
    if (type === 'KEYNOTE') {
      startBlock = calculateStartBlock(timeStart, '09:00', unitMins);
    } else if (type === 'CLOSING') {
      startBlock = calculateStartBlock(timeStart, '17:00', unitMins);
    } else if (type === 'LUNCH') {
      startBlock = calculateStartBlock(timeStart, '12:30', unitMins);
    } else if (type === 'BREAK') {
      startBlock = calculateStartBlock(timeStart, '15:00', unitMins);
    }

    if (startBlock || startBlock === 0) {
      allocateSlot({
        schedule,
        currTalk: remainingTalksModified[i],
        startBlock
      });
      remainingTalksModified[i] = null;
    }
  }

  // Remove already scheduled talks
  return remainingTalksModified.filter(Boolean);
};

const genSchedule = (timeStart, timeEnd, unitMins) => {
  const timeStartFormatted = moment(`2013-02-08 ${timeStart}`);
  const timeEndFormatted = moment(`2013-02-08 ${timeEnd}`);

  const numBlocks = calcNumBlocks(
    timeStartFormatted,
    timeEndFormatted,
    unitMins
  );

  // Populate schedule with empty slots
  return _.fill(Array(numBlocks), null);
};

const Scheduler = ({ talks = [], timeStart, timeEnd, unitMins }) => {
  // Populate an empty array representing the schedule
  const schedule = genSchedule(timeStart, timeEnd, unitMins);

  // Edit on copy of talks
  let remainingTalks = [...talks];

  // Populate mandatory talks (lunch, etc) and return
  remainingTalks = populateMandatoryTalks(
    schedule,
    remainingTalks,
    timeStart,
    unitMins
  );

  for (let i = 0; i < remainingTalks.length; i++) {
    const currTalk = remainingTalks[i];
    const isSuccessful = allocateSlot({ schedule, currTalk });

    // Log current iteration
    console.log(`Iteration: ${i}`, schedule);

    if (!isSuccessful) {
      return false;
    }
    // console.log(schedule);
  }

  return schedule;
};

const addDuration = talk => {
  const { type } = talk;
  const unit = 5;
  let numMins = null;

  if (!unit) {
    throw new Error('NumBlocks should be more than 0 mins!');
  }

  if (type === 'PANEL_DISCUSSION') {
    numMins = 60;
  } else if (type === 'LIGHTNING') {
    numMins = 10;
  } else if (type === 'REGULAR_TALK') {
    numMins = 30;
  } else if (type === 'KEYNOTE') {
    numMins = 30;
  } else if (type === 'WORKSHOP') {
    numMins = 60;
  } else if (type === 'CLOSING') {
    numMins = 30;
  } else if (type === 'BREAK') {
    numMins = 15;
  } else if (type === 'LUNCH') {
    numMins = 60;
  }

  if (!numMins) {
    throw new Error(`Event type not specified!  Event=${talk}`);
  }

  const numBlocks = numMins / unit;
  return { ...talk, numBlocks };
};

export const addDurations = (talks = []) => talks.map(addDuration);

export const addTalk = (talks = [], talk) => {
  if (!talk) {
    throw new Error(`No talk specified to add!`);
  }

  const { type, description, tags = [], title } = talk;

  return talks.push({ type, description, tags, title });
};

export default Scheduler;
