import { useEffect, useMemo, useRef, useState } from 'react';
import styles from '../../styles/modules/MagitekDropdown.module.css';

/**
 * MagitekDropdown
 * - CSS Modules only (strict isolation)
 * - Supports: options as [{value,label}] or optgroups [{group, options:[{value,label}]}]
 * - Optional search for large lists (profession)
 */
export function MagitekDropdown({
  id,
  value,
  options,
  placeholder,
  onChange,
  disabled = false,
  getDisplayText,
  searchable = false,
  searchPlaceholder = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const onDoc = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('touchstart', onDoc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('touchstart', onDoc);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) setQuery('');
  }, [isOpen]);

  const displayText = useMemo(() => {
    if (!value) return placeholder || '';
    if (getDisplayText) return getDisplayText(value);

    if (!Array.isArray(options) || options.length === 0) return String(value);

    if (options[0] && options[0].group) {
      for (const g of options) {
        const hit = g.options?.find((o) => o.value === value);
        if (hit) return hit.label;
      }
      return String(value);
    }

    const hit = options.find((o) => o.value === value);
    return hit?.label ?? String(value);
  }, [getDisplayText, options, placeholder, value]);

  const filteredOptions = useMemo(() => {
    if (!searchable || !query.trim()) return options;
    const q = query.trim().toLowerCase();
    if (!Array.isArray(options) || options.length === 0) return options;

    if (options[0] && options[0].group) {
      const groups = options
        .map((g) => {
          const sub = (g.options || []).filter((o) => String(o.label).toLowerCase().includes(q));
          return sub.length ? { ...g, options: sub } : null;
        })
        .filter(Boolean);
      return groups;
    }

    return options.filter((o) => String(o.label).toLowerCase().includes(q));
  }, [options, query, searchable]);

  const selectValue = (next) => {
    onChange(next);
    setIsOpen(false);
  };

  return (
    <div ref={rootRef} className={`${styles.root} ${disabled ? styles.disabled : ''}`}>
      <button
        id={id}
        type="button"
        className={`${styles.trigger}`}
        onClick={() => !disabled && setIsOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-disabled={disabled}
      >
        <span className={styles.value}>{displayText}</span>
        <span className={styles.arrow} aria-hidden="true">
          {isOpen ? '▲' : '▼'}
        </span>
      </button>

      {isOpen && (
        <div className={styles.popover}>
          {searchable && (
            <div className={styles.searchRow}>
              <input
                type="text"
                className={styles.searchInput}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                autoFocus
              />
            </div>
          )}

          <ul className={styles.list} role="listbox" aria-labelledby={id}>
            {Array.isArray(filteredOptions) && filteredOptions.length > 0 ? (
              filteredOptions[0] && filteredOptions[0].group ? (
                filteredOptions.map((g, gi) => (
                  <li key={`${g.group}-${gi}`} className={styles.group}>
                    <div className={styles.groupLabel}>{g.group}</div>
                    <ul className={styles.groupList}>
                      {(g.options || []).map((o) => (
                        <li key={o.value} className={styles.optionWrap}>
                          <button
                            type="button"
                            className={`${styles.option} ${value === o.value ? styles.selected : ''}`}
                            onClick={() => selectValue(o.value)}
                          >
                            {o.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))
              ) : (
                filteredOptions.map((o) => (
                  <li key={o.value} className={styles.optionWrap}>
                    <button
                      type="button"
                      className={`${styles.option} ${value === o.value ? styles.selected : ''}`}
                      onClick={() => selectValue(o.value)}
                    >
                      {o.label}
                    </button>
                  </li>
                ))
              )
            ) : (
              <li className={styles.empty}>{/* empty */}</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export default MagitekDropdown;

