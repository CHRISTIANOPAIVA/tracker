/**
 * Placeholder entry required by the webpack build step.
 * The actual frontend assets live in /public and are already production ready.
 */
export const buildInfo = () =>
    'FitTrack Pro build placeholder - static assets served from /public.';

if (typeof console !== 'undefined') {
    console.log(buildInfo());
}
