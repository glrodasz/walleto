import { useState } from "react";
import { Card } from "../../../components/atoms/Card";
import { SectionTitle } from "../../../components/atoms/SectionTitle";
import { TextField } from "../../../components/atoms/TextField";
import { Button } from "../../../components/atoms/Button";
import { Chip } from "../../../components/atoms/Chip";
import { Combobox } from "../../../components/atoms/Combobox";
import { KebabMenu } from "../../../components/molecules/KebabMenu";
import { Pager } from "../../../components/molecules/Pager";
import { paginate } from "../../../utils/paginate";
import { ErrorState } from "../../../components/atoms/ErrorState";
import { useTags } from "../../../hooks/useTags";
import { tagKey } from "../../../helpers/tags";

/**
 * The user's tags: rename (case is kept, whitespace dropped), archive, add.
 * Rows keep tag ids, so a rename shows everywhere at once and an archived
 * tag simply stops appearing.
 */
const PAGE_SIZE = 25;

export function TagsSettings() {
  const { tags, loading, error, create, update, remove } = useTags();
  const [page, setPage] = useState(1);
  const paged = paginate(tags, page, PAGE_SIZE);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

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

  const saveRename = async () => {
    const id = editingId;
    const name = draft.trim();
    if (!id || !name) return;
    const current = tags.find((t) => t.id === id);
    setEditingId(null);
    if (current && current.name === name) return;
    const clash = tags.find((t) => t.id !== id && t.key === tagKey(name));
    if (clash) return setMessage(`You already have a tag called "${clash.name}"`);
    await run(id, () => update(id, { name }), "Couldn't rename the tag");
  };

  const add = async (raw: string) => {
    setAdding(false);
    const key = tagKey(raw);
    if (!key) return;
    if (tags.some((t) => t.key === key)) return;
    await run("new", async () => void (await create(raw)), "Couldn't add the tag");
  };

  return (
    <Card>
      <SectionTitle title="Tags" />
      <p className="hint">Labels for any payment or recurring item. Spaces are dropped.</p>

      {error && <ErrorState error={error} />}

      {loading ? (
        <p className="hint">Loading…</p>
      ) : (
        <ul className="list">
          {paged.rows.map((t) => (
            <li key={t.id} className="row">
              {editingId === t.id ? (
                <form
                  className="rename"
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveRename();
                  }}
                >
                  <TextField
                    aria-label="Tag name"
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
                  <span className="name">{t.name}</span>
                  <KebabMenu
                    aria-label={`Actions for ${t.name}`}
                    actions={[
                      {
                        label: "Rename",
                        onSelect: () => {
                          setEditingId(t.id!);
                          setDraft(t.name);
                        },
                      },
                      {
                        label: busyId === t.id ? "Archiving…" : "Archive",
                        onSelect: () =>
                          t.id && run(t.id, () => remove(t.id!), "Couldn't archive the tag"),
                        danger: true,
                        disabled: busyId === t.id,
                      },
                    ]}
                  />
                </>
              )}
            </li>
          ))}
          {tags.length === 0 && <li className="hint">No tags yet</li>}
        </ul>
      )}

      <Pager page={paged.page} pageCount={paged.pageCount} onChange={setPage} />

      <div className="add">
        {adding ? (
          <Combobox
            autoFocus
            label="New tag"
            placeholder="Type a name"
            suggestions={[]}
            onSelect={add}
            onCancel={() => setAdding(false)}
          />
        ) : (
          <Chip variant="add" onClick={() => setAdding(true)}>
            Add tag
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
          margin: 0 0 8px;
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
