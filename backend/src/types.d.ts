import { build } from "./server.ts";

export type TypedFastify = Awaited<ReturnType<typeof build>>;

