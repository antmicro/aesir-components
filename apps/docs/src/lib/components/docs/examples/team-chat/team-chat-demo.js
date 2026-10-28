export const people = {
  morgan: { name: 'Morgan Chen', role: 'Product design', presence: 'online', email: 'morgan.chen@example.com', phone: '+1 202-555-0101', timezone: 'America/New_York' },
  sam: { name: 'Sam Rivera', role: 'Frontend engineering', presence: 'away', email: 'sam.rivera@example.com', phone: '+1 202-555-0102', timezone: 'Europe/London' },
  jules: { name: 'Jules Martin', role: 'Design systems', presence: 'offline', email: 'jules.martin@example.com', phone: '+1 202-555-0103', timezone: 'Europe/Paris' },
  you: { name: 'Alex Johnson', role: 'Software engineering', presence: 'online', email: 'alex.johnson@example.com', phone: '+1 202-555-0104', timezone: 'Europe/Warsaw', status: '' },
  taylor: { name: 'Taylor Brooks', role: 'Quality engineering', presence: 'online', email: 'taylor.brooks@example.com', phone: '+1 202-555-0105', timezone: 'Europe/Berlin' },
  riley: { name: 'Riley Park', role: 'Product management', presence: 'away', email: 'riley.park@example.com', phone: '+1 202-555-0106', timezone: 'America/Los_Angeles' },
  casey: { name: 'Casey Nguyen', role: 'UX research', presence: 'online', email: 'casey.nguyen@example.com', phone: '+1 202-555-0107', timezone: 'Europe/London' },
  jordan: { name: 'Jordan Ellis', role: 'Platform engineering', presence: 'offline', email: 'jordan.ellis@example.com', phone: '+1 202-555-0108', timezone: 'America/New_York' },
  avery: { name: 'Avery Patel', role: 'Technical writing', presence: 'online', email: 'avery.patel@example.com', phone: '+1 202-555-0109', timezone: 'Europe/Warsaw' },
  robin: { name: 'Robin Kim', role: 'Customer support', presence: 'away', email: 'robin.kim@example.com', phone: '+1 202-555-0110', timezone: 'Asia/Seoul' },
  drew: { name: 'Drew Wilson', role: 'Infrastructure', presence: 'offline', email: 'drew.wilson@example.com', phone: '+1 202-555-0111', timezone: 'Europe/Paris' },
  quinn: { name: 'Quinn Garcia', role: 'Security engineering', presence: 'online', email: 'quinn.garcia@example.com', phone: '+1 202-555-0112', timezone: 'America/Chicago' },
  nina: { name: 'Nina Kowalska', role: 'Mobile development', presence: 'online', email: 'nina.kowalska@example.com', phone: '+1 202-555-0113', timezone: 'Europe/Warsaw' },
  leo: { name: 'Leo Santos', role: 'Data analytics', presence: 'away', email: 'leo.santos@example.com', phone: '+1 202-555-0114', timezone: 'America/Sao_Paulo' },
  zoe: { name: 'Zoë Fischer', role: 'Content design', presence: 'offline', email: 'zoe.fischer@example.com', phone: '+1 202-555-0115', timezone: 'Europe/Berlin' },
  omar: { name: 'Omar Hassan', role: 'Customer success', presence: 'online', email: 'omar.hassan@example.com', phone: '+1 202-555-0116', timezone: 'Asia/Dubai' }
};

export const presenceLabels = { online: 'Available', away: 'Away', offline: 'Offline' };

export const conversations = [
  { id: 'design-system', name: 'design-system', type: 'channel', description: 'Components, patterns, and the details in between.', members: ['morgan', 'sam', 'jules', 'you'], unread: 3 },
  { id: 'general', name: 'general', type: 'channel', description: 'A little bit of everything. Everyone is welcome.', members: ['morgan', 'sam', 'jules', 'you'], unread: 0 },
  { id: 'engineering', name: 'engineering', type: 'channel', description: 'What we are building, and how we are building it.', members: ['sam', 'jules', 'you'], unread: 2 },
  { id: 'random', name: 'random', type: 'channel', description: 'The important things that are not work.', members: ['morgan', 'sam', 'jules', 'you'], unread: 0 },
  { id: 'dm-morgan', name: people.morgan.name, type: 'direct', description: people.morgan.role, members: ['morgan', 'you'], unread: 1 },
  { id: 'dm-sam', name: people.sam.name, type: 'direct', description: people.sam.role, members: ['sam', 'you'], unread: 0 },
  { id: 'dm-jules', name: people.jules.name, type: 'direct', description: people.jules.role, members: ['jules', 'you'], unread: 0 },
  { id: 'product', name: 'product', type: 'channel', description: 'Priorities, decisions, and what comes next.', members: ['you', 'riley', 'leo', 'morgan'], unread: 1 },
  { id: 'research', name: 'research', type: 'channel', description: 'Customer interviews and the things we are learning.', members: ['you', 'casey', 'zoe', 'morgan'], unread: 0 },
  { id: 'release-planning', name: 'release-planning', type: 'channel', description: 'A shared checklist for a calm launch.', members: ['you', 'riley', 'taylor', 'nina', 'drew'], unread: 2 },
  { id: 'customer-feedback', name: 'customer-feedback', type: 'channel', description: 'Notes from customers, shared with the whole team.', members: ['you', 'robin', 'omar', 'casey'], unread: 1 },
  { id: 'team-lounge', name: 'team-lounge', type: 'channel', description: 'Weekend plans, playlists, and small wins.', members: ['you', 'nina', 'leo', 'avery', 'zoe', 'omar'], unread: 0 },
  { id: 'platform', name: 'platform', type: 'channel', description: 'Reliability, observability, and the systems behind the scenes.', members: ['you', 'jordan', 'drew', 'quinn'], unread: 0 },
  { id: 'dm-riley', name: people.riley.name, type: 'direct', description: people.riley.role, members: ['you', 'riley'], unread: 2 },
  { id: 'dm-casey', name: people.casey.name, type: 'direct', description: people.casey.role, members: ['you', 'casey'], unread: 0 },
  { id: 'dm-avery', name: people.avery.name, type: 'direct', description: people.avery.role, members: ['you', 'avery'], unread: 1 },
  { id: 'dm-robin', name: people.robin.name, type: 'direct', description: people.robin.role, members: ['you', 'robin'], unread: 0 },
  { id: 'dm-quinn', name: people.quinn.name, type: 'direct', description: people.quinn.role, members: ['you', 'quinn'], unread: 1 },
  { id: 'group-release', name: 'Launch crew', type: 'group', members: ['you', 'riley', 'taylor', 'nina'], unread: 1 },
  { id: 'group-research', name: 'Casey Nguyen, Morgan Chen, Zoë Fischer', type: 'group', members: ['you', 'casey', 'morgan', 'zoe'], unread: 0 },
  { id: 'group-support', name: 'Support handoff', type: 'group', members: ['you', 'robin', 'quinn', 'omar'], unread: 1 }
];

export const initialMessages = [
  {
    id: 'design-1',
    conversation: 'design-system',
    author: 'morgan',
    time: '09:12',
    text: 'Morning! I have put together the first pass of the new component guidelines. The goal is fewer special cases and more consistency across the product.',
    pinned: true,
    saved: true,
    reactions: [
      { emoji: '🙌', count: 3, active: false },
      { emoji: '👀', count: 2, active: false }
    ]
  },
  { id: 'reply-1', conversation: 'design-system', replyToId: 'design-1', author: 'sam', time: '09:15', text: 'Love this direction. Can we include keyboard behavior in the checklist?', reactions: [] },
  {
    id: 'reply-2',
    conversation: 'design-system',
    replyToId: 'reply-1',
    author: 'morgan',
    time: '09:17',
    text: 'Absolutely. Focus, navigation, and dismissal should be part of every component review.',
    reactions: []
  },
  {
    id: 'design-2',
    conversation: 'design-system',
    author: 'sam',
    time: '09:24',
    text: 'The updated spacing tokens are ready to try. Everything now uses the same scale, including the compact layouts.',
    code: 'gap: var(--ds-spacing-3);\npadding: var(--ds-spacing-4);',
    reactions: [{ emoji: '👍', count: 4, active: true }]
  },
  {
    id: 'design-3',
    conversation: 'design-system',
    author: 'jules',
    time: '09:31',
    text: 'One small thing: let’s check the in-between screen sizes too. Desktop and mobile can look great while the middle still feels cramped.',
    reactions: [{ emoji: '💯', count: 3, active: false }]
  },
  {
    id: 'design-4',
    conversation: 'design-system',
    author: 'you',
    time: '09:36',
    text: 'Agreed. I’m trying the layouts with the sidebar open — that usually makes the tight spots pretty obvious.',
    replyToId: 'design-3',
    reactions: []
  },
  {
    id: 'design-5',
    conversation: 'design-system',
    author: 'morgan',
    time: '09:42',
    text: 'Perfect. Let’s keep the interface quiet and let the conversation do the talking. Happy to review together this afternoon.',
    reactions: [{ emoji: '✨', count: 2, active: false }]
  },
  {
    id: 'general-1',
    conversation: 'general',
    author: 'jules',
    time: '08:45',
    text: 'Good morning, team! Quick reminder: our weekly demo is at 14:00. Bring something small you are excited about.',
    pinned: true,
    reactions: [{ emoji: '🙌', count: 3, active: false }]
  },
  {
    id: 'general-2',
    conversation: 'general',
    author: 'you',
    time: '08:52',
    text: 'I’ll bring the new messaging workspace. There are a few interaction details I would love feedback on.',
    reactions: []
  },
  {
    id: 'engineering-1',
    conversation: 'engineering',
    author: 'sam',
    time: '09:05',
    text: 'The preview build is ready. Please check the keyboard flow before we merge: Tab through the composer, reply to a message, and jump back to the quoted original.',
    saved: true,
    reactions: []
  },
  {
    id: 'engineering-2',
    conversation: 'engineering',
    author: 'jules',
    time: '09:18',
    text: 'On it. I’ll check reduced motion and smaller containers as well.',
    reactions: [{ emoji: '👍', count: 1, active: false }]
  },
  {
    id: 'random-1',
    conversation: 'random',
    author: 'morgan',
    time: '08:30',
    text: 'Today’s very unofficial question: coffee first, or inbox first?',
    reactions: [{ emoji: '☕', count: 4, active: false }]
  },
  { id: 'morgan-1', conversation: 'dm-morgan', author: 'morgan', time: '09:20', text: 'Hey Alex! Do you have a moment to look at the new compact layout this afternoon?', reactions: [] },
  { id: 'sam-1', conversation: 'dm-sam', author: 'sam', time: '09:08', text: 'I have a small keyboard-navigation fix ready. Want to pair on the review later?', reactions: [] },
  {
    id: 'forward-1',
    conversation: 'dm-sam',
    author: 'you',
    time: '09:26',
    text: 'The updated spacing tokens are ready to try. Everything now uses the same scale, including the compact layouts.',
    forwardOfId: 'design-2',
    code: 'gap: var(--ds-spacing-3);\npadding: var(--ds-spacing-4);',
    reactions: []
  },
  {
    id: 'jules-1',
    conversation: 'dm-jules',
    author: 'jules',
    time: '09:10',
    text: 'The token documentation is up to date. Let me know if anything is missing from the examples.',
    reactions: []
  },
  {
    id: 'product-1',
    conversation: 'product',
    author: 'riley',
    time: '08:10',
    text: 'This week: finish the mobile rollout, review onboarding, and leave room for the smaller quality fixes.',
    pinned: true,
    reactions: []
  },
  {
    id: 'product-2',
    conversation: 'product',
    author: 'leo',
    time: '08:16',
    text: 'The onboarding report is ready: https://example.com/reports/onboarding. The biggest drop-off is still at the workspace invitation step.',
    reactions: []
  },
  {
    id: 'product-3',
    conversation: 'product',
    author: 'riley',
    time: '08:22',
    text: '@Alex Johnson, could you bring the updated invitation flow to our planning session?',
    reactions: [{ emoji: '👀', count: 2, active: false }]
  },
  {
    id: 'research-1',
    conversation: 'research',
    author: 'casey',
    time: '08:12',
    text: 'Three useful notes from yesterday:\n- People look for search before navigation.\n- Group names make DMs easier to scan.\n- Drafts should never disappear.',
    reactions: [{ emoji: '💡', count: 3, active: false }]
  },
  { id: 'research-2', conversation: 'research', author: 'zoe', time: '08:19', text: 'I can help simplify the labels before the next interview round.', replyToId: 'research-1', reactions: [] },
  { id: 'research-3', conversation: 'research', author: 'you', time: '08:24', text: 'Let’s test the shorter labels with the same tasks so we can compare the results.', reactions: [] },
  {
    id: 'release-1',
    conversation: 'release-planning',
    author: 'taylor',
    time: '08:14',
    text: 'Launch checklist:\n1. Check the smallest supported screens.\n2. Verify light and dark themes.\n3. Confirm message scheduling across timezones.',
    pinned: true,
    reactions: []
  },
  {
    id: 'release-2',
    conversation: 'release-planning',
    author: 'nina',
    time: '08:20',
    text: 'The iPhone pass is done. I am checking Android keyboard behavior next.',
    reactions: [{ emoji: '✅', count: 2, active: false }]
  },
  {
    id: 'release-3',
    conversation: 'release-planning',
    author: 'drew',
    time: '08:27',
    text: 'The staging environment is ready for the final smoke test. No deployment window conflicts today.',
    reactions: []
  },
  {
    id: 'feedback-1',
    conversation: 'customer-feedback',
    author: 'omar',
    time: '08:05',
    text: 'A customer asked for named group conversations so their project chats are easier to find.',
    reactions: []
  },
  {
    id: 'feedback-2',
    conversation: 'customer-feedback',
    author: 'robin',
    time: '08:15',
    text: 'That matches two support tickets this week. I have added the examples to the feedback document.',
    replyToId: 'feedback-1',
    reactions: []
  },
  {
    id: 'feedback-3',
    conversation: 'customer-feedback',
    author: 'casey',
    time: '08:30',
    text: 'Thanks! I will include this in the next usability session.',
    reactions: [{ emoji: '🙌', count: 2, active: false }]
  },
  { id: 'lounge-1', conversation: 'team-lounge', author: 'nina', time: '07:45', text: 'Anyone have a good walking playlist? I am trying to take a screen-free lunch break today.', reactions: [] },
  {
    id: 'lounge-2',
    conversation: 'team-lounge',
    author: 'avery',
    time: '07:52',
    text: 'Instrumental jazz has been working for me. No lyrics means fewer accidental sentences in my notes.',
    reactions: [{ emoji: '🎷', count: 4, active: false }]
  },
  {
    id: 'lounge-3',
    conversation: 'team-lounge',
    author: 'leo',
    time: '08:02',
    text: 'My small win: I finally remembered to bring lunch instead of ordering it at 15:00.',
    reactions: [{ emoji: '🥗', count: 3, active: false }]
  },
  {
    id: 'platform-1',
    conversation: 'platform',
    author: 'jordan',
    time: '07:55',
    text: 'The notification queue is stable after yesterday’s changes. Delivery latency is back within our target.',
    reactions: []
  },
  {
    id: 'platform-2',
    conversation: 'platform',
    author: 'quinn',
    time: '08:07',
    text: 'The permissions check is finished too. Private conversations stay private when messages are forwarded.',
    reactions: [{ emoji: '🔒', count: 2, active: false }]
  },
  { id: 'platform-3', conversation: 'platform', author: 'drew', time: '08:18', text: 'I have added a dashboard link to the runbook: https://example.com/status.', reactions: [] },
  { id: 'riley-1', conversation: 'dm-riley', author: 'you', time: '08:32', text: 'Can we move the planning review to this afternoon? I want to finish the interaction fixes first.', reactions: [] },
  { id: 'riley-2', conversation: 'dm-riley', author: 'riley', time: '08:40', text: 'Of course. I have a free slot at 14:30.', reactions: [] },
  { id: 'riley-3', conversation: 'dm-riley', author: 'riley', time: '08:59', text: 'I will send a short agenda before we start. Bring the mobile demo if it is ready.', reactions: [] },
  { id: 'casey-1', conversation: 'dm-casey', author: 'casey', time: '08:31', text: 'Do you have five minutes to look at the interview script?', reactions: [] },
  { id: 'casey-2', conversation: 'dm-casey', author: 'you', time: '08:37', text: 'Yes. Please send the section about finding an existing conversation.', reactions: [] },
  { id: 'casey-3', conversation: 'dm-casey', author: 'casey', time: '08:53', text: 'Sent! The task is intentionally simple: find the launch group and reply to the last message.', reactions: [] },
  { id: 'avery-1', conversation: 'dm-avery', author: 'avery', time: '08:25', text: 'I have a draft of the release notes. Would you check the messaging section?', reactions: [] },
  { id: 'avery-2', conversation: 'dm-avery', author: 'you', time: '08:38', text: 'Sure. Let’s call out quoted replies and named group conversations.', reactions: [] },
  { id: 'avery-3', conversation: 'dm-avery', author: 'avery', time: '08:50', text: 'Added both. The notes are here: https://example.com/releases/autumn.', reactions: [] },
  { id: 'robin-1', conversation: 'dm-robin', author: 'robin', time: '08:21', text: 'A customer wants to know whether scheduled messages use their local timezone.', reactions: [] },
  { id: 'robin-2', conversation: 'dm-robin', author: 'you', time: '08:35', text: 'They do. The timezone is shown in the scheduling dialog before they confirm.', reactions: [] },
  {
    id: 'robin-3',
    conversation: 'dm-robin',
    author: 'robin',
    time: '08:48',
    text: 'Perfect, thanks. I will send them a screenshot of the confirmation.',
    reactions: [{ emoji: '👍', count: 1, active: false }]
  },
  { id: 'quinn-1', conversation: 'dm-quinn', author: 'you', time: '08:29', text: 'Could you review the private-message forwarding flow before the launch?', reactions: [] },
  { id: 'quinn-2', conversation: 'dm-quinn', author: 'quinn', time: '08:36', text: 'Yes. I will check the quoted content and destination permissions.', reactions: [] },
  { id: 'quinn-3', conversation: 'dm-quinn', author: 'quinn', time: '08:45', text: 'Review complete. I left two small copy suggestions, but no security blockers.', reactions: [] },
  {
    id: 'launch-group-1',
    conversation: 'group-release',
    author: 'riley',
    time: '08:26',
    text: 'Keeping launch coordination here so we do not lose the small decisions in the main channel.',
    reactions: []
  },
  { id: 'launch-group-2', conversation: 'group-release', author: 'taylor', time: '08:33', text: 'Good idea. I will share only the remaining checks in this conversation.', reactions: [] },
  { id: 'launch-group-3', conversation: 'group-release', author: 'nina', time: '08:56', text: 'The device checklist is ready. Can someone take the tablet pass?', reactions: [] },
  {
    id: 'research-group-1',
    conversation: 'group-research',
    author: 'casey',
    time: '08:11',
    text: 'Can we make the first interview task about finding a teammate rather than finding a channel?',
    reactions: []
  },
  { id: 'research-group-2', conversation: 'group-research', author: 'morgan', time: '08:17', text: 'Yes. That should show us whether people notice the recent contacts.', reactions: [] },
  { id: 'research-group-3', conversation: 'group-research', author: 'zoe', time: '08:42', text: 'I updated the script with a shorter prompt and a neutral example name.', reactions: [] },
  {
    id: 'support-group-1',
    conversation: 'group-support',
    author: 'omar',
    time: '08:13',
    text: 'Sharing the overnight handoff here. Two customers are waiting for an update about notifications.',
    reactions: []
  },
  { id: 'support-group-2', conversation: 'group-support', author: 'quinn', time: '08:23', text: 'I can help with the workspace permissions question.', reactions: [] },
  { id: 'support-group-3', conversation: 'group-support', author: 'robin', time: '08:39', text: 'I have the timezone question covered. Let’s send both updates before lunch.', reactions: [] }
].map((message) => ({ ...message, createdAt: `2026-10-08T${message.time}:00.000Z` }));
