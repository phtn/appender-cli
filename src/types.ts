export interface State {
  name: string;
  is_valid: boolean;
  path: string;
}

export interface FilePath {
  src: State;
  des: State;
}

export interface LineItem {
  set: string;
  symbol: string;
  name: string;
  viewBox: string;
}
