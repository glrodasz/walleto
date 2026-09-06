import { useState } from "react";
import { Select } from "../atoms/Select";
import { Chip } from "../atoms/Chip";
import { Combobox } from "../atoms/Combobox";
import type { Category } from "../../types";

interface Props {
  /** Every category of the domain; only roots are offered. */
  categories: Category[];
  value: string;
  onChange: (categoryId: string) => void;
  /** Resolves to the new category's id, which is selected immediately. */
  createCategory: (name: string) => Promise<string>;
  /** Label for the inline creator ("New expense category"). */
  newLabel: string;
  onError?: (message: string) => void;
  disabled?: boolean;
}

/**
 * Category select with an inline "New category" creator, shared by every form
 * that files something under a category. Typing an existing name selects it
 * instead of creating a duplicate.
 */
export function CategoryField({
  categories,
  value,
  onChange,
  createCategory,
  newLabel,
  onError,
  disabled,
}: Props) {
  const [creating, setCreating] = useState(false);
  const roots = categories.filter((c) => !c.parentId);
  const options = roots.map((c) => ({ value: c.id!, label: c.name }));

  const commit = async (raw: string) => {
    const name = raw.trim();
    setCreating(false);
    const existing = roots.find((c) => c.name.toLowerCase() === name.toLowerCase());
    if (existing?.id) {
      onChange(existing.id);
      return;
    }
    try {
      onChange(await createCategory(name));
    } catch (err) {
      console.error("Failed to create category:", err);
      onError?.(`Couldn't create the category "${name}"`);
    }
  };

  if (creating) {
    return (
      <Combobox
        autoFocus
        label={newLabel}
        placeholder="Type a name"
        suggestions={[]}
        onSelect={commit}
        onCancel={() => setCreating(false)}
      />
    );
  }

  return (
    <div className="category">
      <Select
        label="Category"
        placeholder="Pick a category"
        options={options}
        value={value}
        disabled={disabled}
        onValueChange={onChange}
      />
      <div className="category-add">
        {!disabled && (
          <Chip variant="add" onClick={() => setCreating(true)}>
            New category
          </Chip>
        )}
      </div>

      <style jsx>{`
        .category {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .category-add {
          display: flex;
        }
      `}</style>
    </div>
  );
}
