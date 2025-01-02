import { Tables } from "./schema"

export type Project = Tables<"projects"> & {
  documents: Tables<"documents">[]
} 