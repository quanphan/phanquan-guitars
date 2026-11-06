import { PERMISSION_GROUPS } from "../../auth/permissions.js";

const checkboxClass = "mt-0.5 size-4 shrink-0 accent-gold disabled:opacity-50";

export default function PermissionMatrix({
  value,
  onChange,
  disabled = false,
  groups = PERMISSION_GROUPS,
  t,
}) {
  const selected = Array.isArray(value) ? value : [];
  const visibleGroups = groups.filter((group) => group.keys.length);
  const allKeys = visibleGroups.flatMap((group) => group.keys);
  const allSelected = allKeys.length > 0 && allKeys.every((key) => selected.includes(key));

  function setKeys(keys, on) {
    if (disabled) return;
    const next = new Set(selected);
    for (const key of keys) {
      if (on) next.add(key);
      else next.delete(key);
    }
    onChange(allKeys.filter((key) => next.has(key)));
  }

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-3 text-sm text-ivory">
        <input
          type="checkbox"
          className={checkboxClass}
          checked={allSelected}
          disabled={disabled}
          onChange={(event) => setKeys(allKeys, event.target.checked)}
        />
        <span className="text-[11px] uppercase tracking-[0.18em] text-gold">
          {allSelected ? t("admin.users.deselectAllPermissions") : t("admin.users.selectAllPermissions")}
        </span>
      </label>

      <div className="grid gap-4 lg:grid-cols-2">
        {visibleGroups.map((group) => {
          const groupSelected = group.keys.every((key) => selected.includes(key));
          const groupPartial = !groupSelected && group.keys.some((key) => selected.includes(key));
          return (
            <section key={group.id} className="border border-white/10 bg-ink/40 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-[11px] uppercase tracking-[0.18em] text-gold">
                  {t(`admin.permissionGroups.${group.id}`)}
                </h3>
                <label className="flex items-center gap-2 text-xs text-muted">
                  <input
                    type="checkbox"
                    className={checkboxClass}
                    checked={groupSelected}
                    ref={(node) => {
                      if (node) node.indeterminate = groupPartial;
                    }}
                    disabled={disabled}
                    onChange={(event) => setKeys(group.keys, event.target.checked)}
                  />
                  {groupSelected
                    ? t("admin.users.deselectGroup")
                    : t("admin.users.selectGroup")}
                </label>
              </div>
              <ul className="mt-3 space-y-2">
                {group.keys.map((permission) => (
                  <li key={permission}>
                    <label className="flex items-start gap-3 text-sm text-ivory">
                      <input
                        type="checkbox"
                        className={checkboxClass}
                        checked={selected.includes(permission)}
                        disabled={disabled}
                        onChange={(event) => setKeys([permission], event.target.checked)}
                      />
                      <span>
                        {t(`admin.permissions.${permission}`)}
                        <span className="mt-0.5 block text-xs text-muted">{permission}</span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
