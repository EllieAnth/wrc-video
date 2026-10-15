import data from '../../data/draft.json';

const n = (x: number) => x.toLocaleString('en-US');
const faced = data.mostFaced, picked = data.mostPicked, pair = data.topPairs[0];
const follow = Math.round((data.recoFollow.inTop3 / data.recoFollow.selfPicks) * 100);

export const title = `Draft Report · ${n(data.drafts)} drafts · ${data.windowDays} days`;
export const voice: { scene: string; offset?: number; text: string }[] = [
  { scene: 'intro', offset: 6, text: `${n(data.drafts)} drafts analyzed in ${data.windowDays} days, on the site and in the app. Here is what you faced.` },
  { scene: 'faced', offset: 4, text: `The enemy you face the most: ${faced[0].name}, ${faced[0].n} times. Then ${faced.slice(1, 4).map((c) => c.name).join(', ')}.` },
  { scene: 'picked', offset: 4, text: `What you pick: ${picked[0].name} first, then ${picked.slice(1, 3).map((c) => c.name).join(' and ')}. ${follow} percent of your picks were in our top three.` },
  { scene: 'pairs', offset: 4, text: `The matchup of the month: ${pair.pickName} against ${pair.versusName}, ${pair.n} times.` },
  { scene: 'outro', offset: 4, text: 'Draft with the engine, free, on wild rift core dot com and in the app.' },
];
