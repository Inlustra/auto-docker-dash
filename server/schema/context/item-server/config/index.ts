import { readFile as _readFile, exists as _exists } from "fs";
import { promisify } from "util";
import { Validator } from "jsonschema";
import schema from "./schema.json";
import { fileWatchObservable } from "../../../../utils/file-watch-observable";
import { ConnectorConfig } from "../connectors";
import { environment } from "../../../../environment";
import { catchError, map, switchMap } from "rxjs/operators";
import { BehaviorSubject, concat, EMPTY, from, of } from "rxjs";
const exists = promisify(_exists);
const readFile = promisify(_readFile);

export interface ServerConfig {
  connectors: ConnectorConfig[] | ConnectorConfig;
}

async function getConfigFileContents() {
  return readFile(environment().localConfigFile);
}

const schemaValidator = new Validator();

export function getServerConfig() {
  const defaultConfig = new BehaviorSubject<ServerConfig>({
    connectors: [
      {
        type: "docker",
        config: {},
      },
    ],
  });

  const filePath = environment().localConfigFile;
  return from(exists(environment().localConfigFile)).pipe(
    switchMap((fileExists) => {
      if (fileExists) {
        console.debug("File exists, attempting to load file config");
        return from(getConfigFileContents()).pipe(
          switchMap((contents) =>
            concat(
              of(contents),
              fileWatchObservable(filePath).pipe(
                switchMap(() => from(getConfigFileContents()))
              )
            )
          ),
          map((buffer) => JSON.parse(buffer.toString("utf-8"))),
          map((config) => {
            schemaValidator.validate(config, schema, { throwAll: true });
            return config as ServerConfig;
          }),
          catchError((error) => {
            console.error(error);
            console.error("You can edit your config file to trigger a reload");
            return EMPTY;
          })
        );
      }
      console.warn(`Unable to watch config file. Does it exist?
      Reverting to /var/run/docker.sock`);
      return defaultConfig;
    })
  );
}