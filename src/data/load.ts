import type { Meta } from './types';

/** Loads a committed snapshot from public/data. */
export async function loadSnapshot<T>(name: string): Promise<T> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/${name}.json`);
  if (!res.ok) throw new Error(`Failed to load ${name}.json (${res.status})`);
  return (await res.json()) as T;
}

export const loadMeta = () => loadSnapshot<Meta>('meta');
