import {themeEl} from '@ui/root-el';

export function setThemeValue(key: string, value: string) {
  themeEl?.style.setProperty(key, value);
}

export function removeThemeValue(key: string) {
  themeEl?.style.removeProperty(key);
}
