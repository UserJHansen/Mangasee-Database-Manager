function SeparateLines(input: string, split = '\n', trim = true): string[] {
  return trim ? input.split(split).map((x) => x.trim()) : input.split(split);
}

export function FindVariable(
  target: string,
  script: string,
  split = '\n',
  trim = true,
) {
  const variableRegex = new RegExp(
    `${split}.*?${target}(?: *= *)(.+?)${split}`,
    's',
  );

  return trim
    ? variableRegex.exec(script)?.[1].replace(/;/g, '').trim() || ''
    : variableRegex.exec(script)?.[1].trim().replace(/;/g, '') || '';
}

export function FindVariableArray(
  target: string,
  script: string,
  split = '\n',
  trim = true,
) {
  const ScriptArray = SeparateLines(script, split, trim);
  const variableRegex = new RegExp(`${target}(?: *= *)(.+)(?=;?)`);

  const result = [];
  for (let lineNo = 0; lineNo < ScriptArray.length; lineNo += 1) {
    if (variableRegex.exec(ScriptArray[lineNo])?.[1].replace(/;$/, '')) {
      result.push(
        variableRegex.exec(ScriptArray[lineNo])?.[1].replace(/;$/, ''),
      );
    }
  }

  return result;
}
