import { useMemo, useState } from "react";

function buildHierarchyTree(flatOptions) {
  const tree = new Map();
  let currentAsi = null;
  let currentCsm = null;

  (flatOptions || []).forEach((option) => {
    const value = typeof option === "string" ? option : option?.value;
    if (!value || typeof value !== "string") return;

    const [level, name] = value.split("|");
    if (!level || !name) return;

    if (level === "asi") {
      currentAsi = name;
      currentCsm = null;
      if (!tree.has(currentAsi)) {
        tree.set(currentAsi, new Map());
      }
      return;
    }

    if (level === "csm") {
      if (!currentAsi) return;
      currentCsm = name;
      const csmMap = tree.get(currentAsi);
      if (!csmMap.has(currentCsm)) {
        csmMap.set(currentCsm, []);
      }
      return;
    }

    if (level === "asm") {
      if (!currentAsi || !currentCsm) return;
      tree.get(currentAsi).get(currentCsm).push(name);
    }
  });

  return tree;
}

function getDisplayLabel(value, flatOptions) {
  if (!value || value === "All") return "All";
  const match = (flatOptions || []).find((option) => {
    const optionValue = typeof option === "string" ? option : option?.value;
    return optionValue === value;
  });
  if (!match) {
    const [level, name] = value.split("|");
    return name ? `${level?.toUpperCase?.() || level}: ${name}` : value;
  }
  return typeof match === "string" ? match : match.label;
}

export default function HierarchyHoverFilter({
  value,
  options,
  disabled,
  onChange,
}) {
  const tree = useMemo(() => buildHierarchyTree(options), [options]);
  const asiList = useMemo(() => [...tree.keys()], [tree]);

  const [open, setOpen] = useState(false);
  const [activeAsi, setActiveAsi] = useState(asiList[0] || null);
  const [activeCsm, setActiveCsm] = useState(null);

  const csmMap = activeAsi ? tree.get(activeAsi) : null;
  const csmList = useMemo(
    () => (csmMap ? [...csmMap.keys()] : []),
    [csmMap],
  );
  const asmList = useMemo(() => {
    if (!csmMap || !activeCsm) return [];
    return csmMap.get(activeCsm) || [];
  }, [csmMap, activeCsm]);

  const display = useMemo(
    () => getDisplayLabel(value, options),
    [value, options],
  );

  function handlePick(nextValue) {
    if (disabled) return;
    onChange?.(nextValue);
    setOpen(false);
  }

  return (
    <div
      className={`hierarchy-menu ${disabled ? "is-disabled" : ""}`}
      onMouseEnter={() => {
        if (!disabled) setOpen(true);
      }}
      onMouseLeave={() => {
        setOpen(false);
        setActiveCsm(null);
      }}
    >
      <button
        type="button"
        className="control hierarchy-trigger"
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          if (!disabled) setOpen((current) => !current);
        }}
      >
        <span className="hierarchy-trigger-label">{display}</span>
        <span className="hierarchy-trigger-caret">▾</span>
      </button>

      {open ? (
        <div className="hierarchy-popover" role="menu">
          <div className="hierarchy-column">
            <button
              type="button"
              className={`hierarchy-item ${value === "All" ? "is-active" : ""}`}
              onMouseEnter={() => {
                setActiveAsi(asiList[0] || null);
                setActiveCsm(null);
              }}
              onClick={() => handlePick("All")}
            >
              All
            </button>

            {asiList.map((asi) => (
              <button
                key={asi}
                type="button"
                className={`hierarchy-item ${
                  value === `asi|${asi}` ? "is-active" : ""
                } ${activeAsi === asi ? "is-hover" : ""}`}
                onMouseEnter={() => {
                  setActiveAsi(asi);
                  setActiveCsm(null);
                }}
                onClick={() => handlePick(`asi|${asi}`)}
              >
                {asi}
              </button>
            ))}
          </div>

          <div className="hierarchy-column">
            <div className="hierarchy-column-head">CSM</div>
            {activeAsi && csmList.length ? (
              csmList.map((csm) => (
                <button
                  key={csm}
                  type="button"
                  className={`hierarchy-item ${
                    value === `csm|${csm}` ? "is-active" : ""
                  } ${activeCsm === csm ? "is-hover" : ""}`}
                  onMouseEnter={() => setActiveCsm(csm)}
                  onClick={() => handlePick(`csm|${csm}`)}
                >
                  {csm}
                </button>
              ))
            ) : (
              <div className="hierarchy-empty">Hover an ASI</div>
            )}
          </div>

          <div className="hierarchy-column">
            <div className="hierarchy-column-head">ASM</div>
            {activeCsm && asmList.length ? (
              asmList.map((asm) => (
                <button
                  key={asm}
                  type="button"
                  className={`hierarchy-item ${
                    value === `asm|${asm}` ? "is-active" : ""
                  }`}
                  onClick={() => handlePick(`asm|${asm}`)}
                >
                  {asm}
                </button>
              ))
            ) : (
              <div className="hierarchy-empty">Hover a CSM</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

