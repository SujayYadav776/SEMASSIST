export default function Home() {
  /* Mission Control Desk: this intentional minimal entry point routes directly to the standalone, locally persistent HTML study workbench. */
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 grid place-items-center p-6">
      <div className="max-w-md text-center">
        <p className="text-xs uppercase tracking-[0.24em] text-lime-300">SEM ASSIST</p>
        <h1 className="mt-3 text-3xl font-semibold">Opening your study dashboard…</h1>
        <p className="mt-3 text-slate-300">If it does not open automatically, use the link below.</p>
        <a className="mt-6 inline-block rounded-lg bg-lime-300 px-4 py-2 font-bold text-slate-950" href="/study-dashboard.html">Open Study Dashboard</a>
      </div>
      <script dangerouslySetInnerHTML={{ __html: 'window.location.replace("/study-dashboard.html")' }} />
    </main>
  );
}
