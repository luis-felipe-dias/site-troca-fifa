import mongoose from "mongoose";

declare global {
  // eslint-disable-next-line no-var
  var __mongooseConn: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } | undefined;
}

const globalState = globalThis as typeof globalThis & {
  __mongooseConn?: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
};

if (!globalState.__mongooseConn) {
  globalState.__mongooseConn = { conn: null, promise: null };
}

export async function connectMongo() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI não definido");

  if (globalState.__mongooseConn!.conn) return globalState.__mongooseConn!.conn;

  if (!globalState.__mongooseConn!.promise) {
    globalState.__mongooseConn!.promise = mongoose
      .connect(uri, {
        dbName: "troca_figuras"
      })
      .then((m) => m);
  }

  globalState.__mongooseConn!.conn = await globalState.__mongooseConn!.promise;
  return globalState.__mongooseConn!.conn;
}

