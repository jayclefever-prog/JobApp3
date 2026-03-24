import { useState, useEffect, useCallback } from "react";

// --- CONFIG --------------------------------------------------------------
const JSEARCH_KEY = "82c67a2db2msh8abb5ccb0daacd7p1b00c8jsn281ed9d9eac9";

const SEARCH_QUERIES = [
  "Customer Experience Program Manager remote",
  "Director of Operations remote",
  "Chief of Staff nonprofit remote",
  "Program Manager people operations remote",
];

const ROLE_KEYWORDS = [
  "operations", "chief of staff", "program manager", "process", "director",
  "customer experience", "member experience", "client experience",
];

const MISSION_KEYWORDS = [
  "dei", "wellness", "culture", "employee experience", "nonprofit",
  "b corp", "education", "health equity", "mission driven",
];

// --- HELPERS --------------------------------------------------------------
const scoreJob = (job) => {
  const text = `${job.title} ${job.description} ${job.company}`.toLowerCase();
  let score = 50;

  ROLE_KEYWORDS.forEach((kw) => { if (text.includes(kw)) score += 6; });
  MISSION_KEYWORDS.forEach((kw) => { if (text.includes(kw)) score += 4; });

  if (text.includes("remote")) score += 3;

  return Math.max(0, Math.min(score, 99));
};

const timeAgo = (ts) => {
  if (!ts) return "Recently";
  const d = new Date(ts * 1000);
  const diff = (Date.now() - d) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

// --- MAIN SIMPLIFIED APP --------------------------------------------------
export default function JobApp() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // Fetch jobs from RapidAPI directly (no backend)
  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    const all = [];
    const seen = new Set();

    for (const q of SEARCH_QUERIES) {
      try {
        const url = `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(
          q
        )}&num_pages=1`;
        const res = await fetch(url, {
          headers: {
            "x-rapidapi-host": "jsearch.p.rapidapi.com",
            "x-rapidapi-key": JSEARCH_KEY,
          },
        });
        if (!res.ok) throw new Error("API error");

        const data = await res.json();
        const items = data.data || [];

        items.forEach((j) => {
          if (seen.has(j.job_id)) return;
          seen.add(j.job_id);

          all.push({
            id: j.job_id,
            title: j.job_title,
            company: j.employer_name || "Unknown",
            location: j.job_city || "Remote",
            posted: timeAgo(j.job_posted_at_timestamp),
            description: (j.job_description || "").slice(0, 150) + "...",
            url: j.job_apply_link || j.job_google_link,
            score: scoreJob({
              title: j.job_title,
              description: j.job_description,
              company: j.employer_name,
            }),
          });
        });
      } catch (err) {
        console.error(err);
        setErrorMsg("Could not load jobs — try again.");
      }
    }

    all.sort((a, b) => b.score - a.score);
    setJobs(all);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: "0 auto", fontFamily: "sans-serif" }}>
      <h2>Katie's Job Feed</h2>
      <p style={{ color: "#666" }}>Simplified version · Remote · Ops · Program Mgmt</p>

      <button
        onClick={fetchJobs}
        style={{
          padding: "8px 14px",
          margin: "10px 0",
          background: "#eee",
          border: "1px solid #ccc",
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        Refresh Jobs
      </button>

      {loading && <p>Loading jobs...</p>}
      {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}

      <div style={{ marginTop: 20 }}>
        {jobs.map((job) => (
          <div
            key={job.id}
            style={{
              padding: 15,
              border: "1px solid #ddd",
              borderRadius: 8,
              marginBottom: 12,
            }}
          >
            <h3 style={{ margin: 0 }}>{job.title}</h3>
            <p style={{ margin: "4px 0", color: "#555" }}>
              {job.company} · {job.location}
            </p>
            <p style={{ margin: "4px 0", fontSize: 13, color: "#555" }}>
              Posted {job.posted}
            </p>

            <p style={{ fontSize: 14, marginTop: 8 }}>{job.description}</p>

            <p style={{ fontWeight: "bold", marginTop: 8 }}>
              Match Score: {job.score}%
            </p>

            <a
              href={job.url}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-block",
                marginTop: 10,
                background: "#0070f3",
                color: "#fff",
                padding: "8px 12px",
                borderRadius: 6,
                textDecoration: "none",
              }}
            >
              Apply →
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
