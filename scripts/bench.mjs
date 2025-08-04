import {wrapAnsi} from '../lib/main.js';
import {wrapAnsi as prodWrapAnsi} from 'fast-wrap-ansi-prod';
import {Bench} from 'tinybench';
import sourceWrapAnsi from 'wrap-ansi';
import {styleText} from 'node:util';

const benchCases = [
  {
    name: 'basic wrapping',
    text: 'Hello, World!'.repeat(10),
    columns: 6,
    options: {
    }
  },
  {
    name: 'styled wrapping',
    text: `I am ${styleText('blue', 'blue text')} and ${styleText('red', 'red text')}`,
    columns: 6,
    options: {
    }
  }
];

for (const benchCase of benchCases) {
  const bench = new Bench({name: benchCase.name});
  bench.add('fast-wrap-ansi', () => {
    wrapAnsi(benchCase.text, benchCase.columns, benchCase.options);
  });
  bench.add('wrap-ansi', () => {
    sourceWrapAnsi(benchCase.text, benchCase.columns, benchCase.options);
  });
  bench.add('fast-wrap-ansi (prod)', () => {
    prodWrapAnsi(benchCase.text, benchCase.columns, benchCase.options);
  });
  await bench.run();
  console.log(bench.name);
  console.table(bench.table());
}
