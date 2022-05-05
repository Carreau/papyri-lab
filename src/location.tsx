export interface ILocation {
  moduleName?: string;
  version?: string;
  kind?: string;
  path?: string;
}

export interface IBookmark {
  name: string;
  location: ILocation;
}
