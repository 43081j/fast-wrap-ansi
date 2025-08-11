import stringWidth from 'fast-string-width';

const ESC = '\x1B';
const CSI = '\x9B';

const END_CODE = 39;
const ANSI_ESCAPE_BELL = '\u0007';
const ANSI_CSI = '[';
const ANSI_OSC = ']';
const ANSI_SGR_TERMINATOR = 'm';
const ANSI_ESCAPE_LINK = `${ANSI_OSC}8;;`;
const GROUP_REGEX = new RegExp(
  `(?:\\${ANSI_CSI}(?<code>\\d+)m|\\${ANSI_ESCAPE_LINK}(?<uri>.*)${ANSI_ESCAPE_BELL})`,
  'y'
);

const getClosingCode = (openingCode: number): number | undefined => {
  if (openingCode >= 30 && openingCode <= 37) return 39;
  if (openingCode >= 90 && openingCode <= 97) return 39;
  if (openingCode >= 40 && openingCode <= 47) return 49;
  if (openingCode >= 100 && openingCode <= 107) return 49;
  if (openingCode === 1 || openingCode === 2) return 22;
  if (openingCode === 3) return 23;
  if (openingCode === 4) return 24;
  if (openingCode === 7) return 27;
  if (openingCode === 8) return 28;
  if (openingCode === 9) return 29;
  if (openingCode === 0) return 0;
  return undefined;
};

const wrapAnsiCode = (code: number): string =>
  `${ESC}${ANSI_CSI}${code}${ANSI_SGR_TERMINATOR}`;
const wrapAnsiHyperlink = (url: string): string =>
  `${ESC}${ANSI_ESCAPE_LINK}${url}${ANSI_ESCAPE_BELL}`;

const wrapWord = (rows: string[], word: string, columns: number) => {
  const characters = word[Symbol.iterator]();

  let isInsideEscape = false;
  let isInsideLinkEscape = false;
  let lastRow = rows.at(-1);
  let visible = lastRow === undefined ? 0 : stringWidth(lastRow);
  let currentCharacter = characters.next();
  let nextCharacter = characters.next();
  let rawCharacterIndex = 0;

  while (!currentCharacter.done) {
    const character = currentCharacter.value;
    const characterLength = stringWidth(character);

    if (visible + characterLength <= columns) {
      rows[rows.length - 1] += character;
    } else {
      rows.push(character);
      visible = 0;
    }

    if (character === ESC || character === CSI) {
      isInsideEscape = true;

      isInsideLinkEscape = word.startsWith(
        ANSI_ESCAPE_LINK,
        rawCharacterIndex + 1
      );
    }

    if (isInsideEscape) {
      if (isInsideLinkEscape) {
        if (character === ANSI_ESCAPE_BELL) {
          isInsideEscape = false;
          isInsideLinkEscape = false;
        }
      } else if (character === ANSI_SGR_TERMINATOR) {
        isInsideEscape = false;
      }
    } else {
      visible += characterLength;

      if (visible === columns && !nextCharacter.done) {
        rows.push('');
        visible = 0;
      }
    }

    currentCharacter = nextCharacter;
    nextCharacter = characters.next();
    rawCharacterIndex += character.length;
  }

  lastRow = rows.at(-1);
  if (
    !visible &&
    lastRow !== undefined &&
    lastRow.length > 0 &&
    rows.length > 1
  ) {
    rows[rows.length - 2] += rows.pop();
  }
};

const stringVisibleTrimSpacesRight = (string: string): string => {
  const words = string.split(' ');
  let last = words.length;

  while (last > 0) {
    if (stringWidth(words[last - 1]) > 0) {
      break;
    }

    last--;
  }

  if (last === words.length) {
    return string;
  }

  return words.slice(0, last).join(' ') + words.slice(last).join('');
};

export interface Options {
  trim?: boolean;
  wordWrap?: boolean;
  hard?: boolean;
}

const exec = (
  string: string,
  columns: number,
  options: Options = {}
): string => {
  if (options.trim !== false && string.trim() === '') {
    return '';
  }

  let returnValue = '';
  let escapeCode;
  let escapeUrl;

  const words = string.split(' ');
  let rows = [''];
  let rowLength = 0;

  for (const [index, word] of words.entries()) {
    if (options.trim !== false) {
      const row = rows.at(-1) ?? '';
      const trimmed = row.trimStart();
      if (row.length !== trimmed.length) {
        rows[rows.length - 1] = trimmed;
        rowLength = stringWidth(trimmed);
      }
    }

    if (index !== 0) {
      if (
        rowLength >= columns &&
        (options.wordWrap === false || options.trim === false)
      ) {
        rows.push('');
        rowLength = 0;
      }

      if (rowLength > 0 || options.trim === false) {
        rows[rows.length - 1] += ' ';
        rowLength++;
      }
    }

    const wordLength = stringWidth(word);
    if (options.hard && wordLength > columns) {
      const remainingColumns = columns - rowLength;
      const breaksStartingThisLine =
        1 + Math.floor((wordLength - remainingColumns - 1) / columns);
      const breaksStartingNextLine = Math.floor((wordLength - 1) / columns);
      if (breaksStartingNextLine < breaksStartingThisLine) {
        rows.push('');
      }

      wrapWord(rows, word, columns);
      rowLength = stringWidth(rows.at(-1) ?? '')
      continue;
    }

    if (
      rowLength + wordLength > columns &&
      rowLength > 0 &&
      wordLength > 0
    ) {
      if (options.wordWrap === false && rowLength < columns) {
        wrapWord(rows, word, columns);
        rowLength = stringWidth(rows.at(-1) ?? '')
        continue;
      }

      rows.push('');
      rowLength = 0;
    }

    if (rowLength + wordLength > columns && options.wordWrap === false) {
      wrapWord(rows, word, columns);
      rowLength = stringWidth(rows.at(-1) ?? '')
      continue;
    }

    rows[rows.length - 1] += word;
    rowLength += wordLength;
  }

  if (options.trim !== false) {
    rows = rows.map((row) => stringVisibleTrimSpacesRight(row));
  }

  const preString = rows.join('\n');
  const pre = preString[Symbol.iterator]();
  let currentPre = pre.next();
  let nextPre = pre.next();

  // We need to keep a separate index as `String#slice()` works on Unicode code units, while `pre` is an array of codepoints.
  let preStringIndex = 0;

  while (!currentPre.done) {
    const character = currentPre.value;
    const nextCharacter = nextPre.value;

    returnValue += character;

    if (character === ESC || character === CSI) {
      GROUP_REGEX.lastIndex = preStringIndex + 1;
      const groupsResult = GROUP_REGEX.exec(preString);

      const groups = groupsResult?.groups;

      if (groups?.code !== undefined) {
        const code = Number.parseFloat(groups.code);
        escapeCode = code === END_CODE ? undefined : code;
      } else if (groups?.uri !== undefined) {
        escapeUrl = groups.uri.length === 0 ? undefined : groups.uri;
      }
    }

    const closingCode = escapeCode ? getClosingCode(escapeCode) : undefined;

    if (nextCharacter === '\n') {
      if (escapeUrl) {
        returnValue += wrapAnsiHyperlink('');
      }

      if (escapeCode && closingCode) {
        returnValue += wrapAnsiCode(closingCode);
      }
    } else if (character === '\n') {
      if (escapeCode && closingCode) {
        returnValue += wrapAnsiCode(escapeCode);
      }

      if (escapeUrl) {
        returnValue += wrapAnsiHyperlink(escapeUrl);
      }
    }

    preStringIndex += character.length;

    currentPre = nextPre;
    nextPre = pre.next();
  }

  return returnValue;
};

export function wrapAnsi(string: string, columns: number, options?: Options) {
  return String(string)
    .normalize()
    .replaceAll('\r\n', '\n')
    .split('\n')
    .map((line) => exec(line, columns, options))
    .join('\n');
}
