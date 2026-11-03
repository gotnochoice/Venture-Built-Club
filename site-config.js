/*
 * Venture Built: homepage configuration
 * Flip these without touching the page markup. Defaults are the safe ones
 * (applications closed, no unverified claims). The HTML itself ships in the
 * safe state, so the page reads correctly even if this file fails to load.
 */
window.siteConfig = {
  // false -> button reads "Applications opening soon", disabled, no link
  cohort: { applicationsOpen: false },

  // access "apply" -> "Apply to the Club"; "open" -> "Join the Club".
  // For "apply", applicationsOpen:false shows the disabled "Applications opening soon".
  club: { access: "apply", applicationsOpen: false },

  features: {
    whatsappFoundersCopy: true,      // false -> "A WhatsApp community for student builders"
    investorIntroductionLine: false, // controls last sentence of the "Is Venture Built free?" FAQ answer
    coBuildersSpace: true,           // Hub bullet + related FAQ sentence: true/false per what is live
    hubSharingSpace: true            // Hub bullet: true/false per what is live
  },

  routes: {
    founders: "/join-us",            // TODO: confirm destination. Do not point at /problems-to-solve unless it lets founders contribute
    investors: "/investor-network",
    partners: "/partners",
    contactEmail: "venturebuiltclub@gmail.com"
  }
};
