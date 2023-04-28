// db.ts
import { createId } from "@paralleldrive/cuid2";
import { sql } from "drizzle-orm";
import {
  boolean,
  customType,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const goals = mysqlTable("goals", {
  id: varchar("id", { length: 191 }).primaryKey(),
  completed: boolean("completed").notNull().default(false),
  type: mysqlEnum("type", ["CUSTOM", "DOCUMENT"]),
  createdAt: timestamp("createdAt", { fsp: 2 })
    .notNull()
    .default(sql`(now(2))`),
  userId: varchar("userId", { length: 191 }).notNull(),
  title: text("title").notNull(),
  guideMarkdown: text("guideMarkdown"),
});

export const links = mysqlTable(
  "links",
  {
    id: varchar("id", { length: 191 }).primaryKey(),
    createdAt: timestamp("createdAt", { fsp: 2 })
      .notNull()
      .default(sql`(now(2))`),
    lexoRankIndex: varchar("lexoRankIndex", { length: 191 }).notNull(),
    parentId: varchar("parentId", { length: 191 }).notNull(),
    childId: varchar("childId", { length: 191 }).notNull(),
  },
  (links) => ({
    uniqueParentChild: uniqueIndex("unique_parent_child").on(
      links.parentId,
      links.childId
    ),
    parentLexoRankIndex: uniqueIndex("parent_lexoRankIndex").on(
      links.parentId,
      links.lexoRankIndex
    ),
    childLexoRankIndex: uniqueIndex("child_lexoRankIndex").on(
      links.childId,
      links.lexoRankIndex
    ),
  })
);

export const journeys = mysqlTable(
  "journeys",
  {
    id: varchar("id", { length: 191 }).primaryKey(),
    createdAt: timestamp("createdAt", { fsp: 2 })
      .notNull()
      .default(sql`(now(2))`),
    goalId: varchar("goalId", { length: 191 }).notNull(),
    userId: varchar("userId", { length: 191 }).notNull(),
  },
  (journeys) => ({
    goalUserId: uniqueIndex("goal_userId").on(journeys.goalId, journeys.userId),
  })
);
