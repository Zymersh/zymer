// Website-Anreicherung: besucht die echte Website eines Betriebs und zieht
// verifizierte E-Mail, Telefonnummer und Social-Media-Profile heraus — live,
// nicht aus einer veralteten Datenbank.

const SOCIAL_HOSTS = {
  instagram: /instagram\.com\/[A-Za-z0-9_.\-]+/i,
  facebook: /facebook\.com\/[A-Za-z0-9_.\-/]+/i,
  linkedin: /linkedin\.com\/(?:company|in)\/[A-Za-z0-9_.\-/]+/i,
  youtube: /youtube\.com\/[A-Za-z0-9_.@\-/]+/i,
  tiktok: /tiktok\.com\/@[A-Za-z0-9_.\-]+/i,
  xing: /xing\.com\/[A-Za-z0-9_.\-/]+/i,
};

const EMAIL_RE = /[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/g;
// Deutsche Telefonnummern in gängigen Schreibweisen.
const PHONE_RE = /(?:\+49|0)[\s\-/]?\(?\d{2,5}\)?[\s\-/]?\d{2,4}[\s\-/]?\d{2,6}/g;

// Offensichtlichen Müll bei E-Mails aussortieren (Tracking-/Beispiel-Adressen).
function cleanEmails(list) {
  const bad = /(example|sentry|wix|godaddy|\.png|\.jpg|\.gif|\.webp|@2x|placeholder)/i;
  return [...new Set(list.map((e) => e.toLowerCase()))]
    .filter((e) => !bad.test(e))
    .filter((e) => e.length < 60);
}

async function fetchText(url, ms = 8000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (pluszehn Lead-Engine)" },
    });
    if (!res.ok) return "";
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("html") && !ct.includes("text")) return "";
    return await res.text();
  } catch {
    return "";
  } finally {
    clearTimeout(t);
  }
}

function extractFrom(html) {
  const emails = cleanEmails(html.match(EMAIL_RE) || []);
  const phones = [...new Set((html.match(PHONE_RE) || []).map((p) => p.trim()))].slice(0, 3);
  const socials = {};
  for (const [k, re] of Object.entries(SOCIAL_HOSTS)) {
    const m = html.match(re);
    if (m) socials[k] = "https://" + m[0].replace(/^https?:\/\//, "");
  }
  return { emails, phones, socials };
}

function impressumCandidates(website) {
  try {
    const u = new URL(website);
    const base = `${u.protocol}//${u.host}`;
    return [website, `${base}/impressum`, `${base}/kontakt`, `${base}/impressum/`];
  } catch {
    return [website];
  }
}

// Reichert einen Lead an. Im Demo-Modus (kein echtes Website-Scraping nötig)
// nutzen wir die mitgelieferten Demo-Felder, damit alles offline funktioniert.
export async function enrichLead(lead) {
  if (lead.source === "demo") {
    return {
      emails: lead.email ? [lead.email] : [],
      phones: lead.phone ? [lead.phone] : [],
      socials: lead.socials || {},
      enriched: true,
    };
  }
  if (!lead.website) return { emails: [], phones: [], socials: {}, enriched: false };

  const merged = { emails: [], phones: [], socials: {} };
  for (const url of impressumCandidates(lead.website)) {
    const html = await fetchText(url);
    if (!html) continue;
    const got = extractFrom(html);
    merged.emails.push(...got.emails);
    merged.phones.push(...got.phones);
    Object.assign(merged.socials, got.socials);
    // Genug gefunden? Dann nicht weiter crawlen.
    if (merged.emails.length && Object.keys(merged.socials).length) break;
  }
  return {
    emails: cleanEmails(merged.emails),
    phones: [...new Set(merged.phones)].slice(0, 3),
    socials: merged.socials,
    enriched: true,
  };
}
