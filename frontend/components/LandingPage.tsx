"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGraphStore } from "@/lib/store";

const workflow = [
  { number: "01", title: "Inspect", detail: "Map files and relationships" },
  { number: "02", title: "Run", detail: "See command output as it happens" },
  { number: "03", title: "Diagnose", detail: "Trace errors to their source" },
  { number: "04", title: "Review", detail: "Inspect a suggested minimal patch" },
];

export default function LandingPage() {
  const router = useRouter();
  const loadDemoBrokenProject = useGraphStore((s) => s.loadDemoBrokenProject);
  const [demoLoading, setDemoLoading] = useState(false);

  const handleLaunchDemo = async (type: "react" | "python") => {
    setDemoLoading(true);
    try {
      await loadDemoBrokenProject(type);
      router.push("/runfix");
    } catch {
      // The store reports demo-loading errors to the application UI.
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="landing-page">
      <div className="landing-backdrop" aria-hidden="true" />

      <header className="landing-header">
        <Link className="landing-brand" href="/" aria-label="CodeLens home">
          <span className="landing-brand-mark" aria-hidden="true">CL</span>
          <span className="landing-brand-name">CodeLens</span>
          <span className="landing-brand-product">CODE INTELLIGENCE</span>
        </Link>

        <nav className="landing-nav" aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#capabilities">Capabilities</a>
          <Link href="/about">About</Link>
          <Link className="landing-nav-cta" href="/runfix">Open workspace <span aria-hidden="true">→</span></Link>
        </nav>
      </header>

      <main>
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <div className="landing-eyebrow">
              <span className="landing-status-dot" />
              CODEBASE EXPLORATION · RUNFIX
            </div>
            <h1>
              Understand the code
              <span>before you change it.</span>
            </h1>
            <p className="landing-lede">
              Explore how files and symbols connect, then use RunFix to inspect
              command output and review a possible fix with the surrounding context.
            </p>

            <div className="landing-actions">
              <Link className="landing-button landing-button-primary" href="/runfix">
                Open CodeLens <span aria-hidden="true">→</span>
              </Link>
              <button
                className="landing-button landing-button-secondary"
                onClick={() => handleLaunchDemo("react")}
                disabled={demoLoading}
              >
                <span aria-hidden="true">{demoLoading ? "◌" : "▶"}</span>
                {demoLoading ? "Loading sample…" : "Try the sample project"}
              </button>
            </div>
            <p className="landing-action-note">
              No account needed · Review changes before applying them
            </p>
          </div>

          <div className="landing-visual" role="img" aria-label="Illustration of CodeLens code relationships and RunFix review">
            <div className="landing-visual-top">
              <div>
                <span className="landing-panel-kicker">CODELENS WORKSPACE</span>
                <h2>From structure to change</h2>
              </div>
              <span className="landing-panel-indicator"><span /> READY TO EXPLORE</span>
            </div>

            <div className="landing-map">
              <div className="landing-map-lines" aria-hidden="true">
                <i className="landing-line landing-line-one" />
                <i className="landing-line landing-line-two" />
                <i className="landing-line landing-line-three" />
                <i className="landing-line landing-line-four" />
                <i className="landing-line landing-line-five" />
              </div>
              <div className="landing-map-node landing-map-root"><span className="landing-node-icon">⌘</span><span>src</span></div>
              <div className="landing-map-node landing-map-api"><span className="landing-node-icon">ƒ</span><span>api</span></div>
              <div className="landing-map-node landing-map-ui"><span className="landing-node-icon">◫</span><span>ui</span></div>
              <div className="landing-map-node landing-map-data"><span className="landing-node-icon">▤</span><span>data</span></div>
              <div className="landing-map-node landing-map-test"><span className="landing-node-icon">✓</span><span>tests</span></div>
              <div className="landing-map-caption">Explore dependencies and nearby symbols</div>
            </div>

            <div className="landing-review-card">
              <span className="landing-review-icon" aria-hidden="true">↗</span>
              <div className="landing-review-copy">
                <strong>RunFix review</strong>
                <span>Inspect the output. Review a candidate patch.</span>
              </div>
              <span className="landing-review-badge">HUMAN REVIEW</span>
            </div>
          </div>
        </section>

        <section className="landing-workflow" id="how-it-works" aria-labelledby="workflow-title">
          <div className="landing-section-heading">
            <div>
              <span className="landing-section-kicker">A CLEARER WAY TO DEBUG</span>
              <h2 id="workflow-title">Follow the evidence, step by step.</h2>
            </div>
            <p>CodeLens brings repository context and runtime feedback into one workspace.</p>
          </div>
          <ol className="landing-workflow-list">
            {workflow.map((step, index) => (
              <li className="landing-workflow-step" key={step.number}>
                <span className="landing-step-number">{step.number}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.detail}</p>
                </div>
                {index < workflow.length - 1 && <span className="landing-step-arrow" aria-hidden="true">→</span>}
              </li>
            ))}
          </ol>
        </section>

        <section className="landing-capabilities" id="capabilities" aria-label="CodeLens capabilities">
          <article className="landing-capability">
            <span className="landing-capability-icon landing-capability-blue" aria-hidden="true">⌘</span>
            <div>
              <h3>See how your code connects</h3>
              <p>Explore Python, JavaScript, and TypeScript structure as an interactive graph.</p>
            </div>
            <Link href="/graph" aria-label="Explore the code graph">↗</Link>
          </article>
          <article className="landing-capability">
            <span className="landing-capability-icon landing-capability-cyan" aria-hidden="true">⌁</span>
            <div>
              <h3>Investigate a failing run</h3>
              <p>Run project commands and inspect captured output and error details.</p>
            </div>
            <Link href="/runfix" aria-label="Open RunFix">↗</Link>
          </article>
          <article className="landing-capability">
            <span className="landing-capability-icon landing-capability-violet" aria-hidden="true">✓</span>
            <div>
              <h3>Keep the developer in control</h3>
              <p>Review suggested changes yourself; generated test templates remain pending until you run them.</p>
            </div>
            <Link href="/tests" aria-label="View test suites">↗</Link>
          </article>
        </section>
      </main>

      <footer className="landing-footer">
        <span>CodeLens <span aria-hidden="true">·</span> Make the codebase easier to understand.</span>
        <Link href="/about">Learn about the project <span aria-hidden="true">→</span></Link>
      </footer>
    </div>
  );
}
