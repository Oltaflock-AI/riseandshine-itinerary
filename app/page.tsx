"use client";

import { useRef, useState } from "react";
import Script from "next/script";
import type { ItineraryResult, Day, TimeBlock, Place } from "@/lib/itinerary/schema";
import { DESTINATIONS } from "@/lib/destinations";

const DESTS = [
  ["thailand", "Thailand — Bangkok & Phuket"],
  ["kerala", "Kerala — God's Own Country"],
  ["mauritius", "Mauritius — Indian Ocean"],
  ["maldives", "Maldives — Overwater"],
  ["rajasthan", "Rajasthan — Land of Kings"],
  ["bali", "Bali — Island of the Gods"],
];
const INTERESTS = ["Beach", "Sightseeing", "Shopping", "Family", "Adventure", "Wildlife", "Wellness", "Culture", "Self drive", "Night life"];
const KIND_ICON: Record<string, string> = {
  travel: "✈️", transfer: "🚐", checkin: "🏨", sightseeing: "🏛️",
  activity: "🎟️", meal: "🍽️", leisure: "🌴",
};
const inr = (usd: number, fx: number) => "₹" + Math.round(usd * fx).toLocaleString("en-IN");

declare global { interface Window { html2pdf: any } }

export default function Page() {
  const [f, setF] = useState({
    clientName: "Rajesh Sharma", clientPhone: "+91 98250 11111", email: "",
    destinationKey: "thailand", durationNights: 7, budgetTier: 4,
    startDate: "2026-06-15",
    adults: 2, children: 2, infants: 0,
    diet: "veg",
    travelStyle: "balanced", groupType: "family",
    visaNeeded: true, flightAssist: false, hotelAssist: false,
  });
  const [interests, setInterests] = useState<string[]>(["Beach", "Family"]);
  const [scope, setScope] = useState<"domestic" | "international">("international");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [errToggle, setErrToggle] = useState<"flights" | "hotels" | null>(null);
  const [result, setResult] = useState<ItineraryResult | null>(null);
  const [editedDays, setEditedDays] = useState<Day[] | null>(null);
  const [editMode, setEditMode] = useState(false);
  const docRef = useRef<HTMLDivElement>(null);

  const up = (k: string, v: any) => setF((s) => ({ ...s, [k]: v }));

  async function generate() {
    setErr(null); setErrToggle(null); setLoading(true); setResult(null);
    setEditedDays(null); setEditMode(false);
    try {
      const { email, ...rest } = f;
      const r = await fetch("/api/itinerary", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...rest,
          ...(email && email.trim() ? { email: email.trim() } : {}),
          durationNights: Number(f.durationNights),
          budgetTier: Number(f.budgetTier),
          adults: Number(f.adults),
          children: Number(f.children),
          infants: Number(f.infants),
          interests,
        }),
      });
      const j = await r.json();
      if (!r.ok) {
        if (j?.error === "live_provider_unavailable" && (j.which === "flights" || j.which === "hotels")) {
          setErrToggle(j.which);
          throw new Error(`Live ${j.which} provider not configured — see Setup.`);
        }
        throw new Error(j.detail || j.error || "Failed");
      }
      setResult(j as ItineraryResult);
    } catch (e: any) {
      setErr(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function downloadPDF() {
    if (!docRef.current || !window.html2pdf) return;
    window.html2pdf().set({
      margin: 0,
      filename: `RiseAndShine_${result?.meta.destinationName}_${f.clientName}`.replace(/\s+/g, "_") + ".pdf",
      image: { type: "jpeg", quality: 0.96 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["css", "avoid-all"] },
    }).from(docRef.current).save();
  }

  function whatsapp() {
    if (!result) return;
    let n = f.clientPhone.replace(/\D/g, "");
    if (n.length === 10) n = "91" + n;
    const msg = `Dear ${f.clientName.split(" ")[0]}, your customised ${result.meta.destinationName} itinerary from Rise & Shine Travel.`;
    window.open(`https://wa.me/${n}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
  }

  return (
    <>
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js" strategy="lazyOnload" />
      <header className="topbar">
        <a className="logo" href="https://www.riseandshinetravel.com/" target="_blank" rel="noopener noreferrer">
          <img className="brand-img" src="/assets/logo.png" alt="Rise & Shine Travel" />
          <div className="wm">
            <b>Rise &amp; Shine</b>
            <span>TRAVEL · AHMEDABAD</span>
          </div>
        </a>
        <div className="topdiv" />
        <div className="toptitle">
          <b>AI Itinerary Generator</b>
          <span>Live tool · v2.0 · IATTE member</span>
        </div>
        <div className="topright">
          <div className="livebadge"><span className="dot" />LIVE</div>
        </div>
      </header>

      <div className="layout">
        <aside className="form-panel">
          <div className="formhead">
            <div className="hd-left">
              <div className="eyebrow">Build a trip</div>
              <h2>Plan the journey</h2>
            </div>
            <p>Fill the brief — branded, hour-by-hour plan from live data.</p>
          </div>
          <div className="formbody">
          <div className="formcols">
          <div className="formcol">
          <div className="section-title"><span className="st-ic">👤</span>Client</div>
          <div className="fg"><label>Client name</label>
            <input value={f.clientName} onChange={(e) => up("clientName", e.target.value)} /></div>
          <div className="fg"><label>Contact (WhatsApp)</label>
            <input value={f.clientPhone} onChange={(e) => up("clientPhone", e.target.value)} /></div>
          <div className="fg"><label>Email <span style={{ color: "var(--ink-faint)", fontWeight: 500 }}>(optional)</span></label>
            <input type="email" placeholder="client@example.com" value={f.email}
              onChange={(e) => up("email", e.target.value)} /></div>
          </div>

          <div className="formcol">
          <div className="section-title"><span className="st-ic">📍</span>Trip</div>
          <div className="fg"><label>Destination scope</label>
            <div className="scope-pill">
              <button type="button" aria-pressed={scope === "domestic"}
                onClick={() => {
                  setScope("domestic");
                  const first = DESTS.find(([k]) => DESTINATIONS[k as string]?.international === false);
                  if (first && f.destinationKey !== first[0]) up("destinationKey", first[0]);
                }}>🇮🇳 Domestic</button>
              <button type="button" aria-pressed={scope === "international"}
                onClick={() => {
                  setScope("international");
                  const first = DESTS.find(([k]) => DESTINATIONS[k as string]?.international === true);
                  if (first && f.destinationKey !== first[0]) up("destinationKey", first[0]);
                }}>✈️ International</button>
            </div></div>
          <div className="fg"><label>Destination</label>
            <select value={f.destinationKey} onChange={(e) => up("destinationKey", e.target.value)}>
              {DESTS
                .filter(([k]) => DESTINATIONS[k as string]?.international === (scope === "international"))
                .map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select></div>
          <div className="row2">
            <div className="fg"><label>Nights</label>
              <input type="number" min={2} max={20} value={f.durationNights}
                onChange={(e) => up("durationNights", e.target.value)} /></div>
            <div className="fg"><label>Budget tier</label>
              <select value={f.budgetTier} onChange={(e) => up("budgetTier", e.target.value)}>
                <option value={3}>Budget (3★)</option>
                <option value={4}>Mid-range (4★)</option>
                <option value={5}>Luxury (5★)</option>
              </select></div>
          </div>
          <div className="fg"><label>Travel date</label>
            <input type="date" value={f.startDate} onChange={(e) => up("startDate", e.target.value)} /></div>
          </div>

          <div className="formcol">
          <div className="section-title"><span className="st-ic">👥</span>Group &amp; preferences</div>
          <div className="row2">
            <div className="fg"><label>Adults</label>
              <input type="number" min={1} max={20} value={f.adults}
                onChange={(e) => up("adults", e.target.value)} /></div>
            <div className="fg"><label>Children (6–11 yrs)</label>
              <input type="number" min={0} max={10} value={f.children}
                onChange={(e) => up("children", e.target.value)} /></div>
          </div>
          <div className="fg"><label>Infants (0–5 yrs)</label>
            <input type="number" min={0} max={6} value={f.infants}
              onChange={(e) => up("infants", e.target.value)} /></div>
          <div className="fg"><label>Dietary preference</label>
            <select value={f.diet} onChange={(e) => up("diet", e.target.value)}>
              <option value="veg">Vegetarian</option>
              <option value="jain">Jain</option>
              <option value="non-veg">Non-Vegetarian</option>
              <option value="mixed">Mixed</option>
            </select></div>
          <div className="row2">
            <div className="fg"><label>Travel style</label>
              <select title="Travel style" value={f.travelStyle} onChange={(e) => up("travelStyle", e.target.value)}>
                <option value="touristy">Touristy — famous icons</option>
                <option value="balanced">Balanced — mix</option>
                <option value="offbeat">Off-beat — skip the crush</option>
              </select></div>
            <div className="fg"><label>Traveller profile</label>
              <select title="Traveller profile" value={f.groupType} onChange={(e) => up("groupType", e.target.value)}>
                <option value="family">Family</option>
                <option value="solo">Solo traveller</option>
                <option value="honeymoon">Honeymoon</option>
                <option value="bikers">Bike riders</option>
              </select></div>
          </div>
          <div className="fg"><label>Interests</label>
            <div className="chips">
              {INTERESTS.map((i) => (
                <span key={i} className={"chip" + (interests.includes(i) ? " on" : "")}
                  onClick={() => setInterests((s) => s.includes(i) ? s.filter((x) => x !== i) : [...s, i])}>{i}</span>
              ))}
            </div></div>
          </div>
          </div>

          <div className="formfoot">
            <div className="ff-assist">
              <div className="section-title section-title-inline"><span className="st-ic">🎫</span>Booking assistance</div>
              <div className="toggle-row">
                <button type="button"
                  className={"butter-toggle" + (errToggle === "flights" ? " warn" : "")}
                  aria-pressed={f.flightAssist}
                  onClick={() => up("flightAssist", !f.flightAssist)}>
                  <span className="dot" />✈️ Flight assistance
                </button>
                <button type="button"
                  className={"butter-toggle" + (errToggle === "hotels" ? " warn" : "")}
                  aria-pressed={f.hotelAssist}
                  onClick={() => up("hotelAssist", !f.hotelAssist)}>
                  <span className="dot" />🏨 Hotel assistance
                </button>
                <button type="button"
                  className="butter-toggle"
                  aria-pressed={f.visaNeeded}
                  onClick={() => up("visaNeeded", !f.visaNeeded)}>
                  <span className="dot" />🛂 Visa assistance
                </button>
              </div>
              <p className="hint">Flight / Hotel ON = live options (cheapest + 4 alternatives) from Amadeus.</p>
            </div>
            <div className="ff-cta">
              <button className="btn btn-primary" disabled={loading} onClick={generate}>
                {loading
                  ? <><span className="spin" />&nbsp;Building live itinerary…</>
                  : <><svg className="cta-ic" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.2 6.3L20.5 10l-6.3 2.2L12 18l-2.2-5.8L3.5 10l6.3-1.7z"/></svg>Generate Live Itinerary</>}
              </button>
              <div className="gennote">Live flights, hotels &amp; places · ~20 seconds</div>
              {err && <p style={{ color: "#dc2626", fontSize: 12, marginTop: 8 }}>⚠ {err}</p>}
            </div>
          </div>
          </div>
        </aside>

        <main className="preview-panel">
          {!result && !loading && (
            <div className="empty">
              <div className="ic">🗺️</div>
              <h2 style={{ color: "var(--ink)", marginBottom: 6 }}>No itinerary yet</h2>
              <p style={{ maxWidth: 440 }}>Fill the client details and hit <b>Generate</b>. A branded, hour-by-hour
                plan built from live flights, hotels, places & traveller intel appears here.</p>
            </div>
          )}
          {loading && (
            <div className="empty">
              <div className="ic"><span className="spin" /></div>
              <h2 style={{ color: "var(--ink)", marginBottom: 6 }}>Compiling live itinerary…</h2>
              <p style={{ maxWidth: 440 }}>Fetching flights (Amadeus), hotels, attractions & restaurants
                (Google Places), traveller intel (Reddit), composing the hour-by-hour plan (Claude).</p>
            </div>
          )}
          {result && <Itinerary
            r={result}
            days={editedDays ?? result.days}
            editMode={editMode}
            onEditToggle={() => {
              if (!editMode && !editedDays) setEditedDays(result.days);
              setEditMode((v) => !v);
            }}
            onReset={() => { setEditedDays(null); setEditMode(false); }}
            setDays={(d) => setEditedDays(d)}
            docRef={docRef} onPDF={downloadPDF} onWA={whatsapp} />}
        </main>
      </div>
    </>
  );
}

function Fresh({ s }: { s: "live" | "sample" | "indicative" }) {
  if (s === "live") return <span className="live"><span className="dot" />Live data</span>;
  if (s === "indicative")
    return <span className="live ind"><span className="dot" />Indicative — toggle assistance for live</span>;
  return <span className="live warn"><span className="dot" />Sample — add the API key to go live</span>;
}

function PlaceChip({ p }: { p: Place }) {
  return (
    <a className="placechip" href={p.mapsUrl} target="_blank" rel="noopener">
      {p.photoUrl ? <img src={p.photoUrl} alt={p.name} /> : <div className="placechip" style={{ width: 54, height: 54, padding: 0, justifyContent: "center" }}>📍</div>}
      <div>
        <div className="pn">{p.name}</div>
        <div className="pm">{p.category}{p.rating ? ` · ★ ${p.rating}` : ""}{p.tag ? ` · ${p.tag}` : ""}</div>
      </div>
    </a>
  );
}

function Block({ b }: { b: TimeBlock }) {
  return (
    <div className="blk">
      <div className="btime">{b.start}<br />–<br />{b.end}</div>
      <div className="brail"><div className="bicon">{KIND_ICON[b.kind] ?? "•"}</div><div className="bline" /></div>
      <div>
        <div className="btitle">{b.title}{b.kind === "meal" && <span className="kpill">choose 1</span>}</div>
        <div className="bdetail">{b.detail}</div>
        {b.place && <PlaceChip p={b.place} />}
        {b.options?.length > 0 && (
          <div className="opts">
            {b.options.map((o, i) => (
              <a key={i} className="opt" href={o.mapsUrl} target="_blank" rel="noopener">
                {o.photoUrl ? <img src={o.photoUrl} alt={o.name} /> : <div style={{ width: 40, height: 40, borderRadius: 7, background: "#eef3f3", display: "flex", alignItems: "center", justifyContent: "center" }}>🍽️</div>}
                <div><div className="on">{o.name}</div>
                  <div className="om">{o.vegFriendly ? "veg-friendly" : o.category}{o.rating ? ` · ★ ${o.rating}` : ""}</div></div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DayCard({ d, editMode, onChange }: { d: Day; editMode: boolean; onChange: (nd: Day) => void }) {
  const setBlock = (i: number, nb: TimeBlock) =>
    onChange({ ...d, blocks: d.blocks.map((x, j) => (j === i ? nb : x)) });
  const delBlock = (i: number) =>
    onChange({ ...d, blocks: d.blocks.filter((_, j) => j !== i) });
  const addBlock = () =>
    onChange({
      ...d,
      blocks: [...d.blocks, {
        start: "12:00", end: "13:00", kind: "leisure",
        title: "New block", detail: "Describe this slot.", place: null, options: [],
      }],
    });
  return (
    <div className="day">
      <div className="dhead">
        <div>
          <span className="dn">DAY {d.dayIndex + 1}</span>
          {editMode
            ? <input className="edit-input headline" value={d.headline}
                onChange={(e) => onChange({ ...d, headline: e.target.value })} />
            : <span className="dt">{d.headline}</span>}
        </div>
        <div className="dd">{d.weekday}, {d.date} · {d.cityLabel}</div>
      </div>
      {d.efficiency && <div className="effic">🧭 <b>Travel-efficient:</b> {d.efficiency}</div>}
      <div className="tl">
        {d.blocks.map((b, i) => editMode
          ? <BlockEdit key={i} b={b} onChange={(nb) => setBlock(i, nb)} onDelete={() => delBlock(i)} />
          : <Block key={i} b={b} />)}
        {editMode && (
          <button type="button" className="ba add-block" onClick={addBlock}>+ Add block</button>
        )}
      </div>
      {d.skip?.length > 0 && (
        <div className="skip">
          <div className="sl">⛔ Skip today</div>
          <ul>{d.skip.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </div>
      )}
    </div>
  );
}

function BlockEdit({ b, onChange, onDelete }: {
  b: TimeBlock; onChange: (nb: TimeBlock) => void; onDelete: () => void;
}) {
  return (
    <div className="blk edit">
      <div className="btime">
        <input className="edit-input time" type="time" value={b.start}
          onChange={(e) => onChange({ ...b, start: e.target.value })} />
        <input className="edit-input time" type="time" value={b.end}
          onChange={(e) => onChange({ ...b, end: e.target.value })} />
      </div>
      <div className="brail"><div className="bicon">{KIND_ICON[b.kind] ?? "•"}</div><div className="bline" /></div>
      <div className="bbody">
        <div className="be-row">
          <input className="edit-input title" value={b.title}
            onChange={(e) => onChange({ ...b, title: e.target.value })} />
          <button type="button" className="del-btn" onClick={onDelete} aria-label="Remove block">×</button>
        </div>
        <textarea className="edit-input detail" rows={2} value={b.detail}
          onChange={(e) => onChange({ ...b, detail: e.target.value })} />
        {b.place && <PlaceChip p={b.place} />}
        {b.options?.length > 0 && (
          <div className="opts">
            {b.options.map((o, i) => (
              <button type="button" key={i} className="opt as-btn"
                onClick={() => {
                  // Move clicked option to position 0 (primary).
                  const reordered = [o, ...b.options.filter((_, j) => j !== i)];
                  onChange({ ...b, options: reordered });
                }}>
                <div><div className="on">{i === 0 ? "★ " : ""}{o.name}</div>
                  <div className="om">{o.vegFriendly ? "veg-friendly" : o.category}{o.rating ? ` · ★ ${o.rating}` : ""}</div></div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Itinerary({ r, days, editMode, onEditToggle, onReset, setDays, docRef, onPDF, onWA }: {
  r: ItineraryResult; days: Day[];
  editMode: boolean; onEditToggle: () => void; onReset: () => void;
  setDays: (d: Day[]) => void;
  docRef: React.RefObject<HTMLDivElement | null>;
  onPDF: () => void; onWA: () => void;
}) {
  const fx = r.pricing.fx;
  const updateDay = (i: number, nd: Day) => setDays(days.map((x, j) => (j === i ? nd : x)));
  return (
    <>
      <div className="toolbar">
        <div>
          <div style={{ fontWeight: 700 }}>{r.meta.title}</div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>
            {r.meta.startDate} → {r.meta.endDate} · {r.meta.groupLabel}</div>
        </div>
        <div className="acts">
          <button type="button" className={"ba" + (editMode ? " dl" : "")} onClick={onEditToggle}>
            {editMode ? "💾 Save edits" : "✏️ Edit itinerary"}
          </button>
          {editMode && <button type="button" className="ba" onClick={onReset}>↺ Reset</button>}
          <button type="button" className="ba" onClick={onWA}>📱 WhatsApp</button>
          <button type="button" className="ba dl" onClick={onPDF}>⬇ Download PDF</button>
        </div>
      </div>

      <div className="doc" ref={docRef}>
        <div className="cover">
          <div className="bc">
            <div className="brand-logo-chip"><img src="/assets/logo.png" alt="Rise & Shine" /></div>
            <div><h3>Rise &amp; Shine Travel</h3><p>Ahmedabad · IATTE · BNI · ADTOI · Gujarat Tourism</p></div>
          </div>
          <div className="tag">Customised Itinerary</div>
          <h1>{r.meta.title}</h1>
          <div className="sub">{r.meta.tagline}</div>
          <div className="grid">
            <div className="gi"><div className="l">Prepared for</div><div className="v">{r.meta.groupLabel}</div></div>
            <div className="gi"><div className="l">Dates</div><div className="v">{r.meta.startDate} – {r.meta.endDate}</div></div>
            <div className="gi"><div className="l">Tier</div><div className="v">{r.meta.budgetLabel}</div></div>
            <div className="gi"><div className="l">Diet</div><div className="v">{r.meta.dietLabel}</div></div>
          </div>
        </div>

        <div className="page">
          <div className="ph"><div className="l"><img src="/assets/logo.png" alt="" />Rise &amp; Shine Travel</div>
            <div className="pn">Pricing &amp; Booking Estimate</div></div>

          <div className="h2">Indicative Package Pricing</div>
          <div className="disclaimer">
            <b>⚠ Subject to change.</b> {r.meta.disclaimer}
          </div>
          {r.pricing.priced === "live"
            ? <span className="live"><span className="dot" />Flights &amp; hotels = live fetched totals · still subject to availability</span>
            : <span className="live warn"><span className="dot" />Indicative sample rates — confirmed exactly on the booking call</span>}

          {r.pricing.liveRows.length > 0 && (
            <table className="ptab">
              <tbody>
                {r.pricing.liveRows.map((row, i) => (
                  <tr key={i}><td>{row.label}</td><td>{inr(row.usd, fx)}</td></tr>
                ))}
                <tr className="gr"><td>Booking-assistance core</td><td>{inr(r.pricing.liveCoreUSD, fx)}</td></tr>
              </tbody>
            </table>
          )}
          <div className="subm" style={{ margin: "10px 0 4px" }}>Indicative add-ons — confirmed exactly on the booking call:</div>
          <table className="ptab">
            <tbody>
              {r.pricing.addOnRows.map((row, i) => (
                <tr className="sub" key={i}><td>{row.label}</td><td>≈ {inr(row.usd, fx)}</td></tr>
              ))}
              <tr className="sub"><td>Rise &amp; Shine planning &amp; service (12%)</td><td>≈ {inr(r.pricing.serviceUSD, fx)}</td></tr>
              <tr className="gr"><td>Estimated package total</td><td>{inr(r.pricing.grandUSD, fx)}</td></tr>
            </tbody>
          </table>
          <div className="ppp">
            <div><div className="l">Approx. per person ({r.pricing.pax} sharing)</div>
              <div style={{ fontSize: 11, opacity: .7 }}>FX ₹{fx}/$ · all figures indicative · not a guarantee of final fare or rate</div></div>
            <div className="a">{inr(r.pricing.perPersonUSD, fx)}</div>
          </div>
        </div>

        {(r.hotels || r.flights || r.visa) && (
        <div className="page">
          <div className="ph"><div className="l"><img src="/assets/logo.png" alt="" />Rise &amp; Shine Travel</div>
            <div className="pn">Booking Assistance</div></div>

          {r.hotels && (
            <>
              <div className="h2">Your Stay</div>
              <Fresh s={r.freshness.hotels} />
              {r.hotels.map((h, i) => {
                const sv = h.strikeUSD ? Math.round((1 - h.totalUSD / h.strikeUSD) * 100) : 0;
                return (
                  <div className="hcard" key={i}>
                    <iframe className="map" loading="lazy"
                      src={`https://www.google.com/maps?q=${h.lat},${h.lng}&z=14&output=embed`} title={h.name} />
                    <div className="bd">
                      <div className="nm">{h.name}</div>
                      <div className="ar">{h.area}</div>
                      <div className="stars">{"★".repeat(h.stars)}{"☆".repeat(5 - h.stars)}</div>
                      <div className="pills">
                        <span className="pill rate">★ {h.rating}/10</span>
                        {h.reviews > 0 && <span className="pill">{h.reviews.toLocaleString("en-IN")} reviews</span>}
                        <span className="pill">{h.nights} night{h.nights > 1 ? "s" : ""}</span>
                      </div>
                      <div className="price">
                        <span className="now">{inr(h.totalUSD, fx)}</span>
                        {h.strikeUSD && <><span className="was">{inr(h.strikeUSD, fx)}</span><span className="sv">−{sv}%</span></>}
                        <span className="u">(${h.totalUSD} · {h.nights}N · indicative)</span>
                      </div>
                      <a className="lnk" href={h.bookUrl} target="_blank" rel="noopener">Book ↗</a>
                      <a className="lnk alt" href={`https://www.google.com/maps/search/?api=1&query=${h.lat},${h.lng}`} target="_blank" rel="noopener">📍 Map ↗</a>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {r.flights && (
            <>
              <div className="h2" style={{ marginTop: 18 }}>Flights · from {r.meta.originAirport}</div>
              <Fresh s={r.freshness.flights} />
              <div className="fcard">
                {[r.flights.outbound, r.flights.inbound].map((l, i) => (
                  <div className="fleg" key={i}>
                    <div><div className="fr">{l.label} · {l.route}</div>
                      <div className="fs">{r.flights!.carrier} · {l.flights} · {l.stops}</div></div>
                    <div className="ft">{l.dep}<br /><span style={{ color: "var(--ink-faint)" }}>→ {l.arr}</span><br />{l.dur}</div>
                  </div>
                ))}
                <div className="fs" style={{ marginTop: 8 }}>{r.flights.fareNote}</div>
              </div>
            </>
          )}

          {r.visa && (
            <>
              <div className="h2" style={{ marginTop: 18 }}>Visa Assistance</div>
              <span className="live warn"><span className="dot" />Fees + processing times subject to consulate updates</span>
              <table className="ptab vtab">
                <tbody>
                  <tr><td>Visa type</td><td>{r.visa.type}</td></tr>
                  <tr><td>Validity</td><td>{r.visa.validity}</td></tr>
                  <tr><td>Processing</td><td>{r.visa.processing}</td></tr>
                  <tr><td>Fee</td><td>{r.visa.fee}</td></tr>
                  <tr><td>Documents</td><td>{r.visa.docs}</td></tr>
                </tbody>
              </table>
            </>
          )}
        </div>
        )}

        <div className="page">
          <div className="ph"><div className="l"><img src="/assets/logo.png" alt="" />Rise &amp; Shine Travel</div>
            <div className="pn">Hour-by-Hour Plan</div></div>
          <div className="h2">Your Day-by-Day Journey</div>
          <div className="subm">Done-for-you — every hour planned with real places & diet-matched dining options.
            &nbsp;<Fresh s={r.freshness.engine} /></div>
          {days.map((d, i) => (
            <DayCard key={d.dayIndex} d={d} editMode={editMode}
              onChange={(nd) => updateDay(i, nd)} />
          ))}
        </div>

        <div className="page">
          <div className="ph"><div className="l"><img src="/assets/logo.png" alt="" />Rise &amp; Shine Travel</div>
            <div className="pn">Traveller Intel</div></div>
          <div className="h2">Validated Against Real Traveller Experience</div>
          <div className="subm">Filtered for {r.meta.groupLabel.toLowerCase()} · {r.meta.dietLabel.toLowerCase()} &nbsp;<Fresh s={r.freshness.intel} /></div>
          <div className="intel">
            <div className="ic do"><h4>✅ Do</h4><ul>{r.intel.do.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
            <div className="ic sk"><h4>⛔ Skip</h4><ul>{r.intel.skip.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
            <div className="ic ms"><h4>⭐ Don&apos;t miss</h4><ul>{r.intel.miss.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
          </div>
          <div className="idiet">🍃 <b>Matched to your diet:</b> {r.intel.diet}</div>
          <div className="isrc">{r.intel.sources}</div>
        </div>

        <div className="foot">
          <div><span className="iata">IATTE</span> Rise &amp; Shine Travel · Ahmedabad</div>
          <div>+91-79-2329 7232 · info@riseandshinetravel.com</div>
        </div>
      </div>
    </>
  );
}
