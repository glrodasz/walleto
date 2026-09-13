import { fn } from "storybook/test";
import { created, done, hookDefaults } from "../../stories/fixtures/hookDefaults";
import type { TagUpdate } from "../../schemas";

export const createTag = fn(async (_name: string) => created()).mockName("createTag");
export const updateTag = fn(async (_id: string, _patch: TagUpdate) => done()).mockName("updateTag");
export const removeTag = fn(async (_id: string) => done()).mockName("removeTag");
export const useTags = fn(hookDefaults.useTags).mockName("useTags");
