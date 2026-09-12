import { useState } from "react";
import { Card } from "../../../components/atoms/Card";
import { SectionTitle } from "../../../components/atoms/SectionTitle";
import { TextField } from "../../../components/atoms/TextField";
import { Button } from "../../../components/atoms/Button";
import { Chip } from "../../../components/atoms/Chip";
import { Combobox } from "../../../components/atoms/Combobox";
import { KebabMenu } from "../../../components/molecules/KebabMenu";
import { Modal } from "../../../components/molecules/Modal";
import { TabStrip } from "../../../components/atoms/TabStrip";
import { Pager } from "../../../components/molecules/Pager";
import { paginate } from "../../../utils/paginate";
import { ErrorState } from "../../../components/atoms/ErrorState";
import { CategoryIcon } from "../../../components/atoms/CategoryIcon";
import { IconDisc } from "../../../components/molecules/IconDisc";
import { IconPicker } from "../../../components/molecules/IconPicker";
import { iconFor } from "../../../helpers/categoryIcons";
import { useCategories } from "../../../hooks/useCategories";
import suggestions from "../../onboarding/data/categorySuggestions.json";
import { DOMAIN_CONFIG } from "../../domains/helpers/domainConfig";
import type { Domain, IconKey } from "../../../types";

interface EditDraft {
  id: string;
  name: string;
  icon: IconKey;
}

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
  const { categories, loading, error, create, rename, remove, update } = useCategories(domain);
  const [editing, setEditing] = useState<EditDraft | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
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

  const startEdit = (id: string, name: string, icon: IconKey) => setEditing({ id, name, icon });

  const saveEdit = async () => {
    if (!editing) return;
    const name = editing.name.trim();
    if (!name) return setMessage("Give it a name");
    const current = roots.find((c) => c.id === editing.id);
    setSavingEdit(true);
    setMessage(null);
    try {
      if (current && current.name !== name) await rename(editing.id, name);
      if (current && iconFor(current) !== editing.icon)
        await update(editing.id, { icon: editing.icon });
      setEditing(null);
    } catch (err) {
      console.error("Couldn't save the category", err);
      setMessage("Couldn't save the category");
    } finally {
      setSavingEdit(false);
    }
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
          setEditing(null);
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
              <IconDisc domain={domain} size={32}>
                <CategoryIcon category={c} size={15} />
              </IconDisc>
              <span className="name">{c.name}</span>
              {c.isDefault && <span className="default">default</span>}
              <KebabMenu
                aria-label={`Actions for ${c.name}`}
                actions={[
                  {
                    label: "Edit",
                    onSelect: () => c.id && startEdit(c.id, c.name, iconFor(c)),
                  },
                  {
                    label: busyId === c.id ? "Archiving…" : "Archive",
                    onSelect: () =>
                      c.id && run(c.id, () => remove(c.id!), "Couldn't archive the category"),
                    danger: true,
                    disabled: busyId === c.id,
                  },
                ]}
              />
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

      {message && !editing && (
        <p className="message" role="alert">
          {message}
        </p>
      )}

      <Modal open={editing !== null} title="Edit category" onClose={() => setEditing(null)}>
        {editing && (
          <div className="edit">
            <TextField
              label="Name"
              value={editing.name}
              autoFocus
              onValueChange={(name) => setEditing((d) => d && { ...d, name })}
            />
            <div className="edit-icons">
              <span className="edit-icons-label">Icon</span>
              <IconPicker
                label="Icon"
                value={editing.icon}
                onChange={(icon) => setEditing((d) => d && { ...d, icon })}
              />
            </div>
            {message && (
              <p className="message" role="alert">
                {message}
              </p>
            )}
            <div className="edit-actions">
              <Button variant="ghost" onClick={() => setEditing(null)} disabled={savingEdit}>
                Cancel
              </Button>
              <Button variant="primary" onClick={saveEdit} disabled={savingEdit}>
                {savingEdit ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

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
          gap: 10px;
          min-height: 48px;
          padding: 4px 0;
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

        .edit {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .edit-icons {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .edit-icons-label {
          font-size: 0.8125rem;
          color: var(--fg-1);
        }

        .edit-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
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
