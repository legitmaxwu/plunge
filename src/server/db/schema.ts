// db.ts
import { type InferSelectModel, sql } from "drizzle-orm";
import {
  pgEnum,
  pgTableCreator,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

const pgTable = pgTableCreator((name) => `plunge_${name}`);

export const questionTypeEnum = pgEnum("question_type", ["CUSTOM", "DOCUMENT"]);

export const questions = pgTable("questions", {
  id: varchar("id", { length: 191 }).primaryKey(),
  type: questionTypeEnum("question_type"),
  createdAt: timestamp("createdAt", { precision: 3 }).notNull().defaultNow(),
  userId: varchar("userId", { length: 191 }).notNull(),
  title: text("title").notNull(),
  guideMarkdown: text("guideMarkdown"),
});

export type Question = InferSelectModel<typeof questions>;

export const links = pgTable(
  "links",
  {
    id: varchar("id", { length: 191 }).primaryKey(),
    createdAt: timestamp("createdAt", { precision: 3 }).notNull().defaultNow(),
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

export const plunges = pgTable(
  "plunges",
  {
    id: varchar("id", { length: 191 }).primaryKey(),
    createdAt: timestamp("createdAt", { precision: 3 }).notNull().defaultNow(),
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
