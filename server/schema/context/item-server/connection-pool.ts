import { BehaviorSubject, combineLatest, ReplaySubject } from "rxjs";
import { map, share, switchMap } from "rxjs/operators";
import type { Connection, Item } from "./connectors/model";

export function initialiseConnectionPool() {
  const connections$ = new BehaviorSubject<Connection[]>([]);

  const setConnections = (connections: Connection[]) => {
    connections$.next(connections);
  };
  const connectionData$ = connections$.pipe(
    switchMap((connections) => combineLatest(connections))
  );
  const items$ = connectionData$.pipe(
    map((connectionData) =>
      connectionData.reduce<Item[]>(
        (items, data) => [...items, ...data.items],
        []
      )
    ),
    share({
      connector: () => new ReplaySubject(1),
      resetOnComplete: false,
      resetOnError: false,
      resetOnRefCountZero: false,
    })
  );

  return {
    setConnections,
    items$,
    connections$,
    connectionData$,
  };
}