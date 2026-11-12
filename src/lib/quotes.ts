export interface Quote {
  text: string;
  author?: string;
}

const QUOTES: Quote[] = [
  { text: 'Well begun is half done.', author: 'Aristotle' },
  { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  { text: 'Progress, not perfection.' },
  { text: 'Little by little, a little becomes a lot.', author: 'Tanzanian proverb' },
  { text: 'It always seems impossible until it is done.', author: 'Nelson Mandela' },
  { text: 'One day or day one — you decide.' },
  { text: 'Focus on being productive instead of busy.', author: 'Tim Ferriss' },
  { text: 'A calm mind brings inner strength.', author: 'Dalai Lama' },
  { text: 'What you do every day matters more than what you do once in a while.', author: 'Gretchen Rubin' },
  { text: 'Rest is part of the work.' },
  { text: 'The best way out is always through.', author: 'Robert Frost' },
  { text: 'Every accomplishment starts with the decision to try.', author: 'John F. Kennedy' },
  { text: 'You do not have to be great to start, but you have to start to be great.', author: 'Zig Ziglar' },
  { text: 'Slow is smooth, and smooth is fast.' },
  { text: 'How we spend our days is how we spend our lives.', author: 'Annie Dillard' },
  { text: 'Do the small things well.' },
  { text: 'Fall seven times, stand up eight.', author: 'Japanese proverb' },
  { text: 'A journey of a thousand miles begins with a single step.', author: 'Lao Tzu' },
];

export function getQuoteForDate(dateKey: string): Quote {
  const [y, m, d] = dateKey.split('-').map(Number);
  const days = Math.floor(Date.UTC(y, m - 1, d) / 86400000);
  return QUOTES[((days % QUOTES.length) + QUOTES.length) % QUOTES.length];
}
