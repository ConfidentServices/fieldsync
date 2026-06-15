# DexFuel Complete Design Brief — Final
**Confidential Working Product/Design Specification**
**Council Review: Growth/Conversion · UX · Compliance · Product Economics · Engineering · Brand · Ad Network Strategy**
**Version 2.0 — June 2026**

---

## 1. Executive Summary

DexFuel is a tokenized participation platform — the infrastructure layer for the Participation Economy. Users show up daily, complete verified actions, earn Joules, and qualify for variable daily reward allocations. Creators launch tokenized communities. Businesses run verified participation campaigns. Communities coordinate through Grids.

**The one-line brief:** Show up. Do things. Get paid.

**Market category:** Social/Entertainment/Community (for ad networks) | Tokenized Participation (for users/creators/investors)

**Revenue model:**
1. Trading fees (2%) on all bonding curve activity
2. Rewarded video (AppLovin MAX — target $15-25 eCPM)
3. Premium CPA campaigns (Adjoe, Lootably)
4. Creator task deposits (platform takes 10%)
5. Shop commissions (10%)

**Critical design mandate:** This must NOT feel like a crypto rewards app, a memecoin casino, or a spammy offerwall. It must feel like a premium social/entertainment platform where participation creates real economic value.

---

## 2. Strategic Positioning — The Participation Economy

### Core Thesis
Most platforms extract value from their communities. Attention, engagement, and momentum flow upward to platform owners and advertisers while the people creating that value receive nothing.

DexFuel inverts this. Every verified action — watching content, completing a task, buying into a launch, posting for a creator, helping a Grid hit its target — creates measurable economic value. That value flows back to participants through the daily reward cycle.

We're not building a rewards app. We're building the first Participation Economy — a market infrastructure where doing things is the asset.

### Four Audiences, Four Value Props

**For Users:**
You participate daily — tasks, launches, grids, social actions. You earn Joules for every verified action. Joules determine your share of the daily reward pool. Show up consistently, participate across more actions, and your estimated daily reward grows.

**For Creators:**
Launch your tokenized community in minutes. Every time someone buys or sells your token, you earn. Every time your community participates in tasks, your project gains momentum. Build a real economy around your audience, not just a follower count.

**For Businesses & Brands:**
Run verified participation campaigns that drive measurable action — not impressions. Your campaign completes when users actually watch, learn, post, refer, or activate. Pay for verified results, not estimated reach.

**For Ad Networks & Partners:**
DexFuel delivers 3-5 daily sessions from verified daily-active participants. Rewarded video placements sit at peak attention moments — between task completions, before high-value unlocks. Premium brand-safe inventory. Social/Entertainment category. $15-25 eCPM target.

### Competitive Differentiation

| DexFuel | Offerwall Networks (Tapjoy, CPALead) |
|---------|--------------------------------------|
| Verified daily participators | Install farmers and click farms |
| 3-5 genuine sessions/day | One-time action |
| Brand-safe Social/Entertainment | Low-quality CPI traffic |
| On-chain verification layer | Pixel/postback fraud risk |
| Premium eCPM ($15-25) | Commodity CPI ($0.50-2) |
| Habit-forming product design | Transactional churn |

| DexFuel | Pump.fun / Memecoins |
|---------|---------------------|
| Community participation creates value | Pure speculation |
| Tasks, grids, creators, businesses | Buy/sell only |
| Reward cycle tied to verified activity | Reward tied to price movement |
| Compliance-first language | No compliance guardrails |

| DexFuel | Web2 Loyalty Programs |
|---------|----------------------|
| On-chain, transparent, traceable | Points that expire with no audit trail |
| Daily market activity | Quarterly redemption cycles |
| Creator economy layer | Corporate-controlled rewards |
| Real off-ramp via SOL | Gift cards and partner offers |

---

## 3. Language & Compliance Rules

### Use / Avoid Table

| ✅ Use This | ❌ Never Use This |
|------------|-----------------|
| Estimated daily reward | Guaranteed payout |
| Variable reward allocation | Fixed income |
| Participation-based | Passive income |
| Joules measure participation share | Joules are money |
| Receive daily rewards based on verified participation | Get paid guaranteed daily |
| Reward allocation | APY, yield, return |
| Participation tier / contribution weighting | Staking rewards |
| Direct on-chain access | Investment opportunity |
| Creator benefits from project activity | Guaranteed creator income |
| Estimated, variable, subject to platform activity | Fixed, guaranteed, promised |

### Compliance Guardrails (Hard Rules)
- Every reward mention must be preceded by "estimated" or "variable"
- Joules must always be described as "participation units" — never as money, tokens, or tradable value
- No "APY", "yield", "staking", "passive", "guaranteed", "fixed return" anywhere on the platform
- Age attestation (18+) required before wallet creation
- OFAC wallet screening on every new wallet
- Rewards page must include: "Rewards are variable and not guaranteed. Joules are allocation units used to determine participation share. They have no monetary value."
- DexFuel is not an investment platform. No forward-looking return projections.

### Voice Guide

**Tone:** Direct. Energetic. Real.

**Write like you're talking to someone who's smart, skeptical, and short on time. Say what it does. Why it matters. What they should do next.**

**Examples:**

❌ "DexFuel offers users the opportunity to potentially receive variable compensation through a tokenized participation framework"

✅ "Participate daily. Earn Joules. Qualify for your share of the daily reward pool."

---

❌ "Our platform leverages blockchain technology to enable transparent participation-based reward distribution"

✅ "Every action is verified on-chain. You see exactly what you earned and why."

---

❌ "Creators can monetize their communities through DexFuel's comprehensive tokenization infrastructure"

✅ "Every buy and sell on your token earns you a fee. Build your community. Let it work for you."

---

## 4. Design Style & Brand Direction

**Visual tone:** Premium. Fast. Alive. Transparent. Confident. Clean. Social.

**What it should feel like:** Linear's clarity + Discord's energy + Coinbase's trust + TradingView's live-data feel + a hint of Pump.fun's momentum (without the chaos)

**What to avoid:** Casino neon, cluttered DeFi dashboards, reward-app cheapness, meme-heavy graphics, anything that looks like a browser extension offering gift cards

**Color direction:**
- Base: Deep charcoal / near-black (`#0D0D0F`)
- Energy: Electric orange-yellow (`#F5A623`) — DexFuel's signature
- Momentum: Bright green (`#22C55E`)
- Trust: Blue-cyan (`#0EA5E9`)
- Text: High-contrast white (`#F8FAFC`)
- Danger/alert: Amber (`#EF4444`)

**Typography:** Bold geometric headlines (Inter or Neue Haas), highly legible body copy, short sections, generous whitespace, zero unnecessary jargon

**Motion:** Live counters hydrating after load, momentum meters, soft chart transitions, social feed scrolling. No heavy CSS animations. No loading screens. Performance > visual complexity.

---

## 5. Performance Requirements

- **LCP:** Under 2.5s on mobile 4G
- **TTI:** Under 4s
- **Marketing pages:** Static/ISR via Next.js — zero blocking scripts above fold
- **Hero:** No autoplay video. Use animated SVG mockup or CSS motion. Lazy-load live widgets.
- **Dashboard:** Progressive load — core status first, then feed, then charts
- **Images:** WebP/AVIF, responsive srcset, compressed
- **Fonts:** font-display: swap, preload critical fonts
- **Third-party scripts:** Defer analytics, lazy-load chat widget, async ad SDK
- **Mobile:** Sticky bottom CTA, one-column cards, no horizontal scroll tables, progressive disclosure for complexity

---

## 6. Public Website — All Pages

### Homepage

**Headline:** Get Rewarded Daily for Participating

**Subheadline:** Launch projects. Complete tasks. Activate communities. Every verified action earns Joules — your participation score that determines your share of the daily reward pool.

**Above-fold live signals (lazy-loaded after initial render):**
- Today's Reward Pool: `$[LIVE]`
- Active Launches: `[N]`
- Active Participants: `[N]`
- Trending: `$[TICKER]` ↑[%]

**CTAs:** [Start Participating] [Launch a Project]

**Problem section:**
> Most platforms profit from your attention. You create the engagement. They capture the value. Communities that drive momentum for creators, brands, and launches get nothing.

**Solution section:**
> DexFuel turns participation into a measurable economic layer. Every action you take — verified on-chain — earns Joules. Joules determine your share of the daily reward pool. Show up. Do things. Get paid.

**How It Works (4 steps):**
1. **Launch or Join** — Create your tokenized community or join one that's building momentum
2. **Participate** — Complete tasks, watch launches, support your Grid, run social campaigns
3. **Earn Joules** — Every verified action adds to your participation score
4. **Receive Your Daily Reward** — Joules determine your estimated share of the variable daily reward allocation

**For Creators section:**
> Launch your tokenized community. Every buy and sell on your channel token generates creator fees directly to you. Set up participation campaigns. Every completed task builds momentum. The economy lives on DexFuel — transparent, permanent, and always earning.

> Building something bigger? DexFuel also supports full project launches with bonding curve graduation paths to decentralized exchanges.

> [Launch a Channel] [Launch a Project →]

**For Businesses & Brands section:**
> Run verified participation campaigns — not impression buys. Users watch your content, complete education tasks, post for your brand, refer their network. You pay for verified completion, not estimated reach.
> [Explore Business Campaigns →]

**Tokenize Anything section:**
> DexFuel is built for creators, brands, communities, events, loyalty programs, sports teams, schools, podcasters, fitness coaches, and anyone building an audience worth monetizing. If people show up for it, DexFuel can tokenize it.

**Direct Market Access section:**
> All trading happens through transparent on-chain contracts. No platform custody. No hidden spreads. No intermediaries. You see exactly what's happening with every transaction.

**Grids section:**
> Join a Grid — a coordinated community working toward shared participation goals. Grids earn collective rewards when members hit thresholds together. Find your people. Build momentum. Get rewarded.

**Trust & Safety section:**
> Non-custodial. OFAC-screened. Anti-abuse protections. Transparent reward rules. No hidden allocation mechanics. You can verify everything.

**Compliance note (footer/bottom of page):**
> DexFuel is not an investment platform. Daily reward allocations are variable and not guaranteed. Joules are participation units used to calculate your share of platform rewards. They have no monetary value. Participation does not guarantee earnings.

**Final CTA section:**
> Start participating today. Or launch something. Or join a community. Or build one. The Participation Economy is open.
> [Start Participating] [Launch a Project]

---

### How It Works Page

**Headline:** The Participation Economy — How It Works

**Subheadline:** Three things happen on DexFuel every day: launches go live, tasks get verified, and rewards get distributed. Here's how you fit in.

**Section: The Daily Cycle**
Every 24 hours, DexFuel runs a participation cycle:
1. The reward pool opens
2. Users complete verified tasks across the platform
3. Joules accumulate based on verified participation
4. At cycle close, each qualified user receives their estimated reward allocation based on their Joules share
5. The cycle resets. Do it again tomorrow.

**Section: Joules Explained**
Joules are your participation score. Every verified action earns Joules — some actions earn more than others based on value to the platform. At cycle close, your Joules determine what percentage of the total reward pool you qualify for. Joules are not money. They are not tokens. They are not tradable. They are how DexFuel measures your participation share.

**Section: Tasks Explained**
Tasks are verified actions. Watch a creator's video. Post for a brand on social. Complete an education module. Buy into a launch. Help your Grid hit its threshold. Each task is validated — some immediately, some after a delay — before Joules are credited.

**Section: Qualification**
You must meet minimum requirements to qualify for the daily reward pool. Requirements include: minimum task completions, account standing, and DEXF hold tier. You can see your qualification status at any time. Missing a day doesn't reset your tier — it just means you miss that cycle's allocation.

**Section: Launches**
DexFuel has two types of launched projects, and they work differently:

**Channel Tokens (the majority of use cases)** — These are community currencies for creators, brands, sports teams, podcasters, and anyone building a community economy. They live permanently on DexFuel's bonding curve. They are not designed to graduate to external exchanges. Trading stays on DexFuel. Creator fees flow back to the creator on every buy and sell. The bonding curve is the market — transparent, on-chain, and always active.

**Project Launches (graduation-eligible)** — These are full tokenized project launches designed for protocols, products, and ventures that want to build beyond DexFuel's ecosystem. They start on the bonding curve and can graduate to Raydium or other decentralized exchanges once they hit liquidity thresholds. These follow the standard launch momentum model.

Both types earn Joules for participation. Both generate trading fees. The key difference is destination: Channel Tokens stay home on DexFuel; Project Launches can grow beyond it.

For users, early participation in either matters — buying early means lower prices on the bonding curve. Running tasks, posting social, joining the launch Grid — all contribute to momentum and earn Joules.

**Section: Grids**
Grids are coordinated communities. Join a Grid and work toward collective participation targets — buyer counts, task completions, social reach. Grids that hit their thresholds earn bonus rewards distributed among members. Grid captains earn a portion of their Grid's collective reward.

---

### For Creators Page

**Headline:** Your Community Already Creates Value. Now It Creates Revenue.

**Subheadline:** Launch your channel token. Build participation campaigns. Earn fees from every transaction your community generates. The economy lives on DexFuel — always on, always earning.

**Section: Two Ways to Launch on DexFuel**

**Channel Token — For Creators, Communities, and Brands**
This is the primary model. Your channel token lives permanently on DexFuel's bonding curve. It’s the currency of your community economy. Every buy and sell generates creator fees. It doesn’t graduate to external exchanges — it doesn’t need to. DexFuel is its home market. Fitness coaches, podcasters, sports teams, local brands, online communities — this is your path.

**Project Launch — For Protocols and Products**
Building something beyond a community economy? Project launches start on the DexFuel bonding curve and can graduate to Raydium and other decentralized exchanges once they hit liquidity thresholds. For protocols, products, and ventures with exchange-scale ambitions.

**Section: Launch Your Channel (most creators start here)**
In minutes, you can have:
- Your own channel token on a transparent bonding curve
- A participation campaign that rewards your most active followers
- Creator fees flowing to you on every buy and sell — forever
- Tasks that drive real verified engagement from your community

**Section: Creator Economics**
Every buy and sell on your token generates a creator fee that goes directly to you. The more active your community, the more you earn. There's no cap, no delay, and no platform cut — it's your community's economic activity, flowing directly to you.

**Section: Creator Tools**
- Task builder: Create custom participation challenges for your community
- Social campaigns: Have your community post, share, and amplify your content
- Launch windows: Schedule live launch events with countdown momentum
- Grid creation: Build a coordinated community group with collective targets
- Dashboard: See holders, volume, creator fees, active participants, social reach in real time

**Section: Creator Verticals (Channel Token model — your community stays on DexFuel)**
Fitness coaches · Finance creators · Food/recipe creators · Gaming streamers · Musicians · Podcasters · Sports teams · Fashion brands · Local businesses · Event organizers · Schools & educators · Nonprofits

*For all of these, the channel token is the right product: permanent bonding curve, creator fees on every trade, community participation campaigns, no need for exchange graduation.*

**Section: Project Launch Verticals (graduation-eligible)**
Protocols · DeFi products · Web3 applications · Games with on-chain economies · Infrastructure projects

**Section: Creator Success Formula**
1. Launch your token
2. Invite your first 100 community members
3. Create your first participation task
4. Activate a Grid for your most dedicated fans
5. Run a social amplification campaign
6. Watch the economics build momentum

**CTA:** [Launch a Project →]

---

### For Businesses & Brands Page

**Headline:** Verified Participation. Not Estimated Reach.

**Subheadline:** DexFuel participation campaigns drive measurable action — not impressions. Pay for verified completions: video watches, education tasks, social posts, referrals, activations.

**Section: What Is a Verified Participation Campaign?**
Traditional advertising buys estimated reach. DexFuel sells verified action. Your campaign runs until users have actually completed the specified action — watched your full video, answered quiz questions about your product, posted for your brand from their verified social accounts, referred active new users to your platform.

You know exactly what happened. It's verifiable. It's on-chain.

**Section: Campaign Types**
- **Product Education:** Users learn about your product through structured tasks. Comprehension verified.
- **Social Amplification:** Users post, share, and comment using AI-assisted content. Reach and persistence tracked.
- **Brand Activation:** Users complete a specific action — download, sign up, visit, try.
- **Loyalty & Referral:** Users refer verified active participants to your platform.
- **Launch Campaigns:** Get early traction for a new product, app, or initiative.
- **Surveys & Feedback:** Collect verified responses from your target demographic.

**Section: Why DexFuel Over Traditional Channels**
> "Our users participate because it's worth their time. That means they're paying attention. A DexFuel task completion represents genuine engagement — not an accidental click or a bot impression."

**Section: Who Uses DexFuel**
App developers · Consumer brands · Gaming companies · Financial services · Entertainment platforms · E-commerce brands · Web3 protocols · Content platforms

**CTA:** [Talk to Our Team →] [See Campaign Pricing →]

---

### /advertise — Premium Ad Network Partner Page

**Headline:** Reach Verified Daily Active Participants. At Scale.

**Subheadline:** DexFuel delivers premium ad inventory inside a high-engagement Social/Entertainment platform. Our users return 3-5 times daily to participate, earn, and connect. Your brand message lands at peak attention moments.

**Above-fold stats:**
- **3-5** daily sessions per active user
- **8+ minutes** average session length
- **92%** rewarded video completion rate
- **Brand-safe** Social/Entertainment category

**Ad Formats:**

### Rewarded Video — $15-25 eCPM (Primary Inventory)
30-second non-skippable. User-initiated. Placed between task completions and before high-value unlock moments. Users actively choose to watch to boost their Joules — this is peak-attention inventory.

### Interstitial — $8-12 eCPM
Full-screen between natural session breaks. Non-intrusive placement between qualification milestone completions.

### Banner — $2-4 eCPM
Persistent bottom banner during task browsing and project discovery.

### Sponsored Task — Custom Pricing (Premium)
Your brand creates a DexFuel participation challenge. Users complete verified actions for your brand and earn Joules. Highest engagement format. Contact for pricing.

---

**Why DexFuel Is Different From Offerwall Inventory**

| DexFuel Premium Inventory | Traditional Offerwall Traffic |
|--------------------------|-------------------------------|
| Verified daily returning users | Install farmers and CPI arbitrageurs |
| 3-5 genuine sessions per day | One-time action takers |
| Social/Entertainment category | Rewards/Loyalty category |
| 92% video completion rate | 30-40% typical completion |
| On-chain verification layer | Pixel/postback fraud exposure |
| Brand-safe community platform | No brand safety controls |
| $15-25 eCPM rewarded video | $0.50-2 commodity CPI |

---

**Audience Profile**

- **Age:** 18-34 primary, 18-44 total
- **Category:** Social / Entertainment / Community
- **Behavior:** Daily active, multi-session, achievement-motivated
- **Platform:** Mobile-first PWA (iOS/Android compatible)
- **Geography:** Global, English-primary at launch
- **Interests:** Gaming, creator content, community, personal finance, social media

---

**Integration Options**

1. **AppLovin MAX SDK** — Primary integration. Programmatic header bidding, real-time optimization.
2. **IronSource / Unity Ads** — Secondary fill via mediation layer.
3. **Direct IO** — Available for $50K+ monthly commitments. Custom placements, guaranteed impressions.
4. **Programmatic DSP** — OpenRTB 2.x compatible. Contact for endpoint access.

---

**Brand Safety & Compliance**

- COPPA compliant: 18+ age gate on all new users
- GDPR: Consent management on signup, data minimization policy
- CCPA: California privacy rights management
- Brand safety: Content moderation on all user-generated task submissions
- No gambling, drug, explicit content, or financial instrument language in ad-adjacent contexts
- App Store category: Social Networking / Entertainment (not Finance or Crypto)
- MRC viewability standards supported

---

**Minimum Viable Partnership**

- Minimum 30-day test campaign
- Minimum $10K monthly for rewarded video
- AppLovin MAX SDK integration preferred
- Brand safety review completed before launch
- DexFuel reserves right to reject advertisers incompatible with platform brand

---

**Contact:**
> Ready to reach verified daily participants?
> [Request Media Kit] [Schedule a Call] [Partner@dexfuel.com]

---

## 7. Logged-In Product UX — Complete Architecture

### 7.1 Global Persistent Components (Every Screen)

| Component | Purpose | Primary CTA |
|-----------|---------|-------------|
| Estimated Reward Tracker | Shows current estimated daily reward, connects to participation share | Earn More Joules |
| Qualification Progress Bar | Shows tasks complete/required to qualify for today's pool | Complete Next Task |
| Next Action Panel | Ranks user's top 3-5 actions by value and status | Take Next Action |
| Tier Progress Widget | Current tier + progress to next | View Tier Benefits |
| Streak Widget | Daily habit formation, loss aversion | Protect My Streak |
| Live Launch Strip | Event-based return trigger | Join Launch |
| Grid Accountability Panel | Social obligation + group participation | Help Grid |
| Profile Health Widget | Social connection + trust improvement | Improve Profile |

---

### 7.2 Dashboard (Home Tab)

**Layout — mobile-first:**
```
[Estimated Reward Tracker] [Qualification Bar]
[Tier: Gold] [Streak: 7 days 🔥]
━━━━━━━━━━━━━━━━━━
NEXT ACTIONS
▶ Complete social task for $TURPUM (+45 Joules) — 2 min
▶ Join live launch: $PADEL — Trending now
▶ Help your Grid: Harbor Crew needs 3 more buys
━━━━━━━━━━━━━━━━━━
LIVE LAUNCHES
[$PADEL ↑ 847% momentum] [Join →]
[$COZNET ↑ 312% momentum] [Join →]
━━━━━━━━━━━━━━━━━━
RECENT ACTIVITY
@user123 earned 340 Joules from $CHAOWL launch
Grid "Morning Collective" hit 100% threshold 🎉
3,241 users qualified for today's reward cycle
```

**Sticky bottom CTA (mobile):** Reflects top next action. Updates as user progresses.

---

### 7.3 Qualification Progress Bar — Mandatory Component

This component appears on: Dashboard, Task Page, Rewards Page, mobile nav footer.

**States:**

| State | Copy | CTA |
|-------|------|-----|
| Not Started | 0 of 5 tasks completed. Complete 5 verified tasks to qualify for today's reward cycle. | Start First Task |
| In Progress | 3 of 5 tasks completed. 2 more to qualify. | Continue |
| Almost Qualified | 4 of 5 tasks completed. One more task to qualify for today's reward. | Finish Qualification |
| Qualified | ✅ Qualified for today. Earn more Joules to increase your share. | Earn More Joules |
| At Risk | A task is pending validation. Qualification may be affected. | View Task |
| Not Eligible | You're not eligible this cycle. Review missing requirements. | View Requirements |

---

### 7.4 Participate Tab (Tasks + Videos)

**Header:** Qualification Progress Bar (always visible)

**Filters:** All · Required · High-Value · Launch · Social · Grid · Creator · Education · Profile

**Task Card anatomy:**
```
[Category badge] [Time: 2 min]
Task Title — What you'll actually do
+45 Joules · Validation: Immediate
[Start Task →]
```

**Task flow:**
1. User taps task → brief explainer appears
2. User confirms → task begins
3. Task content renders (video, quiz, social action, etc.)
4. Completion trigger detected
5. "Verifying..." state (0-30 seconds)
6. Joule animation: "+45 Joules credited"
7. Qualification bar updates
8. Next recommended task surfaces

**Task failure state:**
> This task wasn't counted. [Why?]
> The task [reason: timed out / not completed in correct context / validation failed]. 
> You can [retry this task / choose a different task]. 
> Your Joules from today are still intact.

**Rewarded Video placement:**
Between task cards: "**Boost your next Joules by 2x** — Watch a 30-second brand moment" [Watch Now]
After qualifying: "**You're qualified.** Watch one more to boost your share." [Boost Joules]

---

### 7.5 Launch Tab (Channels + Projects + Trading)

**Two token type filters (top of tab):**
```
[All] [Channels] [Projects]
```
- **Channels** = community tokens that live permanently on DexFuel's bonding curve. Creator-owned. No graduation.
- **Projects** = launch tokens with DEX graduation potential. Protocol/product scale.

**Live launch banner:**
```
🔴 LIVE — $PADEL PULSE  [Channel]
847 verified buyers · $12,340 volume · 2h 14m remaining
[Buy] [Run Tasks] [Join Grid]
```

**Channel token card anatomy:**
- Ticker + name + [Channel] badge
- Creator handle + category badge (fitness / music / gaming / etc.)
- Price (current bonding curve price, stays on DexFuel)
- Volume (24h), Creator fee rate
- Momentum % (buyer velocity)
- [Buy] [Tasks] [Join Grid]

**Project launch card anatomy:**
- Ticker + name + [Project] badge
- Graduation progress bar (X% to DEX threshold) if near graduation
- Price (current bonding curve price)
- Volume (24h), Target DEX
- Momentum % (buyer velocity)
- [Buy] [Tasks] [Join Grid]

**Trade widget:**
- SOL input → token output (live quote)
- Slippage control (5% default)
- "Connect to Trade" button (wallet adapter)
- Buy/Sell toggle
- Confirmation screen showing: amount, price, estimated fees, slippage
- Post-trade: Joule credit for verified participation

---

### 7.6 Grids Tab

**Grid discovery:**
```
[Your Grids] [Find a Grid]

Harbor Crew (Your Grid)
47/47 members · $1,240 volume this cycle
Your contribution: 3 tasks · 1 buy
Grid target: 85% complete ← [Help Grid]

Morning Collective
Open · 12/47 members
Running $TURPUM campaign
[Join →]
```

**Grid captain view:**
- Member activity list (tasks, buys, social)
- Target progress
- Missing member actions
- Send message to Grid
- Create group task or launch goal

---

### 7.7 Earn Tab (Rewards + Profile)

**Reward estimate:**
```
Today's Estimated Reward
~$[X] — Variable, based on participation share

Your Joules: 3,240
Total Platform Joules: 1,247,000
Your Share: 0.26%
Today's Pool: ~$[Y]

[How is this calculated?]
```

**Joules history:** Chronological list of every earning event with task name, amount, validation status

**Tier status:**
```
Gold Tier — 0.15% Joule bonus
Progress to Platinum: 2,500 DEXF needed (you have 1,847)

Tier benefits:
✓ 0.15% Joule multiplier
✓ Early launch notifications
✓ Premium task access
✓ Grid captain eligibility
[View All Benefits]
```

**Referral program:**
> Invite a friend who qualifies for their first reward cycle → You earn 500 Joules. They earn 200 Joules.
> [Share Referral Link]

**Off-ramp:**
> Your rewards are distributed in SOL. Withdraw to your wallet anytime.
> [Withdraw] [View History]

---

## 8. Creator Dashboard & Onboarding

### Creator Onboarding Flow (5 steps, <10 minutes)

Two paths are presented at the start of creator onboarding:
- **“Launch a Channel”** — For creators, communities, and brands. Channel token stays on DexFuel permanently.
- **“Launch a Project”** — For protocols and products. Graduation-eligible to DEX.

**Most users select “Launch a Channel.”** That's the primary flow below.

**Step 1 — Create Channel**
- Channel name, handle, description, category (from dropdown: Creator / Brand / Community / Sports / Music / Fitness / Finance / Gaming / Other), avatar upload
- Preview shows how channel appears to participants
- Note shown: "Your channel token lives on DexFuel's bonding curve permanently. It earns you creator fees on every buy and sell."

**Step 2 — Launch Channel Token**
- Token name, ticker, description, image upload
- One-click deploy to DexFuel bonding curve on Solana
- Cost: ~0.003 SOL gas
- Token created → Channel linked → Creator dashboard unlocks
- Confirmation: "Your channel token is live. Every buy and sell earns you a creator fee directly."

**Step 3 — Set Up First Task**
- "What do you want your first participants to do?"
- Quick options: Watch your intro video / Post for your launch / Buy your token / Join your Grid
- Task live in <60 seconds

**Step 4 — Invite Your Community**
- Shareable launch link with UTM tracking
- "Get your first 10 participants and watch the momentum meter move"

**Step 5 — Go Live**
- Launch window opens
- Countdown on your channel page
- Live momentum bar tracks verified buyers, volume, social reach

*Note: The Project Launch flow (Step 2 variant) includes an additional field for graduation threshold settings and exchange target selection. This path is for protocols only.*

### Creator Dashboard Metrics
- **Holders:** Current token holder count
- **24h Volume:** Trading volume with creator fee earned
- **Active Participants:** Unique users who completed tasks for your project in last 24h
- **Creator Fee Rate:** % of buy+sell going to you (configured at launch)
- **Social Reach:** Total impressions from verified social tasks
- **Estimated Creator Earnings:** Variable, based on activity — clearly marked as estimate

### Creator Task Builder
- Task type: Video watch / Social post / Quiz / Buy / Grid join / Referral
- Joule reward: Creator funds the Joule pool (or uses DexFuel native incentives)
- Validation method: Automatic / Zernio social verification / On-chain verification
- Duration: How long the task runs
- Target: How many completions before task closes

---

## 9. Admin Panel

### Overview Dashboard
- Platform-wide: DAU, sessions/user, total Joules earned, reward pool size, qualification rate
- Revenue: Trading fees (24h, 7d, 30d), rewarded video revenue, CPA revenue, creator deposits
- Top projects by volume and participants
- Top Grids by threshold completion

### User Management
- Search by wallet address, username, email
- User status: active / restricted / banned / flagged
- Joule history and reward history per user
- Restriction tool: flag, limit, ban with reason
- Support ticket view per user

### Content Moderation
- Task submission queue for manual review
- Flagged content (reported by users)
- Social post verification status
- Creator campaign approval queue

### Ad Network Performance
- AppLovin MAX: impressions, completions, eCPM, revenue (7d/30d)
- Fill rate by placement
- Revenue per DAU
- Video completion rate

### Fee Wallet Monitoring
- Fee Wallet A + B current balances
- Reward Vault balance
- Daily fee collection chart
- Bot detection flags (unusual wallet patterns, rapid task completion, VPN usage)

### Engineering Flags
- Failed task validations (>10% rate triggers alert)
- Unusual Joule accumulation patterns
- Reward pool size vs. qualified user count
- Grid manipulation flags

---

## 10. Notification & Retention System

### Push Notification Strategy

| Trigger | Timing | Message | CTA |
|---------|--------|---------|-----|
| Morning cycle reset | 8am local | "New day, new reward cycle. Start your first task." | Start Today |
| Launch window opening | At launch | "$[TICKER] just went live. Trending in real time." | Join Launch |
| Grid needs help | When Grid is <80% of target, 4h before cutoff | "Harbor Crew needs 3 more participants to hit today's target." | Help Grid |
| Task validation complete | Immediate | "+[N] Joules verified for [task name]." | Complete Next Task |
| Almost qualified | When 4/5 tasks done | "1 more task qualifies you for today's reward pool." | Finish Now |
| Evening streak protection | 2h before cutoff | "You haven't protected your streak today. 2 hours left." | Protect Streak |
| Reward estimate changed | When pool changes significantly | "Today's reward pool increased. Your estimated share went up." | View Reward |
| Weekly summary | Sunday 9am | "This week you earned [N] Joules across [N] tasks. Here's your impact." | View Summary |

### Email Cadence
- Welcome: Sent on wallet creation. "You're in the Participation Economy."
- Day 2: "Did you know about Grids? Find your community."
- Day 7: "Your first week on DexFuel. Here's what you earned."
- Monthly: Platform highlights, top creators, new features
- Reward confirmation: Daily reward distributed — "Your [amount] reward has been distributed."

---

## 11. Privy.io Embedded Wallet Onboarding Flow

**Goal:** From landing page to first Joule earned in under 3 minutes. No crypto jargon shown to new users.

**Step 1 — Landing (dexfuel.com)**
> "Show up. Do things. Get paid."
> [Start Participating — It's Free]

**Step 2 — Social sign-in (Privy modal)**
> "Create your account" — [Continue with Google] [Continue with Apple] [Continue with Email]
> No mention of wallets, keys, or crypto. Privy handles everything silently.

**Step 3 — Age attestation**
> "DexFuel is for users 18 and over."
> ☐ I confirm I am 18 years of age or older.
> [Continue]

**Step 4 — Quick intro (3-panel swipe)**
> Panel 1: "Participate daily. Earn Joules." (icon: lightning bolt)
> Panel 2: "Joules = your participation score. More actions = bigger reward share." (icon: bar chart)
> Panel 3: "Daily rewards are variable and participation-based. Show up consistently." (icon: calendar)
> [Get Started]

**Step 5 — First task presented**
> "Your first task is ready."
> **Watch: How DexFuel Works** (90 seconds)
> +50 Joules · Immediate validation
> [Start Task]

**Step 6 — Task completes**
> Joule animation: "+50 Joules" flying up to tracker
> "You're qualified to start earning." 
> Qualification bar: 1/5 complete
> [See Your Dashboard]

**Step 7 — Dashboard first load**
> Estimated reward tracker visible (shows low estimate with clear "earn more" path)
> Next Action Panel: "Complete 4 more tasks to qualify for today's reward pool."
> First session begins.

**Wallet visibility:** Never shown to new users unless they initiate a trade or withdrawal. Privy handles wallet creation silently. Users discover their wallet when they want to trade ("Connect to trade — your wallet is ready") or withdraw.

---

## 12. Mobile Navigation Architecture

**Bottom tab bar (mobile):**
```
🏠 Home    ⚡ Participate    🚀 Launch    🔥 Grids    💰 Earn
```

**Sticky top bar (mobile):**
```
[DexFuel logo] [Estimated Reward: ~$X] [Joules: 3,240]
```

**Sticky bottom CTA (above tab bar):**
Changes based on top priority action. Example: "Complete 1 more task to qualify →"

**Progressive disclosure:**
- New users see simplified view (3 main actions, no tier complexity)
- After Day 7: Full feature set unlocks
- Grid features visible after first Grid join

---

## 13. Rewarded Video Integration Spec

**SDK:** AppLovin MAX (primary), IronSource Unity (secondary fill via mediation)

**Placements:**

| Placement | Trigger | Label in UI |
|-----------|---------|-------------|
| Post-task boost | After task completion | "Watch a brand moment to 2x your next Joule reward" |
| Qualification booster | When 3/5 tasks done | "Boost your Joules — 30 seconds" |
| Pre-high-value-task | Before premium task unlocks | "Watch to unlock this premium task" |
| Earn tab | In rewards section | "Boost today's Joules" |

**UX rules:**
- Never call it an "ad" — use "brand moment" or "sponsored content"
- Show progress bar during video
- "Reward unlocking..." animation after completion
- Joule animation crediting 2x multiplier on next task
- Max 5 rewarded videos per user per day (frequency cap)
- Skip after 5 seconds if AppLovin MAX allows (some formats are non-skippable)
- NEVER auto-play. Always user-initiated.

**Revenue split:**
- AppLovin MAX: ~30% (platform fee)
- DexFuel: ~70% net
- Target eCPM: $15-25 (premium Social/Entertainment fill rate)

**Unlock conditions for premium eCPM:**
- App Store category: Social Networking or Entertainment
- Minimum 10,000 MAU
- Session frequency: 3+ per user per day
- Video completion rate: >85%
- Brand safety certification complete

---

## 14. Premium Ad Network Strategy (Internal)

### Target Network Priority
1. **AppLovin MAX** — Primary integration. Best eCPM, strongest mediation, best fill rate for Social/Entertainment
2. **IronSource** — Secondary. Strong gaming/social inventory, good for Latin America and Southeast Asia
3. **Unity Ads** — Gaming audience crossover, good for creator/gaming vertical
4. **Digital Turbine / Vungle** — Carrier-level distribution, fills mid-tier gaps
5. **Adjoe** — Premium CPA, highest quality offer-wall alternative
6. **Lootably** — Secondary CPA, good for English-speaking markets

### App Category Positioning
**Register DexFuel as:** Social Networking (primary) / Entertainment (secondary)

**NEVER register as:** Finance, Crypto, Rewards, Gambling, or Investment

The ad network's content policy review will check:
- Does the app homepage mention guaranteed income? → NO (enforced by language rules)
- Is the primary action financial transaction? → NO (primary action is task completion)
- Does it have gambling mechanics? → NO
- Is it age-gated? → YES (18+)
- Does it have user-generated content moderation? → YES

### Minimum Metrics for Premium eCPM Unlock

| Metric | Minimum for Premium | Target |
|--------|--------------------|----|
| MAU | 10,000 | 50,000+ |
| DAU/MAU ratio | 25% | 40%+ |
| Sessions/DAU | 2.5 | 3-5 |
| Session length | 4 minutes | 8+ minutes |
| Video completion rate | 85% | 92% |
| App Store rating | 4.0+ | 4.5+ |
| COPPA/GDPR cert | Required | Complete |

### Internal Pitch Talking Points for AppLovin BD
> "DexFuel is a Social/Entertainment platform with verified daily engagement. Users return 3-5 times per day as part of a daily participation cycle. Our rewarded video placement sits at peak attention moments — between task completions, when users are most motivated to continue. We're targeting $15-25 eCPM and have a clear roadmap to 100K MAU. We're not an offerwall. We're the platform offerwall users wish they were in."

---

## 15. Engineering Modules

| Module | Purpose | Key Outputs |
|--------|---------|-------------|
| User Status Engine | Combines wallet, eligibility, tier, streak, task, restriction state | qualified status, tier, streaks, at-risk states |
| Reward Estimate Engine | Calculates estimated reward based on user Joules and pool | estimated reward, participation share, explanation |
| Qualification Engine | Determines if user meets daily reward requirements | tasks remaining, missing requirements, status |
| Next Action Engine | Ranks 3-5 best actions per user | primary CTA, action cards |
| Task Engine | Manages tasks, validation, context, attribution | task states, Joules, retry options |
| Launch/Momentum Engine | Tracks live launches, countdowns, buyers, volume | live strip, momentum meter, CTAs |
| Grid Engine | Tracks membership, thresholds, contributions, streaks | grid accountability, alerts |
| Streak Engine | Tracks login, qualification, task, grid, launch streaks | streak widgets, warnings, badges |
| Tier Engine | Tracks DEXF snapshot, participation consistency, tier progress | tier, next tier progress |
| Profile Health Engine | Tracks social connections and credibility | health score, missing actions, unlocks |
| Notification Engine | Triggers multi-session return events | push/email/in-app notifications |
| Ad Revenue Engine | Manages AppLovin MAX SDK, fill rate, frequency caps, revenue tracking | eCPM, impressions, revenue |
| Explanation Engine | Single source for UI and bot explanations | what/why/next templates |
| Social Proof Feed Engine | Aggregates meaningful activity events | feed cards, activity stream |
| Admin Dashboard | Platform-wide analytics for ops | COO/admin reporting |

### Required API Endpoints
- `GET /me/status` — qualification, tier, streak, profile health, eligibility
- `GET /me/reward-estimate` — estimated reward, Joules share, pool estimate
- `GET /me/qualification` — tasks complete, required, missing, validation states
- `GET /me/next-actions` — ranked action cards with copy and CTAs
- `GET /tasks` — available tasks with type, Joules, time, validation status
- `GET /launches/live` — live launches, countdowns, momentum, verified buyers
- `GET /grids/status` — grid targets, thresholds, user contribution, streaks
- `GET /profile-health` — connected socials, score, missing actions
- `GET /feed/live` — filtered live social proof events
- `GET /explanations/:type` — template text for UI/bot consistency
- `POST /ad/impression` — record ad impression with placement type
- `POST /ad/complete` — record video completion, trigger Joule multiplier

---

## 16. Analytics & Success Metrics

### Platform Health KPIs
| Metric | Target |
|--------|--------|
| Sessions per DAU | 3-5 |
| Qualification rate (active users) | 70-85% |
| Task completion rate | 60%+ |
| Next Action click-through | 40%+ |
| Live launch participation rate | 25%+ per launch |
| Grid participation rate | 50%+ of members per cycle |
| Streak Day 7 retention | 40%+ |
| Profile Health completion (2+ socials) | 30%+ of users |
| Reward page views per DAU | 2+ |
| Support ticket deflection (via UI explanations) | 60%+ |

### Ad Revenue KPIs
| Metric | Target |
|--------|--------|
| Rewarded video eCPM | $15-25 |
| Video completion rate | 90%+ |
| Ad revenue per DAU | $0.15-0.40 |
| Fill rate (AppLovin MAX) | 85%+ |
| Daily ad impressions | MAU × 1.5 sessions × fill rate |

### Conversion KPIs
| Metric | Target |
|--------|--------|
| Visitor → wallet connect | 8-12% |
| Wallet connect → first task | 70%+ |
| First task → Day 7 return | 30%+ |
| Creator page visit → project launch | 5-8% |
| Business inquiry → campaign launch | 15-20% |

---

## 17. Implementation Priority

### Phase 1 — MVP (Must Ship)
- Privy.io onboarding (social sign-in + silent wallet)
- Age attestation (18+)
- Estimated Reward Tracker
- Qualification Progress Bar (with all states)
- Next Action Panel (at least 3 actions ranked)
- Task completion flow (basic types: video, social, quiz)
- Live Launch Strip (basic: countdown, buy CTA)
- Tier Progress Widget
- Streak Widget
- Dashboard (mobile-first)
- Profile page (basic)
- Explanation templates for all error/edge states
- AppLovin MAX SDK integration (rewarded video, 1 placement)

### Phase 1.1 — 30 Days Post-Launch
- Grid system (join, participate, captain tools)
- Grid Accountability Panel on dashboard
- Profile Health Widget (social account connections)
- Social Proof Feed (live activity stream)
- Push notification engine (morning reset, launch, streak)
- Creator dashboard (basic: metrics, task builder)
- Admin panel (user management, moderation queue)
- /advertise page (live, with real stats)

### Phase 1.2 — 60 Days Post-Launch
- Full creator onboarding flow
- Social task engine (Zernio integration)
- Adjoe/Lootably CPA integration (secondary offer fill)
- Email notification cadence
- Advanced admin analytics
- Business/brand campaign creation tool
- Mobile app (PWA hardening, App Store submission)
- IronSource mediation layer (secondary ad fill)

### Phase 2 — Scale
- AppLovin MAX premium eCPM unlock (requires 10K+ MAU)
- Brand sponsored task format
- Advanced Grid features (multi-tier, captain competitions)
- Creator reputation system
- Marketplace for participation campaigns
- Enterprise business campaign dashboard

---

## 18. Compliance Checklist — Before Any Ad Network Partnership

- [ ] App Store listing category: Social Networking or Entertainment (NOT Finance)
- [ ] Age gate: 18+ attestation on signup
- [ ] COPPA: No data collection from users under 13 (age gate enforces)
- [ ] GDPR: Consent management on signup, right to erasure, data minimization
- [ ] CCPA: Privacy policy with California rights
- [ ] Language audit: Zero instances of guaranteed/fixed/APY/yield/staking in any user-facing copy
- [ ] Joules disclaimer on every rewards-related page
- [ ] "Not an investment platform" footer disclaimer
- [ ] Brand safety: Content moderation on task submissions
- [ ] OFAC: Wallet screening on every new wallet creation
- [ ] AppLovin MAX content policy review: Complete
- [ ] App Store screenshots: No financial return claims, no gambling imagery
- [ ] Privacy policy: Updated to include AppLovin MAX data sharing
- [ ] Terms of service: Updated to include ad partner data usage

---

*DexFuel Design Brief v2.0 — Confidential*
*Council-reviewed: Growth · UX · Compliance · Economics · Engineering · Brand · Ad Network Strategy*
*"Show up. Do things. Get paid. — The Participation Economy™"*
