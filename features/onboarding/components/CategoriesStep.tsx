import { useState } from "react";
import { useCategories } from "../../../hooks/useCategories";
import { Chip } from "../../../components/atoms/Chip";
import { Combobox } from "../../../components/atoms/Combobox";
import { TrendingUp, TrendingDown, Briefcase, Lifebuoy } from "../../../components/atoms/Icons";
import suggestionsByDomain from "../data/categorySuggestions.json";
import type { Domain } from "../../../types";

const SECTIONS: { domain: Domain; label: string; Icon: typeof TrendingUp }[] = [
  { domain: "INCOME", label: "Incomes", Icon: TrendingUp },
  { domain: "EXPENSE", label: "Expenses", Icon: TrendingDown },
  { domain: "INVESTMENT", label: "Investments", Icon: Briefcase },
  { domain: "SAVING", label: "Savings", Icon: Lifebuoy },
];

function CategorySection({ domain, label, Icon }: (typeof SECTIONS)[number]) {
  const { categories, create, remove } = useCategories(domain);
  const [adding, setAdding] = useState(false);

  // Only top-level categories belong in this step; subcategories come later.
  const roots = categories.filter((c) => !c.parentId);

  // Don't suggest what the user already has.
  const taken = new Set(roots.map((c) => c.name.toLowerCase()));
  const suggestions = (suggestionsByDomain[domain] as string[]).filter(
    (name) => !taken.has(name.toLowerCase())
  );

  const commit = async (name: string) => {
    setAdding(false);
    try {
      await create({ domain, name });
    } catch (err) {
      console.error("Failed to create category:", err);
    }
  };

  return (
    <section className="section">
      <h2 className="heading">
        <Icon size={18} />
        {label}
      </h2>

      <div className="chips">
        {roots.map((cat) => (
          <Chip
            key={cat.id}
            onRemove={() => cat.id && remove(cat.id).catch(console.error)}
            removeLabel={`Remove ${cat.name}`}
          >
            {cat.name}
          </Chip>
        ))}

        {adding ? (
          <Combobox
            autoFocus
            label={`New ${label} category`}
            placeholder="Search or create"
            suggestions={suggestions}
            onSelect={commit}
            onCancel={() => setAdding(false)}
          />
        ) : (
          <Chip variant="add" onClick={() => setAdding(true)}>
            Add category
          </Chip>
        )}
      </div>

      <style jsx>{`
        .section {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .heading {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0;
          font-size: 0.9375rem;
          font-weight: 700;
          color: var(--fg-0);
        }

        .chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
        }
      `}</style>
    </section>
  );
}

export function CategoriesStep() {
  return (
    <div className="sections">
      {SECTIONS.map((s) => (
        <CategorySection key={s.domain} {...s} />
      ))}

      <style jsx>{`
        .sections {
          display: flex;
          flex-direction: column;
          gap: 28px;
        }
      `}</style>
    </div>
  );
}
