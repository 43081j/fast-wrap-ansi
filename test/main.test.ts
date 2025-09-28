import {test, assert} from 'vitest';
import {styleText, stripVTControlCharacters} from 'node:util';
import {wrapAnsi} from '../src/main.js';

const fixture =
  'The quick brown ' +
  styleText('red', 'fox jumped over ') +
  'the lazy ' +
  styleText('green', 'dog and then ran away with the unicorn.');
const fixture2 = '12345678\n901234567890';
const fixture3 = '12345678\n901234567890 12345';
const fixture4 = '12345678\n';
const fixture5 = '12345678\n ';

const hasAnsi = (str: string): boolean => stripVTControlCharacters(str) !== str;

test('wraps string at 20 characters', () => {
  const result = wrapAnsi(fixture, 20);

  assert.equal(
    result,
    'The quick brown \u001B[31mfox\u001B[39m\n\u001B[31mjumped over \u001B[39mthe lazy\n\u001B[32mdog and then ran\u001B[39m\n\u001B[32maway with the\u001B[39m\n\u001B[32municorn.\u001B[39m'
  );
  assert.ok(
    stripVTControlCharacters(result)
      .split('\n')
      .every((line) => line.length <= 20)
  );
});

test('wraps string at 30 characters', () => {
  const result = wrapAnsi(fixture, 30);

  assert.equal(
    result,
    'The quick brown \u001B[31mfox jumped\u001B[39m\n\u001B[31mover \u001B[39mthe lazy \u001B[32mdog and then ran\u001B[39m\n\u001B[32maway with the unicorn.\u001B[39m'
  );
  assert.ok(
    stripVTControlCharacters(result)
      .split('\n')
      .every((line) => line.length <= 30)
  );
});

test('does not break strings longer than "cols" characters', () => {
  const result = wrapAnsi(fixture, 5, {hard: false});

  assert.equal(
    result,
    'The\nquick\nbrown\n\u001B[31mfox\u001B[39m\n\u001B[31mjumped\u001B[39m\n\u001B[31mover\u001B[39m\n\u001B[31m\u001B[39mthe\nlazy\n\u001B[32mdog\u001B[39m\n\u001B[32mand\u001B[39m\n\u001B[32mthen\u001B[39m\n\u001B[32mran\u001B[39m\n\u001B[32maway\u001B[39m\n\u001B[32mwith\u001B[39m\n\u001B[32mthe\u001B[39m\n\u001B[32municorn.\u001B[39m'
  );
  assert.ok(
    stripVTControlCharacters(result)
      .split('\n')
      .some((line) => line.length > 5)
  );
});

test('handles colored string that wraps on to multiple lines', () => {
  const result = wrapAnsi(styleText('green', 'hello world') + ' hey!', 5, {
    hard: false
  });
  const lines = result.split('\n');
  assert.ok(hasAnsi(lines[0]));
  assert.ok(hasAnsi(lines[1]));
  assert.ok(!hasAnsi(lines[2]));
});

test('does not prepend newline if first string is greater than "cols"', () => {
  const result = wrapAnsi(styleText('green', 'hello') + '-world', 5, {
    hard: false
  });
  assert.equal(result.split('\n').length, 1);
});

// When "hard" is true

test('breaks strings longer than "cols" characters', () => {
  const result = wrapAnsi(fixture, 5, {hard: true});

  assert.equal(
    result,
    'The\nquick\nbrown\n\u001B[31mfox j\u001B[39m\n\u001B[31mumped\u001B[39m\n\u001B[31mover\u001B[39m\n\u001B[31m\u001B[39mthe\nlazy\n\u001B[32mdog\u001B[39m\n\u001B[32mand\u001B[39m\n\u001B[32mthen\u001B[39m\n\u001B[32mran\u001B[39m\n\u001B[32maway\u001B[39m\n\u001B[32mwith\u001B[39m\n\u001B[32mthe\u001B[39m\n\u001B[32munico\u001B[39m\n\u001B[32mrn.\u001B[39m'
  );
  assert.ok(
    stripVTControlCharacters(result)
      .split('\n')
      .every((line) => line.length <= 5)
  );
});

test('removes last row if it contained only ansi escape codes', () => {
  const result = wrapAnsi(styleText('green', 'helloworld'), 2, {hard: true});
  assert.ok(
    stripVTControlCharacters(result)
      .split('\n')
      .every((x) => x.length === 2)
  );
});

test('does not prepend newline if first word is split', () => {
  const result = wrapAnsi(styleText('green', 'hello') + 'world', 5, {
    hard: true
  });
  assert.equal(result.split('\n').length, 2);
});

test('takes into account line returns inside input', () => {
  assert.equal(
    wrapAnsi(fixture2, 10, {hard: true}),
    '12345678\n9012345678\n90'
  );
});

test('word wrapping', () => {
  assert.equal(wrapAnsi(fixture3, 15), '12345678\n901234567890\n12345');
});

test('no word-wrapping', () => {
  const result = wrapAnsi(fixture3, 15, {wordWrap: false});
  assert.equal(result, '12345678\n901234567890 12\n345');

  const result2 = wrapAnsi(fixture3, 5, {wordWrap: false});
  assert.equal(result2, '12345\n678\n90123\n45678\n90 12\n345');

  const rsult3 = wrapAnsi(fixture5, 5, {wordWrap: false});
  assert.equal(rsult3, '12345\n678\n');

  const result4 = wrapAnsi(fixture, 5, {wordWrap: false});
  assert.equal(
    result4,
    'The q\nuick\nbrown\n\u001B[31mfox j\u001B[39m\n\u001B[31mumped\u001B[39m\n\u001B[31mover\u001B[39m\n\u001B[31m\u001B[39mthe l\nazy \u001B[32md\u001B[39m\n\u001B[32mog an\u001B[39m\n\u001B[32md the\u001B[39m\n\u001B[32mn ran\u001B[39m\n\u001B[32maway\u001B[39m\n\u001B[32mwith\u001B[39m\n\u001B[32mthe u\u001B[39m\n\u001B[32mnicor\u001B[39m\n\u001B[32mn.\u001B[39m'
  );
});

test('no word-wrapping and no trimming', () => {
  const result = wrapAnsi(fixture3, 13, {wordWrap: false, trim: false});
  assert.equal(result, '12345678\n901234567890 \n12345');

  const result2 = wrapAnsi(fixture4, 5, {wordWrap: false, trim: false});
  assert.equal(result2, '12345\n678\n');

  const result3 = wrapAnsi(fixture5, 5, {wordWrap: false, trim: false});
  assert.equal(result3, '12345\n678\n ');

  const result4 = wrapAnsi(fixture, 5, {wordWrap: false, trim: false});
  assert.equal(
    result4,
    'The q\nuick \nbrown\n \u001B[31mfox \u001B[39m\n[31mjumpe[39m\n[31md ove[39m\n[31mr \u001B[39mthe\n lazy\n \u001B[32mdog \u001B[39m\n[32mand t[39m\n[32mhen r[39m\n[32man aw[39m\n[32may wi[39m\n[32mth th[39m\n[32me uni[39m\n[32mcorn.\u001B[39m'
  );
});

test('supports fullwidth characters', () => {
  assert.equal(wrapAnsi('안녕하세', 4, {hard: true}), '안녕\n하세');
});

test('supports unicode surrogate pairs', () => {
  assert.equal(
    wrapAnsi('a\uD83C\uDE00bc', 2, {hard: true}),
    'a\n\uD83C\uDE00\nbc'
  );
  assert.equal(
    wrapAnsi('a\uD83C\uDE00bc\uD83C\uDE00d\uD83C\uDE00', 2, {hard: true}),
    'a\n\uD83C\uDE00\nbc\n\uD83C\uDE00\nd\n\uD83C\uDE00'
  );
});

test('#23, properly wraps whitespace with no trimming', () => {
  assert.equal(wrapAnsi('   ', 2, {trim: false}), '  \n ');
  assert.equal(wrapAnsi('   ', 2, {trim: false, hard: true}), '  \n ');
});

test('#24, trims leading and trailing whitespace only on actual wrapped lines and only with trimming', () => {
  assert.equal(wrapAnsi('   foo   bar   ', 3), 'foo\nbar');
  assert.equal(wrapAnsi('   foo   bar   ', 6), 'foo\nbar');
  assert.equal(wrapAnsi('   foo   bar   ', 42), 'foo   bar');
  assert.equal(
    wrapAnsi('   foo   bar   ', 42, {trim: false}),
    '   foo   bar   '
  );
});

test('#24, trims leading and trailing whitespace inside a color block only on actual wrapped lines and only with trimming', () => {
  assert.equal(
    wrapAnsi(styleText('blue', '   foo   bar   '), 6),
    `${styleText('blue', 'foo')}\n${styleText('blue', 'bar')}`
  );
  assert.equal(
    wrapAnsi(styleText('blue', '   foo   bar   '), 42),
    styleText('blue', 'foo   bar')
  );
  assert.equal(
    wrapAnsi(styleText('blue', '   foo   bar   '), 42, {trim: false}),
    styleText('blue', '   foo   bar   ')
  );
});

test('#25, properly wraps whitespace between words with no trimming', () => {
  assert.equal(wrapAnsi('foo bar', 3), 'foo\nbar');
  assert.equal(wrapAnsi('foo bar', 3, {hard: true}), 'foo\nbar');
  assert.equal(wrapAnsi('foo bar', 3, {trim: false}), 'foo\n \nbar');
  assert.equal(
    wrapAnsi('foo bar', 3, {trim: false, hard: true}),
    'foo\n \nbar'
  );
});

test('#26, does not multiplicate leading spaces with no trimming', () => {
  assert.equal(wrapAnsi(' a ', 10, {trim: false}), ' a ');
  assert.equal(wrapAnsi('   a ', 10, {trim: false}), '   a ');
});

test('#27, does not remove spaces in line with ansi escapes when no trimming', () => {
  assert.equal(
    wrapAnsi(styleText('bgGreen', ` ${styleText('black', 'OK')} `), 100, {
      trim: false
    }),
    styleText('bgGreen', ` ${styleText('black', 'OK')} `)
  );
  assert.equal(
    wrapAnsi(styleText('bgGreen', `  ${styleText('black', 'OK')} `), 100, {
      trim: false
    }),
    styleText('bgGreen', `  ${styleText('black', 'OK')} `)
  );
  assert.equal(
    wrapAnsi(styleText('bgGreen', ' hello '), 10, {hard: true, trim: false}),
    styleText('bgGreen', ' hello ')
  );
});

test('#35, wraps hyperlinks, preserving clickability in supporting terminals', () => {
  const result1 = wrapAnsi(
    'Check out \u001B]8;;https://www.example.com\u0007my website\u001B]8;;\u0007, it is \u001B]8;;https://www.example.com\u0007supercalifragilisticexpialidocious\u001B]8;;\u0007.',
    16,
    {hard: true}
  );
  assert.equal(
    result1,
    'Check out \u001B]8;;https://www.example.com\u0007my\u001B]8;;\u0007\n\u001B]8;;https://www.example.com\u0007website\u001B]8;;\u0007, it is\n\u001B]8;;https://www.example.com\u0007supercalifragili\u001B]8;;\u0007\n\u001B]8;;https://www.example.com\u0007sticexpialidocio\u001B]8;;\u0007\n\u001B]8;;https://www.example.com\u0007us\u001B]8;;\u0007.'
  );

  const result2 = wrapAnsi(
    `Check out \u001B]8;;https://www.example.com\u0007my \uD83C\uDE00 ${styleText('bgGreen', 'website')}\u001B]8;;\u0007, it ${styleText('bgRed', 'is \u001B]8;;https://www.example.com\u0007super\uD83C\uDE00califragilisticexpialidocious\u001B]8;;\u0007')}.`,
    16,
    {hard: true}
  );
  assert.equal(
    result2,
    'Check out \u001B]8;;https://www.example.com\u0007my 🈀\u001B]8;;\u0007\n\u001B]8;;https://www.example.com\u0007\u001B[42mwebsite\u001B[49m\u001B]8;;\u0007, it \u001B[41mis\u001B[49m\n\u001B[41m\u001B]8;;https://www.example.com\u0007super🈀califragi\u001B]8;;\u0007\u001B[49m\n\u001B[41m\u001B]8;;https://www.example.com\u0007listicexpialidoc\u001B]8;;\u0007\u001B[49m\n\u001B[41m\u001B]8;;https://www.example.com\u0007ious\u001B]8;;\u0007\u001B[49m.'
  );
});

test('covers non-SGR/non-hyperlink ansi escapes', () => {
  assert.equal(
    wrapAnsi('Hello, \u001B[1D World!', 8),
    'Hello,\u001B[1D\nWorld!'
  );
  assert.equal(
    wrapAnsi('Hello, \u001B[1D World!', 8, {trim: false}),
    'Hello, \u001B[1D \nWorld!'
  );
});

test('#39, normalizes newlines', () => {
  assert.equal(
    wrapAnsi('foobar\r\nfoobar\r\nfoobar\nfoobar', 3, {hard: true}),
    'foo\nbar\nfoo\nbar\nfoo\nbar\nfoo\nbar'
  );
  assert.equal(
    wrapAnsi('foo bar\r\nfoo bar\r\nfoo bar\nfoo bar', 3),
    'foo\nbar\nfoo\nbar\nfoo\nbar\nfoo\nbar'
  );
});
