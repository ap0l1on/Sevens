// Umami analytics — events never carry grades, subject names or free text.
// The script tag must include data-exclude-search="true" (see index.html),
// because the query string holds grades.
declare global {
  interface Window {
    umami?: { track: (name: string, props?: Record<string, string | number>) => void };
  }
}

type EventName =
  | 'calc_completed'
  | 'pass_check_failed'
  | 'offer_planned'
  | 'whatif_used'
  | 'share_clicked'
  | 'example_loaded'
  | 'faq_opened'
  | 'report_clicked';

export function track(name: EventName, props?: Record<string, string | number>): void {
  try {
    window.umami?.track(name, props);
  } catch {
    // Analytics must never break the calculator.
  }
}
