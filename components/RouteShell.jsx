// Thin wrapper that just sets the app background. Route-change feedback is
// handled by the slim top progress bar in RouteLoader plus Next's own
// loading.js skeleton — this shell no longer dims, fades, or disables clicks on
// the page, which used to make even a fast, prefetched navigation feel delayed.
const RouteShell = ({ children }) => {
  return <div className="min-h-screen bg-[#f8fafc]">{children}</div>
}

export default RouteShell
