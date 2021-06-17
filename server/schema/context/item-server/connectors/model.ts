import { Observable } from "rxjs";

export interface Item {
  name: string;
  category: string | null;
  icon: string | null;
  link: string | null;
  state: "RED" | "GREEN" | "YELLOW" | "GREY";
  status: string | null;
  parents: string[];
}

export interface ConnectionData {
  id: string;
  connected: boolean;
  lastUpdated: Date | null;
  items: Item[];
  error: string | null;
}

export type Connection = Observable<ConnectionData>;
export type Connector = (data: any) => Connection;
export type ConnectorMap = { [key: string]: Connector };
