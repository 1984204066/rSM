import { DataTypes, Database, Model, PostgresConnector } from 'https://deno.land/x/denodb/mod.ts';
// import {BinarySearchTree} from "./board.tsx";

//https://github.com/eveningkid/denodb#clients
// https://eveningkid.com/denodb-docs/docs/getting-started
const connector = new SQLite3Connector({
  filepath: './xsm.db',
});
const db = new Database(connector);


class BoardTBL extends Model {
  static table = 'boardtbl';
  static timestamps = true;

  static fields = {
      bid: { primaryKey: true, autoIncrement: true },
      tag: DataTypes.STRING,
      url: DataTypes.STRING,
      kind: DataTypes.INTERGER,
      name: DataTypes.STRING,
//    flightDuration: DataTypes.FLOAT,
  };

  static defaults = {
  };
}

db.link([BoardTBL]);

await db.sync({ drop: true });

export function initBoardTbl(Boards: Board[]) {
    console.log(Boards.length);
}
