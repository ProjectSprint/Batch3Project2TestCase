import { Config } from "./config.js";

export type Scenario<T> = (config: Config, tags: Record<string, string>, info: any) => T
export type Scenarios = Record<string, Scenario<T>> 
