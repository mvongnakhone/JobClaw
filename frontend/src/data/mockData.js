export function isProfileComplete(p) {
  const prefs = p.job_prefs || {};
  const hasActivity = (
    (p.experience?.length  >= 1) ||
    (p.projects?.length    >= 1) ||
    (p.volunteering?.length >= 1)
  );
  return !!(
    p.name?.trim() &&
    p.phone?.trim() &&
    p.location?.trim() &&
    prefs.roles?.trim() &&
    hasActivity
  );
}

export const TICKER = [
  "📈 94% match at Stripe — your resume is ready",
  "🆕 3 new roles match your profile today",
  "⚡ Linear posted Group PM just 1 day ago",
  "🎯 GitHub hiring Senior PM, Dev UX — 87% match",
  "📬 Notion — application viewed by recruiter",
  "💡 Add your summary to boost match score by 12%",
  "🚀 Twilio looking for PM, APIs — 91% fit",
];

export const TODAY_MATCHES = [
  { id:1, logo:"💳", role:"Senior Product Manager", company:"Stripe",  location:"Remote", match:96, salary:"$170–210k", tags:["Payments","API"],     posted:"2d ago", isNew:true },
  { id:2, logo:"📝", role:"Product Manager II",     company:"Notion",  location:"SF, CA", match:88, salary:"$140–175k", tags:["Growth","SaaS"],      posted:"4d ago", isNew:true },
  { id:3, logo:"⚡", role:"Group PM, Growth",       company:"Linear",  location:"Remote", match:84, salary:"$160–195k", tags:["Dev Tools","Remote"], posted:"1d ago", isNew:true },
];

export const READY_JOBS = [
  { id:4, logo:"📞", role:"PM, API Platform",  company:"Twilio", location:"Remote", match:91, salary:"$155–185k" },
  { id:5, logo:"🐙", role:"Senior PM, Dev UX", company:"GitHub", location:"Remote", match:87, salary:"$160–200k" },
];

export const INIT_PROFILE = {
  email:        "",
  name:         "",
  phone:        "",
  location:     "",
  linkedin_url: "",
  github_url:   "",
  headline:     "",
  portfolio_url:"",
  twitter_url:  "",
  education:    [],
  experience:   [],
  projects:     [],
  skills:       [],
  job_prefs: {
    roles:        "",
    work_type:    "",
    job_type:     "",
    salary_min:   "",
    locations:    "",
    industries:   "",
    open_to:      "",
    availability: "",
  },
  volunteering: [],
};

/* Sample data — uncomment to restore for UI testing
export const INIT_PROFILE = {
  id:           "uuid-placeholder",
  email:        "jane@smith.dev",
  name:         "Jane Smith",
  phone:        "(415) 555-0192",
  location:     "San Francisco, CA",
  linkedin_url: "linkedin.com/in/janesmith",
  github_url:   "github.com/janesmith",
  created_at:   "2025-01-15T00:00:00Z",
  education: [
    { id:1, degree:"BS Computer Science", school:"UC Berkeley", start:"2015", end:"2019", gpa:"3.8", notes:"Graduated with Honors" },
  ],
  experience: [
    { id:1, title:"Senior Product Manager", company:"Acme Corp", type:"Full-time", start:"Jan 2022", end:"Present",  location:"SF, CA", desc:"Led 0→1 launch of API platform serving 50k developers. Grew developer signups 3× through targeted onboarding redesign. Managed roadmap across 4 engineering teams." },
    { id:2, title:"Product Manager II",     company:"Beta Inc",  type:"Full-time", start:"Mar 2019", end:"Dec 2021", location:"Remote", desc:"Shipped payments v2, reducing fraud by 34%. Ran 40+ A/B experiments. Grew revenue by $8M ARR." },
  ],
  projects: [
    { id:1, name:"DevDash", url:"github.com/janesmith/devdash", desc:"Open-source developer metrics dashboard. 1.2k GitHub stars.", tags:["React","Python","OSS"] },
  ],
  skills: ["Product Strategy","Roadmapping","SQL","Figma","A/B Testing","Stakeholder Management","Go-to-Market","User Research","API Design"],
  headline:      "Senior Product Manager · Developer Tools & APIs",
  portfolio_url: "",
  twitter_url:   "",
  job_prefs: {
    roles:        "Senior PM, Group PM",
    work_type:    "Remote / Hybrid",
    job_type:     "Full-time",
    salary_min:   "$150k",
    locations:    "SF Bay Area, Remote",
    industries:   "Developer Tools, Fintech, SaaS",
    open_to:      "Open to relocation",
    availability: "2 weeks notice",
  },
  volunteering: [
    { id:1, role:"Mentor", org:"Out in Tech", start:"Jan 2023", end:"Present", desc:"Mentoring LGBTQ+ professionals transitioning into tech product roles." },
  ],
};
*/
