"use client";

import { useRef, useState } from "react";
import Script from "next/script";
import type {
  Day,
  ItineraryResult,
  NarrativeActivity,
  Place,
} from "@/lib/itinerary/schema";
import {
  CATALOG_PACKAGES,
  PACKAGE_LIST,
  isCatalogPackage,
  type CatalogPackageKey,
} from "@/lib/catalog";
import { buildInquiryMessage } from "@/lib/catalog/build";
import type { PackageCategory } from "@/lib/catalog";

const AGENCY_WHATSAPP = "917923297232";

const CATEGORIES: { id: PackageCategory; label: string; flag: string }[] = [
  { id: "domestic", label: "Domestic", flag: "🇮🇳" },
  { id: "international", label: "International", flag: "✈️" },
  { id: "cruise", label: "Cruise", flag: "🚢" },
];

const fmtDate = (iso: string) => {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
};

const fmtRange = (a: string, b: string) => {
  const da = new Date(a + "T00:00:00Z");
  const db = new Date(b + "T00:00:00Z");
  const sameY = da.getUTCFullYear() === db.getUTCFullYear();
  const left = da.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    ...(sameY ? {} : { year: "numeric" }),
    timeZone: "UTC",
  });
  const right = db.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
  return `${left} – ${right}`;
};

const inr = (usd: number, fx: number) =>
  "₹" + Math.round(usd * fx).toLocaleString("en-IN");

declare global {
  interface Window {
    html2pdf: unknown;
  }
}

type Step = "packages" | "details" | "itinerary";

export default function Page() {
  const [step, setStep] = useState<Step>("packages");
  const [category, setCategory] = useState<PackageCategory>("domestic");
  const [packageKey, setPackageKey] = useState<CatalogPackageKey | null>(null);

  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [startDate, setStartDate] = useState("2026-06-15");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<ItineraryResult | null>(null);
  const docRef = useRef<HTMLDivElement>(null);

  const selectedPkg = packageKey
    ? CATALOG_PACKAGES[packageKey as CatalogPackageKey]
    : null;
  const visiblePackages = PACKAGE_LIST.filter((p) => p.category === category);

  async function generate() {
    if (!packageKey) return;
    setErr(null);
    setLoading(true);
    setResult(null);
    try {
      const r = await fetch("/api/itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: clientName.trim() || "Guest",
          clientPhone: clientPhone.trim(),
          destinationKey: packageKey,
          startDate,
          adults: Number(adults),
          children: Number(children),
          infants: Number(infants),
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.detail || j.error || "Failed to build itinerary");
      setResult(j as ItineraryResult);
      setStep("itinerary");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function downloadPDF() {
    if (!docRef.current || !window.html2pdf || !result) return;
    const html2pdf = window.html2pdf as () => {
      set: (o: object) => { from: (el: HTMLElement) => { save: () => void } };
    };
    html2pdf()
      .set({
        margin: 0,
        filename:
          `RiseAndShine_${result.meta.destinationName}_${clientName}`.replace(
            /\s+/g,
            "_",
          ) + ".pdf",
        image: { type: "jpeg", quality: 0.96 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["css", "avoid-all"] },
      })
      .from(docRef.current)
      .save();
  }

  function sendInquiry() {
    if (!result || !packageKey) return;
    const msg = buildInquiryMessage(
      {
        clientName: clientName.trim() || "Guest",
        clientPhone: clientPhone.trim(),
        destinationKey: packageKey,
        startDate,
        adults: Number(adults),
        children: Number(children),
        infants: Number(infants),
      },
      result,
    );
    window.open(
      `https://wa.me/${AGENCY_WHATSAPP}?text=${encodeURIComponent(msg)}`,
      "_blank",
      "noopener",
    );
  }

  function pickPackage(key: CatalogPackageKey) {
    setPackageKey(key);
    setStep("details");
    setResult(null);
    setErr(null);
  }

  function backToPackages() {
    setStep("packages");
    setResult(null);
    setErr(null);
  }

  return (
    <>
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"
        strategy="lazyOnload"
      />
      <header className="topbar">
        <a
          className="logo"
          href="https://www.riseandshinetravel.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            className="brand-img"
            src="/assets/logo.png"
            alt="Rise & Shine Travel"
          />
          <div className="wm">
            <b>Rise &amp; Shine</b>
            <span>TRAVEL · AHMEDABAD</span>
          </div>
        </a>
        <div className="topdiv" />
        <div className="toptitle">
          <b>Itinerary Planner</b>
          <span>Explore packages · Plan your trip</span>
        </div>
        <div className="topright">
          <div className="livebadge demo-badge">
            <span className="dot" />
            Official packages
          </div>
        </div>
      </header>

      <nav className="stepper" aria-label="Booking steps">
        <span className={"stepper-step" + (step === "packages" ? " on" : "")}>
          1 · Choose package
        </span>
        <span className="stepper-sep" aria-hidden />
        <span className={"stepper-step" + (step === "details" ? " on" : "")}>
          2 · Your details
        </span>
        <span className="stepper-sep" aria-hidden />
        <span
          className={
            "stepper-step" + (step === "itinerary" ? " on" : "")
          }
        >
          3 · Your itinerary
        </span>
      </nav>

      <div className="layout">
        {step === "packages" && (
          <section className="flow-section">
            <div className="flow-head">
              <p className="eyebrow">Step 1 of 3</p>
              <h1>Choose your package</h1>
              <p className="flow-sub">
                Same categories as{" "}
                <a
                  href="https://www.riseandshinetravel.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  riseandshinetravel.com
                </a>
                — pick a trip, then enter your dates and travellers.
              </p>
            </div>

            <div className="cat-row">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={"cat-btn" + (category === c.id ? " on" : "")}
                  onClick={() => setCategory(c.id)}
                >
                  <span>{c.flag}</span> {c.label}
                </button>
              ))}
            </div>

            {visiblePackages.length === 0 ? (
              <div className="coming-soon">
                <p>No packages found in this category. Please choose another tab.</p>
              </div>
            ) : (
              <div className="pkg-grid">
                {visiblePackages.map((pkg) => (
                  <button
                    key={pkg.key}
                    type="button"
                    className="pkg-card"
                    onClick={() => pickPackage(pkg.key)}
                  >
                    <img
                      src={pkg.heroImageUrl}
                      alt={pkg.name}
                      loading="lazy"
                      onError={(e) => {
                        const el = e.currentTarget;
                        if (el.dataset.fallback) return;
                        el.dataset.fallback = "1";
                        el.src =
                          "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&q=80";
                      }}
                    />
                    <div className="pkg-overlay">
                      <h3>{pkg.name.toUpperCase()}</h3>
                      <p>
                        {pkg.durationDays} days · {pkg.durationNights} nights
                      </p>
                      <span className="pkg-route">{pkg.routeSummary}</span>
                      <span className="pkg-cta">Explore itinerary →</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {step === "details" && selectedPkg && (
          <section className="flow-section details-step">
            <button type="button" className="back-link" onClick={backToPackages}>
              ← All packages
            </button>
            <div className="selected-pkg-banner">
              <img
                src={selectedPkg.heroImageUrl}
                alt=""
                onError={(e) => {
                  const el = e.currentTarget;
                  if (el.dataset.fallback) return;
                  el.dataset.fallback = "1";
                  el.src =
                    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&q=80";
                }}
              />
              <div>
                <p className="eyebrow">{selectedPkg.tourName}</p>
                <h2>{selectedPkg.title}</h2>
                <p>{selectedPkg.routeSummary}</p>
                <p className="fixed-nights">
                  Fixed schedule · {selectedPkg.durationDays} days /{" "}
                  {selectedPkg.durationNights} nights
                </p>
              </div>
            </div>

            <div className="form-panel compact-form">
              <div className="formhead">
                <div className="hd-left">
                  <div className="eyebrow">Step 2 of 3</div>
                  <h2>Your details</h2>
                </div>
              </div>
              <div className="formbody">
                <div className="formcols formcols-2">
                  <div className="fg">
                    <label>Your name</label>
                    <input
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Full name"
                    />
                  </div>
                  <div className="fg">
                    <label>Phone (WhatsApp)</label>
                    <input
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div className="fg">
                    <label>Travel start date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="fg">
                    <label>Travellers</label>
                    <div className="row2">
                      <div className="fg" style={{ marginBottom: 0 }}>
                        <label>Adults</label>
                        <input
                          type="number"
                          min={1}
                          max={12}
                          value={adults}
                          onChange={(e) => setAdults(Number(e.target.value))}
                        />
                      </div>
                      <div className="fg" style={{ marginBottom: 0 }}>
                        <label>Children (6–11)</label>
                        <input
                          type="number"
                          min={0}
                          max={6}
                          value={children}
                          onChange={(e) => setChildren(Number(e.target.value))}
                        />
                      </div>
                    </div>
                    <div className="fg" style={{ marginTop: 11 }}>
                      <label>Infants (0–5)</label>
                      <input
                        type="number"
                        min={0}
                        max={4}
                        value={infants}
                        onChange={(e) => setInfants(Number(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
                <div className="formfoot formfoot-single">
                  <button
                    className="btn btn-primary"
                    disabled={loading || !clientName.trim() || !clientPhone.trim()}
                    onClick={generate}
                  >
                    {loading ? (
                      <>
                        <span className="spin" />
                        &nbsp;Building your itinerary…
                      </>
                    ) : (
                      <>View your day-by-day plan</>
                    )}
                  </button>
                  {err && (
                    <p className="form-err">⚠ {err}</p>
                  )}
                  <p className="gennote">
                    Indicative pricing · 4★ hotels · No account required
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {step === "itinerary" && result && packageKey && (
          <main className="preview-panel full-preview">
            <ItineraryView
              r={result}
              packageKey={packageKey}
              clientName={clientName}
              onBack={() => setStep("details")}
              onInquiry={sendInquiry}
              onPDF={downloadPDF}
              docRef={docRef}
            />
          </main>
        )}
      </div>
    </>
  );
}

function NarrativeActivityCard({ a }: { a: NarrativeActivity }) {
  const hero = a.place?.photoUrl;
  return (
    <article className={"narr-act" + (hero ? " has-hero" : "")}>
      <div className="narr-period">{a.period}</div>
      <div className="narr-body">
        <div className="narr-copy">
          <h4 className="btitle">{a.title}</h4>
          <p className="bdetail">{a.detail}</p>
          {a.place && !hero && <PlaceChip p={a.place} />}
        </div>
        {hero && a.place && (
          <a
            className="bhero"
            href={a.place.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`View ${a.place.name} on map`}
          >
            <img src={hero} alt={a.place.name} loading="lazy" />
            <div className="bhero-tag">
              {a.place.rating ? `★ ${a.place.rating}` : "Place"} ·{" "}
              {a.place.category}
            </div>
          </a>
        )}
      </div>
    </article>
  );
}

function PlaceChip({ p }: { p: Place }) {
  return (
    <a className="placechip" href={p.mapsUrl} target="_blank" rel="noopener noreferrer">
      {p.photoUrl ? (
        <img src={p.photoUrl} alt={p.name} />
      ) : (
        <div className="placechip-fallback">📍</div>
      )}
      <div>
        <div className="pn">{p.name}</div>
        <div className="pm">
          {p.category}
          {p.rating ? ` · ★ ${p.rating}` : ""}
        </div>
      </div>
    </a>
  );
}

function NarrativeDayCard({ d }: { d: Day }) {
  const acts = d.activities ?? [];
  return (
    <div className="day narrative-day">
      <div className="dhead">
        <div>
          <span className="dn">DAY {d.dayIndex + 1}</span>
          <span className="dt">{d.headline}</span>
        </div>
        <div className="dd">
          {d.weekday}, {fmtDate(d.date)} · {d.cityLabel}
        </div>
      </div>
      <div className="narr-tl">
        {acts.map((a, i) => (
          <NarrativeActivityCard key={i} a={a} />
        ))}
      </div>
      {d.overnight && (
        <div className="overnight">
          🌙 <b>Overnight:</b> {d.overnight}
        </div>
      )}
    </div>
  );
}

function ItineraryView({
  r,
  packageKey,
  clientName,
  onBack,
  onInquiry,
  onPDF,
  docRef,
}: {
  r: ItineraryResult;
  packageKey: CatalogPackageKey;
  clientName: string;
  onBack: () => void;
  onInquiry: () => void;
  onPDF: () => void;
  docRef: React.RefObject<HTMLDivElement | null>;
}) {
  const fx = r.pricing.fx;
  const pkg = CATALOG_PACKAGES[packageKey];

  return (
    <div className="itin-shell">
      <div className="itin-actions-sticky">
        <div className="toolbar">
          <div>
            <button type="button" className="back-link inline" onClick={onBack}>
              ← Edit details
            </button>
            <div style={{ fontWeight: 700, marginTop: 6, fontFamily: "var(--f-display-stack)" }}>
              {r.meta.title}
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
              {fmtRange(r.meta.startDate, r.meta.endDate)} · {r.meta.groupLabel}
              {clientName ? ` · ${clientName}` : ""}
            </div>
          </div>
          <div className="acts">
            <button type="button" className="ba inquiry-btn" onClick={onInquiry}>
              Send inquiry
            </button>
            <button type="button" className="ba dl" onClick={onPDF}>
              Download PDF
            </button>
          </div>
        </div>
      </div>

      <div className="doc" ref={docRef}>
        <div className="cover">
          <div className="bc">
            <div className="brand-logo-chip">
              <img src="/assets/logo.png" alt="Rise & Shine" />
            </div>
            <div>
              <h3>Rise &amp; Shine Travel</h3>
              <p>Ahmedabad · IATTE · BNI · ADTOI · Gujarat Tourism</p>
            </div>
          </div>
          <div className="tag">{pkg?.tourName ?? r.meta.title}</div>
          <h1>{r.meta.title}</h1>
          <div className="sub">{r.meta.tagline}</div>
          <div className="grid">
            <div className="gi">
              <div className="l">Prepared for</div>
              <div className="v">{clientName || r.meta.groupLabel}</div>
            </div>
            <div className="gi">
              <div className="l">Dates</div>
              <div className="v">{fmtRange(r.meta.startDate, r.meta.endDate)}</div>
            </div>
            <div className="gi">
              <div className="l">Route</div>
              <div className="v">{pkg?.routeSummary ?? "—"}</div>
            </div>
            <div className="gi">
              <div className="l">Travellers</div>
              <div className="v">{r.meta.groupLabel}</div>
            </div>
          </div>
        </div>

        <div className="page">
          <div className="ph">
            <div className="l">
              <img src="/assets/logo.png" alt="" />
              Rise &amp; Shine Travel
            </div>
            <div className="pn">Indicative pricing</div>
          </div>
          <div className="h2">Package estimate (average market rates)</div>
          <div className="disclaimer">
            <b>Subject to change.</b> {r.meta.disclaimer}
          </div>
          <span className="live warn">
            <span className="dot" />
            Indicative averages — confirmed on your booking call
          </span>
          <table className="ptab">
            <tbody>
              {r.pricing.liveRows.map((row, i) => (
                <tr key={i}>
                  <td>{row.label}</td>
                  <td>{inr(row.usd, fx)}</td>
                </tr>
              ))}
              <tr className="gr">
                <td>Flights + hotels (core)</td>
                <td>{inr(r.pricing.liveCoreUSD, fx)}</td>
              </tr>
            </tbody>
          </table>
          <table className="ptab">
            <tbody>
              {r.pricing.addOnRows.map((row, i) => (
                <tr className="sub" key={i}>
                  <td>{row.label}</td>
                  <td>≈ {inr(row.usd, fx)}</td>
                </tr>
              ))}
              <tr className="sub">
                <td>Rise &amp; Shine planning &amp; service (12%)</td>
                <td>≈ {inr(r.pricing.serviceUSD, fx)}</td>
              </tr>
              <tr className="gr">
                <td>Estimated package total</td>
                <td>{inr(r.pricing.grandUSD, fx)}</td>
              </tr>
            </tbody>
          </table>
          <div className="ppp">
            <div>
              <div className="l">
                Approx. per person ({r.pricing.pax} travellers)
              </div>
            </div>
            <div className="a">{inr(r.pricing.perPersonUSD, fx)}</div>
          </div>
        </div>

        {r.flights && (
          <div className="page">
            <div className="ph">
              <div className="l">
                <img src="/assets/logo.png" alt="" />
                Rise &amp; Shine Travel
              </div>
              <div className="pn">Flights</div>
            </div>
            <div className="h2">Flights · from {r.meta.originAirport}</div>
            <div className="fcard">
              {[r.flights.outbound, r.flights.inbound].map((l, i) => (
                <div className="fleg" key={i}>
                  <div>
                    <div className="fr">
                      {l.label} · {l.route}
                    </div>
                    <div className="fs">
                      {r.flights!.carrier} · {l.flights} · {l.stops}
                    </div>
                  </div>
                  <div className="ft">
                    {l.dep}
                    <br />
                    <span style={{ color: "var(--ink-faint)" }}>→ {l.arr}</span>
                    <br />
                    {l.dur}
                  </div>
                </div>
              ))}
              <div className="fs" style={{ marginTop: 8 }}>
                {r.flights.fareNote}
              </div>
              <div className="per-adult">
                ≈ {inr(r.flights.perAdultUSD, fx)} per adult (round trip, average)
              </div>
            </div>
          </div>
        )}

        {r.hotels && r.hotels.length > 0 && (
          <div className="page">
            <div className="ph">
              <div className="l">
                <img src="/assets/logo.png" alt="" />
                Rise &amp; Shine Travel
              </div>
              <div className="pn">Your stay</div>
            </div>
            <div className="h2">4★ hotels (indicative)</div>
            {r.hotels.map((h, i) => {
              const sv = h.strikeUSD
                ? Math.round((1 - h.totalUSD / h.strikeUSD) * 100)
                : 0;
              return (
                <div className="hcard has-photo" key={i}>
                  {h.photoUrl && (
                    <img className="hcard-photo" src={h.photoUrl} alt={h.name} />
                  )}
                  <div className="bd">
                    <div className="nm">{h.name}</div>
                    <div className="ar">{h.area}</div>
                    <div className="stars">
                      {"★".repeat(h.stars)}
                      {"☆".repeat(5 - h.stars)}
                    </div>
                    <div className="pills">
                      <span className="pill rate">★ {h.rating}/10</span>
                      {h.reviews > 0 && (
                        <span className="pill">
                          {h.reviews.toLocaleString("en-IN")} reviews
                        </span>
                      )}
                      <span className="pill">
                        {h.nights} night{h.nights > 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="price">
                      <span className="now">{inr(h.totalUSD, fx)}</span>
                      {h.strikeUSD && (
                        <>
                          <span className="was">{inr(h.strikeUSD, fx)}</span>
                          <span className="sv">−{sv}%</span>
                        </>
                      )}
                      <span className="u">(avg. for stay · indicative)</span>
                    </div>
                    <a
                      className="lnk alt"
                      href={`https://www.google.com/maps/search/?api=1&query=${h.lat},${h.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      📍 View on map
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="page">
          <div className="ph">
            <div className="l">
              <img src="/assets/logo.png" alt="" />
              Rise &amp; Shine Travel
            </div>
            <div className="pn">Day-by-day plan</div>
          </div>
          <div className="h2">Your journey</div>
          <div className="subm">{pkg?.routeSummary ?? ""}</div>
          {r.days.map((d) => (
            <NarrativeDayCard key={d.dayIndex} d={d} />
          ))}
        </div>

        <div className="page">
          <div className="ph">
            <div className="l">
              <img src="/assets/logo.png" alt="" />
              Rise &amp; Shine Travel
            </div>
            <div className="pn">Travel tips</div>
          </div>
          <div className="h2">Good to know</div>
          <div className="intel">
            <div className="ic do">
              <h4>Do</h4>
              <ul>
                {r.intel.do.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </div>
            <div className="ic sk">
              <h4>Skip</h4>
              <ul>
                {r.intel.skip.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </div>
            <div className="ic ms">
              <h4>Don&apos;t miss</h4>
              <ul>
                {r.intel.miss.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="foot">
          <div>
            <span className="iata">IATTE</span> Rise &amp; Shine Travel · Ahmedabad
          </div>
          <div>+91-79-2329 7232 · info@riseandshinetravel.com</div>
        </div>
      </div>
    </div>
  );
}
