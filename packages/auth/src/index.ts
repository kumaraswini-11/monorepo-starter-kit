import { auth } from "./auth.js";

export { auth };

/** Inferred types for consumers (apps, server code). */
export type Session = typeof auth.$Infer.Session;
export type User = Session["user"];
