/** Pre-written "AI" descriptions served by the demo backend. */

export const EVENT_DESCRIPTIONS: Record<string, string[]> = {
  'demo-evt-rooftop': [
    'Watch the sun melt into the bay from a rooftop full of good music, cold drinks and friendly faces.',
    'Golden hour, skyline views and a playlist worth staying for: come unwind with us above the city.',
    'Start the weekend with sunset cocktails, easy conversation and the best view downtown.',
  ],
  'demo-evt-hackers': [
    'Swap launch stories, get feedback on your side project and meet other builders shipping on their own terms.',
    'An evening of lightning demos and honest conversation for anyone building something small and stubborn.',
    'Bring your project, your questions and your laptop stickers for a relaxed night with the indie maker crowd.',
  ],
  'demo-evt-sourdough': [
    'Roll up your sleeves and learn to shape, score and bake a proper loaf with a baker who has done it ten thousand times.',
    'From starter to crust, this hands-on workshop sends you home with warm bread and a jar of your own culture.',
    'A flour-dusted Sunday morning of kneading, laughing and eating far too much fresh bread.',
  ],
  'demo-evt-blockparty': [
    'Close the street, fire up the grills and meet the neighbors you keep waving to: this one is for the whole block.',
    'Food trucks, lawn games and live music turn the street into the best backyard in town.',
    'One afternoon, one very long table and everyone who calls this block home.',
  ],
  'demo-evt-trailrun': [
    'Lace up for an easy lakeside loop at sunrise, then trade sore legs for pancakes at a long communal brunch.',
    'All paces welcome: run, jog or stroll the lake trail, then refuel together over coffee and eggs.',
    'Fresh air, flat trails and a well-earned brunch afterward make this the friendliest way to start Saturday.',
  ],
  'demo-evt-openmic': [
    'Sign up on the chalkboard and take the stage, or just settle in with a drink and cheer on your neighbors.',
    'Poets, songwriters and first-timers share one mic and one cozy room: come to perform or come to listen.',
    'A warm, no-pressure night of live music and spoken word at the neighborhood cafe, with a slot for anyone brave enough.',
  ],
};

const GENERIC = [
  (name: string, where: string) =>
    `Join us at ${where} for ${name}, an easygoing get-together built around good company and a little bit of fun.`,
  (name: string, where: string) =>
    `${name} is coming to ${where}: bring a friend, bring your curiosity and plan to stay longer than you meant to.`,
  (name: string, where: string) =>
    `Mark your calendar for ${name} at ${where}, a relaxed gathering where everyone leaves knowing someone new.`,
];

export function descriptionFor(eventId: string, name: string, location: string, nth: number): string {
  const specific = EVENT_DESCRIPTIONS[eventId];
  if (specific) return specific[nth % specific.length];
  const where = location.split(',')[0] || 'our venue';
  return GENERIC[nth % GENERIC.length](name, where);
}
