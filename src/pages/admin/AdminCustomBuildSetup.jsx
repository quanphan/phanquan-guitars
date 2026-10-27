import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext.jsx";
import { errorText } from "../../auth/errorText.js";
import ConfirmDialog from "../../components/admin/ConfirmDialog.jsx";
import Button from "../../components/Button.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import {
  addTargetCategoryId,
  filterWizardSetupRows,
  groupLabel,
  groupsWithOptions,
  resolveGroupAfterStepChange,
  wizardSetupSteps,
  WIZARD_STEP_COPY,
} from "../../data/wizardSetupLayout.js";
import { useDebouncedValue } from "../../hooks/useDebouncedValue.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import {
  blockedDeleteBody,
  canStartExclusiveAction,
  deleteWizardOption,
  duplicateWizardOption,
  isBlockedDelete,
  listWizardSetup,
  updateWizardOption,
} from "../../services/wizardSetupService.js";

const inputClass =
  "mt-2 w-full border border-white/10 bg-ink px-3 py-2.5 text-sm text-ivory focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";

function stepTitle(t, stepId) {
  const copy = WIZARD_STEP_COPY[stepId];
  if (copy?.titleKey) return t(copy.titleKey);
  if (stepId === "unassigned") return t("admin.wizardSetup.unassignedStep");
  return t("admin.wizardSetup.stepN").replace("{n}", String(stepId));
}

function stepDescription(t, stepId) {
  const copy = WIZARD_STEP_COPY[stepId];
  return copy?.descriptionKey ? t(copy.descriptionKey) : "";
}

export default function AdminCustomBuildSetup() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { authorizedRequest, hasPermission } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput, 300);
  const [status, setStatus] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const canRead = hasPermission("catalog.read");
  const canWrite = hasPermission("catalog.write");
  const canDelete = hasPermission("catalog.delete");

  const steps = useMemo(() => wizardSetupSteps(categories), [categories]);
  const requestedStepId = searchParams.get("step");
  const requestedGroupId = searchParams.get("group") || "";
  const selectedStep = steps.find((item) => item.id === requestedStepId) || steps[0] || null;
  const stepId = selectedStep?.id || "";
  const stepGroups = useMemo(() => groupsWithOptions(selectedStep?.categories || []), [selectedStep]);
  const groupId = resolveGroupAfterStepChange(requestedGroupId, stepGroups);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!canRead) {
      setError("FORBIDDEN");
      setLoading(false);
      return false;
    }
    if (!silent) setLoading(true);
    setError(null);
    const listed = await listWizardSetup(authorizedRequest);
    if (!listed.ok) {
      setError(listed.code);
      setLoading(false);
      if (listed.code === "UNAUTHORIZED") {
        navigate(`/admin/login?from=${encodeURIComponent("/admin/custom-build-setup")}`, { replace: true });
      }
      return false;
    }
    setCategories(listed.categories);
    setLoading(false);
    return true;
  }, [authorizedRequest, canRead, navigate]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!steps.length) return;
    const next = new URLSearchParams();
    next.set("step", stepId);
    if (groupId) next.set("group", groupId);
    if (searchParams.get("step") === stepId && (searchParams.get("group") || "") === groupId) return;
    setSearchParams(next, { replace: true });
  }, [groupId, searchParams, setSearchParams, stepId, steps.length]);

  const rows = useMemo(
    () => filterWizardSetupRows({ categories, stepId, groupId, status, search }),
    [categories, groupId, search, status, stepId],
  );

  function selectStep(nextStepId) {
    const nextStep = steps.find((item) => item.id === nextStepId);
    const nextGroup = resolveGroupAfterStepChange(groupId, groupsWithOptions(nextStep?.categories || []));
    const next = new URLSearchParams();
    next.set("step", nextStepId);
    if (nextGroup) next.set("group", nextGroup);
    setSearchParams(next);
  }

  function selectGroup(nextGroupId) {
    const next = new URLSearchParams();
    if (stepId) next.set("step", stepId);
    if (nextGroupId) next.set("group", nextGroupId);
    setSearchParams(next);
  }

  async function toggleActive(category, option) {
    if (!canWrite || !canStartExclusiveAction(busyId || deleting)) return;
    setBusyId(option.id);
    setError(null);
    const nextActive = option.active === false;
    const result = await updateWizardOption(authorizedRequest, category.id, option.id, {
      ...option,
      code: option.code,
      name: option.name,
      active: nextActive,
      isDefault: nextActive ? option.isDefault : false,
      defaultForInstrumentTypeIds: nextActive ? option.defaultForInstrumentTypeIds || [] : [],
    });
    setBusyId(null);
    if (!result.ok) {
      setError(result.code);
      return;
    }
    setNotice("saved");
    await load({ silent: true });
  }

  async function duplicate(category, option) {
    if (!canWrite || !canStartExclusiveAction(busyId || deleting)) return;
    setBusyId(option.id);
    setError(null);
    const result = await duplicateWizardOption(authorizedRequest, category.id, option.id);
    setBusyId(null);
    if (!result.ok) {
      setError(result.code);
      return;
    }
    setNotice("duplicated");
    await load({ silent: true });
  }

  async function confirmDelete() {
    const current = pendingDelete;
    if (!current || !canDelete || deleting) return;
    setDeleting(true);
    setBusyId(current.option.id);
    setDeleteError(null);
    setNotice(null);
    const result = await deleteWizardOption(authorizedRequest, current.category.id, current.option.id);
    if (!result.ok) {
      setDeleting(false);
      setBusyId(null);
      setDeleteError(result);
      setError(result.code);
      return;
    }
    const refreshed = await load({ silent: true });
    setDeleting(false);
    setBusyId(null);
    if (!refreshed) {
      setDeleteError({ code: "failure" });
      return;
    }
    setPendingDelete(null);
    setDeleteError(null);
    setNotice("deleted");
  }

  async function confirmDeactivate() {
    const current = pendingDelete;
    if (!current || !canWrite || deleting) return;
    setDeleting(true);
    setBusyId(current.option.id);
    setError(null);
    const result = await updateWizardOption(authorizedRequest, current.category.id, current.option.id, {
      ...current.option,
      code: current.option.code,
      name: current.option.name,
      active: false,
      isDefault: false,
      defaultForInstrumentTypeIds: [],
    });
    if (!result.ok) {
      setDeleting(false);
      setBusyId(null);
      setDeleteError(result);
      setError(result.code);
      return;
    }
    await load({ silent: true });
    setDeleting(false);
    setBusyId(null);
    setPendingDelete(null);
    setDeleteError(null);
    setNotice("saved");
  }

  const blockedDelete = isBlockedDelete(deleteError);
  const offerDeactivate = blockedDelete && canWrite;
  const deleteBody = deleteError
    ? blockedDeleteBody((code) => errorText(t, "admin.wizardSetup", code), deleteError)
    : t("admin.wizardSetup.confirmDelete.body");
  const addCategoryId = addTargetCategoryId(groupId, selectedStep?.categories || [], stepGroups);
  const addHref = addCategoryId
    ? `/admin/custom-build-setup/${addCategoryId}/new${stepId ? `?step=${encodeURIComponent(stepId)}` : ""}`
    : "";
  const listQuery = stepId ? `?step=${encodeURIComponent(stepId)}${groupId ? `&group=${encodeURIComponent(groupId)}` : ""}` : "";

  return (
    <section className="pb-24">
      <PageHeader
        eyebrow={t("admin.tabs.label")}
        title={t("admin.wizardSetup.title")}
        description={t("admin.wizardSetup.description")}
      />
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        {steps.length ? (
          <nav className="mt-8 border-b border-white/10" aria-label={t("admin.wizardSetup.step")}>
            <div className="flex gap-1 overflow-x-auto">
              {steps.map((step) => {
                const active = step.id === stepId;
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => selectStep(step.id)}
                    className={`shrink-0 border-b-2 px-4 py-3 text-[11px] uppercase tracking-[0.18em] transition-colors ${
                      active
                        ? "border-gold text-gold"
                        : "border-transparent text-ivory/70 hover:text-ivory"
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    <span className="block">{stepTitle(t, step.id)}</span>
                    <span className="mt-1 block text-[10px] tracking-[0.14em] text-muted">
                      {t("admin.wizardSetup.optionCount").replace("{count}", String(step.optionCount))}
                    </span>
                  </button>
                );
              })}
            </div>
          </nav>
        ) : null}

        {selectedStep ? (
          <div className="mt-6">
            <h2 className="font-display text-2xl text-ivory">{stepTitle(t, selectedStep.id)}</h2>
            {stepDescription(t, selectedStep.id) ? (
              <p className="mt-2 max-w-3xl text-sm text-muted">{stepDescription(t, selectedStep.id)}</p>
            ) : null}
            <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-gold">
              {t("admin.wizardSetup.optionCount").replace("{count}", String(selectedStep.optionCount))}
            </p>
          </div>
        ) : null}

        <form className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" onSubmit={(event) => event.preventDefault()}>
          <label className="text-[11px] uppercase tracking-[0.18em] text-gold">
            {t("admin.wizardSetup.columns.group")}
            <select value={groupId} onChange={(event) => selectGroup(event.target.value)} className={inputClass}>
              <option value="">{t("admin.wizardSetup.allGroups")}</option>
              {stepGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {groupLabel(t, group)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[11px] uppercase tracking-[0.18em] text-gold">
            {t("admin.catalog.search")}
            <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} className={inputClass} placeholder={t("admin.wizardSetup.searchPlaceholder")} />
          </label>
          <label className="text-[11px] uppercase tracking-[0.18em] text-gold">
            {t("admin.catalog.status")}
            <select value={status} onChange={(event) => setStatus(event.target.value)} className={inputClass}>
              <option value="">{t("admin.catalog.allStatuses")}</option>
              <option value="active">{t("admin.catalog.active")}</option>
              <option value="inactive">{t("admin.catalog.inactive")}</option>
            </select>
          </label>
          {canWrite && addHref ? (
            <div className="flex items-end">
              <Button to={addHref} className="w-full">
                {t("admin.catalog.add")}
              </Button>
            </div>
          ) : null}
        </form>

        {notice ? (
          <p className="mt-6 border border-gold/40 px-4 py-3 text-sm text-ivory" role="status">
            {t(`admin.wizardSetup.notices.${notice}`)}
          </p>
        ) : null}
        {error ? (
          <div className="mt-6 border border-gold/40 bg-gold/10 px-4 py-4 text-sm" role="alert">
            <p>{errorText(t, "admin.wizardSetup", error)}</p>
            <button type="button" onClick={() => void load()} className="mt-3 text-[11px] uppercase tracking-[0.18em] text-gold">
              {t("admin.retry")}
            </button>
          </div>
        ) : null}
        {loading ? <p className="mt-8 text-sm text-muted">{t("admin.loadingBody")}</p> : null}
        {!loading && rows.length === 0 ? (
          <p className="mt-8 border border-white/10 px-4 py-6 text-sm text-muted">{t("admin.wizardSetup.empty")}</p>
        ) : null}

        {!loading && rows.length > 0 ? (
          <div className="mt-8 overflow-x-auto border border-white/10">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-ink text-[11px] uppercase tracking-[0.16em] text-gold">
                <tr>
                  <th className="px-4 py-3 font-medium">{t("admin.wizardSetup.columns.group")}</th>
                  <th className="px-4 py-3 font-medium">{t("admin.catalog.columns.name")}</th>
                  <th className="px-4 py-3 font-medium">{t("admin.catalog.columns.slug")}</th>
                  <th className="px-4 py-3 font-medium">{t("admin.catalog.columns.status")}</th>
                  <th className="px-4 py-3 font-medium">{t("admin.wizardSetup.columns.default")}</th>
                  <th className="px-4 py-3 font-medium">
                    <span className="sr-only">{t("admin.catalog.columns.actions")}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ category, option }) => {
                  const label = language === "vi" ? option.translations?.vi?.name || option.name : option.translations?.en?.name || option.name;
                  return (
                    <tr key={`${category.id}:${option.id}`} className="border-t border-white/8">
                      <td className="px-4 py-3 text-muted">{groupLabel(t, category)}</td>
                      <td className="px-4 py-3">
                        <Link to={`/admin/custom-build-setup/${category.id}/${encodeURIComponent(option.id)}${listQuery}`} className="text-gold hover:text-gold-light">
                          {label}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted">{option.code}</td>
                      <td className="px-4 py-3">{option.active === false ? t("admin.catalog.inactive") : t("admin.catalog.active")}</td>
                      <td className="px-4 py-3">
                        {option.isDefault ? t("admin.wizardSetup.default") : "—"}
                        {option.defaultForInstrumentTypeIds?.length ? (
                          <span className="mt-1 block text-[10px] uppercase tracking-[0.14em] text-muted">
                            {option.defaultForInstrumentTypeIds.join(", ")}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-3">
                          {canWrite ? (
                            <>
                              <button type="button" disabled={busyId === option.id} className="text-[11px] uppercase tracking-[0.16em] text-gold" onClick={() => void toggleActive(category, option)}>
                                {option.active === false ? t("admin.catalog.activate") : t("admin.catalog.deactivate")}
                              </button>
                              <button type="button" disabled={busyId === option.id} className="text-[11px] uppercase tracking-[0.16em] text-ivory/70 hover:text-gold" onClick={() => void duplicate(category, option)}>
                                {t("admin.catalog.copy")}
                              </button>
                            </>
                          ) : null}
                          {canDelete ? (
                            <button type="button" disabled={Boolean(busyId) || deleting} className="text-[11px] uppercase tracking-[0.16em] text-ivory/70 hover:text-gold disabled:opacity-40" onClick={() => { setDeleteError(null); setPendingDelete({ category, option }); }}>
                              {t("admin.wizardSetup.delete")}
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={t("admin.wizardSetup.confirmDelete.title")}
        body={deleteBody}
        confirmLabel={offerDeactivate ? t("admin.catalog.deactivate") : t("admin.wizardSetup.confirmDelete.confirm")}
        cancelLabel={t("admin.wizardSetup.confirmDelete.cancel")}
        busy={deleting}
        busyLabel={offerDeactivate ? t("admin.catalog.saving") : t("admin.wizardSetup.deleting")}
        hideConfirm={blockedDelete && !canWrite}
        onConfirm={() => void (offerDeactivate ? confirmDeactivate() : confirmDelete())}
        onCancel={() => {
          if (!deleting) {
            setPendingDelete(null);
            setDeleteError(null);
          }
        }}
      />
    </section>
  );
}
