import { useState } from "react";
import { useCategories } from "../../../hooks/useCategories";
import { Chip } from "../../../components/atoms/Chip";
import { Combobox } from "../../../components/atoms/Combobox";
import { ErrorState } from "../../../components/atoms/ErrorState";
import {
  TrendingUp,
  TrendingDown,
  Briefcase,
  Lifebuoy,
  CreditCard,
} from "../../../components/atoms/Icons";
import suggestionsByDomain from "../data/categorySuggestions.json";
import type { Category, Domain } from "../../../types";

const SECTIONS: { domain: Domain; label: string; Icon: typeof TrendingUp }[] = [
  { domain: "INCOME", label: "Income", Icon: TrendingUp },
  { domain: "EXPENSE", label: "Expenses", Icon: TrendingDown },
  { domain: "INVESTMENT", label: "Investments", Icon: Briefcase },
  { domain: "SAVING", label: "Savings", Icon: Lifebuoy },
  { domain: "DEBT", label: "Debts", Icon: CreditCard },
];

type Section = (typeof SECTIONS)[number];

interface SectionProps extends Section {
  /** This domain's top-level categories. */
  roots: Category[];
  /** First snapshot still pending: show placeholders, not an empty section. */
  loading: boolean;
  create: ReturnType<typeof useCategories>["create"];
  remove: ReturnType<typeof useCategories>["remove"];
}

function CategorySection({ domain, label, Icon, roots, loading, create, remove }: SectionProps) {
  const [adding, setAdding] = useState(false);

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

      <div className="chips" aria-busy={loading || undefined}>
        {loading &&
          [72, 96, 64].map((width) => (
            <span key={width} className="placeholder" style={{ width }} aria-hidden="true" />
          ))}

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
        ) : loading ? null : (
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

        .placeholder {
          height: 34px;
          border-radius: 999px;
          background: var(--glass-inset);
          animation: pulse 1.2s ease-in-out infinite;
        }

        @keyframes pulse {
          50% {
            opacity: 0.45;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .placeholder {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}

export function CategoriesStep() {
  // One listener for all five sections: a brand-new user used to wait on five
  // separate queries, each painting its section whenever it happened to land.
  const { categories, loading, error, create, remove } = useCategories();

  if (error) return <ErrorState title="Couldn't load your categories" error={error} />;

  // Only top-level categories belong in this step; subcategories come later.
  const rootsFor = (domain: Domain) => categories.filter((c) => c.domain === domain && !c.parentId);

  return (
    <div className="sections">
      {SECTIONS.map((s) => (
        <CategorySection
          key={s.domain}
          {...s}
          roots={rootsFor(s.domain)}
          loading={loading}
          create={create}
          remove={remove}
        />
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
