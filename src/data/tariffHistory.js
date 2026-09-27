const periods = [
  'Sep-24', 'Oct-24', 'Nov-24', 'Dec-24', 'Jan-25', 'Feb-25',
  'Mar-25', 'Apr-25', 'May-25', 'Jun-25', 'Jul-25', 'Aug-25',
  'Sep-25', 'Oct-25', 'Nov-25', 'Dec-25', 'Jan-26', 'Feb-26',
  'Mar-26', 'Apr-26', 'May-26', 'Jun-26', 'Jul-26', 'Aug-26',
];

const endpoints = {
  mgo: [42.95, 45.6],
  nonMgo: [46.15, 48.9],
  excess: [51.25, 54.75],
};

function round2(value) {
  return Number(value.toFixed(2));
}

function buildSeries([start, end], index) {
  const t = index / (periods.length - 1);
  const wave = Math.sin((index + 1) / 2.4) * 0.18;
  return round2(start + (end - start) * t + wave);
}

export const TARIFF_HISTORY_DATA = periods.map((period, index) => ({
  period,
  mgo: buildSeries(endpoints.mgo, index),
  nonMgo: buildSeries(endpoints.nonMgo, index),
  excess: buildSeries(endpoints.excess, index),
}));