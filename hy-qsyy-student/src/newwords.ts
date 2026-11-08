const KEY = "qsyy-student-newwords";

export interface NewWord {
  word: string;
  meaning: string;
  module: string;
}

export function loadNewWords(): NewWord[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function addNewWord(item: NewWord) {
  const list = loadNewWords().filter(row => !(row.word === item.word && row.module === item.module));
  list.unshift(item);
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, 200)));
}
