export const EXTERNAL_DOMAIN = 'https://endlesssparkcreativehub.in';

export function getExternalUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${EXTERNAL_DOMAIN}${cleanPath}`;
}

export const DEFAULT_GENERAL_TEMPLATE = `🎥 *Watch Course Promotion Video:* {promoVideoUrl}

*Hello!* 👋

Welcome to *Endless Spark School of Printing and Packaging*!

We are excited to share an amazing opportunity to transform your career! 🚀

*Modes of Study Available:*
📍 *Offline Classes*: Practical, hands-on physical labs and classroom training.
💻 *Online Classes*: Learn from anywhere with our advanced interactive student app.

*Explore our industry-leading courses:*
{courseList}

*How Our Dedicated Learning App Helps You Excel Online:*
🧠 *Interactive AI Mind Maps*: Simplify complex technical concepts with visual structures.
📋 *Digital Project Checklists*: Work on real-world Pre-Flight & QC checklists dynamically.
🎥 *Secure Video Hub*: Replay recorded lectures anytime with lightning-fast streaming.
💬 *Live Queries Resolver*: Raise doubts via our support catalog and get timely solutions from faculty.

Ready to get started or learn more? 
👉 Fill out this quick inquiry form and we'll get right back to you:
{inquiryUrl}

📞 Or reach us directly on Call / WhatsApp: *+91 90428 21999*

Let’s build your future together! 🌟

Best,
The Admissions Team`;

export const DEFAULT_COURSE_PROMO_TEMPLATE = `🎬 *Course Promotion Video:* {promoVideoUrl}

*Transform Your Career with Endless Spark School of Printing & Packaging!* 🚀

Watch our live course demonstration & student walkthrough video above!

*What you will master:*
✨ Production art & Pre Press (Repro)
✨ 100% Practical Industrial Checklists & AI Tools
✨ Live Lab Access + Online Companion App

👉 *Fill Inquiry Form:* {inquiryUrl}
📞 *Call / WhatsApp:* +91 90428 21999`;

export const DEFAULT_WEBINAR_TEMPLATE = `🎥 *Watch Course Promotion Video:* {promoVideoUrl}

*Endless Spark School Admission Invitation!* 👋 

Hello [Name]!

Congratulations, your live webcast pass for *[WebinarTitle]* is ready.

🗓️ Batch Date: *[WebinarDate]*
⏰ Live Stream: *[WebinarTime]*
🎟️ Secure ticket: *[TicketCode]*

💡 *How our customized app environment helps you learn online:*
- Visual preflight simulator directly inside your browser
- Instant offset digital production color matching tool
- Daily technical puzzles and pre-press validation checklist

Reply with "YES" to schedule your live app setup walkthrough with our specialists.

📞 Or reach us directly on Call / WhatsApp: *+91 90428 21999*`;

export const DEFAULT_REMOTE_LEARNING_TEMPLATE = `🎥 *Watch Course Promotion Video:* {promoVideoUrl}

*Learn Printing & Packaging Engineering remotely* 🚀

Our school companion app replaces dry theory with live engineering action:

1. *Interactive Lab walkthroughs* — Master pre-press layout prep visually on any mobile screen.
2. *Real-time digital audits* — Submit work files directly inside of our preflight tracker.
3. *Expert Pre-Press guidance* — Access live Q&As whenever you encounter production blockers.

Join the admission webinar on *[WebinarDate]* to explore these tools in action!

📞 Contact / WhatsApp: *+91 90428 21999*`;

export interface TemplateVariables {
  promoVideoUrl?: string;
  inquiryUrl?: string;
  courses?: any[];
  webinarTitle?: string;
  webinarDate?: string;
  webinarTime?: string;
  name?: string;
  ticketCode?: string;
}

export function formatCourseList(courses?: any[]): string {
  if (courses && courses.length > 0) {
    return courses.map(c => `🎓 ${c.title}`).join('\n');
  }
  return `🎓 Packaging Engineer
🎓 Production Art Engineer
🎓 Print Ready Engineer
🎓 Plate Ready Engineer
🎓 Colour Retouching Engineer
🎓 Quality Control Engineer
🎓 Printing & Packaging Cross Courses`;
}

export function resolveTemplateText(
  rawTemplate: string | undefined,
  defaultTemplate: string,
  vars: TemplateVariables
): string {
  let text = (rawTemplate && rawTemplate.trim().length > 0) ? rawTemplate : defaultTemplate;

  const promoUrl = vars.promoVideoUrl || 'https://youtu.be/vMl8FHK75HM';
  const inqUrl = vars.inquiryUrl || `${EXTERNAL_DOMAIN}/inquiry`;
  const courseStr = formatCourseList(vars.courses);

  text = text.replace(/\{promoVideoUrl\}/g, promoUrl);
  text = text.replace(/\{inquiryUrl\}/g, inqUrl);
  text = text.replace(/\{courseList\}/g, courseStr);

  if (vars.webinarTitle) {
    text = text.replace(/\[WebinarTitle\]/g, vars.webinarTitle);
  }
  if (vars.webinarDate) {
    text = text.replace(/\[WebinarDate\]/g, vars.webinarDate);
  }
  if (vars.webinarTime) {
    text = text.replace(/\[WebinarTime\]/g, vars.webinarTime);
  }
  if (vars.name) {
    text = text.replace(/\[Name\]/g, vars.name);
  }
  if (vars.ticketCode) {
    text = text.replace(/\[TicketCode\]/g, vars.ticketCode);
  }

  return text;
}
