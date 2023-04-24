import { z } from "zod";
type JSONType = Record<string, unknown> | string | boolean | number;

export enum LocalStorageKey {
  StackStore = "StackStore",
}

export const LocalStorage = {
  set: (key: LocalStorageKey, val: JSONType) => {
    window.localStorage.setItem(key, JSON.stringify(val));
  },
  get: (key: LocalStorageKey): JSONType | null => {
    const ret = window.localStorage.getItem(key);
    if (!ret) return null;
    return JSON.parse(ret) as JSONType;
  },
  delete: (key: LocalStorageKey) => {
    window.localStorage.removeItem(key);
  },
  clear: () => {
    window.localStorage.clear();
  },
};
