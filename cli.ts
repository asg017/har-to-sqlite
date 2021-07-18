import { parse } from "https://deno.land/std@0.101.0/flags/mod.ts";
import { expandGlobSync } from "https://deno.land/std@0.101.0/fs/expand_glob.ts";

import { DB } from "https://deno.land/x/sqlite@v2.4.2/mod.ts";

import { initHarDB, fillDb } from "./main.ts";
import { HAR } from "./types.ts";

export interface HarToSqliteArgs {
  // inputs/outputs
  _: string[];

  // --name, -n
  name?: string;
  n?: string;
}

async function main() {
  const args = parse(Deno.args) as HarToSqliteArgs;
  const name = args.name || args.n;

  if (args._.length < 2) {
    throw Error(
      "At least two arguments must be provided, e.g. 'har-to-sqlite input.db output.db'"
    );
  }

  const inputFilePaths = args._.slice(0, args._.length - 1);
  const outputFilePath = args._[args._.length - 1];

  const outDb = new DB(outputFilePath);
  initHarDB(outDb);

  for (const inputFilePath of inputFilePaths) {
    console.log(inputFilePath);
    for (const file of expandGlobSync(inputFilePath)) {
      const har = JSON.parse(await Deno.readTextFile(file.path)) as HAR;
      fillDb(outDb, har, name);
    }
  }
}

if (import.meta.main) {
  main();
}
