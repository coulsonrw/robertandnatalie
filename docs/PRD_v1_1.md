# Robert and Natalie — Wedding Website
## Product Requirements Document

**Version:** 1.1  
**Prepared / reissued:** 21 September 2026  
**Status:** Reissued implementation brief; open product decisions still require approval  
**Product owners:** Robert and Natalie  
**Supersedes:** PRD v1.0; retain earlier versions for reference only  
**Wedding:** Saturday, 19 December 2026 · Point Clear, Alabama

The approved ivory, gold, original-color crest, and charcoal invitation is the visual foundation. This specification translates the website research into prioritized, testable requirements for design, development, and guest operations. Version 1.1 makes design-foundation selection a mandatory pre-build stage; no template is selected or purchased by this reissue.

**Reading guide:** Sections 01–04: product and visual authority; 05: mandatory template/foundation selection; 06–09: guest experience and RSVP; 10–14: data, technical controls, and acceptance; 15–17: delivery, decisions, and sources. The first agent deliverable is the selection package, not a production website.

# Document control and revision record

**Current issue:** v1.1, 21 September 2026. This is the complete reissued PRD, not an addendum. It supersedes v1.0 for implementation. The original 51 requirement IDs are retained; 12 mandatory selection requirements (TPL-01–12) and six acceptance cases (AT-17–22) are added. Total: **63 identified requirements and 22 acceptance cases**.

| Change in v1.1 | Operational effect |
|---|---|
| New Section 05: template and design-foundation selection | Agent must research, screen, compare, prototype, and obtain approval before committing to the production design. |
| Evidence-based shortlist and weighted evaluation | Target six to eight credible candidates; present three branded alternatives, including a custom component-based benchmark. |
| Separate concept, purchase, and build approvals | An attractive public demo does not establish source-code quality, license rights, or a compliant RSVP system. |
| Expanded acceptance and handover | Selection evidence, source/license checks, proof screenshots, decision record, and change control become required deliverables. |
| Reconciled delivery baseline | Replace the earlier 20-working-day estimate with a proposed 25-working-day baseline, excluding owner/procurement waiting time. |

**Unchanged:** wedding date, named venues and start times, exact invitation copy, original-color Coulson crest, ivory/gold/charcoal identity, household RSVP requirements, privacy decision status, and P1/P2 scope boundaries. No new wedding arrangements, template purchase, or production authorization are implied.

## Agent starting point
Read Sections 01–05 and the decision register in Section 16 before design work. Inspect the two supplied artwork files. The first deliverable is a visual selection package: screened candidate register, scorecard, three comparable branded proofs, source/rights status, and a recommendation with estimated effort. Stop at the approval gates in Section 05.5; prototype code and technical evaluation are permitted, but production commitment is not.

## Document and approval authority
Robert and Natalie approve the visual direction and material product decisions; an expressly delegated owner representative may act where recorded. The technical lead records source, build, integration, accessibility, and security findings. The coordinator verifies guest logistics. A coding agent may assemble evidence and recommend a choice; it may not record its own recommendation as owner approval.

Sections 06–17 correspond to Sections 05–16 in v1.0. Existing requirement and test identifiers are stable; refer to those identifiers when linking implementation tasks. Dates, estimates, candidate findings, and approvals must remain distinguishable from verified event information.

<!-- PAGEBREAK -->

# 01 / Product brief and confirmed basis

## Product vision
Create a bespoke digital invitation and practical guest guide for Robert and Natalie: formal, personal, and unmistakably continuous with their approved wedding stationery. Guests must be able to find the wedding details, plan their stay, and submit an accurate RSVP without navigating a decorative obstacle course.

**Product owners:** Robert and Natalie. **Document status:** v1.1, reissued implementation brief, 21 September 2026; unresolved product decisions remain subject to approval. **Audience:** designer, developer, wedding coordinator, and any AI-assisted implementation team. Event details below come from the couple’s instructions; they do not independently verify venue bookings.

| Item | Confirmed basis |
|---|---|
| Couple | Robert and Natalie; no surnames have been supplied for publication. |
| Date and destination | Saturday, 19 December 2026; Point Clear, Alabama. |
| Ceremony | Saint Francis Chapel; 2:00 p.m. local time. |
| Reception | The Grand Hotel; 4:00 p.m. local time. |
| Visual direction | Ivory, gold ornament and calligraphy, original-color Coulson crest, charcoal/black informational text. No crimson text. |
| Closing line | “Where the ancient Moeli waters meet the Bahia Del Espiritu Santo” — retain this wording. |

**Time handling:** use `America/Chicago` as the event timezone. The supplied starts resolve to 14:00 and 16:00 CST on the wedding date. Never replace venue-local times with a visitor’s timezone without an explicit label. Ceremony duration, reception end, arrival instructions, and transport between venues remain unconfirmed.

## Outcomes and proposed success measures

| Outcome | Acceptance target and measurement |
|---|---|
| Immediate clarity | At least 5 of 6 representative testers find the date, ceremony time, and venue within 15 seconds after entering the invitation. |
| Simple response | At least 5 of 6 testers complete a household RSVP without assistance within 3 minutes, excluding optional notes. |
| Accurate planning | Every tested response reconciles to named guests and authorized events; retries create no duplicate responses. |
| Reliable access | No critical accessibility, security, data-loss, or broken-direction defects at launch. |
| Low administration | A coordinator can find outstanding responses and export an event-specific guest list within 2 minutes. |

These are product targets, not results observed on the reference websites. The primary measure is guest task completion, not visitor volume or design-award recognition.

<!-- PAGEBREAK -->

# 02 / Research translated into scope

## Design precedents, not a traffic ranking
The earlier shortlist did not establish comparable visitor counts. This PRD uses observable design and navigation patterns from three individually identifiable wedding websites; it does not depend on an unverified “most popular” ranking.

| Reference and evidence | Adopt for this website | Do not import |
|---|---|---|
| **Veley/Ross:** its site groups the venue, airport, lodging, activities, and dining information. [S1] | Destination-oriented Travel & Stay content, concise practical links, repeated RSVP access. | Another couple’s recommendations, copy, photographs, or destination details. |
| **Sarah & Matt:** invitation-led presentation, relationship timeline, celebration and travel sections; its showcase documents a 3D invitation hero. [S2–S3] | A digital-stationery opening, readable editorial sections, and direct routes to guest tasks. | Mandatory animation, a copied visual identity, or an assumption that its backend suits this project. |
| **Jess & Russ:** the preserved showcase records an illustrated timeline and scrolling effects; the original site is no longer linked as live. [S4] | A small number of personal milestones and carefully commissioned illustrations. | Heavy parallax, scroll hijacking, or an elaborate interactive story required before viewing logistics. |

## Scope and priority convention
**P0 — mandatory process and launch requirements:** completed design-foundation selection and recorded production-build approval (Section 05); approved invitation design; responsive navigation; ceremony/reception information; Travel & Stay; essential FAQs; invitation access; household RSVP; confirmation and correction; coordinator view and export; privacy, accessibility, backups, and operational handover.

**P1 — optional after P0 acceptance:** approved Our Story content and modest gallery; a restrained invitation-opening animation; approved local recommendations; owner-triggered reminder sending. These enhancements must not postpone the core release. The Our Story navigation item is omitted until that section is approved.

**P2 — explicitly deferred:** post-wedding photo gallery, guest uploads, guestbook, multilingual content, live-streaming, registry integrations, and seating-plan tools. Reconsider only through a separately approved scope change.

**Out of scope:** native apps, public guest directories, advertising, payment collection, automated itinerary planning, an AI concierge, social-login requirements, a full wedding-planning platform, and a bespoke general-purpose CMS. Do not invent a registry, dress code, children policy, welcome event, brunch, shuttle, or hotel discount.

**Implementation principle:** build a distinctive front end and a small, dependable guest-operations system. A decorative feature that conflicts with clarity, privacy, or RSVP reliability loses priority. Research references are precedents, not licensed template purchases or approved technical foundations; selection follows Section 05.

<!-- PAGEBREAK -->

# 03 / Information architecture and guest journeys

## Site structure
Use a primarily single-page, anchor-based guest experience, with dedicated routes for transactions and administration. Recommended visibility is invitation-only; this is a proposed privacy choice requiring owner approval, not an existing instruction from the couple.

| Route or section | Purpose and required behavior |
|---|---|
| `/` | Minimal entry page with approved names/crest and invitation-access control. No venue logistics or personal guest data in public metadata under the recommended privacy model. |
| `/celebration#invitation` | Full invitation and quick links to Wedding Day, Travel & Stay, and RSVP. |
| `#our-story` | Optional approved narrative; remove the link and section when unpublished. |
| `#wedding-day` | Ceremony and reception cards, local times, directions, and approved practical details. |
| `#travel-stay` | Hotel, verified booking information, travel guidance, transport, and local orientation. |
| `#questions` | Concise, accessible FAQs and a private contact route. |
| `/rsvp` | Household-specific attendance form, review, submission, and corrections. |
| `/rsvp/confirmation` | Saved response summary and authorized edit action. No sensitive data in the URL. |
| `/privacy` and `/admin` | Public privacy notice; separately authenticated administration. |

**IA-01 [P0] Navigation.** After invitation access, persistent navigation must expose Wedding Day, Travel & Stay, and RSVP. RSVP remains visible on mobile without hiding content or keyboard focus. Anchor links account for the header height. Native scrolling and browser back behavior must work.

**IA-02 [P0] Direct access.** Household links land in the appropriate guest context after access is established. An expired session returns a visitor to their intended destination after re-entry. No guest is required to create a general-purpose account.

## Primary journeys
**Invited household:** follow the private invitation link or enter the supplied code → view invitation → review details → respond for named invitees → receive an on-screen record → optionally correct the response.

**Traveling guest:** enter invitation → select Travel & Stay → distinguish general hotel information from an actual room-block offer → open the approved booking or directions link. No requirement to read Our Story first.

**Wedding-day guest:** return to the site → reach ceremony or reception directions in one navigation action → view the latest approved logistics and contact instructions.

**Coordinator:** authenticate separately → review attendance by event and person → resolve incomplete responses → export only the information needed by the authorized recipient.

**Exception:** anyone without valid invitation access receives a neutral help message and the approved contact route; the website never confirms whether a searched name is on the guest list.

<!-- PAGEBREAK -->

# 04 / Visual system and responsive composition

## Governing artwork
**DES-01 [P0] Preserve the approved identity.** The latest charcoal-text invitation governs the overall aesthetic. The original uploaded crest governs heraldic detail. Reuse that source image: silver/charcoal dolphins, gold collars and chain, navy accents, existing monogram, shield, and ribbon. Do not reinterpret letters, regenerate dolphins, flatten the crest into monochrome gold, crop the motto, or distort proportions.

Retain the reduced, subordinate crest scale established in the invitation. Proposed website width is 110–140 CSS pixels on mobile and 140–180 on desktop; final approval is visual, not a mathematical claim that these values reproduce the earlier 50% reduction. Keep the names dominant.

| Proposed token | Value | Application |
|---|---|---|
| Paper | `#F7F3EA` | Main ivory background; restrained paper texture. |
| Ink | `#292A28` | Informational text and form labels; visually reconcile with the dolphins. |
| Decorative gold | `#B38A39` | Fine rules, corner ornament, nonessential foil effects. |
| Text gold | `#856119` | Starting color for legible gold headings; validate final contrast. |
| Heraldic navy | `#152B45` | Existing crest detail and limited functional accents, not a new dominant palette. |

These are proposed implementation values, not exact samples from the artwork. Approve them in-browser against the supplied references.

**DES-02 [P0] Typography.** Use elaborate gold script for Robert and Natalie and for the two venue names. Use a classical serif for formal copy and a readable serif treatment for practical information. Pinyon Script and Cormorant Garamond are candidates for a first proof, not identified matches. [S13–S14] The raster references do not establish exact font files. Final typefaces require an approved proof and appropriate web-use rights; no unapproved substitution at launch.

**DES-03 [P0] Composition.** Concentrate the ornate frame around the opening invitation; use lighter dividers and generous space below it. Desktop content max-width: approximately 1,160 pixels; reading columns: 60–70 characters. Mobile gutters: 20–24 pixels. Start with 18-pixel body copy and a 16-pixel minimum for controls. Preserve small caps selectively, not across long paragraphs.

**DES-04 [P0] Wrapping.** “Robert and Natalie” may occupy one line on wide screens or the approved stacked arrangement on narrow screens. Never horizontally compress lettering. The closing sentence must match the informational font, size, weight, and charcoal color, wrapping into two or more centered lines rather than shrinking. Compare this treatment across the Section 05 branded proofs; an unapproved template default must not override these rules.

<!-- PAGEBREAK -->

# 05 / Template and design-foundation selection

## 05.1 / Mandate, authority, and discovery

**TPL-01 [P0] Mandatory pre-build stage.** Research → screen → score → branded proofs → owner concept approval → licensed-source validation → production-build approval. The agent’s first deliverable is the selection package, not a production website. Permit time-boxed prototypes and technical spikes with synthetic data; prohibit unapproved purchases, production guest imports, public guest launch, or commitment to a foundation before the relevant gate. No template has been selected by this PRD.

**TPL-02 [P0] Authority and selection principle.** The original crest governs heraldic detail; the latest charcoal invitation governs visual identity; the PRD governs behavior and controls. Research precedents contribute only the patterns identified in Section 02. Resolve conflicts in that order and obtain owner approval of any composite. Select the foundation that serves the invitation and guest tasks, not the strongest marketplace sales page. Never copy another couple’s artwork, narrative, photos, or private data.

**TPL-03 [P0] Candidate search and shortlist.** Target six to eight credible candidates across the categories below, including the custom benchmark. Search current publisher/repository sources and inspect individual product listings and live demonstrations, not just marketplace category pages. Example search terms: “couple wedding invitation React source,” “editorial heritage event template,” and “accessible Next.js event components.” Record the search date and exact source links. A marketplace or wedding platform is a discovery channel, not itself a candidate.

| Candidate category | Evaluate for this project |
|---|---|
| Individual-couple wedding templates | Invitation-led structure, event and travel sections, editable typography, and useful RSVP presentation. |
| Editorial, heritage-hospitality, or formal-event templates | Formal typography, restraint, generous space, and flexible composition that can support the approved stationery. |
| Custom component-based composition | Original invitation section with reusable navigation, form, accordion, layout, and administrative components; a mandatory effort/value benchmark. |

Reject wedding-planner/vendor sales sites unless their structure offers a demonstrable advantage. Do not pad the list with near-duplicates or unsuitable entries. Shortlist three distinct branded alternatives, including the custom composition. If fewer credible options exist, document the search and obtain an explicit owner exception before reducing the proof count; retain the custom benchmark.

**TPL-04 [P0] Evidence register.** Give each candidate a stable ID. Record publisher/repository, exact listing and demo links, review date, source access, release/commit where visible, stack and dependencies, license and asset-rights status, purchase/subscription costs and currency, gate result, evidence files, and exclusion reasons. Label each material finding **verified**, **publisher claim**, **not verified**, or **not applicable** with a reason. An inaccessible demo or unavailable source remains not verified; never invent a review, score, compatibility result, or price.

<!-- PAGEBREAK -->

## 05.2 / Mandatory screening and source validation

**TPL-05 [P0] Screening gates.** Mark each criterion pass, pending verification, or fail. A failure excludes a candidate when no approved, feasible remediation exists. Pending source/license findings may remain during concept comparison but must be resolved for the selected foundation before G2. A weighted score cannot compensate for an unresolved mandatory gate.

| Gate | Evidence needed before production-build approval |
|---|---|
| Editable source and ownership | Source can be held in owner-controlled accounts and deployed under the approved architecture; document any dependency on proprietary hosting or a visual builder. |
| Template, font, and media rights | Record the applicable license, purchaser/license holder, permitted use and transfer, attribution, included/excluded assets, and recurring obligations. Replace unclear-rights assets or stop for owner review. |
| Technical viability | Inspect actual source and dependencies; reproduce a clean install/build; document integration work, support status, and material security or maintenance concerns. |
| Visual adaptability | Preserve the original crest, live invitation text, type hierarchy, charcoal copy, matching-size closing line, and responsive layouts without distorting assets. |
| Guest-system integration | Support authenticated household context and trusted server-side RSVP behavior; reject client-only privacy or an email-only form as the final RSVP architecture. |
| Accessible and performant path | Identify keyboard/reflow/motion issues and load costs; provide costed fixes for remediable gaps. No nonremediable conflict with P0 usability, accessibility, or performance targets. |

**TPL-06 [P0] Safe, licensed technical evaluation.** Inspect dependency manifests, lockfiles, setup scripts, component boundaries, CSS/theme controls, font/media sources, external requests, and form handlers. Run available source in an isolated, nonproduction environment without production secrets. Record actual commands, tool/runtime versions, build output, and the source revision evaluated. Do not infer current framework compatibility from a listing title or treat an old dependency as safe merely because a demo loads.

Source access is not assumed. Before paid source is available, use permitted demonstrations and clearly labeled original concept mockups; do not scrape or clone proprietary source or represent a concept as an inspected template implementation. G1 authorizes any specific purchase. After acquisition, validate the chosen source, rerun the scorecard and branded proof, and stop for a replacement decision if material findings invalidate the recommendation.

**RSVP boundary:** a template can supply styling and layout. Its advertised “RSVP” capability does not establish household authorization, guest/event entitlements, atomic saves, idempotency, revision handling, durable confirmation, or coordinator reporting. Map every RSVP-, DATA-, ARCH-, SEC-, and ADMIN- requirement to retained code, an adaptation, or a new implementation. Do not reduce those requirements to fit the template.

A custom composition is subject to the same source, license, dependency, and technical checks for every reused component. “Custom” is not a waiver of screening.

<!-- PAGEBREAK -->

## 05.3 / Weighted evaluation and effort comparison

**TPL-07 [P0] Evidence-based scorecard.** Score each eligible candidate from 0 to 5 using the weights below. Evaluate the actual branded proof where available, not the vendor’s stock photography. Attach a rationale, evidence status, and evidence reference to every criterion. These weights are project decision rules, not observed popularity measures.

| Criterion | Weight | Required basis |
|---|---|---|
| Fit with the approved invitation | 35% | Actual crest and copy; ivory/gold/charcoal treatment; type hierarchy; ornamentation; fidelity without an image-only page. |
| Mobile usability and guest navigation | 20% | Readable 320/390-pixel layouts; clear schedule/travel navigation and RSVP entry; no mandatory story or animation. |
| Technical fit and maintainability | 20% | Inspected source/build; component structure; dependencies; integration path; owner-controlled deployment. |
| Customization effort and total cost | 15% | Keep/adapt/replace assessment, comparable work estimates, licensing and recurring costs, and uncertainty. |
| Accessibility and performance readiness | 10% | Measured proof behavior, keyboard/reflow/reduced-motion checks, load evidence, and costed remediation. |

**Scoring anchors:** 0 = cannot meet the criterion on an acceptable path; 1 = very poor fit/major rebuild; 2 = substantial adaptation; 3 = workable with moderate changes; 4 = strong fit with limited changes; 5 = demonstrated fit with minimal relevant remediation. A mandatory gate failure remains a rejection regardless of score.

**Calculation:** weighted total out of 100 = sum of each weight multiplied by its score divided by five. Never renormalize weights to hide unverified criteria. Use a blank score and a labeled possible total range for unresolved criteria; for that range only, use 0 and 5 as bounds. Do not rank a provisional total as equivalent to a fully evaluated total. All five criteria must be evaluated for the selected implementation at G2; later work and estimates remain explicitly identified, not asserted complete.

**TPL-08 [P0] Keep/adapt/replace and total effort.** For each finalist, classify the invitation, navigation, event cards, travel, FAQs, RSVP interface, access layer, coordinator tools, and content editing as **keep**, **adapt**, **replace**, or **build new**. State why, map affected requirement IDs, and show dependencies. Include removal of demo assets, unwanted trackers, obsolete plugins, and irrelevant wedding-vendor sections.

Use the same scope and rates for all alternatives. Separate acquisition/licensing, design adaptation, component integration, guest-system work, testing/remediation, and handover. Show estimated hours or working days by role, low/base/high assumptions, and recurring cost through the proposed post-wedding retention period. Use dated, sourced prices only; record unknowns rather than zero. Do not count common backend work as a template saving unless reuse is demonstrated.

Recommend the custom composition when no template offers a material, explained net advantage after adaptation and risk. The preferred starting hypothesis is a bespoke invitation over reusable components, but it is not a predetermined winner. Owners may favor a different passing option with a recorded rationale; scores do not authorize a purchase or build.

<!-- PAGEBREAK -->

## 05.4 / Branded proofs and comparative testing

**TPL-09 [P0] Three comparable visual proofs.** Present three alternatives, including the custom component-based option, using the same approved crest, invitation wording, event values, and synthetic household. Build only the comparison slice below, not three complete production websites. Each alternative must have a desktop and mobile proof; use an isolated browser prototype where licensed source is available. Label original concept mockups and untested interactions explicitly. The selected alternative must have a working, source-validated proof before G2.

| Proof element | Minimum content |
|---|---|
| Invitation opening | Exact copy, original-color crest, dominant gold names, restrained frame, matching-size closing line, and visible navigation/RSVP access. |
| Wedding Day transition | Ceremony and reception cards with confirmed start times, venue distinction, and legible information hierarchy. |
| Travel & Stay | Approved hotel information only; unknown room-block/transport details omitted or clearly marked as review-only, never fabricated. |
| First RSVP screen | Synthetic household invitees and event-specific response presentation; show relevant focus/error states without implying a working backend where none exists. |

Use the same proof scope, content completeness, viewport sizes, and evidence standards for all alternatives. Keep review previews access-controlled. No production guest list, contact details, invitation credentials, invented couple history, or unauthorized photography may be used. Missing optional content is omitted; unresolved essential logistics appear only as explicitly labeled review annotations outside publishable content.

**TPL-10 [P0] Proof tests and visual baseline.** Capture each branded proof at **320, 390, 768, and 1440 CSS pixels**. Include full-page captures and readable invitation/RSVP detail views. For functioning prototypes, record browser/build versions, keyboard focus, text zoom/reflow, reduced motion, responsive navigation, and basic load behavior. Browser automation may be used for repeatable screenshots; visual judgment and manual accessibility checks remain necessary. Do not claim a static concept passed interactive or performance tests.

Check the original crest’s proportions, ribbon and heraldic detail; script letter spacing and wrapping; absence of crimson; legible gold headings; the closing sentence at the same informational size; and direct access to Wedding Day and RSVP. Do not force a portrait invitation into one phone screen by shrinking text. Do not give a candidate credit for a complex animation that impedes guest tasks.

Freeze the approved selected proof as the visual baseline after G2. Retain its source revision, tokens, approved fonts and asset provenance, browser/device settings, and screenshots. Compare later builds against that baseline and review differences rather than blindly accepting screenshot changes. A screenshot match is not proof of household security, accessibility conformance, or response integrity; the full acceptance suite remains required.

<!-- PAGEBREAK -->

## 05.5 / Owner approvals, decision record, and agent stop rules

**TPL-11 [P0] Separate approvals.** The agent recommends; Robert and Natalie, or their recorded delegate, approve. Keep the following gates distinct. Where no purchase is needed, record “not applicable” for procurement rather than inventing a transaction.

| Gate | Required approval and stop rule |
|---|---|
| **G1 — concept and procurement** | Owners review the candidate register, scorecard, three branded alternatives, estimated effort/cost, and unresolved findings. Record the preferred concept. Any paid acquisition requires explicit approval of the named item, license, price/currency, account owner, and recurring obligations before purchase. Concept approval alone is not production approval. |
| **G2 — production-build authorization** | Selected source is available and validated; mandatory gates pass; all criteria are evaluated; the working branded proof, typefaces, architecture, costed remediation, and schedule are approved. Record owner visual sign-off and technical-lead validation. Only then may the selected production implementation proceed. |
| **G3 — guest release** | Section 16 RELEASE-01 is satisfied, including Section 14 tests and essential content/security/operations decisions. G2 does not authorize publication or import of an unapproved roster. |

The agent may prepare synthetic prototypes, technical spikes, and architecture analyses before G2. It may not silently buy all finalists, change the approved stack to accommodate a favorite template, waive a mandatory gate, publish to guests, or substitute a different foundation after approval. Owner waiting time and procurement delays must be surfaced in the schedule, not absorbed by cutting P0 testing.

**TPL-12 [P0] Decision package and change control.** Deliver a candidate register with rejected options, the scored comparison and evidence, all branded proof captures/prototypes, source/license/build findings, keep/adapt/replace maps, cost estimates, and a decision record. The record identifies the chosen candidate and source revision, approved proof, actual approvers/dates, G1/G2 status, remaining remediation owners, and the reason for selection over the custom benchmark or vice versa. Unmade approvals remain blank/pending.

Retain this package in the owner-controlled project repository. A later change to the foundation, material dependency/hosting approach, paid license, crest, typefaces, or approved composition requires an impact note, updated evidence/costs, and renewed approval at the affected gate. Routine defect corrections within the approved baseline require regression evidence, not a new template competition.

**Required first submission:** selection report, evidence register, scorecard, three branded proofs, keep/adapt/replace estimates, and a proposed decision record. This PRD and the included starter files prescribe those deliverables; they do not claim the market search, scoring, prototypes, or approvals have already been completed.

<!-- PAGEBREAK -->

# 06 / Invitation content and opening experience

## Approved content master
Maintain the following wording as editable text. Line breaks may respond to viewport size. The plain-language schedule can additionally show numerals and a timezone label for quick comprehension.

> Robert and Natalie
>
> With joy and gratitude, request the pleasure of your company for their wedding in Point Clear, Alabama
>
> On Saturday, The Nineteenth of December
> Two Thousand Twenty-Six
>
> Saint Francis Chapel
> Ceremony at Two O’Clock in the Afternoon
>
> The Grand Hotel
> Reception at Four O’Clock in the Evening
>
> Where the ancient Moeli waters meet
> the Bahia Del Espiritu Santo

The closing phrase is owner-supplied poetic copy, not a verified historical explanation. Do not change “Moeli,” add accents, or expand its meaning without approval. Preserve “and” in the couple’s display names rather than automatically replacing it with an ampersand.

**HOME-01 [P0] Invitation rendering.** Build the invitation with semantic HTML, live text, and separate decorative assets. The supplied invitation PNG is a visual reference, not the entire website or an image-only substitute for readable content. Clearly associate the page title, names, date, and destination for assistive technology.

**HOME-02 [P0] Immediate utility.** Display the date and Point Clear destination with the names, then place RSVP and View Wedding Day actions near the opening content. Do not force the full portrait invitation to fit inside one mobile screen by reducing typography. Give guests access to navigation before any extended scrolling.

**HOME-03 [P1] Optional opening motion.** A brief paper reveal or gentle invitation tilt may reinforce the stationery concept. It must be skippable, must not obscure navigation, and must provide an equivalent static rendering. No autoplay audio, looping shimmer, confetti, custom cursor, required 3D engine, or forced scrolling. Disable nonessential motion when reduced motion is requested.

**HOME-04 [P0] Functional styling.** Buttons, links, status messages, and errors must remain legible against ivory. Use charcoal rather than returning to the earlier crimson palette. Communicate errors with clear text and iconography, not color alone. A decorative gold border is not sufficient to identify an interactive control.

<!-- PAGEBREAK -->

# 07 / Story, wedding day, travel, and questions

**CONTENT-01 [P1] Our Story.** Publish only couple-approved narrative: approximately 150–250 words, three to five milestones, and up to six selected photographs or original illustrations. No invented relationship history, travel chronology, family information, or photographs. Missing content removes the section cleanly; it does not create a visible placeholder.

**CONTENT-02 [P0] Wedding Day.** Show two distinct event cards: Saint Francis Chapel at 2:00 p.m. and The Grand Hotel at 4:00 p.m., both on 19 December 2026. Each card contains its confirmed address/entrance, local-time label, directions action, and approved arrival, parking, and accessibility notes. Highlight the change of venue. The two-hour interval between start times is not a stated ceremony duration or a confirmed transport plan.

**CONTENT-03 [P0] Travel & Stay.** Prioritize hotel information, getting to Point Clear, and moving between venues. The Grand Hotel’s official contact page lists One Grand Boulevard, Point Clear, AL 36564; this establishes the resort address, not the reception room, guest entrance, or wedding room block. [S5] Obtain coordinator confirmation before publishing event-specific directions.

A hotel card must distinguish “View hotel / general reservations” from “Book our wedding room block.” Publish negotiated rates, room-block code, cutoff date, inclusions, and cancellation conditions only when supplied and approved. Do not invent alternative hotels or airport travel times. Verify any airport or transport recommendation against current official information before release; the hotel’s Getting Here page is a starting source. [S6]

**CONTENT-04 [P0] FAQs and assistance.** Required topics are RSVP deadline/corrections, attendance eligibility, attire, getting between venues, parking, access needs, and contact arrangements. Children and plus-one wording must match the actual invitation policy. Unknown answers remain in the approval register, not as fabricated guest-facing guidance. Meal choices appear only when finalized; access and dietary needs can be raised privately.

**CONTENT-05 [P0] Links and calendars.** Directions use confirmed entrances and ordinary map links, not automatically loaded embedded maps. Provide separate ceremony and reception calendar downloads using the event timezone and stable event identifiers. Where an end time is unknown, omit it rather than invent a duration; validate the resulting start-only entry in calendar clients. A downloaded calendar file is not an automatically updating subscription. [S7]

**CONTENT-06 [P0] Publication control.** Each content block records owner, approval state, source where relevant, and last review date. Changes to time, location, room-block terms, or attendance policies require owner/coordinator approval. Unapproved optional modules and dead links are omitted; missing essential logistics block full guest launch.

<!-- PAGEBREAK -->

# 08 / Invitation access and RSVP behavior

**RSVP-01 [P0] Private household access.** Recommended default: a unique, revocable invitation link for each household, with a manually enterable invitation code as fallback. Successful access unlocks general guest information and that household’s response form. Do not require both a shared website password and a separate household password. Codes must not be predictable from surnames, telephone numbers, or the wedding date.

A household is an explicitly grouped invitation, not a guessed family relationship. The coordinator supplies named guests and their event entitlements. Guests may see and amend only that household’s authorized records. Sharing an invitation link shares access; explain that limitation and support replacement/revocation.

## Form sequence

| Step | Required behavior |
|---|---|
| 1. Confirm invitees | Display only the authorized household. Provide a private correction/contact route; do not expose a public name search. |
| 2. Attendance | Ask for attending/declining for each named person and each invited event. An unanswered choice is never treated as a decline. |
| 3. Practical details | Collect a confirmation email if one is not already supplied. Optional short dietary/access notes; meal choice only for attending guests where configured. |
| 4. Review | Show each guest’s ceremony and reception response and any configured meal choice. Provide direct edit actions before submission. |
| 5. Confirmation | Show a success page only after durable storage. Display a reference, the saved response, and an authorized correction path. |

**RSVP-02 [P0] Entitlements.** Attendance capacity is enforced per named guest and per event on the server. A plus-one is a pre-authorized slot, not an unrestricted number field. Collect its name only if used. The coordinator defines whether children are named invitees; the interface cannot independently add them. Permit different ceremony/reception responses when the invitation permits both.

**RSVP-03 [P0] Conditional fields.** Declining guests skip meal and practical-detail questions. Dietary/access notes are optional and explained as planning information shared only with relevant organizers/providers. Do not request medical diagnoses, dates of birth, passport details, guest addresses, or unnecessary travel itineraries.

**RSVP-04 [P0] Completion and correction.** A household submission requires an explicit decision for every authorized guest/event pair. In-progress editing does not imply attendance. Permit corrections until the configured cutoff; afterward show a contact route. No “maybe” response in MVP. Owners can make an audited correction after cutoff without silently overwriting a guest’s response.

<!-- PAGEBREAK -->

# 09 / Response integrity and coordinator operations

**RSVP-05 [P0] Save safely.** Submit the household response atomically. Use a unique request identifier to make retries idempotent and a response revision to detect concurrent edits. Double-clicking, reconnecting, or retrying a timed-out request must not duplicate attendance. If another device has saved changes, show the latest revision and request review rather than silently overwriting it.

**RSVP-06 [P0] Failure states.** Invalid access, expired sessions, field errors, connection loss, server errors, closed RSVP, and unavailable email all have explicit states. Keep unsent input in page memory where possible; never show “confirmed” before commit. Do not persist sensitive notes in analytics or browser local storage. Provide a coordinator fallback for guests unable to use the form.

**RSVP-07 [P0] Confirmation delivery.** Queue email only after the response transaction commits. Include the date, attendance summary, and safe correction instructions, but omit dietary/access notes. Email failure does not undo a saved RSVP: display the saved result, retry delivery, and flag persistent failures to the coordinator. A mail provider’s acceptance is not proof of inbox delivery. Owner accounts must control the sending identity.

**ADMIN-01 [P0] Minimum administration.** Provide separately authenticated owner and coordinator roles. Owners manage access, imports, content publishing, and export permissions. Coordinators manage attendance and approved logistics within assigned permissions. Named staff accounts and multi-factor authentication are required; a private URL alone is not protection.

**ADMIN-02 [P0] Guest register.** Import CSV with preview and validation before commit. Identify records by immutable IDs, not names or email alone. Flag duplicate IDs, missing invitees, invalid event references, and conflicting updates. Re-import must not reset responses. Allow an owner to add, revoke, or correct an invitation and record a phone/email response on a guest’s behalf with its origin noted.

**ADMIN-03 [P0] Reporting.** Distinguish no response, incomplete household, complete household, attending, and declining. Count people by event, not invitations as people. Export guest/event attendance, authorized plus-one names, and configured meal selections. Dietary/access fields require a separate restricted export. Timestamp exports; neutralize spreadsheet formula injection and record who exported them.

**ADMIN-04 [P0] Practical updates.** A small structured editor must publish FAQs, venue notes, approved hotel links, and an urgent logistics banner without changing code. Keep version history and rollback. Avoid a general-purpose page builder. Automated reminder campaigns are P1; MVP includes a filtered outstanding-response list for owner-managed follow-up.

<!-- PAGEBREAK -->

# 10 / Data model and content contract

## Minimum persistent entities

| Entity | Minimum fields and invariants |
|---|---|
| Household | Immutable ID, display label, contact email if supplied, active/revoked state; no implicit grouping by surname. |
| Guest | Immutable ID, household ID, approved display name, named/plus-one-slot status. |
| Event | Stable ID, display name, venue, start, timezone, optional end, confirmed directions, approval state. |
| Invitation entitlement | Guest ID + event ID; unique pair. Defines what that guest may answer. |
| Response | Entitlement ID, pending/attending/declining, configured meal value, revision, submitted timestamp and origin. One current record per entitlement. |
| Restricted guest needs | Guest ID, optional planning note, allowed recipients, retention date; separate access from general reporting. |
| Access credential/session | Credential digest, household binding, expiry/revocation; server session state. Never store a bearer credential in plaintext logs. |
| Content and operations | Approved content version, editor, timestamps; idempotency records; mail outbox; minimal audit events. |

**DATA-01 [P0] Single source of truth.** Event values must drive the invitation, event cards, confirmation messages, exports, and calendar generation. Do not hard-code independent dates or times into individual components. Derive response completeness and event counts from entitlements and responses, not manually editable totals.

| Configuration key | Initial value or required state |
|---|---|
| `couple.displayName` | `Robert and Natalie` |
| `wedding.date` / `timezone` | `2026-12-19` / `America/Chicago` |
| `ceremony.startsAt` | `2026-12-19T14:00:00-06:00` |
| `reception.startsAt` | `2026-12-19T16:00:00-06:00` |
| `ceremony.venue` / `reception.venue` | `Saint Francis Chapel` / `The Grand Hotel` |
| `endsAt`, confirmed entrances, `rsvp.cutoffAt` | Null until approved; do not substitute invented defaults. |
| `closingLine` | Exact approved Moeli / Bahia Del Espiritu Santo wording. |
| Room block, dress code, children, transport | Approval required; optional features disabled until resolved. |

**DATA-02 [P0] Validation.** Enforce referential integrity, allowed state transitions, event eligibility, configured meal values, and household ownership in trusted server code and database constraints. Store timestamps consistently and preserve the event timezone separately. Record the actor and changed field names for audit without copying sensitive free text into audit trails.

**DATA-03 [P0] Environment separation.** Use synthetic guests in candidate proofs, development, and staging. Production personal data must not be copied into source control, public preview builds, or AI prompts. The accompanying configuration example contains no guest data or credentials and is not launch-ready content.

<!-- PAGEBREAK -->

# 11 / Architecture and integration requirements

## Recommended implementation, subject to technical approval
Use a small TypeScript/Next.js application, managed PostgreSQL, private object storage, and a transactional email provider behind a narrow adapter. Supabase is a candidate managed backend, not a required purchase. The product contract takes precedence over specific vendors; the engineer must document the chosen supported versions, authorization design, operating cost, and backup capability before implementation. The front-end foundation must pass Section 05/G2. A template-driven architecture change requires an explicit impact assessment and approval; do not adopt a different hosting platform or stack by default.

**ARCH-01 [P0] Trust boundaries.** Browser → authenticated server endpoints → database/storage/mail outbox. The browser receives only the current household’s permitted data. Keep guest credentials, administrative secrets, service keys, and data-access logic server-side. If using Next.js, follow its current server-side data-security guidance rather than assuming that a hidden component or server action is automatically authorized. [S8]

**ARCH-02 [P0] Database isolation.** Apply deny-by-default authorization to every read, mutation, export, and asset access. If Supabase’s exposed APIs are used, enable and test appropriate row-level policies; service-role credentials must never reach a browser. Application-level checks remain mandatory, particularly on privileged server paths. [S9–S10]

**ARCH-03 [P0] Transaction boundary.** Attendance changes, revision increments, and the confirmation-outbox record commit together. A background worker sends queued mail with retries and deduplication. Specify maximum retry age and coordinator alerting. Database truth, not email delivery, determines whether an RSVP exists.

**ARCH-04 [P0] Content delivery.** Server-render meaningful guest information after authorized access. Do not hide private content with CSS or client-only routing. Return private/no-store cache policies for household data; test that one household’s response cannot be served from another household’s cache. Public decorative assets may be cached; sensitive content and exports may not.

**ARCH-05 [P0] External services.** Prefer external directions and hotel links over embedded tracking-heavy widgets. Calendar downloads must follow iCalendar requirements and be tested in Apple, Google, and Outlook clients. [S7] No third-party booking or map service receives guest RSVP data merely because its link is present.

**ARCH-06 [P0] Owner control and portability.** Domain, hosting, database, mail, storage, and repository access must reside in owner-controlled accounts. Deliver source, deployment instructions, schema migrations, dependency lockfile, content export, asset manifest, a credential-free environment template, and the Section 05 selection/approval record with applicable license provenance. Do not require the original developer’s personal account to keep the website running.

**Architecture restraint:** no microservices, Kubernetes, full CMS, or 3D rendering infrastructure unless separately justified and approved. One maintainable application is the intended baseline.

<!-- PAGEBREAK -->

# 12 / Security, privacy, and retention

**SEC-01 [P0] Visibility decision.** Recommended policy: public entry displays only approved names/crest; wedding logistics, household details, and RSVPs require invitation access. Record owner approval before launch. Search-engine noindex directives are supplementary and are not an access-control mechanism. Public previews, page metadata, pre-rendered HTML, source maps, images, and calendar endpoints must not leak protected details.

**SEC-02 [P0] Credential handling.** Use cryptographically random household credentials; links should carry at least 128 bits of entropy. Store their digests, scope them to one household, and allow expiry/revocation. Manually entered fallback codes require adequate entropy and rate limiting. A link-preview GET must not consume a credential or modify attendance. Establish the session through an explicit action, remove credentials from the visible URL, redact request logs, and prevent referrer leakage.

**SEC-03 [P0] Session and request security.** Use HTTPS, secure HttpOnly cookies, appropriate SameSite/CSRF protection, rate limits, validated server inputs, output encoding, restrictive security headers, and tested authorization on every request. Owner/coordinator authentication is distinct from guest access. Deny unauthorized object access even when an attacker knows a valid database ID. [S10]

**SEC-04 [P0] Minimize exposure.** No public guest list, advertising pixels, session replay, or behavioral profiling. Diagnostic events must omit names, emails, invitation credentials, and free text. The default has no nonessential tracking. A privacy notice explains purpose, recipients, hosting providers, contact route, and deletion arrangements; do not claim legal compliance without reviewing the actual implementation.

**SEC-05 [P0] Restricted information.** Treat dietary/access notes as potentially sensitive. Capture only what guests volunteer for planning, with clear purpose wording. Exclude these notes from confirmation emails, general exports, and ordinary audit logs. Release relevant extracts only to named organizers or service providers who need them; explain this sharing at collection.

**SEC-06 [P0] Proposed retention.** Seek owner approval to delete guest response/contact data and restricted notes from the live system 90 days after the wedding. Provider backups must age out within a further 30 days, or the notice and retention plan must be revised before launch. Reapply deletion rules after restores. Owner-requested archival exports must be separately documented; do not silently preserve everything forever.

**SEC-07 [P0] Recovery.** Encrypt stored data and backups using the selected service’s supported controls. Take daily recoverable backups; proposed recovery objectives are no more than 24 hours of lost updates and restoration within 4 hours. Test a restore before launch and document the manual RSVP fallback. These are requirements to validate, not guarantees already provided by a vendor.

<!-- PAGEBREAK -->

# 13 / Accessibility, performance, and compatibility

**NFR-01 [P0] Accessibility target.** Meet WCAG 2.2 AA for applicable guest and administration flows. Validate manually as well as with automated tools. Use semantic headings, meaningful labels, visible keyboard focus, accessible errors/status announcements, proper alternative text, and a skip link. Keep decorative flourishes out of the accessibility tree. [S11]

| Area | Product requirement and test approach |
|---|---|
| Text and contrast | At least 4.5:1 for normal text and 3:1 for qualifying large text; validate final gold headings, controls, and focus states rather than relying on palette names. [S11] |
| Reading and reflow | No loss of information at 200% text zoom; verify reflow at 320 CSS pixels and applicable 400% zoom behavior. No horizontal compression of script lettering. |
| Controls | Prefer at least 44 × 44 CSS-pixel tap areas. This is a product target, not a claim that WCAG AA requires that size universally. |
| Motion | Respect reduced-motion settings; no required drag, hover, tilt, or animation to access content. |
| Load experience | Target LCP ≤2.5 seconds, INP ≤200 milliseconds, and CLS ≤0.1 at the 75th percentile when sufficient field data exists. [S12] |
| Transfer budget | Proposed initial guest-page transfer ≤1.5 MB; initial compressed JavaScript ≤200 KB. Lazy-load noncritical photographs; reserve media dimensions. |
| RSVP service | Proposed 95th-percentile database-confirmed save ≤1.5 seconds at 50 concurrent guest sessions, excluding a visitor’s connection. Email is asynchronous. |
| Reliability | Proposed 99.9% monthly availability after launch; error monitoring and a named incident contact. Test critical operations rather than claiming availability in advance. |

**NFR-02 [P0] Test conditions.** Before launch, record five cold-cache mobile performance runs on a production-equivalent build, including the authenticated guest route and RSVP page. Report the test profile and actual results. Lab tests do not establish real-world 75th-percentile INP; if traffic is too low for field statistics, disclose that limitation and retain lab interaction tests.

**NFR-03 [P0] Device coverage.** Test current and preceding major versions of Safari/iOS, Chrome/Android, Chrome desktop, Edge, and Safari/macOS at launch. Include 320, 390, 768, and 1440-pixel layouts; keyboard-only navigation; VoiceOver and NVDA; reduced motion; and constrained bandwidth. Use the G2-approved visual baseline for regression review; initial selection tests do not replace release testing.

**NFR-04 [P0] Planning assumptions.** Initially test for up to 1,000 named guests and 50 concurrent sessions; these are engineering envelopes, not an assumed wedding size. Reconfirm the actual guest count at kickoff. Self-host licensed webfonts, provide readable fallbacks, and never block essential content while custom lettering loads.

<!-- PAGEBREAK -->

# 14 / Acceptance-test matrix

All P0 requirements are mandatory. AT-17–22 are pre-build selection gates; retain their pass evidence for release. AT-01–16 are the minimum product acceptance suite, supplemented by visual, accessibility, and security testing. All applicable cases must pass before guest release. Use synthetic guest fixtures: one individual, a couple, a named family, an authorized plus-one, and a guest invited to only one event.

| Test | Scenario and expected result | Requirement |
|---|---|---|
| AT-01 | Compare desktop/mobile build with the G2-approved proof and original artwork. Original crest detail survives; no red copy; no distorted names; closing line wraps at matching size. | DES-01–04; TPL-10 |
| AT-02 | Change the test ceremony start once in configuration. Invitation, schedule, confirmation, and calendar agree. | DATA-01 |
| AT-03 | Guest locates date, ceremony, hotel information, and RSVP without reading the story or completing an animation. | IA-01; HOME-02 |
| AT-04 | Valid household access reveals only that household. Invalid/revoked access reveals no guest existence or protected content. | RSVP-01; SEC-01–03 |
| AT-05 | Manipulate guest/event IDs and query protected APIs, assets, exports, and caches. Cross-household access is denied. | ARCH-02/04; SEC-03 |
| AT-06 | Named guests choose different responses by event. Counts and household completeness reconcile exactly. | RSVP-02/04; ADMIN-03 |
| AT-07 | Attempt unauthorized plus-ones, extra children, uninvited events, and invalid meals. Server rejects them. | RSVP-02; DATA-02 |
| AT-08 | Decline all events. No meal/access questions are required; a valid decline is saved. | RSVP-03 |
| AT-09 | Double-click, retry after timeout, and lose connectivity during save. At most one committed revision per request; no false success. | RSVP-05/06 |
| AT-10 | Edit in two browser sessions. A stale revision cannot overwrite newer responses silently. | RSVP-05 |
| AT-11 | Disable email delivery. RSVP remains saved, retry is queued, and coordinator sees the delivery issue. | RSVP-07; ARCH-03 |
| AT-12 | Test immediately before/after cutoff in event-local time. Guest editing closes correctly; audited admin correction remains possible. | RSVP-04 |
| AT-13 | Import then re-import roster. Existing responses persist. General exports exclude restricted notes and neutralize formula cells. | ADMIN-02/03 |
| AT-14 | Open maps and calendar files on target devices. Correct venue entrance and 2:00/4:00 p.m. local starts; no invented end time. | CONTENT-02/05 |
| AT-15 | Complete access, RSVP, errors, and correction using keyboard and screen reader; test zoom and reduced motion. | NFR-01/03 |
| AT-16 | Restore backup, revoke an invitation, roll back a content change, and exercise fallback response capture. | SEC-07; ADMIN-04 |

<!-- PAGEBREAK -->

## Selection and pre-build acceptance

These process tests are completed during Section 05, before the corresponding approval gate. Their evidence is part of the release record; a later material foundation change reopens the affected tests.

| Test | Scenario and expected result | Requirement |
|---|---|---|
| AT-17 | Inspect search and candidate register. Six to eight credible options were screened where available; three distinct alternatives include a custom benchmark, or an explicit owner exception explains a shortage. | TPL-01–04 |
| AT-18 | Review source/rights/build evidence. Selected source and component licenses are recorded; clean build is reproduced; all mandatory gates pass. Publisher claims and uninspected source are not marked verified. | TPL-04–06 |
| AT-19 | Recompute the weighted scorecard and effort comparison. Weights total 100%; missing evidence is not renormalized; keep/adapt/replace and common backend effort are explicit; no unverified total is presented as final. | TPL-07–08 |
| AT-20 | Inspect all three comparable branded proofs at 320/390/768/1440 pixels. Original assets and exact copy are used; synthetic guest data and concept/runtime status are explicit. Selected working proof and baseline are recorded. | TPL-09–10 |
| AT-21 | Attempt to advance with only concept approval or an unresolved selected-source gate. Production build remains blocked until G2; paid purchases require named-item approval; no self-approval by the agent. | TPL-05–06/11 |
| AT-22 | Review decision record and simulate a material foundation/typeface change. Approvers, source revision, baseline, costs, and remediation are recorded; affected approvals reopen; unchanged product requirements remain binding. | TPL-12; OPS-01 |

**Selection completion does not establish product completion.** A passing prototype or template build does not certify household privacy, durable RSVP storage, usable coordinator tools, validated venue directions, or production performance. Retest those flows in the actual integrated application.

**Pass evidence:** record candidate/build identifier, source revision where applicable, environment, tester, date, result, and screenshot/log where appropriate. Record the owner decision and approver separately from technical test results. A fixed defect requires a rerun of affected cases. No production guest data should appear in shared QA evidence.

<!-- PAGEBREAK -->

# 15 / Delivery plan and implementation risks

## Proposed delivery baseline
Allow **25 working days from approval of scope and essential inputs**, replacing the v1.0 estimate of 20 working days to accommodate comparative proofs, source validation, and explicit approvals. This remains a planning estimate, not a delivery guarantee. It assumes an experienced designer/developer, three narrowly scoped proofs rather than full alternative builds, prompt feedback, available source, and no custom illustration delays. Re-estimate at G2 if template remediation or the selected guest-system work exceeds the allowance.

| Stage | Indicative window | Exit condition |
|---|---|---|
| Inputs and preliminary architecture | Days 1–3 | Artwork, budget, owner accounts, privacy direction, guest model, essential inputs, and evaluation authority confirmed. |
| Discovery and screening | Days 4–5 | Candidate register, source/rights status, preliminary gates, and three-option shortlist including custom benchmark. |
| Comparative branded proofs | Days 6–8 | Common-scope mobile/desktop proofs, scorecard, effort comparison, and G1 concept decision; any specific purchase authorized separately. |
| Selected-source validation and baseline | Days 9–10 | Source acquired where approved; clean build and rights checks; updated working proof, scorecard, architecture, remediation, and G2 sign-off. |
| Core implementation | Days 11–16 | P0 guest experience, household authorization, database, RSVP, and coordinator tools operate with synthetic fixtures. |
| Content and integration | Days 17–19 | Approved content and roster import tested; directions/calendar/email verified; essential links signed off. |
| QA and pilot | Days 20–23 | Product and selection evidence complete; accessibility/security review, recovery test, and six-person usability pilot pass. |
| Guest launch and handover | Days 24–25 | G3/release approval; production smoke test; monitoring, account access, and complete handover package in place. |

**Critical dependency:** inputs → screened shortlist → comparable proofs/G1 → licensed-source validation/G2 → integrated guest system → approved content and full acceptance → G3. Allow owner/procurement waiting time separately; it extends calendar elapsed time, not the tested scope. A source failure returns the affected candidate to selection. The wedding remains 19 December 2026; agree the guest-launch date against invitation distribution and the still-unconfirmed RSVP cutoff. Do not back-solve a launch date by removing privacy, accessibility, or recovery checks.

P1 work begins only where P0 progress permits. If illustration, story copy, or optional photography is late, launch without those sections. Do not trade away invitation integrity, response accuracy, or access controls to preserve an arbitrary visual deadline.

<!-- PAGEBREAK -->

## Delivery risks and controls

| Risk | Required control |
|---|---|
| Crest/lettering drift during reconstruction | Original crest is authoritative; approve a static visual proof before interaction work. |
| Unconfirmed address, room block, or transport | Coordinator owns verification. Essential missing details block full guest launch; no plausible-looking filler. |
| Private invitation link is forwarded | Explain bearer access, keep access household-scoped, and support immediate revocation/reissue. |
| Email delay or spam filtering | Database-backed on-screen confirmation; verified sending setup; retries and coordinator visibility. |
| Overbuilt motion or storytelling | Explicit P1 status, performance budget, static fallback, and no mandatory animation. |
| RSVP change lost or overwritten | Atomic writes, idempotent requests, revision checks, backup/restore test. |
| Vendor/developer dependency | Owner-controlled accounts, source and data exports, deployment runbook, and documented support ownership. |
| Attractive demo but unavailable/unsuitable source | Keep claims provisional; explicit purchase approval; inspect/build actual source before G2; retain the custom alternative. |
| Styling work erases apparent template savings | Compare equal-scope keep/adapt/replace estimates including remediation and common backend work; re-estimate at G2. |
| Comparison/procurement or owner approval delays | Time-box proof scope, name the approver, expose waiting time, and do not spend or proceed without the appropriate gate. |
| Unlicensed assets or template RSVP mismatch | Record component/font/media rights; replace unclear assets; implement and test the PRD guest system independently. |

**Budget requirement:** obtain approval for the comparison/prototype effort, build cost, any template/component license, and recurring domain, hosting, database/backup, mail, font, and optional media costs. G1 authorizes a specific acquisition, not a blanket purchasing budget. No vendor price, selected template, or account ownership is established by this PRD.

<!-- PAGEBREAK -->

# 16 / Decisions, launch gates, and handover

## Owner/coordinator decisions still required

| Decision | Owner | Required by |
|---|---|---|
| Domain, budget, operator, and account ownership | Robert / Natalie | Kickoff |
| Invitation-only visibility and credential delivery method | Robert / Natalie | Architecture approval |
| Guest roster, household groupings, event entitlements, children/plus-one policy | Couple / coordinator | RSVP implementation and import |
| RSVP cutoff and post-cutoff contact route | Couple / coordinator | Guest launch |
| Exact chapel address/entrance; reception room/entrance; arrival/access/parking instructions | Coordinator / venues | Directions and guest launch |
| Confirmed room block or approval to show general hotel information only | Couple / hotel | Travel publication |
| Dress code, inter-venue transport, meal questions, and any extra events | Couple / coordinator | Relevant content publication |
| Three-option concept choice and any paid acquisition | Couple / recorded delegate | G1; before purchase |
| Selected foundation, source/license checks, architecture, effort and working visual baseline | Couple / technical lead | G2; before production commitment |
| Typeface proof, usable artwork, photography permissions, optional story | Couple / designer | G2 or optional-module approval |
| Data recipients, retention, support ownership, and post-event plan | Couple / operator | Guest launch |

The names, date, venue names, stated start times, closing phrase, original-color crest, and charcoal/gold/ivory direction are already established and should not be reopened by default.

<!-- PAGEBREAK -->

## Release gate and complete handover
**RELEASE-01 [P0].** G3 authorizes guest release only after G1/G2 decisions and Section 05 evidence are recorded, the owners approve the working visual baseline and content, and all applicable P0 tests pass; essential decisions are resolved; the production guest list has been reconciled; live credentials and roles have been verified; email, maps, and calendars work; and recovery plus manual fallback have been tested. No draft labels, fabricated reviews, demo guests, broken buttons, or unresolved essential placeholders may appear to guests.

## Handover and lifecycle
**OPS-01 [P0].** Deliver the deployed website, repository, design tokens, approved asset manifest, font/template/component-license records, database migrations/export procedure, synthetic test fixtures, test results, account-access register, and operating runbook. Include the candidate register, scorecard/evidence, three branded proofs, selected source/build record, keep/adapt/replace estimates, G1/G2 decisions, approved visual baseline, and subsequent change approvals. Preserve evidence of rejected options; do not deliver an empty decision template as if selection were complete. Document how to correct an RSVP, issue/revoke access, export safe lists, update urgent logistics, restore a backup, and take the site offline. Transfer secrets separately through an approved secure method.

**OPS-02 [P0].** Maintain pre-event mode and an owner-controlled wedding-day logistics banner. Immediately before invitation distribution and again before the wedding, the operator rechecks critical links and approved information. Do not silently publish a new timetable from a calendar integration or external source.

**OPS-03 [P0].** After the wedding, close guest editing and replace RSVP calls to action with approved thank-you content. Photographs remain P2 and require consent/rights and a visibility decision. Complete the approved data-retention process and offer the owners a static, guest-data-free keepsake export. This document specifies operations; it does not schedule or perform them.

## Reissued handoff package
The package includes this complete PRD in Word and Markdown, `AGENT_START_HERE.md`, `CHANGELOG_v1_1.md`, the unchanged original artwork, updated document-version metadata in `content-config.example.json`, the asset manifest, and blank selection-evaluation/decision-record starters. The JSON content schema remains 1.0; document version is 1.1. Starter selection scores, findings, source links, and approvals are unpopulated because selection has not yet occurred. No font files, paid template code, guest roster, or credentials are supplied.

<!-- PAGEBREAK -->

# 17 / Sources and asset register

The source register below is retained from v1.0, which records research checks on **21 September 2026**. This reissue adds an implementation-selection workflow; it does not independently revalidate every external link or conduct a new template competition. Recheck candidate availability, licenses, supported dependencies, and guest-facing travel information during implementation. References support the observed design patterns, published venue information, and technical standards; the product’s scope, priorities, numeric service budgets, delivery estimate, and proposed privacy defaults are recommendations, not claims that the reference sites used or achieved them.

| ID | Reference and use |
|---|---|
| S1 | [Veley/Ross wedding website](https://veleyross.wedding/) — destination content, travel organization, and repeated RSVP access. |
| S2 | [Sarah & Matt wedding website](https://www.sarahandmatt.wedding/) — story, celebration, travel, and response navigation. |
| S3 | [One Page Love: Sarah & Matt](https://onepagelove.com/sarah-matt-wedding) — documented interactive invitation hero and editorial design. |
| S4 | [One Page Love: Jess & Russ](https://onepagelove.com/jess-russ) — preserved illustrated timeline; original link identified as offline/redesigned. |
| S5 | [The Grand Hotel: Contact Us](https://www.grand1847.com/about/Contact-Us-148.html) — published resort address, not wedding-specific arrangements. |
| S6 | [The Grand Hotel: Getting Here](https://www.grand1847.com/about/GettingHere-137.html) — starting point for current travel verification. |
| S7 | [IETF / RFC Editor: RFC 5545](https://www.rfc-editor.org/info/rfc5545/) — iCalendar event representation; check applicable updates. |
| S8 | [Next.js: Data Security](https://nextjs.org/docs/app/guides/data-security) — server-side data and authorization boundaries. |
| S9 | [Supabase: Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) — database isolation if this backend is selected. |
| S10 | [OWASP: Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html) — deny-by-default and per-request access checks. |
| S11 | [W3C: WCAG 2.2 Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/) — applicable accessibility success criteria. |
| S12 | [web.dev: Web Vitals](https://web.dev/articles/vitals) — LCP, INP, CLS, and field-measurement thresholds. |
| S13 | [Google Fonts: Pinyon Script](https://fonts.google.com/specimen/Pinyon+Script) — candidate for visual proof only. |
| S14 | [Google Fonts: Cormorant Garamond](https://fonts.google.com/specimen/Cormorant+Garamond) — candidate for visual proof only. |

## Provided artwork and precedence
**A1 — `assets/coulson-crest-original.jpg`.** Original user-supplied heraldic artwork; authoritative for crest detail, colors, monogram, proportions, and ribbon. Preserve rather than redraw. Original filename: `heZe4.jpg`.

**A2 — `assets/invitation-approved-charcoal.png`.** Latest invitation, showing the requested charcoal text and original-color crest; authoritative for the overall visual direction. Original filename: `elegant_ivory_wedding_invitation_with_gold_filigre.png`.

**A3 — original Noah Feldman invitation reference.** Governs stylistic inspiration only; its names, wording, crest, and other personal details must not be reused. Not included in the handoff package because A1/A2 and this specification provide the required implementation basis.

If A1 and a generated invitation version differ in heraldic detail, preserve A1 and obtain owner approval of the composite. No font files are supplied. Optional images, illustrations, final webfonts, venue-specific directions, and the approved guest roster remain separately required inputs.
