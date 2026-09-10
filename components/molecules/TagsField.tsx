import { useState } from "react";
import { Chip } from "../atoms/Chip";
import { Combobox } from "../atoms/Combobox";
import { tagKey, tagNames } from "../../helpers/tags";
import type { Tag } from "../../types";

interface Props {
  /** Every live tag of the user, for suggestions and name resolution. */
  tags: Tag[];
  /** Selected tag ids. */
  value: string[];
  onChange: (ids: string[]) => void;
  /** Resolves to the created (or revived) tag's id. */
  createTag: (name: string) => Promise<string>;
  onError?: (message: string) => void;
  disabled?: boolean;
}

/**
 * Selected tags as removable chips plus an "Add tag" affordance that opens
 * a combobox over the user's tags. A typed name whose key matches an
 * existing tag reuses it ("trip 2026" is "Trip2026"); anything else is
 * created on the spot.
 */
export function TagsField({ tags, value, onChange, createTag, onError, disabled }: Props) {
  const [adding, setAdding] = useState(false);
  const selected = tagNames(value, tags);
  const suggestions = tags.filter((t) => t.id && !value.includes(t.id)).map((t) => t.name);

  const pick = async (raw: string) => {
    setAdding(false);
    const key = tagKey(raw);
    if (!key) return;
    const existing = tags.find((t) => t.key === key || tagKey(t.name) === key);
    if (existing?.id) {
      if (!value.includes(existing.id)) onChange([...value, existing.id]);
      return;
    }
    try {
      const id = await createTag(raw);
      onChange([...value, id]);
    } catch (err) {
      console.error("Failed to create tag:", err);
      onError?.(`Couldn't create the tag "${raw.trim()}"`);
    }
  };

  const remove = (name: string) => {
    const tag = tags.find((t) => t.name === name);
    if (tag?.id) onChange(value.filter((id) => id !== tag.id));
  };

  return (
    <div className="tags-field">
      <span className="label">Tags</span>
      <div className="chips">
        {selected.map((name) => (
          <Chip
            key={name}
            onRemove={disabled ? undefined : () => remove(name)}
            removeLabel={`Remove ${name}`}
          >
            {name}
          </Chip>
        ))}
        {!disabled && !adding && (
          <Chip variant="add" onClick={() => setAdding(true)}>
            Add tag
          </Chip>
        )}
      </div>
      {adding && (
        <Combobox
          autoFocus
          label="New tag"
          placeholder="Type a tag"
          suggestions={suggestions}
          onSelect={pick}
          onCancel={() => setAdding(false)}
        />
      )}

      <style jsx>{`
        .tags-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .label {
          font-size: 0.8125rem;
          color: var(--fg-1);
        }

        .chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
      `}</style>
    </div>
  );
}
