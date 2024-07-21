export interface Player {
  resource: string;
  id: number;
  country_id: number;
  firstname: string;
  lastname: string;
  fullname: string;
  image_path: string;
  dateofbirth: string;
  gender: string;
  battingstyle: string;
  bowlingstyle: string;
  position: Position;
  updated_at: string;
}

export interface Position {
  resource: string;
  id: number;
  name: string;
}

export interface Metadata {
  total: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

export interface QueryResult<T> {
  results: T[];
  fields: any;
}
