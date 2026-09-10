/**
 * REMS Harita Pin ve İşaretçi Sabitleri
 * Vektör SVG formatında saklanır, OpenLayers ve UI şablonları için Data URI sunar.
 */

export const PIN_SVG_KONUT = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 46" width="36" height="46">
    <defs>
      <filter id="s" x="-20%" y="-10%" width="140%" height="130%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.3"/>
      </filter>
    </defs>
    <path d="M18 2 C9.16 2 2 9.16 2 18 C2 28 16 41.5 18 43 C20 41.5 34 28 34 18 C34 9.16 26.84 2 18 2 Z" fill="#2563eb" stroke="#ffffff" stroke-width="2" filter="url(#s)"/>
    <circle cx="18" cy="17" r="10" fill="#ffffff"/>
    <path d="M18 10.5 L12 16 L13.8 16 L13.8 22.5 L16.5 22.5 L16.5 18.5 L19.5 18.5 L19.5 22.5 L22.2 22.5 L22.2 16 L24 16 Z" fill="#2563eb"/>
  </svg>`
);

export const PIN_SVG_ARSA = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 46" width="36" height="46">
    <defs>
      <filter id="s" x="-20%" y="-10%" width="140%" height="130%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.3"/>
      </filter>
    </defs>
    <path d="M18 2 C9.16 2 2 9.16 2 18 C2 28 16 41.5 18 43 C20 41.5 34 28 34 18 C34 9.16 26.84 2 18 2 Z" fill="#16a34a" stroke="#ffffff" stroke-width="2" filter="url(#s)"/>
    <circle cx="18" cy="17" r="10" fill="#ffffff"/>
    <path d="M14 13 L22 13 L24 21 L12 21 Z" fill="none" stroke="#16a34a" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M18 13 L18 21 M13 17 L23 17" stroke="#16a34a" stroke-width="1.2"/>
  </svg>`
);

export const PIN_SVG_BINA = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 46" width="36" height="46">
    <defs>
      <filter id="s" x="-20%" y="-10%" width="140%" height="130%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.3"/>
      </filter>
    </defs>
    <path d="M18 2 C9.16 2 2 9.16 2 18 C2 28 16 41.5 18 43 C20 41.5 34 28 34 18 C34 9.16 26.84 2 18 2 Z" fill="#ea580c" stroke="#ffffff" stroke-width="2" filter="url(#s)"/>
    <circle cx="18" cy="17" r="10" fill="#ffffff"/>
    <path d="M13 11 L23 11 L23 23 L13 23 Z" fill="#ea580c"/>
    <rect x="15" y="13" width="2" height="2" fill="#ffffff"/>
    <rect x="19" y="13" width="2" height="2" fill="#ffffff"/>
    <rect x="15" y="16" width="2" height="2" fill="#ffffff"/>
    <rect x="19" y="16" width="2" height="2" fill="#ffffff"/>
    <rect x="17" y="19.5" width="2" height="3.5" fill="#ffffff"/>
  </svg>`
);

export const PIN_SVG_DIGER = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 46" width="36" height="46">
    <defs>
      <filter id="s" x="-20%" y="-10%" width="140%" height="130%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.3"/>
      </filter>
    </defs>
    <path d="M18 2 C9.16 2 2 9.16 2 18 C2 28 16 41.5 18 43 C20 41.5 34 28 34 18 C34 9.16 26.84 2 18 2 Z" fill="#64748b" stroke="#ffffff" stroke-width="2" filter="url(#s)"/>
    <circle cx="18" cy="17" r="10" fill="#ffffff"/>
    <circle cx="18" cy="17" r="4" fill="#64748b"/>
  </svg>`
);

export const MAP_ICONS = {
  konut: PIN_SVG_KONUT,
  arsa: PIN_SVG_ARSA,
  bina: PIN_SVG_BINA,
  diger: PIN_SVG_DIGER
};

/**
 * Taşınmaz tipine göre pin SVG Data URI döner
 */
export function getPinIconByTipi(tip?: string): string {
  const temizTip = (tip || '').trim().toLowerCase();
  if (temizTip === 'arsa') return MAP_ICONS.arsa;
  if (temizTip === 'bina') return MAP_ICONS.bina;
  if (temizTip === 'konut') return MAP_ICONS.konut;
  return MAP_ICONS.diger;
}
