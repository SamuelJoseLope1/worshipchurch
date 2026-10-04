import { useSyncExternalStore } from "react";
import { engine, type EngineSnapshot } from "./engine";

const server = engine.getSnapshot();
export function useEngine(): EngineSnapshot {
  return useSyncExternalStore(engine.subscribe, engine.getSnapshot, () => server);
}
export { engine };
