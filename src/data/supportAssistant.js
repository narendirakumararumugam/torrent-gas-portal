export const supportChatQuickPrompts = [
  'Why is my bill higher this month?',
  'How do I raise a complaint?',
  'What is the current tariff rate?',
  'Show my connection status',
];

const supportChatResponses = [
  {
    keywords: ['bill', 'invoice', 'payment', 'due'],
    response:
      'Your latest bill shows the expected split across MGO, Non-MGO, and Excess usage. Higher charges usually come from a larger share of Excess slab consumption or delayed payment penalties.',
  },
  {
    keywords: ['tariff', 'rate', 'price'],
    response:
      'The active tariff view shows the current month pricing dashboard with a trend chart and slab-wise rate cards. Use the Tariff Information page for detailed slab rates and historical movement.',
  },
  {
    keywords: ['complaint', 'ticket', 'grievance', 'support'],
    response:
      'You can raise a new complaint from Register Complaint. For urgent issues, use the 24/7 hotline shown below. I can also help summarize the right category before submission.',
  },
  {
    keywords: ['connection', 'status', 'meter', 'pipeline'],
    response:
      'Your connection status is currently active. If you are checking a live issue, the support team can verify meter status, pipeline availability, and service interruptions.',
  },
  {
    keywords: ['contract', 'agreement', 'terms'],
    response:
      'The contract summary page shows the current agreement terms, off-take obligations, and slab definitions. Ask me for a plain-language summary if you want the clauses broken down.',
  },
  {
    keywords: ['outage', 'leak', 'emergency', 'safety'],
    response:
      'For any suspected gas leak, service interruption, or safety issue, stop normal operations and call the 24/7 emergency hotline immediately. This assistant is for guidance only and cannot replace urgent field support.',
  },
];

export function buildSupportReply(message) {
  const normalized = message.trim().toLowerCase();

  if (!normalized) {
    return 'Please type a question about billing, tariff rates, complaints, or connection status.';
  }

  const matchedResponse = supportChatResponses.find(({ keywords }) => keywords.some((keyword) => normalized.includes(keyword)));

  if (matchedResponse) {
    return matchedResponse.response;
  }

  return (
    'I can help with bills, tariff prices, complaints, contract terms, connection status, and urgent support routing. ' +
    'Try asking something like "Why is my bill higher this month?" or "How do I raise a complaint?"'
  );
}
