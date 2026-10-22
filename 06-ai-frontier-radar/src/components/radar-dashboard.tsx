"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  FlaskConical,
  Layers3,
  Radio,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  demoFindings,
  filterFindings,
  formatDate,
  initialQuery,
  researchQuerySchema,
  type Finding,
} from "@/lib/research";

export function RadarDashboard() {
  const [topic, setTopic] = useState(initialQuery.topic);
  const [start, setStart] = useState(initialQuery.start);
  const [end, setEnd] = useState(initialQuery.end);
  const [results, setResults] = useState(demoFindings);
  const [activeTopic, setActiveTopic] = useState(initialQuery.topic);
  const [category, setCategory] = useState("All findings");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(
    "Showing the historical demo collection. No live research has been run.",
  );
  const visible = results.filter(
    (item) => category === "All findings" || item.category === category,
  );

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = researchQuerySchema.safeParse({ topic, start, end });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setError("");
    setResults(filterFindings(demoFindings, parsed.data));
    setActiveTopic(parsed.data.topic);
    setCategory("All findings");
    setNotice(
      "Demo filters applied. Results come only from three local fixtures; no sources were fetched and no AI model was called.",
    );
  }
  function reset() {
    setTopic(initialQuery.topic);
    setStart(initialQuery.start);
    setEnd(initialQuery.end);
    setResults(demoFindings);
    setActiveTopic(initialQuery.topic);
    setCategory("All findings");
    setError("");
    setNotice(
      "Historical demo collection restored. No live research has been run.",
    );
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <Link className="brand" href="/" aria-label="AI Frontier Radar home">
          <span className="brand-mark">
            <Radio size={23} />
          </span>
          <span>
            FRONTIER<span className="brand-light"> / RADAR</span>
          </span>
        </Link>
        <nav aria-label="Main navigation">
          <a href="#findings" className="nav-active">
            Research feed
          </a>
          <a href="#method">
            Our approach <ArrowUpRight size={13} />
          </a>
        </nav>
        <Badge variant="outline" className="demo-badge">
          <span className="status-dot" /> Demo workspace
        </Badge>
      </header>
      <main id="main" className="main-container">
        <section className="hero" aria-labelledby="hero-title">
          <div>
            <div className="eyebrow">
              <span className="tiny-line" /> THE SIGNAL BEYOND THE HYPE
            </div>
            <h1 id="hero-title">
              The frontier moves fast.
              <br />
              <span>Know what matters.</span>
            </h1>
            <p className="hero-description">
              AI research, grounded in sources. Explore the technical shifts
              <br className="desktop-break" /> and turn interesting ideas into
              your next experiment.
            </p>
            <div className="hero-proof">
              <ShieldCheck size={15} /> Evidence first <span>·</span>{" "}
              Engineering focused <span>·</span> Built for curiosity
            </div>
          </div>
          <div className="radar-art" aria-hidden="true">
            <div className="radar-orbit orbit-one" />
            <div className="radar-orbit orbit-two" />
            <div className="radar-orbit orbit-three" />
            <div className="radar-axis axis-x" />
            <div className="radar-axis axis-y" />
            <div className="radar-sweep" />
            <span className="radar-center" />
            <span className="blip blip-one" />
            <span className="blip blip-two" />
            <span className="blip blip-three" />
            <span className="radar-label">SCANNING THE POSSIBLE</span>
          </div>
        </section>
        <section className="research-panel" aria-labelledby="research-title">
          <div className="panel-heading">
            <div>
              <span className="section-index">01 / EXPLORE</span>
              <h2 id="research-title">What’s on your radar?</h2>
            </div>
            <Badge variant="secondary">Fixture preview</Badge>
          </div>
          <form onSubmit={submit} noValidate>
            <div className="form-grid">
              <div className="topic-field">
                <label htmlFor="topic">Research topic</label>
                <div className="input-with-icon">
                  <Search size={17} />
                  <Input
                    id="topic"
                    value={topic}
                    onChange={(event) => setTopic(event.target.value)}
                    placeholder="e.g. language models, agents, inference"
                    maxLength={160}
                    aria-invalid={!!error}
                    aria-describedby={error ? "form-error" : "demo-note"}
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="start">From</label>
                <Input
                  type="date"
                  id="start"
                  value={start}
                  onChange={(event) => setStart(event.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="end">To</label>
                <Input
                  type="date"
                  id="end"
                  value={end}
                  onChange={(event) => setEnd(event.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="explore-button">
                Explore demo <ArrowRight size={16} />
              </Button>
            </div>
            {error && (
              <p id="form-error" role="alert" className="form-error">
                {error}
              </p>
            )}
            <div className="form-footer">
              <p id="demo-note">
                <span className="amber-dot" />
                Demo data only · Historical papers, Oct 2022–Jul 2023 · No API
                calls
              </p>
              <button type="button" onClick={reset}>
                Reset demo <span aria-hidden="true">↺</span>
              </button>
            </div>
          </form>
        </section>
        <div className="content-grid">
          <section id="findings" aria-labelledby="findings-title">
            <div className="results-heading">
              <div>
                <span className="section-index">02 / THE RESEARCH FEED</span>
                <h2 id="findings-title">
                  Ideas worth a closer look
                  <span className="result-count">
                    {results.length.toString().padStart(2, "0")}
                  </span>
                </h2>
              </div>
              <span className="sort-label">
                Newest first <ArrowDown size={13} />
              </span>
            </div>
            <div
              className="filter-row"
              role="group"
              aria-label="Filter findings by category"
            >
              {["All findings", "Models", "Agents"].map((tab) => (
                <button
                  key={tab}
                  aria-pressed={category === tab}
                  onClick={() => setCategory(tab)}
                  className={
                    category === tab ? "filter-tab selected" : "filter-tab"
                  }
                >
                  {tab}
                </button>
              ))}
              <span className="fixture-label">CURATED DEMO</span>
            </div>
            <p role="status" className="results-notice">
              {notice}
            </p>
            <p className="sr-only">Applied topic: {activeTopic}</p>
            <div className="finding-list">
              {visible.map((finding, index) => (
                <FindingCard key={finding.id} finding={finding} index={index} />
              ))}
            </div>
            {visible.length === 0 && (
              <div className="empty-state">
                <Search size={28} />
                <h3>No demo findings match</h3>
                <p>
                  Try “language models,” “agents,” or “inference” within the
                  historical demo dates. Live search is not connected yet.
                </p>
                <Button variant="outline" onClick={reset}>
                  Restore demo collection
                </Button>
              </div>
            )}
          </section>
          <aside>
            <section className="approach-card" id="method">
              <div className="aside-icon">
                <Layers3 size={21} />
              </div>
              <span className="section-index">LESS NOISE. MORE CONTEXT.</span>
              <h2>
                From a paper
                <br />
                to a possibility.
              </h2>
              <p>
                A useful finding should help you understand what changed—and
                what to try next.
              </p>
              <ol>
                <li>
                  <span>01</span>
                  <div>
                    <strong>Start with the source</strong>
                    <p>
                      Original papers and official releases, with dates you can
                      inspect.
                    </p>
                  </div>
                </li>
                <li>
                  <span>02</span>
                  <div>
                    <strong>Make the meaning clear</strong>
                    <p>
                      Keep reported evidence separate from technical
                      interpretation.
                    </p>
                  </div>
                </li>
                <li>
                  <span>03</span>
                  <div>
                    <strong>Make something of it</strong>
                    <p>Turn an insight into a small, measurable experiment.</p>
                  </div>
                </li>
              </ol>
              <div className="aside-foot">
                <ShieldCheck size={17} />
                <span>
                  Source links are provided.
                  <br />
                  Experiments are proposals, not results.
                </span>
              </div>
            </section>
            <section className="scope-card">
              <span className="scope-dot" />
              <h3>A preview of what’s ahead</h3>
              <p>
                You’re exploring a fixture-based prototype. Live source
                retrieval and AI synthesis are planned for later milestones.
              </p>
              <span>LOCAL DATA · ZERO API SPEND</span>
            </section>
          </aside>
        </div>
        <footer className="site-footer">
          <span>
            <Radio size={16} /> AI Frontier Radar
          </span>
          <p>Stay curious. Check the sources. Build something.</p>
          <span>DEMO / V0.1</span>
        </footer>
      </main>
    </div>
  );
}

function FindingCard({ finding, index }: { finding: Finding; index: number }) {
  return (
    <article className="finding-card">
      <div className="card-top">
        <div className="card-meta">
          <Badge
            variant="outline"
            className={
              finding.category === "Agents"
                ? "category-agent"
                : "category-model"
            }
          >
            {finding.category === "Agents" ? (
              <Sparkles size={11} />
            ) : (
              <Layers3 size={11} />
            )}{" "}
            {finding.category}
          </Badge>
          <span>{finding.source}</span>
        </div>
        <span className="card-index">
          /{(index + 1).toString().padStart(2, "0")}
        </span>
      </div>
      <h3>{finding.title}</h3>
      <p className="finding-summary">{finding.summary}</p>
      <div className="interpretation">
        <span>
          WHY IT MATTERS <small>· EDITORIAL INTERPRETATION</small>
        </span>
        <p>{finding.interpretation}</p>
      </div>
      <details className="evidence-details">
        <summary>
          Inspect source evidence <span>+</span>
        </summary>
        <div>
          <p>
            <strong>Source paraphrase:</strong> {finding.evidence}
          </p>
          <p>
            <strong>Limitations:</strong> {finding.limitation}
          </p>
          <p>
            Manually curated fixture. No automated claim verification or model
            generation has occurred.
          </p>
        </div>
      </details>
      <div className="experiment">
        <FlaskConical size={18} />
        <div>
          <strong>
            TRY THIS <span>PROPOSED EXPERIMENT</span>
          </strong>
          <p>{finding.experiment}</p>
        </div>
      </div>
      <div className="card-bottom">
        <time dateTime={finding.published}>
          {formatDate(finding.published)} <span>· First published</span>
        </time>
        <a href={finding.url} target="_blank" rel="noreferrer">
          Read primary source <ArrowUpRight size={14} />
          <span className="sr-only">
            {" "}
            for {finding.title} (opens in a new tab)
          </span>
        </a>
      </div>
    </article>
  );
}
