const KEY = "qsyy-student-stars";

type StarState = { fragments: Record<string, number>; lit: number[] };

function read(): StarState {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || "");
    return {
      fragments: data.fragments || {},
      lit: Array.isArray(data.lit) ? data.lit : []
    };
  } catch {
    return { fragments: {}, lit: [] };
  }
}

function write(state: StarState) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function starState() {
  return read();
}

export function addFragment(id: number) {
  const state = read();
  const key = String(id);
  state.fragments[key] = (state.fragments[key] || 0) + 1;
  write(state);
  return state;
}

export function lightStar(id: number, need: number) {
  const state = read();
  const key = String(id);
  if (state.lit.includes(id) || (state.fragments[key] || 0) < need) return state;
  state.fragments[key] -= need;
  state.lit.push(id);
  write(state);
  return state;
}
