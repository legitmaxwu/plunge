type JSONType = Record<string, unknown> | string | boolean | number;

export enum LocalStorageKey {
  StackStore = "StackStore",
  HidePromptSelectText = "HidePromptSelectText",
  TurboMode = "TurboMode",
}

type LocalStorageTypeMap = {
  [LocalStorageKey.StackStore]: JSONType;
  [LocalStorageKey.HidePromptSelectText]: boolean;
  [LocalStorageKey.TurboMode]: boolean;
};

export const LocalStorage = {
  set: <T extends LocalStorageKey>(key: T, val: LocalStorageTypeMap[T]) => {
    window.localStorage.setItem(key, JSON.stringify(val));
  },
  get: <T extends LocalStorageKey>(key: T) => {
    const ret = window.localStorage.getItem(key);
    if (!ret) return null;
    return JSON.parse(ret) as LocalStorageTypeMap[T];
  },
  delete: (key: LocalStorageKey) => {
    window.localStorage.removeItem(key);
  },
  clear: () => {
    window.localStorage.clear();
  },
};
