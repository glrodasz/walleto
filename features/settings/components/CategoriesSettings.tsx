import { useState } from "react";
import { Card } from "../../../components/atoms/Card";
import { SectionTitle } from "../../../components/atoms/SectionTitle";
import { TextField } from "../../../components/atoms/TextField";
import { Button } from "../../../components/atoms/Button";
import { Chip } from "../../../components/atoms/Chip";
import { Combobox } from "../../../components/atoms/Combobox";
import { KebabMenu } from "../../../components/molecules/KebabMenu";
import { TabStrip } from "../../../components/atoms/TabStrip";
import { Pager } from "../../../components/molecules/Pager";
import { paginate } from "../../../utils/paginate";
import { ErrorState } from "../../../components/atoms/ErrorState";
import { useCategories } from "../../../hooks/useCategories";
import suggestions from "../../onboarding/data/categorySuggestions.json";
import { DOMAIN_CONFIG } from "../../domains/helpers/domainConfig";
import type { Domain } from "../../../types";

const DOMAINS: Domain[] = ["INCOME", "EXPENSE", "INVESTMENT", "SAVING"];
const PAGE_SIZE = 25;
const SUGGESTIONS = suggestions as Record<Domain, string[]>;

/**
 * Root categories per domain: rename, add, archive. Subcategories are still
 * created from the forms; archiving keeps every transaction filed under the
 * category, it only leaves the pickers.
 */
export function CategoriesSettings() {
  const [domain, setDomain] = useState<Domain>("EXPENSE");
  const { categories, loading, error, create, rename, remove } = useCategories(domain);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const roots = categories.filter((c) => !c.parentId);
  const paged = paginate(roots, page, PAGE_SIZE);
  const taken = new Set(roots.map((c) => c.name.trim().toLowerCase()));
  const available = SUGGESTIONS[domain].filter((s) => !taken.has(s.toLowerCase()));

  const run = async (id: string, action: () => Promise<void>, failure: string) => {
    setBusyId(id);
    setMessage(null);
    try {
      await action();
    } catch (err) {
      console.error(failure, err);
      setMessage(failure);
    } finally {
      setBusyId(null);
    }
  };

  const startRename = (id: string, name: string) => {
    setEditingId(id);
    setDraft(name);
  };
  const saveRename = async () => {
    const id = editingId;
    const name = draft.trim();
    if (!id || !name) return;
    const current = roots.find((c) => c.id === id);
    setEditingId(null);
    if (current && current.name === name) return;
    await run(id, () => rename(id, name), "Couldn't rename the category");
  };
  const add = async (raw: string) => {
    const name = raw.trim();
    setAdding(false);
    if (!name || taken.has(name.toLowerCase())) return;
    await run(
      "new",
      async () => void (await create({ domain, name })),
      "Couldn't add the category"
    );
  };

  return (
    <Card>
      <SectionTitle title="Categories" />
      <TabStrip
        label="Domain"
        tabs={DOMAINS.map((d) => ({
          key: d,
          label: DOMAIN_CONFIG[d].title,
          accent: DOMAIN_CONFIG[d].accent,
        }))}
        value={domain}
        onChange={(d) => {
          setDomain(d as Domain);
          setPage(1);
          setEditingId(null);
          setAdding(false);
          setMessage(null);
        }}
      />

      {error && <ErrorState error={error} />}

      {loading ? (
        <p className="hint">Loading…</p>
      ) : (
        <ul className="list">
          {paged.rows.map((c) => (
            <li key={c.id} className="row">
              {editingId === c.id ? (
                <form
                  className="rename"
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveRename();
                  }}
                >
                  <TextField
                    aria-label="Category name"
                    value={draft}
                    autoFocus
                    onValueChange={setDraft}
                  />
                  <Button type="submit" variant="primary" size="sm">
                    Save
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                </form>
              ) : (
                <>
                  <span className="name">{c.name}</span>
                  {c.isDefault && <span className="default">default</span>}
                  <KebabMenu
                    aria-label={`Actions for ${c.name}`}
                    actions={[
                      { label: "Rename", onSelect: () => c.id && startRename(c.id, c.name) },
                      {
                        label: busyId === c.id ? "Archiving…" : "Archive",
                        onSelect: () =>
                          c.id && run(c.id, () => remove(c.id!), "Couldn't archive the category"),
                        danger: true,
                        disabled: busyId === c.id,
                      },
                    ]}
                  />
                </>
              )}
            </li>
          ))}
          {roots.length === 0 && <li className="hint">No categories yet</li>}
        </ul>
      )}

      <Pager page={paged.page} pageCount={paged.pageCount} onChange={setPage} />

      <div className="add">
        {adding ? (
          <Combobox
            autoFocus
            label={`New ${DOMAIN_CONFIG[domain].title.toLowerCase()} category`}
            placeholder="Type a name"
            suggestions={available}
            onSelect={add}
            onCancel={() => setAdding(false)}
          />
        ) : (
          <Chip variant="add" onClick={() => setAdding(true)}>
            Add category
          </Chip>
        )}
      </div>

      {message && (
        <p className="message" role="alert">
          {message}
        </p>
      )}

      <style jsx>{`
        .list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
        }

        .row {
          display: flex;
          align-items: center;
          gap: 8px;
          min-height: 44px;
          border-bottom: 1px solid var(--line);
        }

        .row:last-child {
          border-bottom: none;
        }

        .name {
          flex: 1;
          min-width: 0;
          font-size: 0.9rem;
          color: var(--fg-0);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .default {
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--fg-2);
        }

        .rename {
          flex: 1;
          display: flex;
          align-items: flex-end;
          gap: 8px;
          padding: 6px 0;
        }

        .rename > :global(.field) {
          flex: 1;
        }

        .add {
          margin-top: 12px;
        }

        .hint {
          margin: 0;
          font-size: 0.85rem;
          color: var(--fg-2);
        }

        .message {
          margin: 10px 0 0;
          font-size: 0.85rem;
          color: var(--accent-hot);
        }
      `}</style>
    </Card>
  );
}
