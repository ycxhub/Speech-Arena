import Link from "next/link";
import { getActivePlaygroundPages } from "./[slug]/actions";

function simplifyTitle(title: string): string {
  return title
    .replace(/^Compare\s+/i, "")
    .replace(/\s+vs\s+/i, " & ");
}

export default async function PlaygroundCatalogPage() {
  const pages = await getActivePlaygroundPages();

  return (
    <main className="murf-catalog">
      <div className="murf-catalog-inner">
        <header className="murf-catalog-header">
          <h1 className="murf-catalog-title">Compare TTS Models</h1>
          <p className="murf-catalog-subtitle">
            Listen side-by-side and pick your favorite voice. Choose a
            comparison below to start.
          </p>
        </header>

        {pages.length > 0 ? (
          <div className="murf-catalog-grid">
            {pages.map((page) => (
              <Link
                key={page.slug}
                href={`/pg/${page.slug}`}
                className="murf-catalog-card"
              >
                <span className="murf-catalog-card-title">
                  {simplifyTitle(page.title)}
                </span>
                <span className="murf-catalog-card-cta">
                  Listen & compare
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M6 4L10 8L6 12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="murf-catalog-empty">
            <p className="murf-catalog-empty-text">
              No comparisons available yet. Check back soon.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
