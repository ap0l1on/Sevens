// Analytics: Cloudflare Web Analytics (free, cookieless) counts page views
// only. It has no custom events, so this helper is a no-op that keeps the
// existing track() call sites compiling without sending anything.
export function track(
  _name:
    | 'calc_completed'
    | 'pass_check_failed'
    | 'offer_planned'
    | 'whatif_used'
    | 'share_clicked'
    | 'example_loaded'
    | 'faq_opened'
    | 'report_clicked',
  _props?: Record<string, string | number>,
): void {
  // No-op by design.
}
