import mongoose from "mongoose";
const { Types } = mongoose;

// ---------------------------------------------------------------------------
// Users (6)
// ---------------------------------------------------------------------------
const u1 = new Types.ObjectId(); // Alice
const u2 = new Types.ObjectId(); // Bob
const u3 = new Types.ObjectId(); // Charlie
const u4 = new Types.ObjectId(); // Diana
const u5 = new Types.ObjectId(); // Ethan
const u6 = new Types.ObjectId(); // Fiona

// ---------------------------------------------------------------------------
// Threads (20) — all software engineering / development / deployment topics
// ---------------------------------------------------------------------------
const t1 = new Types.ObjectId(); // node: structuring a large Express app
const t2 = new Types.ObjectId(); // javascript: map vs forEach
const t3 = new Types.ObjectId(); // webdev: is SSR still worth it
const t4 = new Types.ObjectId(); // databases: UUID vs auto-increment IDs
const t5 = new Types.ObjectId(); // devops: speeding up CI
const t6 = new Types.ObjectId(); // docker: shrinking image size
const t7 = new Types.ObjectId(); // systemdesign: scalable URL shortener
const t8 = new Types.ObjectId(); // python: dependency management
const t9 = new Types.ObjectId(); // git: undoing a pushed commit
const t10 = new Types.ObjectId(); // security: storing passwords
const t11 = new Types.ObjectId(); // react: useEffect runs twice
const t12 = new Types.ObjectId(); // typescript: interface vs type
const t13 = new Types.ObjectId(); // kubernetes: is it overkill for a small app
const t14 = new Types.ObjectId(); // testing: unit vs integration
const t15 = new Types.ObjectId(); // systemdesign: monolith vs microservices
const t16 = new Types.ObjectId(); // typescript: worth it for small projects
const t17 = new Types.ObjectId(); // aws: cheap hosting for a side project
const t18 = new Types.ObjectId(); // devops: auto-running migrations on deploy
const t19 = new Types.ObjectId(); // webdev: keeping CSS maintainable
const t20 = new Types.ObjectId(); // python: is async worth it for a web API

export const users = [
  { _id: u1, name: "Alice", email: "alice@example.com", password: "password123" },
  { _id: u2, name: "Bob", email: "bob@example.com", password: "password123" },
  { _id: u3, name: "Charlie", email: "charlie@example.com", password: "password123" },
  { _id: u4, name: "Diana", email: "diana@example.com", password: "password123" },
  { _id: u5, name: "Ethan", email: "ethan@example.com", password: "password123" },
  { _id: u6, name: "Fiona", email: "fiona@example.com", password: "password123" },
];

export const subreddits = [
  { name: "javascript", description: "JavaScript language and ecosystem", author: u1 },
  { name: "node", description: "Node.js and backend JavaScript", author: u2 },
  { name: "webdev", description: "General web development topics", author: u3 },
  { name: "databases", description: "SQL, NoSQL, and data modeling", author: u4 },
  { name: "devops", description: "CI/CD, infrastructure, and deployment", author: u5 },
  { name: "docker", description: "Containers and image building", author: u6 },
  { name: "systemdesign", description: "Architecture and scaling discussions", author: u1 },
  { name: "python", description: "Python language and tooling", author: u2 },
  { name: "git", description: "Version control and workflows", author: u3 },
  { name: "security", description: "Application and infrastructure security", author: u4 },
  { name: "react", description: "React and frontend component design", author: u5 },
  { name: "typescript", description: "TypeScript types and tooling", author: u6 },
  { name: "kubernetes", description: "Container orchestration with k8s", author: u1 },
  { name: "testing", description: "Automated testing and QA", author: u2 },
  { name: "aws", description: "Cloud infrastructure on AWS", author: u3 },
];

export const threads = [
  {
    _id: t1,
    title: "How do I structure a large Express app?",
    content:
      "My routes file is getting huge. How do people organize a bigger Express project so it stays maintainable?",
    subredditName: "node",
    author: u1,
    upvotedBy: [u2, u3, u4, u5],
    downvotedBy: [],
  },
  {
    _id: t2,
    title: "When should I use `map` vs `forEach`?",
    content:
      "I see both used everywhere. Is there a real rule for when to reach for one over the other?",
    subredditName: "javascript",
    author: u2,
    upvotedBy: [u1, u3],
    downvotedBy: [u5],
  },
  {
    _id: t3,
    title: "Is server-side rendering still worth it in 2026?",
    content:
      "With how good client-side frameworks are now, is SSR still worth the extra complexity?",
    subredditName: "webdev",
    author: u3,
    upvotedBy: [u2, u4],
    downvotedBy: [u6],
  },
  {
    _id: t4,
    title: "Should I use UUIDs or auto-increment IDs for primary keys?",
    content:
      "Starting a new schema and can't decide between UUIDs and auto-increment integers for primary keys. What are the trade-offs?",
    subredditName: "databases",
    author: u4,
    upvotedBy: [u1, u5, u6],
    downvotedBy: [],
  },
  {
    _id: t5,
    title: "How do I speed up a slow CI pipeline?",
    content:
      "Our CI takes almost 20 minutes and it's killing our flow. Where do people usually find the biggest wins?",
    subredditName: "devops",
    author: u5,
    upvotedBy: [u2, u4, u6],
    downvotedBy: [],
  },
  {
    _id: t6,
    title: "Why is my Docker image so huge, and how do I shrink it?",
    content:
      "My Node image is over a gigabyte. What's the standard way to get the image size down?",
    subredditName: "docker",
    author: u6,
    upvotedBy: [u3, u5],
    downvotedBy: [u1],
  },
  {
    _id: t7,
    title: "How do I design a URL shortener that scales?",
    content:
      "Classic interview question, but I want to actually understand it. How would you design a URL shortener that handles heavy read traffic?",
    subredditName: "systemdesign",
    author: u1,
    upvotedBy: [u2, u3, u4, u5],
    downvotedBy: [],
  },
  {
    _id: t8,
    title: "What's the right way to manage Python dependencies in 2026?",
    content:
      "Between pip, venv, Poetry, and the newer tools, what's the current sane default for managing a Python project's dependencies?",
    subredditName: "python",
    author: u2,
    upvotedBy: [u1, u4],
    downvotedBy: [],
  },
  {
    _id: t9,
    title: "How do I undo a commit I already pushed?",
    content:
      "I pushed a bad commit to a shared branch. What's the safe way to undo it without breaking everyone else's history?",
    subredditName: "git",
    author: u3,
    upvotedBy: [u1, u4, u5, u6],
    downvotedBy: [],
  },
  {
    _id: t10,
    title: "How should I store user passwords securely?",
    content:
      "Building auth from scratch for a learning project. What's the right way to actually store passwords?",
    subredditName: "security",
    author: u4,
    upvotedBy: [u2, u3, u5, u6],
    downvotedBy: [],
  },
  {
    _id: t11,
    title: "useEffect runs twice in development — is that a bug?",
    content:
      "My useEffect fires twice on mount in dev and it's confusing. Is something wrong with my code?",
    subredditName: "react",
    author: u5,
    upvotedBy: [u1, u6],
    downvotedBy: [u4],
  },
  {
    _id: t12,
    title: "What's the difference between `interface` and `type` in TypeScript?",
    content:
      "When should I use an interface versus a type alias in TypeScript? They seem to overlap a lot.",
    subredditName: "typescript",
    author: u6,
    upvotedBy: [u4, u5],
    downvotedBy: [],
  },
  {
    _id: t13,
    title: "Do I actually need Kubernetes for a small app?",
    content:
      "Everyone reaches for Kubernetes, but for a small app with modest traffic, is it overkill?",
    subredditName: "kubernetes",
    author: u1,
    upvotedBy: [u2, u3, u4],
    downvotedBy: [u5],
  },
  {
    _id: t14,
    title: "How do I decide what to unit test vs integration test?",
    content:
      "I never know where to draw the line between unit and integration tests. How do you decide?",
    subredditName: "testing",
    author: u2,
    upvotedBy: [u3, u4],
    downvotedBy: [],
  },
  {
    _id: t15,
    title: "Monolith or microservices for a new product?",
    content:
      "Greenfield product, small team. Should we start with a monolith or go microservices from day one?",
    subredditName: "systemdesign",
    author: u3,
    upvotedBy: [u2, u4, u5, u6],
    downvotedBy: [],
  },
  {
    _id: t16,
    title: "Is TypeScript worth it for small projects?",
    content:
      "I get TypeScript for big codebases, but is it overkill for small side projects?",
    subredditName: "typescript",
    author: u4,
    upvotedBy: [u1, u5],
    downvotedBy: [u3],
  },
  {
    _id: t17,
    title: "What's the cheapest way to host a small side project on AWS?",
    content:
      "I have a small full-stack side project. What's the most cost-effective way to host it on AWS without surprise bills?",
    subredditName: "aws",
    author: u5,
    upvotedBy: [u1, u2, u6],
    downvotedBy: [],
  },
  {
    _id: t18,
    title: "Should I run database migrations automatically on deploy?",
    content:
      "Is it a good idea to run DB migrations automatically as part of the deploy, or should that be a separate manual step?",
    subredditName: "devops",
    author: u6,
    upvotedBy: [u1, u5],
    downvotedBy: [u3],
  },
  {
    _id: t19,
    title: "How do I stop my CSS from becoming a mess?",
    content:
      "Every project my CSS slowly turns into spaghetti. How do you keep styles under control?",
    subredditName: "webdev",
    author: u1,
    upvotedBy: [u2, u4],
    downvotedBy: [],
  },
  {
    _id: t20,
    title: "Is async actually worth it in Python for a web API?",
    content:
      "Does async Python meaningfully help a typical web API, or is it just added complexity for little gain?",
    subredditName: "python",
    author: u2,
    upvotedBy: [u1, u3, u4],
    downvotedBy: [u6],
  },
];

export const comments = [
  // t1 — Express structure (5 answers)
  { thread: t1, user: u2, content: "Split by feature: routes, controllers, services, and models per resource. It scales far better than grouping by file type.", upvotedBy: [u1, u3, u4], downvotedBy: [] },
  { thread: t1, user: u3, content: "Keep business logic in services and out of controllers. Controllers should just read the request and call a service.", upvotedBy: [u1], downvotedBy: [] },
  { thread: t1, user: u4, content: "Add a centralized error handler so you're not wrapping every route in try/catch.", upvotedBy: [u5], downvotedBy: [] },
  { thread: t1, user: u5, content: "Use a small config layer for env vars instead of reading process.env all over the codebase.", upvotedBy: [], downvotedBy: [] },
  { thread: t1, user: u6, content: "Write integration tests early. They catch the wiring bugs that unit tests quietly miss.", upvotedBy: [u1, u2], downvotedBy: [] },

  // t2 — map vs forEach (3)
  { thread: t2, user: u1, content: "Use map when you want a new array back, forEach when you only care about side effects.", upvotedBy: [u3, u4], downvotedBy: [] },
  { thread: t2, user: u4, content: "If you're ignoring the return value, map is misleading. Reach for forEach or a plain for...of.", upvotedBy: [u2], downvotedBy: [] },
  { thread: t2, user: u5, content: "for...of is often clearer than both, especially when you need to await inside the loop.", upvotedBy: [], downvotedBy: [u1] },

  // t3 — SSR (4)
  { thread: t3, user: u1, content: "For content and SEO-heavy sites, yes. For a logged-in dashboard, usually not worth the complexity.", upvotedBy: [u2, u6], downvotedBy: [] },
  { thread: t3, user: u2, content: "Depends on the framework. With modern meta-frameworks SSR is almost free, so the trade-off changed.", upvotedBy: [u3], downvotedBy: [] },
  { thread: t3, user: u5, content: "We render the landing pages on the server and keep the app itself an SPA. Best of both.", upvotedBy: [u1], downvotedBy: [] },
  { thread: t3, user: u6, content: "Don't add SSR just because it's trendy. Measure your real load times first.", upvotedBy: [u4], downvotedBy: [u2] },

  // t4 — UUID vs auto-increment (2)
  { thread: t4, user: u3, content: "Auto-increment integers are smaller and faster to index, but UUIDs let you generate IDs across services without coordination.", upvotedBy: [u1, u5], downvotedBy: [] },
  { thread: t4, user: u6, content: "If you expose IDs in URLs, UUIDs stop people from guessing or enumerating your records.", upvotedBy: [u2], downvotedBy: [] },

  // t5 — speeding up CI (3)
  { thread: t5, user: u1, content: "Cache your dependencies between runs. Reinstalling everything on each build is usually the single biggest cost.", upvotedBy: [u4, u6], downvotedBy: [] },
  { thread: t5, user: u2, content: "Run independent jobs in parallel instead of one long sequential pipeline.", upvotedBy: [u5], downvotedBy: [] },
  { thread: t5, user: u4, content: "Run the full suite on main, and a faster subset on feature branches so day-to-day pushes stay quick.", upvotedBy: [], downvotedBy: [] },

  // t6 — Docker image size (2)
  { thread: t6, user: u1, content: "Use a multi-stage build so the final image ships only the runtime, not your build tools.", upvotedBy: [u3, u5], downvotedBy: [] },
  { thread: t6, user: u4, content: "Switch to a slim or alpine base and add a .dockerignore so you're not copying node_modules and .git into the image.", upvotedBy: [u6], downvotedBy: [] },

  // t7 — URL shortener design (5)
  { thread: t7, user: u2, content: "Generate a short key (base62 of a counter, or a hash) and store the key-to-URL mapping in a fast key-value store.", upvotedBy: [u1, u3, u5], downvotedBy: [] },
  { thread: t7, user: u3, content: "Reads massively outnumber writes, so cache aggressively. Most lookups should never touch the database.", upvotedBy: [u4], downvotedBy: [] },
  { thread: t7, user: u4, content: "Put the mapping behind a CDN or edge cache since the data is basically immutable once a link is created.", upvotedBy: [u6], downvotedBy: [] },
  { thread: t7, user: u5, content: "Watch out for key collisions if you hash. A counter encoded in base62 sidesteps that entirely.", upvotedBy: [], downvotedBy: [] },
  { thread: t7, user: u6, content: "Don't forget analytics and link expiry. Those requirements shape the storage design more than the redirect itself.", upvotedBy: [u2], downvotedBy: [] },

  // t8 — Python dependencies (3)
  { thread: t8, user: u1, content: "Always use a virtual environment per project. Never install project deps into the system Python.", upvotedBy: [u3, u4], downvotedBy: [] },
  { thread: t8, user: u3, content: "Pin versions in a lockfile so CI and teammates get the exact same dependency tree you tested against.", upvotedBy: [u5], downvotedBy: [] },
  { thread: t8, user: u6, content: "Pick one tool and commit to it. Mixing pip and a manager halfway is where the pain comes from.", upvotedBy: [u2], downvotedBy: [] },

  // t9 — undo pushed commit (2)
  { thread: t9, user: u2, content: "Use git revert. It creates a new commit that undoes the changes without rewriting shared history.", upvotedBy: [u1, u4, u5], downvotedBy: [] },
  { thread: t9, user: u4, content: "Save force-push and reset for branches only you work on. On a shared branch, revert is the friendly option.", upvotedBy: [u3], downvotedBy: [] },

  // t10 — storing passwords (5)
  { thread: t10, user: u1, content: "Never store plaintext. Hash with a slow, salted algorithm like bcrypt, scrypt, or Argon2.", upvotedBy: [u2, u3], downvotedBy: [] },
  { thread: t10, user: u2, content: "bcrypt salts each password for you, so you don't have to manage salts separately.", upvotedBy: [u4], downvotedBy: [] },
  { thread: t10, user: u3, content: "Never roll your own crypto or use a plain SHA-256. Fast hashes are exactly what you don't want here.", upvotedBy: [u5, u6], downvotedBy: [] },
  { thread: t10, user: u5, content: "Set a sensible work factor and bump it over time as hardware gets faster.", upvotedBy: [], downvotedBy: [] },
  { thread: t10, user: u6, content: "For anything real, use a vetted auth library or provider instead of hand-rolling it.", upvotedBy: [u1], downvotedBy: [] },

  // t11 — useEffect twice (3)
  { thread: t11, user: u2, content: "That's Strict Mode in development intentionally double-invoking effects to surface bugs. It won't happen in production.", upvotedBy: [u1, u6], downvotedBy: [] },
  { thread: t11, user: u4, content: "It's a signal your effect isn't idempotent. Make sure you clean up properly in the returned function.", upvotedBy: [u3], downvotedBy: [] },
  { thread: t11, user: u6, content: "Add the cleanup function and it'll behave. The double-run exists to catch exactly that missing cleanup.", upvotedBy: [], downvotedBy: [] },

  // t12 — interface vs type (2)
  { thread: t12, user: u1, content: "Interfaces merge and extend cleanly, which is handy for public APIs. Type aliases do unions and tuples that interfaces can't.", upvotedBy: [u4, u5], downvotedBy: [] },
  { thread: t12, user: u5, content: "For plain object shapes they're mostly interchangeable. Pick one convention per codebase and stay consistent.", upvotedBy: [u6], downvotedBy: [] },

  // t13 — Kubernetes overkill (4)
  { thread: t13, user: u2, content: "For a small app, almost certainly overkill. A single container on a managed platform is simpler and cheaper.", upvotedBy: [u1, u3], downvotedBy: [] },
  { thread: t13, user: u3, content: "K8s shines when you have many services and need self-healing and autoscaling. One app rarely needs that.", upvotedBy: [u4], downvotedBy: [] },
  { thread: t13, user: u4, content: "The operational overhead is real. Early on you'll spend more time on the cluster than on the product.", upvotedBy: [u5], downvotedBy: [] },
  { thread: t13, user: u6, content: "Start simple, and only move to Kubernetes when you actually feel the pain it solves.", upvotedBy: [u1, u2], downvotedBy: [] },

  // t14 — unit vs integration (3)
  { thread: t14, user: u1, content: "Unit test pure logic with lots of branches. Integration test the wiring between modules and the database.", upvotedBy: [u3, u4], downvotedBy: [] },
  { thread: t14, user: u3, content: "If a test needs heavy mocking just to exist, that's often a hint it should be an integration test instead.", upvotedBy: [u5], downvotedBy: [] },
  { thread: t14, user: u5, content: "Cover the critical paths end to end, then unit test the tricky edge cases underneath. Don't chase 100% coverage.", upvotedBy: [], downvotedBy: [] },

  // t15 — monolith vs microservices (5)
  { thread: t15, user: u1, content: "Start with a monolith. You don't know your boundaries yet, and microservices lock in the wrong ones early.", upvotedBy: [u2, u4], downvotedBy: [] },
  { thread: t15, user: u2, content: "Microservices solve an organizational scaling problem, not a code problem. A small team rarely has that problem yet.", upvotedBy: [u3, u5], downvotedBy: [] },
  { thread: t15, user: u4, content: "A well-structured modular monolith gives you most of the benefits without the distributed-systems tax.", upvotedBy: [u6], downvotedBy: [] },
  { thread: t15, user: u5, content: "If you do split later, the clean module boundaries from the monolith are what make extraction painless.", upvotedBy: [], downvotedBy: [] },
  { thread: t15, user: u6, content: "The network is the hard part. Every service boundary you add is a new place for latency and failures.", upvotedBy: [u1], downvotedBy: [] },

  // t16 — TypeScript on small projects (2)
  { thread: t16, user: u2, content: "Even on small projects the autocomplete and safe refactors pay for themselves fast.", upvotedBy: [u1, u5], downvotedBy: [] },
  { thread: t16, user: u3, content: "For a throwaway script, no. For anything you'll maintain past a month, yes.", upvotedBy: [u4], downvotedBy: [u1] },

  // t17 — cheap AWS hosting (1)
  { thread: t17, user: u4, content: "For something small, serverless (Lambda plus API Gateway) with static assets on S3 behind CloudFront is hard to beat — it scales to near-zero cost when idle.", upvotedBy: [u1, u2, u6], downvotedBy: [] },

  // t18 — auto migrations on deploy (3)
  { thread: t18, user: u1, content: "Automate them, but keep migrations backward-compatible so the old and new app versions both work during the rollout.", upvotedBy: [u5, u6], downvotedBy: [] },
  { thread: t18, user: u3, content: "Be careful with destructive migrations on auto-deploy. Expand-and-contract across separate releases is much safer.", upvotedBy: [u2], downvotedBy: [u6] },
  { thread: t18, user: u5, content: "Run them as a distinct step before the new version takes traffic, not inside app startup where parallel instances race.", upvotedBy: [], downvotedBy: [] },

  // t19 — CSS mess (2)
  { thread: t19, user: u2, content: "Pick a convention (BEM, utility classes, whatever) and actually stick to it.", upvotedBy: [u1, u4], downvotedBy: [] },
  { thread: t19, user: u4, content: "Co-locate styles with components and delete aggressively. Dead CSS is the real enemy.", upvotedBy: [u3], downvotedBy: [] },

  // t20 — async Python (3)
  { thread: t20, user: u1, content: "It helps when you're I/O-bound — lots of waiting on the database or external calls. For CPU-bound work it won't save you.", upvotedBy: [u3, u4], downvotedBy: [] },
  { thread: t20, user: u3, content: "Going async is fairly all-or-nothing. One blocking call stalls the event loop, so it's a real commitment.", upvotedBy: [u5], downvotedBy: [] },
  { thread: t20, user: u6, content: "Measure first. A sync app with a few workers handles a surprising amount of traffic before async pays off.", upvotedBy: [u1, u2], downvotedBy: [] },
];
