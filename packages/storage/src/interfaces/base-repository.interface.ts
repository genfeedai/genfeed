export interface QueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FindOptions<T> extends QueryOptions {
  where?: Partial<T>;
}

export interface IBaseRepository<T, CreateDto, UpdateDto> {
  create(data: CreateDto): Promise<T>;
  findById(id: string): Promise<T | null>;
  findOne(options: FindOptions<T>): Promise<T | null>;
  findAll(options?: FindOptions<T>): Promise<T[]>;
  update(id: string, data: UpdateDto): Promise<T | null>;
  softDelete(id: string): Promise<T | null>;
  hardDelete(id: string): Promise<boolean>;
  count(options?: FindOptions<T>): Promise<number>;
}
