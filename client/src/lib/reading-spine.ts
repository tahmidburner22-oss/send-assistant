/**
 * reading-spine.ts — UK-aligned reading recommendations grouped by year
 * group. Hand-curated from titles widely used in CLPE Power-of-Reading
 * style "reading spine" lists in English primary and lower-secondary
 * schools. Used by the Book Review tab for Year of Reading discovery.
 *
 * No external API. Each entry can be sent straight to the existing
 * Book Review generator — title and author become the prompt input.
 */

export interface ReadingSpineBook {
  title: string;
  author: string;
  /** Short blurb for browsing. */
  blurb: string;
  themes: string[];
  /** Approx UK reading age range, mostly informational. */
  ageRange: string;
}

export interface ReadingSpineGroup {
  yearGroup: string;
  books: ReadingSpineBook[];
}

export const READING_SPINE: ReadingSpineGroup[] = [
  {
    yearGroup: "Reception / Year 1",
    books: [
      { title: "Where the Wild Things Are", author: "Maurice Sendak", blurb: "Max sails to where the wild things roar — about big feelings.", themes: ["imagination", "anger", "home"], ageRange: "Ages 4–6" },
      { title: "The Tiger Who Came to Tea", author: "Judith Kerr", blurb: "An afternoon disrupted by an extraordinary tea-time guest.", themes: ["surprise", "family"], ageRange: "Ages 4–6" },
      { title: "Owl Babies", author: "Martin Waddell", blurb: "Three baby owls wait for their mother in the dark.", themes: ["loss", "comfort"], ageRange: "Ages 4–6" },
      { title: "Handa's Surprise", author: "Eileen Browne", blurb: "Seven exotic fruits and the friends who pinch them.", themes: ["friendship", "surprise"], ageRange: "Ages 4–6" },
    ],
  },
  {
    yearGroup: "Year 2",
    books: [
      { title: "The Owl Who Was Afraid of the Dark", author: "Jill Tomlinson", blurb: "Plop the baby owl learns to love the night.", themes: ["fear", "growing up"], ageRange: "Ages 5–8" },
      { title: "Flat Stanley", author: "Jeff Brown", blurb: "Stanley wakes up flat — and turns it into an adventure.", themes: ["adventure", "humour"], ageRange: "Ages 6–8" },
      { title: "The Dragonsitter", author: "Josh Lacey", blurb: "Letters from Eddie about his uncle's troublesome dragon.", themes: ["humour", "family"], ageRange: "Ages 6–8" },
      { title: "The Hodgeheg", author: "Dick King-Smith", blurb: "Max the hedgehog tries to teach his family how to cross the road.", themes: ["bravery", "problem-solving"], ageRange: "Ages 6–8" },
    ],
  },
  {
    yearGroup: "Year 3",
    books: [
      { title: "The Boy at the Back of the Class", author: "Onjali Q. Raúf", blurb: "A new pupil arrives — and a quiet plan to help him grows.", themes: ["refugees", "kindness", "PSHE"], ageRange: "Ages 8–11" },
      { title: "The Iron Man", author: "Ted Hughes", blurb: "A giant man of metal arrives from nowhere.", themes: ["fear of difference", "courage"], ageRange: "Ages 7–11" },
      { title: "Charlotte's Web", author: "E. B. White", blurb: "A spider, a pig, and the friendship that saves a life.", themes: ["friendship", "loss"], ageRange: "Ages 7–10" },
      { title: "The Lion, the Witch and the Wardrobe", author: "C. S. Lewis", blurb: "Four siblings step through a wardrobe into Narnia.", themes: ["adventure", "good vs evil"], ageRange: "Ages 8–11" },
    ],
  },
  {
    yearGroup: "Year 4",
    books: [
      { title: "The Firework-Maker's Daughter", author: "Philip Pullman", blurb: "Lila makes the dangerous journey to become a firework-maker.", themes: ["determination", "tradition"], ageRange: "Ages 8–11" },
      { title: "Varjak Paw", author: "S. F. Said", blurb: "A pedigree kitten learns the ancient Way of his ancestors.", themes: ["bravery", "identity"], ageRange: "Ages 8–11" },
      { title: "The Indian in the Cupboard", author: "Lynne Reid Banks", blurb: "A toy cupboard turns plastic figures into tiny living people.", themes: ["responsibility", "perspective"], ageRange: "Ages 8–11" },
      { title: "Beetle Boy", author: "M. G. Leonard", blurb: "Darkus discovers his missing father's link to extraordinary beetles.", themes: ["mystery", "loyalty"], ageRange: "Ages 9–12" },
    ],
  },
  {
    yearGroup: "Year 5",
    books: [
      { title: "The Lion Above the Door", author: "Onjali Q. Raúf", blurb: "Two friends investigate a forgotten WWII pilot's name.", themes: ["history", "racism", "research skills"], ageRange: "Ages 9–12" },
      { title: "Skellig", author: "David Almond", blurb: "Michael finds a strange, dusty creature in the garage.", themes: ["faith", "family", "imagination"], ageRange: "Ages 9–12" },
      { title: "The London Eye Mystery", author: "Siobhan Dowd", blurb: "Ted, who sees the world differently, solves a vanishing.", themes: ["mystery", "neurodiversity"], ageRange: "Ages 9–12" },
      { title: "Letters From the Lighthouse", author: "Emma Carroll", blurb: "An evacuated girl uncovers wartime secrets in Devon.", themes: ["WWII", "evacuation"], ageRange: "Ages 9–12" },
    ],
  },
  {
    yearGroup: "Year 6",
    books: [
      { title: "Wonder", author: "R. J. Palacio", blurb: "Auggie starts mainstream school for the first time at age ten.", themes: ["empathy", "kindness", "PSHE"], ageRange: "Ages 9–13" },
      { title: "Holes", author: "Louis Sachar", blurb: "Stanley digs holes at a desert camp for boys — and uncovers a curse.", themes: ["fate", "friendship"], ageRange: "Ages 10–13" },
      { title: "Pax", author: "Sara Pennypacker", blurb: "A boy and his pet fox make their way back to each other in wartime.", themes: ["loyalty", "war"], ageRange: "Ages 10–13" },
      { title: "Goodnight Mister Tom", author: "Michelle Magorian", blurb: "Wartime evacuee Willie finds shelter with a gruff old man.", themes: ["WWII", "trauma", "kindness"], ageRange: "Ages 10–13" },
    ],
  },
  {
    yearGroup: "Year 7",
    books: [
      { title: "Boy in the Tower", author: "Polly Ho-Yen", blurb: "Ade watches buildings fall as something strange grows from the ground.", themes: ["dystopia", "mental health"], ageRange: "Ages 11–14" },
      { title: "Murder Most Unladylike", author: "Robin Stevens", blurb: "Daisy and Hazel investigate a suspicious death at boarding school.", themes: ["mystery", "1930s setting"], ageRange: "Ages 10–13" },
      { title: "Coram Boy", author: "Jamila Gavin", blurb: "A sweeping Georgian novel of foundlings and choirs.", themes: ["history", "social class"], ageRange: "Ages 12–15" },
      { title: "Northern Lights", author: "Philip Pullman", blurb: "Lyra travels to the Arctic to rescue stolen children.", themes: ["adventure", "philosophy"], ageRange: "Ages 11–14" },
    ],
  },
  {
    yearGroup: "Year 8",
    books: [
      { title: "Animal Farm", author: "George Orwell", blurb: "A satire about farm animals and the politics of revolution.", themes: ["politics", "satire"], ageRange: "Ages 12–16" },
      { title: "The Curious Incident of the Dog in the Night-Time", author: "Mark Haddon", blurb: "Christopher investigates a neighbour's dog and uncovers more.", themes: ["neurodiversity", "family"], ageRange: "Ages 12–15" },
      { title: "Noughts & Crosses", author: "Malorie Blackman", blurb: "A divided society where skin colour determines status.", themes: ["racism", "society", "love"], ageRange: "Ages 12–15" },
      { title: "Private Peaceful", author: "Michael Morpurgo", blurb: "A soldier remembers his life on the eve of dawn.", themes: ["WWI", "brotherhood"], ageRange: "Ages 12–15" },
    ],
  },
  {
    yearGroup: "Year 9",
    books: [
      { title: "Of Mice and Men", author: "John Steinbeck", blurb: "Two migrant workers chase a small American dream.", themes: ["loneliness", "the Depression"], ageRange: "Ages 13–16" },
      { title: "The Hate U Give", author: "Angie Thomas", blurb: "Starr witnesses the police shooting of her childhood friend.", themes: ["racism", "activism"], ageRange: "Ages 13–16" },
      { title: "I Am Malala (young readers' edition)", author: "Malala Yousafzai", blurb: "The schoolgirl who stood up to the Taliban.", themes: ["education", "courage"], ageRange: "Ages 12–16" },
      { title: "A Monster Calls", author: "Patrick Ness", blurb: "Each night, a monster comes to tell Conor stories.", themes: ["grief", "honesty"], ageRange: "Ages 12–15" },
    ],
  },
];

export function findGroup(yearGroup: string): ReadingSpineGroup | undefined {
  const target = yearGroup.toLowerCase();
  return READING_SPINE.find(g => g.yearGroup.toLowerCase().includes(target.replace(/^year\s*/i, "Year ").toLowerCase()))
      || READING_SPINE.find(g => g.yearGroup.toLowerCase() === target);
}
