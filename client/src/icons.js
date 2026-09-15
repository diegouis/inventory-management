// Static, developer-authored SVG inner markup for NavIcon.vue.
// All paths are drawn on a 0 0 20 20 viewBox with stroke="currentColor"
// stroke-width 1.5 set by the wrapping <svg>. Safe to render with v-html
// because nothing here ever comes from user input or the network.
export const icons = Object.freeze({
  dashboard:
    '<rect x="3" y="3" width="6" height="6" rx="1"/><rect x="11" y="3" width="6" height="6" rx="1"/>' +
    '<rect x="3" y="11" width="6" height="6" rx="1"/><rect x="11" y="11" width="6" height="6" rx="1"/>',
  box:
    '<path d="M10 2.5 17 6.25v7.5L10 17.5 3 13.75v-7.5L10 2.5Z"/><path d="M3 6.25 10 10l7-3.75"/><path d="M10 10v7.5"/>',
  clipboard:
    '<rect x="4" y="3" width="12" height="14" rx="1.5"/><path d="M7 7h6M7 10h6M7 13h4"/>',
  'chart-bar':
    '<path d="M3 17h14"/><path d="M6 17v-6M10 17V5M14 17v-4"/>',
  'trending-up':
    '<path d="M3 14.5l4.5-4.5 3 3L17 6.5"/><path d="M12.5 6.5H17V11"/>',
  document:
    '<path d="M5 2.5h7l4 4V17a.5.5 0 0 1-.5.5h-10A.5.5 0 0 1 5 17V2.5Z"/><path d="M12 2.5v4h4"/><path d="M8 14v-3M10.5 14V9M13 14v-2"/>',
  'chevron-left':
    '<path d="M12.5 4.5 7 10l5.5 5.5"/>',
  menu:
    '<path d="M3 5.5h14M3 10h14M3 14.5h14"/>',
  close:
    '<path d="M5 5l10 10M15 5 5 15"/>'
})
