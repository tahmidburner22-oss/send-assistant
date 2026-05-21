/**
 * Source-Text Library — canonical extracts for English Literature & Language
 * worksheets.
 *
 * Many of the issues flagged in the content audit (notably "Macbeth Act 1
 * Scene 5 extract was missing") came from the LLM being asked to invent the
 * extract itself. For texts that are out of copyright (Shakespeare, Dickens,
 * Brontë, Stevenson, Wilde, etc.) we can simply ship the canonical extract
 * verbatim and inject it into the prompt as authoritative source material.
 *
 * The library is intentionally small and curated. Adding more entries is a
 * pure data change — the lookup function `findExtract()` does fuzzy matching
 * against subject + topic + free-text additionalInstructions so a teacher
 * typing "Macbeth Act 1 Scene 5" or "Lady Macbeth letter scene" both hit.
 *
 * If no entry matches we return `null` and the existing prompt logic falls
 * through to its current behaviour (instruct the LLM to invent an extract).
 *
 * NOTE: Only public-domain texts are included here. Modern texts (e.g. An
 *       Inspector Calls, Of Mice and Men, A Christmas Carol — fine, that's
 *       Dickens — are kept to lines short enough to qualify as fair-use
 *       teaching extracts.
 */

export interface SourceExtract {
  /** Stable id used for analytics + debugging. */
  id: string;
  /** Human-readable title of the work. */
  work: string;
  /** Author. */
  author: string;
  /** Specific location within the work (e.g. "Act 1 Scene 5, lines 1–30"). */
  location: string;
  /** Topic-bag for fuzzy matching against the worksheet topic. */
  matchTerms: string[];
  /** AQA / OCR / Edexcel exam-board cluster this typically appears in. */
  examBoards: string[];
  /** The extract itself. Use real line breaks; do not include line numbers
   *  here — the prompt builder injects "1 ", "2 " etc when rendering. */
  text: string;
  /** Optional brief context note — used as a teacher-side prompt hint. */
  contextNote?: string;
}

// ─── Macbeth — Act 1 Scene 5 ────────────────────────────────────────────────
// The exact extract the audit flagged as missing. Lady Macbeth's soliloquy
// after reading the letter — a foundational passage for AQA Lit Paper 1.
const macbethAct1Scene5: SourceExtract = {
  id: 'macbeth-1-5-letter',
  work: 'Macbeth',
  author: 'William Shakespeare',
  location: 'Act 1, Scene 5 (Lady Macbeth\'s soliloquy)',
  matchTerms: [
    'macbeth', 'lady macbeth', 'act 1 scene 5', '1.5', 'letter scene',
    'unsex me', 'come you spirits', 'soliloquy',
  ],
  examBoards: ['aqa', 'ocr', 'edexcel', 'wjec'],
  text:
`They met me in the day of success: and I have learned by the perfectest report, they have more in them than mortal knowledge. When I burned in desire to question them further, they made themselves air, into which they vanished. Whiles I stood rapt in the wonder of it, came missives from the king, who all-hailed me 'Thane of Cawdor'; by which title, before, these weird sisters saluted me, and referred me to the coming on of time, with 'Hail, king that shalt be!' This have I thought good to deliver thee, my dearest partner of greatness, that thou mightst not lose the dues of rejoicing, by being ignorant of what greatness is promised thee. Lay it to thy heart, and farewell.

Glamis thou art, and Cawdor; and shalt be
What thou art promised: yet do I fear thy nature;
It is too full o' the milk of human kindness
To catch the nearest way: thou wouldst be great;
Art not without ambition, but without
The illness should attend it: what thou wouldst highly,
That wouldst thou holily; wouldst not play false,
And yet wouldst wrongly win.

Come, you spirits
That tend on mortal thoughts, unsex me here,
And fill me from the crown to the toe top-full
Of direst cruelty! make thick my blood;
Stop up the access and passage to remorse,
That no compunctious visitings of nature
Shake my fell purpose.`,
  contextNote:
`Spoken by Lady Macbeth alone on stage. She has just finished reading her husband's letter describing the witches' prophecies. Key AO2 methods: imperatives ("Come, you spirits"), apostrophe to supernatural forces, semantic field of cruelty/violence, imagery of inversion ("unsex me"). Key AO3 context: Jacobean attitudes to witchcraft (1606), the divine right of kings, expectations of femininity.`,
};

// ─── Macbeth — Act 1 Scene 7 (Lady Macbeth's persuasion) ────────────────────
const macbethAct1Scene7: SourceExtract = {
  id: 'macbeth-1-7-persuasion',
  work: 'Macbeth',
  author: 'William Shakespeare',
  location: 'Act 1, Scene 7 (Lady Macbeth persuades Macbeth)',
  matchTerms: ['macbeth', 'act 1 scene 7', '1.7', 'persuasion', 'screw your courage'],
  examBoards: ['aqa', 'ocr', 'edexcel'],
  text:
`Was the hope drunk
Wherein you dress'd yourself? hath it slept since?
And wakes it now, to look so green and pale
At what it did so freely? From this time
Such I account thy love. Art thou afeard
To be the same in thine own act and valour
As thou art in desire? Wouldst thou have that
Which thou esteem'st the ornament of life,
And live a coward in thine own esteem,
Letting 'I dare not' wait upon 'I would,'
Like the poor cat i' the adage?

What beast was't, then,
That made you break this enterprise to me?
When you durst do it, then you were a man;
And, to be more than what you were, you would
Be so much more the man.`,
  contextNote:
`Lady Macbeth attacks Macbeth's masculinity to push him into killing Duncan. Methods: rhetorical questions, comparison to a cat ("poor cat i' the adage"), redefinition of manhood. Useful for theme-based questions on ambition, gender, manipulation.`,
};

// ─── Romeo and Juliet — Balcony Scene ───────────────────────────────────────
const romeoAndJulietBalcony: SourceExtract = {
  id: 'rj-2-2-balcony',
  work: 'Romeo and Juliet',
  author: 'William Shakespeare',
  location: 'Act 2, Scene 2 (Balcony scene)',
  matchTerms: ['romeo and juliet', 'balcony scene', 'act 2 scene 2', 'wherefore art thou'],
  examBoards: ['aqa', 'ocr', 'edexcel'],
  text:
`But, soft! what light through yonder window breaks?
It is the east, and Juliet is the sun.
Arise, fair sun, and kill the envious moon,
Who is already sick and pale with grief,
That thou her maid art far more fair than she.

O Romeo, Romeo! wherefore art thou Romeo?
Deny thy father and refuse thy name;
Or, if thou wilt not, be but sworn my love,
And I'll no longer be a Capulet.
'Tis but thy name that is my enemy;
Thou art thyself, though not a Montague.
What's Montague? it is nor hand, nor foot,
Nor arm, nor face, nor any other part
Belonging to a man. O, be some other name!
What's in a name? that which we call a rose
By any other name would smell as sweet.`,
  contextNote:
`Romeo (lines 1–5) sees Juliet at her window; Juliet (lines 6–16) speaks unaware Romeo is below. Key methods: extended sun/moon metaphor, oxymoron, the rose conceit. Useful for love, identity, conflict (family vs self) themes.`,
};

// ─── A Christmas Carol — Stave 1 (Marley's Ghost) ───────────────────────────
const christmasCarolMarley: SourceExtract = {
  id: 'cc-1-marley',
  work: 'A Christmas Carol',
  author: 'Charles Dickens',
  location: 'Stave 1 (Marley\'s Ghost)',
  matchTerms: ['christmas carol', 'marley', 'stave 1', 'scrooge'],
  examBoards: ['aqa', 'ocr', 'edexcel'],
  text:
`The chain he drew was clasped about his middle. It was long, and wound about him like a tail; and it was made (for Scrooge observed it closely) of cash-boxes, keys, padlocks, ledgers, deeds, and heavy purses wrought in steel. His body was transparent; so that Scrooge, observing him, and looking through his waistcoat, could see the two buttons on his coat behind.

"You are fettered," said Scrooge, trembling. "Tell me why?"

"I wear the chain I forged in life," replied the Ghost. "I made it link by link, and yard by yard; I girded it on of my own free will, and of my own free will I wore it. Is its pattern strange to you?"

Scrooge trembled more and more.

"Or would you know," pursued the Ghost, "the weight and length of the strong coil you bear yourself? It was full as heavy and as long as this, seven Christmases ago. You have laboured on it, since. It is a ponderous chain!"`,
  contextNote:
`Marley's chain is Dickens's central allegory for the moral consequences of avarice. Methods: symbolism (the chain), motif of weight/measurement, direct address. Context: 1843 publication, Dickens's social criticism of Malthusian economics.`,
};

// ─── Jekyll and Hyde — Chapter 1 (the door) ─────────────────────────────────
const jekyllHydeDoor: SourceExtract = {
  id: 'jh-1-door',
  work: 'The Strange Case of Dr Jekyll and Mr Hyde',
  author: 'Robert Louis Stevenson',
  location: 'Chapter 1 (the door / trampling incident)',
  matchTerms: ['jekyll', 'hyde', 'jekyll and hyde', 'stevenson', 'the door', 'trampled'],
  examBoards: ['aqa', 'ocr', 'edexcel'],
  text:
`The story-teller (Mr. Enfield) said: "Well, it was this way," returned Mr. Enfield: "I was coming home from some place at the end of the world, about three o'clock of a black winter morning, and my way lay through a part of town where there was literally nothing to be seen but lamps. Street after street, and all the folks asleep — street after street, all lighted up as if for a procession and all as empty as a church — till at last I got into that state of mind when a man listens and listens and begins to long for the sight of a policeman.

All at once, I saw two figures: one a little man who was stumping along eastward at a good walk, and the other a girl of maybe eight or ten who was running as hard as she was able down a cross street. Well, sir, the two ran into one another naturally enough at the corner; and then came the horrible part of the thing; for the man trampled calmly over the child's body and left her screaming on the ground. It sounds nothing to hear, but it was hellish to see. It wasn't like a man; it was like some damned Juggernaut."`,
  contextNote:
`The novel's first description of Hyde, told second-hand by Enfield. Methods: simile ("like some damned Juggernaut"), pathetic fallacy ("black winter morning"), gothic urban setting. Context: Victorian fears about duality and degeneration.`,
};

// ─── Library ────────────────────────────────────────────────────────────────
const SOURCE_TEXT_LIBRARY: SourceExtract[] = [
  macbethAct1Scene5,
  macbethAct1Scene7,
  romeoAndJulietBalcony,
  christmasCarolMarley,
  jekyllHydeDoor,
];

/**
 * Find the most relevant extract for a given subject + topic + (optional) free-text
 * additional instructions. Returns null if no entry scores above the threshold.
 *
 * Scoring: each match-term that appears in the combined haystack (topic +
 * additionalInstructions) adds 1 point, with a small boost for exact-phrase
 * matches in the location field (so "Act 1 Scene 5" is preferred over
 * generic "Macbeth").
 */
export function findExtract(opts: {
  subject?: string;
  topic?: string;
  additionalInstructions?: string;
}): SourceExtract | null {
  const subjectLower = (opts.subject || '').toLowerCase();
  // Only run for English subjects — never inject extracts into maths or science.
  if (!/english|literature|language|drama/.test(subjectLower)) return null;

  const haystack = `${opts.topic || ''}\n${opts.additionalInstructions || ''}`.toLowerCase();
  if (!haystack.trim()) return null;

  let best: { entry: SourceExtract; score: number } | null = null;
  for (const entry of SOURCE_TEXT_LIBRARY) {
    let score = 0;
    for (const term of entry.matchTerms) {
      if (haystack.includes(term.toLowerCase())) score += 1;
    }
    // Boost for an exact location-string match ("act 1 scene 5", "stave 1", etc.)
    if (haystack.includes(entry.location.toLowerCase().split(' (')[0])) score += 1;
    if (score >= 2 && (!best || score > best.score)) {
      best = { entry, score };
    }
  }
  return best?.entry ?? null;
}

/**
 * Render an extract as a numbered prompt block ready to paste into the
 * system prompt. Adds line numbers (1, 2, 3, ...) to every non-blank line so
 * the LLM can reference specific lines in retrieval / language questions.
 */
export function renderExtractForPrompt(extract: SourceExtract): string {
  const lines = extract.text.split('\n');
  let lineNumber = 0;
  const numbered = lines
    .map((line) => {
      if (!line.trim()) return '';
      lineNumber += 1;
      return `${lineNumber}  ${line}`;
    })
    .join('\n');
  return [
    `SOURCE TEXT — USE THIS EXACT EXTRACT, DO NOT INVENT YOUR OWN:`,
    `Work: "${extract.work}" by ${extract.author}`,
    `Location: ${extract.location}`,
    ``,
    numbered,
    ``,
    extract.contextNote ? `Context note for the teacher key: ${extract.contextNote}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

export default { findExtract, renderExtractForPrompt };
