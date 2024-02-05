// db.ts
import { type InferModel, sql } from "drizzle-orm";
import {
  mysqlEnum,
  mysqlTableCreator,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

const mysqlTable = mysqlTableCreator((name) => `plunge_${name}`);

export const questions = mysqlTable("questions", {
  id: varchar("id", { length: 191 }).primaryKey(),
  type: mysqlEnum("type", ["CUSTOM", "DOCUMENT"]),
  createdAt: timestamp("createdAt", { fsp: 2 })
    .notNull()
    .default(sql`(now(2))`),
  userId: varchar("userId", { length: 191 }).notNull(),
  title: text("title").notNull(),
  guideMarkdown: text("guideMarkdown"),
});

export type Question = InferModel<typeof questions>;

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

export const plunges = mysqlTable(
  "plunges",
  {
    id: varchar("id", { length: 191 }).primaryKey(),
    createdAt: timestamp("createdAt", { fsp: 2 })
      .notNull()
      .default(sql`(now(2))`),
    questionId: varchar("questionId", { length: 191 }).notNull(),
    userId: varchar("userId", { length: 191 }).notNull(),
  },
  (journeys) => ({
    questionIdUserId: uniqueIndex("questionId_userId").on(
      journeys.questionId,
      journeys.userId
    ),
  })
);
