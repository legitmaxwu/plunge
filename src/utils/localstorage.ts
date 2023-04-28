type JSONType = Record<string, unknown> | string | boolean | number;

export enum LocalStorageKey {
  StackStore = "StackStore",
  HidePromptSelectText = "HidePromptSelectText",
}

interface LocalStorageType extends Record<LocalStorageKey, JSONType> {
  [LocalStorageKey.StackStore]: JSONType;
  [LocalStorageKey.HidePromptSelectText]: boolean;
}

export const LocalStorage = {
  set: <T extends LocalStorageKey>(key: T, val: LocalStorageType[T]) => {
    window.localStorage.setItem(key, JSON.stringify(val));
  },
  get: <T extends LocalStorageKey>(
    key: LocalStorageKey
  ): LocalStorageType[T] | null => {
    const ret = window.localStorage.getItem(key);
    if (!ret) return null;
    return JSON.parse(ret) as LocalStorageType[T];
  },
  delete: (key: LocalStorageKey) => {
    window.localStorage.removeItem(key);
  },
  clear: () => {
    window.localStorage.clear();
  },
};
