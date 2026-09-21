import { describe, it, expect } from "vitest";
import { insightCreateSchema, insightUpdateSchema, insightPublishSchema } from "./insights-schema";

describe("insights-schema", () => {
  describe("insightCreateSchema", () => {
    it("validates a complete insight", () => {
      const data = {
        slug: "my-first-insight",
        title: "My First Insight",
        body: "This is a longer body with meaningful content about insights and strategies.",
        author: "John Doe",
      };
      const result = insightCreateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("rejects slug with spaces", () => {
      const data = {
        slug: "my insight",
        title: "Title",
        body: "This is a longer body with meaningful content about insights and strategies.",
        author: "Author",
      };
      const result = insightCreateSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("rejects short slug", () => {
      const data = {
        slug: "ab",
        title: "Title",
        body: "This is a longer body with meaningful content.",
        author: "Author",
      };
      const result = insightCreateSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("rejects short body", () => {
      const data = {
        slug: "my-insight",
        title: "Title",
        body: "Short",
        author: "Author",
      };
      const result = insightCreateSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("insightUpdateSchema", () => {
    it("allows partial updates", () => {
      const data = {
        title: "Updated Title",
      };
      const result = insightUpdateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("allows empty partial updates", () => {
      const result = insightUpdateSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe("insightPublishSchema", () => {
    it("validates publish status", () => {
      const result = insightPublishSchema.safeParse({ status: "published" });
      expect(result.success).toBe(true);
    });

    it("validates draft status", () => {
      const result = insightPublishSchema.safeParse({ status: "draft" });
      expect(result.success).toBe(true);
    });

    it("rejects invalid status", () => {
      const result = insightPublishSchema.safeParse({ status: "archived" });
      expect(result.success).toBe(false);
    });
  });
});
