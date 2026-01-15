export const STORAGE_ADAPTER_TYPE = Symbol('STORAGE_ADAPTER_TYPE');
export const STORAGE_CONFIG = Symbol('STORAGE_CONFIG');
export const SQLITE_DATABASE = Symbol('SQLITE_DATABASE');

export enum StorageAdapterType {
  SQLITE = 'sqlite',
  MONGODB = 'mongodb',
  POSTGRES = 'postgres',
  SUPABASE = 'supabase',
}

export interface StorageConfig {
  type: StorageAdapterType;
  connectionUri?: string;
  sqlitePath?: string;
  debug?: boolean;
}
