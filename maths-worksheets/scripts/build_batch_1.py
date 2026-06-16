#!/usr/bin/env python3
"""
Batch 1 builder — 11 multiplication & division foundation worksheets.

Outputs JSON worksheet files in maths-worksheets/json/ for:
  • 088 — 10 times table
  • 089 — 2 times table
  • 090 — 5 times table
  • 092 — 3 times table
  • 093 — 4 times table
  • 094 — 8 times table
  • 095 — Mixed times table practice
  • 100 — 6, 7, 9, 11, 12 times tables
  • 091 — Division as the inverse of multiplication
  • 099 — Multiplying by 10, 100 and 1000
  • 096 — Dividing by 10, 100 and 1000
"""
import json, os, sys

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "json")
os.makedirs(OUT_DIR, exist_ok=True)


# ── Helpers ────────────────────────────────────────────────────────────────
def practice(num, head, color, bg, border, instr, qs, linked="ex1"):
    return {
        "id": f"p{num}", "number": num, "heading": head,
        "heading_color": color, "bg_color": bg, "border_color": border,
        "instruction": instr, "linked_example": linked,
        "questions": [{"id": qid, "expression": expr,
                       **({"answer": ans} if ans is not None else {})}
                      for qid, expr, ans in qs],
    }


def example(idx, label_suffix, question, steps, answer, explanation):
    colour = ["#1F5FA6", "#1F5FA6", "#CC0000", "#1E7D2E"][idx-1]
    bg     = ["#EEF3FF", "#EEF3FF", "#FFF0F0", "#EDFAEE"][idx-1]
    return {
        "id": f"ex{idx}", "card_color": colour, "card_bg": bg,
        "label": f"Example {idx} &ndash; {label_suffix}",
        "question": question, "steps": steps,
        "answer": answer, "explanation": explanation,
    }


def write_ws(filename, ws):
    path = os.path.join(OUT_DIR, filename)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(ws, f, indent=2, ensure_ascii=False)
    print(f"  ✓ {filename}")


# ── Templated single-table builder ─────────────────────────────────────────
def build_times_table(filename, n, name_caps, friendly_pattern, multipliers, word_a, word_b):
    """
    n              : the table number (e.g. 4)
    name_caps      : 'FOUR' for the title
    friendly_pattern: human-readable description of the pattern
    multipliers    : list of (x, n*x) pairs for examples
    word_a, word_b : two real-world contexts (cost, eggs, wheels...)
    """
    blue   = "#1F5FA6"
    return {
        "title": f"MULTIPLICATION,\n({name_caps} TIMES TABLE)",
        "objective": f"LO: I can recall and use the {n} times table to multiply and divide.",
        "send_mode": False,
        "info_boxes": {
            "key_terms": {
                "id": "key_terms",
                "title": f"What is the {n} times table?",
                "content": [
                    {"type": "paragraph",
                     "text": f"The <span class=\"ul-b\">{n} times table</span> is a list of "
                             f"<span class=\"ul-k\">multiples</span> of {n}: numbers we get when we count "
                             f"in {n}s. {friendly_pattern}"},
                    {"type": "paragraph",
                     "text": f"<span class=\"rb\">Strategy:</span> Skip-count in {n}s on your fingers, "
                             f"or use a number line. Each jump adds {n}."},
                ],
            },
            "what_we_learn": {
                "id": "what_we_learn",
                "title": f"Multiples of {n}",
                "examples": [
                    {"correct": True,  "expr": f"1 &times; {n} = {n}",      "desc": "starting point"},
                    {"correct": True,  "expr": f"2 &times; {n} = {2*n}",    "desc": "double"},
                    {"correct": True,  "expr": f"5 &times; {n} = {5*n}",    "desc": "halfway to 10"},
                    {"correct": False, "expr": f"3 &times; {n} = {3*n+1}",  "desc": "wrong"},
                    {"correct": False, "expr": f"{n} &times; 0 = {n}",      "desc": "any &times; 0 = 0"},
                ],
            },
            "key_idea": {
                "id": "key_idea",
                "title": "Key idea",
                "text": f"Multiplication is repeated addition. {n} &times; 4 means &lsquo;4 groups of {n}&rsquo;. "
                        f"You can also think of it as &lsquo;{n} groups of 4&rsquo; — the answer is the same.",
                "equation": f"<span class=\"ov\">{n}</span> + <span class=\"ov\">{n}</span> + "
                            f"<span class=\"ov\">{n}</span> + <span class=\"ov\">{n}</span> = "
                            f"<span class=\"ovr\">{n}&times;4 = {n*4}</span>",
                "caption": f"Four groups of {n}",
            },
        },
        "modelled_examples": [
            example(1, f"single multiplication",
                    f"Calculate {multipliers[0][0]} &times; {n}",
                    [f"{multipliers[0][0]} groups of {n}",
                     f"{n} + {n} + {n}{' + ' + str(n) if multipliers[0][0] >= 4 else ''}{'  ...' if multipliers[0][0] > 4 else ''}",
                     f"= {multipliers[0][1]}"],
                    f"= {multipliers[0][1]}",
                    f"Skip-count in {n}s {multipliers[0][0]} times to reach {multipliers[0][1]}."),
            example(2, "missing factor",
                    f"Solve: ___ &times; {n} = {multipliers[1][1]}",
                    [f"How many {n}s in {multipliers[1][1]}?",
                     f"Count up: {n}, {2*n}, {3*n}{', ...' if multipliers[1][0] > 3 else ''}",
                     f"= {multipliers[1][0]}"],
                    f"= {multipliers[1][0]}",
                    f"Divide: {multipliers[1][1]} &divide; {n} = {multipliers[1][0]}."),
            example(3, "division by sharing",
                    f"Calculate {multipliers[2][1]} &divide; {n}",
                    [f"How many groups of {n} fit in {multipliers[2][1]}?",
                     f"{n} &times; ___ = {multipliers[2][1]}",
                     f"= {multipliers[2][0]}"],
                    f"= {multipliers[2][0]}",
                    f"Division is the inverse of multiplication."),
            example(4, "word problem",
                    f"{word_a}",
                    ["Identify what is being repeated",
                     f"Set up: count &times; {n}",
                     "Compute and check"],
                    f"See solution",
                    f"Always show your working clearly."),
        ],
        "practice": [
            practice(1, f"Recall the {n} times table", blue, "#EEF3FF", blue,
                     f"Complete the calculation. Skip-count in {n}s if you need to.",
                     [(c, f"{x} &times; {n} = ___", str(x*n)) for c, x in zip("abcd", [3, 6, 8, 10])]),
            practice(2, f"Missing factors", blue, "#EEF3FF", blue,
                     f"Find the missing number.",
                     [(c, f"___ &times; {n} = {x*n}", str(x)) for c, x in zip("abcd", [4, 7, 9, 11])]),
            practice(3, f"Dividing by {n}", "#CC0000", "#FFF0F0", "#CC0000",
                     f"Use the {n} times table to divide. {n} &times; ___ = ?",
                     [(c, f"{x*n} &divide; {n} = ___", str(x)) for c, x in zip("abcd", [2, 5, 8, 12])]),
            practice(4, "Two-step problems", "#1E7D2E", "#EDFAEE", "#1E7D2E",
                     "Work out the answer step by step.",
                     [("a", f"({2}&times;{n}) + ({3}&times;{n}) = ___", str(2*n + 3*n)),
                      ("b", f"({5}&times;{n}) &minus; ({2}&times;{n}) = ___", str(5*n - 2*n)),
                      ("c", f"{4*n} &divide; {n} + 6 = ___", str(4 + 6)),
                      ("d", f"({n}&times;{n}) &times; 2 = ___", str(n*n*2))]),
            practice(5, "Mixed practice", "#7B3FA0", "#F5EEFF", "#7B3FA0",
                     f"Use what you know about the {n} times table.",
                     [("a", f"{n} &times; 7 = ___", str(7*n)),
                      ("b", f"{12*n} &divide; {n} = ___", "12"),
                      ("c", f"___ &times; {n} = {6*n}", "6"),
                      ("d", f"{n*n} &divide; {n} = ___", str(n)),
                      ("e", f"{9*n} &divide; {n} = ___", "9")]),
        ],
        "misconceptions": {
            "items": [
                {"id": "a", "statement": f"{n} &times; 0 = {n}", "correct": False},
                {"id": "b", "statement": f"{n} &times; 1 = {n}", "correct": True},
                {"id": "c", "statement": f"{n*4} &divide; {n} = 4", "correct": True},
                {"id": "d", "statement": f"{n} &times; 10 = {n}0 (i.e. {10*n})", "correct": True},
                {"id": "e", "statement": f"{n} &times; 7 = {7*n + 1}", "correct": False},
            ]
        },
        "challenge": {
            "problems": [
                {"id": "a", "text": word_a},
                {"id": "b", "text": word_b},
            ]
        },
    }


if __name__ == "__main__":
    # Build the 6 single times-table worksheets ---------------------------------
    write_ws("088-10-times-table.json", build_times_table(
        "088", 10, "TEN",
        "Numbers in the 10 times table always end in 0.",
        [(7, 70), (4, 40), (8, 80)],
        "A bag of marbles holds <strong>10 marbles</strong>. How many marbles are in <strong>6 bags</strong>? "
        "Write a multiplication and find the answer.",
        "Sara collects 10p coins. She has <strong>£1.20 in total</strong>. "
        "How many 10p coins does she have? Show your working.",
    ))

    write_ws("089-2-times-table.json", build_times_table(
        "089", 2, "TWO",
        "Numbers in the 2 times table are always even.",
        [(5, 10), (4, 8), (6, 12)],
        "Each pair of socks contains <strong>2 socks</strong>. How many socks are in <strong>7 pairs</strong>? "
        "Write a multiplication.",
        "Tom has <strong>14 wheels</strong>. Each bike has 2 wheels. "
        "How many bikes can he build? Show your working.",
    ))

    write_ws("090-5-times-table.json", build_times_table(
        "090", 5, "FIVE",
        "Numbers in the 5 times table always end in 0 or 5.",
        [(6, 30), (4, 20), (7, 35)],
        "A starfish has <strong>5 arms</strong>. How many arms do <strong>8 starfish</strong> have in total? "
        "Show your working.",
        "Lucy saves 5p coins. She has <strong>45p</strong> saved up. "
        "How many 5p coins does she have? Write a division.",
    ))

    write_ws("092-3-times-table.json", build_times_table(
        "092", 3, "THREE",
        "The digits of every multiple of 3 add up to a multiple of 3 (e.g. 27 &rarr; 2+7 = 9).",
        [(7, 21), (5, 15), (4, 12)],
        "A tricycle has <strong>3 wheels</strong>. How many wheels are on <strong>9 tricycles</strong>? "
        "Show your multiplication.",
        "A florist sells roses in bunches of 3. There are <strong>24 roses</strong> in total. "
        "How many bunches can she make?",
    ))

    write_ws("093-4-times-table.json", build_times_table(
        "093", 4, "FOUR",
        "Multiples of 4 are always even, and you can find them by doubling the 2 times table.",
        [(6, 24), (5, 20), (8, 32)],
        "A car has <strong>4 wheels</strong>. How many wheels are on <strong>7 cars</strong>?",
        "There are <strong>36 chair legs</strong> in a hall. Each chair has 4 legs. "
        "How many chairs are in the hall?",
    ))

    write_ws("094-8-times-table.json", build_times_table(
        "094", 8, "EIGHT",
        "Multiples of 8 are always even, and you can find them by doubling the 4 times table.",
        [(4, 32), (6, 48), (7, 56)],
        "A spider has <strong>8 legs</strong>. How many legs do <strong>6 spiders</strong> have? "
        "Write a multiplication and solve it.",
        "An octopus tank has <strong>72 tentacles</strong> in total. "
        "Each octopus has 8 tentacles. How many octopuses are in the tank?",
    ))


    # ── 095 — Mixed times-table practice ───────────────────────────────────────
    write_ws("095-mixed-times-table-practice.json", {
        "title": "MULTIPLICATION,\n(MIXED TIMES TABLE PRACTICE)",
        "objective": "LO: I can fluently recall and use multiplication and division facts up to 12 &times; 12.",
        "send_mode": False,
        "info_boxes": {
            "key_terms": {"id": "key_terms", "title": "What is times-table fluency?", "content": [
                {"type": "paragraph", "text": "<span class=\"ul-b\">Fluency</span> means recalling a "
                 "<span class=\"ul-k\">multiplication fact</span> in under 2 seconds, without counting on fingers."},
                {"type": "paragraph", "text": "<span class=\"rb\">Tip:</span> Each multiplication gives you "
                 "<strong>two</strong> division facts. e.g. 6&times;7=42, so 42&divide;6=7 and 42&divide;7=6."}]},
            "what_we_learn": {"id": "what_we_learn", "title": "Spot the table", "examples": [
                {"correct": True, "expr": "8 &times; 6 = 48",  "desc": "fact"},
                {"correct": True, "expr": "48 &divide; 6 = 8", "desc": "linked"},
                {"correct": True, "expr": "7 &times; 9 = 63",  "desc": "fact"},
                {"correct": False, "expr": "7 &times; 8 = 54", "desc": "should be 56"},
                {"correct": False, "expr": "9 &times; 6 = 56", "desc": "should be 54"}]},
            "key_idea": {"id": "key_idea", "title": "Key idea",
                "text": "Multiplication is commutative: a &times; b = b &times; a. So you only need to learn HALF the table.",
                "equation": "<span class=\"ov\">7 &times; 8</span> = <span class=\"ov\">8 &times; 7</span> = <span class=\"ovr\">56</span>",
                "caption": "Same answer either way"}},
        "modelled_examples": [
            example(1, "fact recall", "Calculate 7 &times; 8",
                    ["Think: 7 &times; 8 = 8 &times; 7", "= (7 &times; 7) + 7", "= 49 + 7"],
                    "= 56", "If you know 7&times;7=49, just add one more 7."),
            example(2, "missing factor", "Solve: 6 &times; ___ = 54",
                    ["54 &divide; 6", "Count up in 6s: 6,12,...,54", "= 9"],
                    "= 9", "9 sixes make 54."),
            example(3, "division", "Calculate 72 &divide; 9",
                    ["Think: 9 &times; ___ = 72", "9 &times; 8 = 72", "= 8"],
                    "= 8", "Use multiplication to check: 9 &times; 8 = 72 &check;"),
            example(4, "two-step", "Calculate (4 &times; 6) + (3 &times; 7)",
                    ["4 &times; 6 = 24", "3 &times; 7 = 21", "24 + 21 = 45"],
                    "= 45", "Do each multiplication first, then add.")],
        "practice": [
            practice(1, "Quick recall", "#1F5FA6", "#EEF3FF", "#1F5FA6",
                     "Answer as quickly as you can.",
                     [("a", "6 &times; 7 = ___", "42"), ("b", "8 &times; 9 = ___", "72"),
                      ("c", "11 &times; 5 = ___", "55"), ("d", "12 &times; 4 = ___", "48")]),
            practice(2, "Missing factors", "#1F5FA6", "#EEF3FF", "#1F5FA6",
                     "Fill in the blank.",
                     [("a", "___ &times; 7 = 49", "7"), ("b", "8 &times; ___ = 64", "8"),
                      ("c", "___ &times; 9 = 81", "9"), ("d", "11 &times; ___ = 121", "11")]),
            practice(3, "Division facts", "#CC0000", "#FFF0F0", "#CC0000",
                     "Use times-tables knowledge to divide.",
                     [("a", "63 &divide; 9 = ___", "7"), ("b", "84 &divide; 7 = ___", "12"),
                      ("c", "96 &divide; 8 = ___", "12"), ("d", "144 &divide; 12 = ___", "12")]),
            practice(4, "Two-step", "#1E7D2E", "#EDFAEE", "#1E7D2E",
                     "Show full working.",
                     [("a", "(5&times;6) + (4&times;7) = ___", "58"),
                      ("b", "(8&times;7) &minus; (3&times;9) = ___", "29"),
                      ("c", "63 &divide; 7 + 9 = ___", "18"),
                      ("d", "11 &times; 12 &divide; 6 = ___", "22")]),
            practice(5, "Mixed challenge", "#7B3FA0", "#F5EEFF", "#7B3FA0",
                     "These mix all tables to 12 &times; 12.",
                     [("a", "9 &times; 7 = ___", "63"), ("b", "132 &divide; 12 = ___", "11"),
                      ("c", "8 &times; 11 = ___", "88"), ("d", "144 &divide; 9 = ___", "16"),
                      ("e", "12 &times; 12 = ___", "144")])],
        "misconceptions": {"items": [
            {"id": "a", "statement": "7 &times; 8 = 54", "correct": False},
            {"id": "b", "statement": "9 &times; 6 = 54", "correct": True},
            {"id": "c", "statement": "11 &times; 11 = 121", "correct": True},
            {"id": "d", "statement": "8 &times; 7 = 7 &times; 8", "correct": True},
            {"id": "e", "statement": "6 &times; 9 &ne; 9 &times; 6", "correct": False}]},
        "challenge": {"problems": [
            {"id": "a", "text": "There are <strong>6 boxes</strong> with <strong>9 cupcakes</strong> in each. "
             "Mr Khan eats <strong>7 cupcakes</strong>. How many are left? Show your working step by step."},
            {"id": "b", "text": "A school has <strong>11 classes</strong> with <strong>12 children</strong> in each. "
             "On Sports Day, the children form <strong>teams of 8</strong>. How many full teams can be made? "
             "Are any children left over?"}]},
    })


    # ── 100 — 6, 7, 9, 11, 12 times tables ────────────────────────────────────
    write_ws("100-6-7-9-11-12-times-tables.json", {
        "title": "MULTIPLICATION,\n(6, 7, 9, 11 AND 12 TIMES TABLES)",
        "objective": "LO: I can recall the harder times tables (6, 7, 9, 11, 12) and use them to solve problems.",
        "send_mode": False,
        "info_boxes": {
            "key_terms": {"id": "key_terms", "title": "Tricks for the harder tables", "content": [
                {"type": "paragraph", "text": "The <span class=\"ul-b\">9 times table</span> trick: the digits of every "
                 "multiple of 9 add to <span class=\"ul-k\">9</span> (e.g. 36 &rarr; 3+6 = 9). Or use 10&times;n then "
                 "subtract n: 9&times;7 = 70 &minus; 7 = 63."},
                {"type": "paragraph", "text": "<span class=\"rb\">11 times table</span> trick: for 1&minus;9, just repeat "
                 "the digit (4&times;11 = 44, 7&times;11 = 77)."}]},
            "what_we_learn": {"id": "what_we_learn", "title": "Patterns to spot", "examples": [
                {"correct": True,  "expr": "9 &times; 7 = 63 (6+3=9)",      "desc": "9-trick"},
                {"correct": True,  "expr": "11 &times; 5 = 55",             "desc": "doubled digit"},
                {"correct": True,  "expr": "12 &times; 6 = 72",             "desc": "double 6 = 12, &times;6 = 72"},
                {"correct": False, "expr": "7 &times; 8 = 54",              "desc": "should be 56"},
                {"correct": False, "expr": "11 &times; 12 = 121",           "desc": "should be 132"}]},
            "key_idea": {"id": "key_idea", "title": "Key idea",
                "text": "Use friendly facts to bridge to harder ones. e.g. 7&times;6 = (7&times;5) + 7 = 35 + 7 = 42.",
                "equation": "<span class=\"ov\">9 &times; 8</span> = <span class=\"ov\">10 &times; 8</span> &minus; 8 = <span class=\"ovr\">72</span>",
                "caption": "&times;10 then subtract"}},
        "modelled_examples": [
            example(1, "9 times table trick", "Calculate 9 &times; 6",
                    ["10 &times; 6 = 60", "Subtract one 6", "60 &minus; 6 = 54"],
                    "= 54", "Multiples of 9 are always one less than 10&times;n."),
            example(2, "7 times table", "Calculate 7 &times; 8",
                    ["7 &times; 7 = 49", "Add one more 7", "49 + 7 = 56"],
                    "= 56", "Use the square fact 7&times;7=49 as a stepping stone."),
            example(3, "12 times table", "Calculate 12 &times; 8",
                    ["12 = 10 + 2", "(10&times;8) + (2&times;8)", "80 + 16 = 96"],
                    "= 96", "Split 12 into 10 + 2 and multiply each separately."),
            example(4, "11 times table", "Calculate 11 &times; 7",
                    ["For 1&minus;9, repeat the digit", "11 &times; 7 = 77", "&check;"],
                    "= 77", "11 &times; 12 breaks the rule: it's 132, not 1212.")],
        "practice": [
            practice(1, "6 and 7 times tables", "#1F5FA6", "#EEF3FF", "#1F5FA6",
                     "Recall as fast as you can.",
                     [("a", "6 &times; 8 = ___", "48"), ("b", "7 &times; 9 = ___", "63"),
                      ("c", "6 &times; 12 = ___", "72"), ("d", "7 &times; 6 = ___", "42")]),
            practice(2, "9 times table", "#1F5FA6", "#EEF3FF", "#1F5FA6",
                     "Use the &times;10&minus;n trick if you need to.",
                     [("a", "9 &times; 4 = ___", "36"), ("b", "9 &times; 7 = ___", "63"),
                      ("c", "9 &times; 11 = ___", "99"), ("d", "9 &times; 12 = ___", "108")]),
            practice(3, "11 times table", "#CC0000", "#FFF0F0", "#CC0000",
                     "Most are easy &mdash; just repeat the digit. Watch out for 11&times;10, 11&times;11, 11&times;12!",
                     [("a", "11 &times; 6 = ___", "66"), ("b", "11 &times; 9 = ___", "99"),
                      ("c", "11 &times; 11 = ___", "121"), ("d", "11 &times; 12 = ___", "132")]),
            practice(4, "12 times table", "#1E7D2E", "#EDFAEE", "#1E7D2E",
                     "Split 12 into 10 + 2 if needed.",
                     [("a", "12 &times; 5 = ___", "60"), ("b", "12 &times; 7 = ___", "84"),
                      ("c", "12 &times; 9 = ___", "108"), ("d", "12 &times; 12 = ___", "144")]),
            practice(5, "Mixed harder tables", "#7B3FA0", "#F5EEFF", "#7B3FA0",
                     "All 6/7/9/11/12 facts mixed.",
                     [("a", "7 &times; 12 = ___", "84"), ("b", "9 &times; 6 = ___", "54"),
                      ("c", "11 &times; 8 = ___", "88"), ("d", "6 &times; 9 = ___", "54"),
                      ("e", "12 &times; 11 = ___", "132")])],
        "misconceptions": {"items": [
            {"id": "a", "statement": "11 &times; 12 = 1212", "correct": False},
            {"id": "b", "statement": "9 &times; 7 = 63 because 6+3 = 9", "correct": True},
            {"id": "c", "statement": "7 &times; 8 = 54", "correct": False},
            {"id": "d", "statement": "12 &times; 12 = 144", "correct": True},
            {"id": "e", "statement": "6 &times; 7 &ne; 7 &times; 6", "correct": False}]},
        "challenge": {"problems": [
            {"id": "a", "text": "A football coach has <strong>11 players</strong> in each of <strong>9 teams</strong>. "
             "<strong>7 players</strong> are absent. How many are present? Show your working."},
            {"id": "b", "text": "A baker makes trays of <strong>12 buns</strong>. She bakes for <strong>6 hours</strong> "
             "and produces <strong>1 tray every 30 minutes</strong>. How many buns does she make in total?"}]},
    })


    # ── 091 — Division as the inverse of multiplication ───────────────────────
    write_ws("091-division-as-the-inverse-of-multiplication.json", {
        "title": "MULTIPLICATION AND DIVISION,\n(DIVISION AS THE INVERSE)",
        "objective": "LO: I can use multiplication facts to solve division problems by recognising they are inverse operations.",
        "send_mode": False,
        "info_boxes": {
            "key_terms": {"id": "key_terms", "title": "What does inverse mean?", "content": [
                {"type": "paragraph", "text": "<span class=\"ul-b\">Inverse</span> means <span class=\"ul-k\">opposite</span>. "
                 "Multiplication and division are inverses: one undoes the other."},
                {"type": "paragraph", "text": "<span class=\"rb\">Fact families:</span> from one multiplication you can write "
                 "FOUR related facts. e.g. 3&times;4=12 gives 4&times;3=12, 12&divide;3=4, 12&divide;4=3."}]},
            "what_we_learn": {"id": "what_we_learn", "title": "Fact families", "examples": [
                {"correct": True, "expr": "5 &times; 6 = 30",   "desc": "multiplication"},
                {"correct": True, "expr": "6 &times; 5 = 30",   "desc": "commutative"},
                {"correct": True, "expr": "30 &divide; 5 = 6",  "desc": "inverse"},
                {"correct": True, "expr": "30 &divide; 6 = 5",  "desc": "inverse"},
                {"correct": False, "expr": "30 &divide; 30 = 1 &times; 5 + 6", "desc": "doesn't follow"}]},
            "key_idea": {"id": "key_idea", "title": "Key idea",
                "text": "If a &times; b = c, then c &divide; a = b AND c &divide; b = a. Use what you know about times tables to divide.",
                "equation": "<span class=\"ov\">7 &times; 8 = 56</span> &rarr; <span class=\"ovr\">56 &divide; 7 = 8</span>",
                "caption": "Same numbers, inverse operation"}},
        "modelled_examples": [
            example(1, "fact family from a multiplication",
                    "If 4 &times; 7 = 28, write the four related facts.",
                    ["4 &times; 7 = 28", "7 &times; 4 = 28", "28 &divide; 4 = 7,  28 &divide; 7 = 4"],
                    "Four facts",
                    "Same three numbers (4, 7, 28) just rearranged."),
            example(2, "use multiplication to divide",
                    "Calculate 42 &divide; 6",
                    ["Think: 6 &times; ___ = 42",
                     "From times table: 6 &times; 7 = 42",
                     "So 42 &divide; 6 = 7"],
                    "= 7",
                    "Recall the multiplication fact, then read off the inverse."),
            example(3, "checking with the inverse",
                    "Check that 81 &divide; 9 = 9 is correct.",
                    ["Inverse: 9 &times; 9 = ?",
                     "9 &times; 9 = 81",
                     "Match &check;"],
                    "Correct",
                    "If multiplication gives the original, the division is right."),
            example(4, "missing-number problem",
                    "Solve: ___ &divide; 8 = 7",
                    ["Inverse: 8 &times; 7 = ?",
                     "8 &times; 7 = 56",
                     "So the missing number is 56"],
                    "= 56",
                    "Multiplying both sides by 8 gives the original number.")],
        "practice": [
            practice(1, "Complete the fact family", "#1F5FA6", "#EEF3FF", "#1F5FA6",
                     "Each multiplication has 3 partners. Write them.",
                     [("a", "5 &times; 9 = 45 &rarr; ___, ___, ___", None),
                      ("b", "6 &times; 8 = 48 &rarr; ___, ___, ___", None),
                      ("c", "7 &times; 7 = 49 &rarr; ___, ___", None),
                      ("d", "12 &times; 4 = 48 &rarr; ___, ___, ___", None)]),
            practice(2, "Use multiplication to divide", "#1F5FA6", "#EEF3FF", "#1F5FA6",
                     "Think which multiplication helps.",
                     [("a", "36 &divide; 4 = ___", "9"), ("b", "63 &divide; 7 = ___", "9"),
                      ("c", "72 &divide; 8 = ___", "9"), ("d", "55 &divide; 5 = ___", "11")]),
            practice(3, "Check with the inverse", "#CC0000", "#FFF0F0", "#CC0000",
                     "Is each statement correct? Use multiplication to check.",
                     [("a", "84 &divide; 7 = 12 &mdash; check by 7&times;12", "yes 7&times;12=84"),
                      ("b", "54 &divide; 6 = 8 &mdash; check by 6&times;8", "no, 6&times;8=48"),
                      ("c", "121 &divide; 11 = 11 &mdash; check", "yes"),
                      ("d", "96 &divide; 8 = 11 &mdash; check", "no, 8&times;11=88")]),
            practice(4, "Missing-number problems", "#1E7D2E", "#EDFAEE", "#1E7D2E",
                     "Use the inverse to find the unknown.",
                     [("a", "___ &divide; 9 = 8", "72"), ("b", "144 &divide; ___ = 12", "12"),
                      ("c", "___ &divide; 7 = 11", "77"), ("d", "108 &divide; ___ = 9", "12")]),
            practice(5, "Mixed fact-family practice", "#7B3FA0", "#F5EEFF", "#7B3FA0",
                     "Spot the multiplication fact you need.",
                     [("a", "If 12 &times; 6 = 72, then 72 &divide; 6 = ___", "12"),
                      ("b", "If 8 &times; 9 = 72, then 72 &divide; 9 = ___", "8"),
                      ("c", "11 &times; 11 = ___, so 121 &divide; 11 = ___", "121, 11"),
                      ("d", "If 7 &times; 5 = 35, then 35 &divide; 5 = ___", "7"),
                      ("e", "Write 4 facts from 4 &times; 6 = 24", "24÷4=6, 24÷6=4, 6×4=24")])],
        "misconceptions": {"items": [
            {"id": "a", "statement": "Division is the inverse of multiplication", "correct": True},
            {"id": "b", "statement": "If 7&times;9=63, then 63&divide;7=9", "correct": True},
            {"id": "c", "statement": "Division is commutative: 12&divide;3 = 3&divide;12", "correct": False},
            {"id": "d", "statement": "If a&times;b = c, then c&divide;a = b", "correct": True},
            {"id": "e", "statement": "Multiplication undoes division", "correct": True}]},
        "challenge": {"problems": [
            {"id": "a", "text": "A teacher has <strong>56 stickers</strong> to share equally between <strong>8 children</strong>. "
             "Without dividing directly, use multiplication facts to find how many each child gets. Show your reasoning."},
            {"id": "b", "text": "Mia says &lsquo;I know 7 &times; 11 = 77, so I also know 77 &divide; 7 and 77 &divide; 11.&rsquo; "
             "Is she right? Write all four related facts and explain."}]},
    })


    # ── 099 — Multiplying by 10, 100 and 1000 ──────────────────────────────────
    write_ws("099-multiplying-by-10-100-and-1000.json", {
        "title": "MULTIPLICATION,\n(BY 10, 100 AND 1000)",
        "objective": "LO: I can multiply whole numbers and decimals by 10, 100 and 1000 by shifting place value.",
        "send_mode": False,
        "info_boxes": {
            "key_terms": {"id": "key_terms", "title": "How does &times;10 work?", "content": [
                {"type": "paragraph", "text": "Multiplying by <span class=\"ul-b\">10</span> shifts every digit one column "
                 "<span class=\"ul-k\">LEFT</span>. The digits stay the same; their place value changes."},
                {"type": "paragraph", "text": "<span class=\"rb\">Common error:</span> &lsquo;just add a zero.&rsquo; That works "
                 "only for whole numbers. For decimals, you must shift digits (3.4 &times; 10 = 34, not 3.40)."}]},
            "what_we_learn": {"id": "what_we_learn", "title": "Examples of place-value shift", "examples": [
                {"correct": True,  "expr": "7 &times; 10 = 70",        "desc": "shift L by 1"},
                {"correct": True,  "expr": "7 &times; 100 = 700",      "desc": "shift L by 2"},
                {"correct": True,  "expr": "7 &times; 1000 = 7000",    "desc": "shift L by 3"},
                {"correct": True,  "expr": "0.4 &times; 10 = 4",       "desc": "decimal shifts too"},
                {"correct": False, "expr": "3.4 &times; 10 = 3.40",    "desc": "should be 34"}]},
            "key_idea": {"id": "key_idea", "title": "Key idea",
                "text": "Multiplying by 10 = shift digits 1 left. By 100 = shift 2 left. By 1000 = shift 3 left. The decimal point appears to move RIGHT.",
                "equation": "<span class=\"ov\">3.45</span> &times; <span class=\"ov\">100</span> = <span class=\"ovr\">345</span>",
                "caption": "Decimal point moves 2 places right"}},
        "modelled_examples": [
            example(1, "whole &times; 10", "Calculate 47 &times; 10",
                    ["47 has digits 4 and 7", "Shift each one column left", "= 470"],
                    "= 470", "Add a zero in the units column to mark the new place."),
            example(2, "whole &times; 100", "Calculate 23 &times; 100",
                    ["Each digit shifts 2 places left", "Add 2 zeros as placeholders", "= 2300"],
                    "= 2300", "Multiplying by 100 = multiplying by 10 twice."),
            example(3, "decimal &times; 10", "Calculate 3.6 &times; 10",
                    ["3.6 has 3 ones and 6 tenths", "Shift each one place left", "= 36"],
                    "= 36", "The 6 moves from tenths to ones."),
            example(4, "decimal &times; 1000", "Calculate 0.045 &times; 1000",
                    ["Shift each digit 3 places left", "0.045 &rarr; 45.0", "= 45"],
                    "= 45", "Decimal point moves 3 places right.")],
        "practice": [
            practice(1, "&times; 10", "#1F5FA6", "#EEF3FF", "#1F5FA6",
                     "Shift digits one column left.",
                     [("a", "8 &times; 10 = ___", "80"), ("b", "26 &times; 10 = ___", "260"),
                      ("c", "0.7 &times; 10 = ___", "7"), ("d", "3.4 &times; 10 = ___", "34")]),
            practice(2, "&times; 100", "#1F5FA6", "#EEF3FF", "#1F5FA6",
                     "Shift digits two columns left.",
                     [("a", "5 &times; 100 = ___", "500"), ("b", "32 &times; 100 = ___", "3200"),
                      ("c", "0.06 &times; 100 = ___", "6"), ("d", "1.45 &times; 100 = ___", "145")]),
            practice(3, "&times; 1000", "#CC0000", "#FFF0F0", "#CC0000",
                     "Shift digits three columns left.",
                     [("a", "4 &times; 1000 = ___", "4000"), ("b", "12 &times; 1000 = ___", "12000"),
                      ("c", "0.005 &times; 1000 = ___", "5"), ("d", "2.34 &times; 1000 = ___", "2340")]),
            practice(4, "Mixed scales", "#1E7D2E", "#EDFAEE", "#1E7D2E",
                     "Spot the &times;10/100/1000 pattern.",
                     [("a", "7 &times; ___ = 700", "100"), ("b", "0.3 &times; ___ = 30", "100"),
                      ("c", "0.06 &times; 1000 = ___", "60"), ("d", "8.4 &times; 100 = ___", "840")]),
            practice(5, "Two-step", "#7B3FA0", "#F5EEFF", "#7B3FA0",
                     "Apply the rule twice.",
                     [("a", "(2.5 &times; 10) &times; 100 = ___", "2500"),
                      ("b", "(0.04 &times; 1000) &times; 10 = ___", "400"),
                      ("c", "(7 &times; 100) + (3 &times; 10) = ___", "730"),
                      ("d", "(0.6 &times; 1000) &minus; (5 &times; 10) = ___", "550"),
                      ("e", "(1.2 &times; 100) &times; 10 = ___", "1200")])],
        "misconceptions": {"items": [
            {"id": "a", "statement": "3.4 &times; 10 = 3.40", "correct": False},
            {"id": "b", "statement": "0.05 &times; 100 = 5", "correct": True},
            {"id": "c", "statement": "47 &times; 100 = 4700", "correct": True},
            {"id": "d", "statement": "&times;10 means &lsquo;just add a zero&rsquo;", "correct": False},
            {"id": "e", "statement": "0.6 &times; 1000 = 600", "correct": True}]},
        "challenge": {"problems": [
            {"id": "a", "text": "A box of pencils contains <strong>100 pencils</strong>. A school orders <strong>34 boxes</strong>. "
             "How many pencils in total? Use &times;100 to find the answer."},
            {"id": "b", "text": "A water bottle holds <strong>0.75 litres</strong>. A factory fills <strong>1000 bottles</strong> "
             "an hour. How many litres of water are used per hour? Show your working."}]},
    })


    # ── 096 — Dividing by 10, 100 and 1000 ─────────────────────────────────────
    write_ws("096-dividing-by-10-100-and-1000.json", {
        "title": "DIVISION,\n(BY 10, 100 AND 1000)",
        "objective": "LO: I can divide whole numbers and decimals by 10, 100 and 1000 by shifting place value.",
        "send_mode": False,
        "info_boxes": {
            "key_terms": {"id": "key_terms", "title": "How does &divide;10 work?", "content": [
                {"type": "paragraph", "text": "Dividing by <span class=\"ul-b\">10</span> shifts every digit one column "
                 "<span class=\"ul-k\">RIGHT</span>. The digits stay the same; their place value gets smaller."},
                {"type": "paragraph", "text": "<span class=\"rb\">Common error:</span> &lsquo;just remove a zero.&rsquo; "
                 "Doesn't work for decimals or numbers without trailing zeros (e.g. 47 &divide; 10 &ne; 47, it's 4.7)."}]},
            "what_we_learn": {"id": "what_we_learn", "title": "Examples of place-value shift", "examples": [
                {"correct": True,  "expr": "70 &divide; 10 = 7",        "desc": "shift R by 1"},
                {"correct": True,  "expr": "700 &divide; 100 = 7",      "desc": "shift R by 2"},
                {"correct": True,  "expr": "7000 &divide; 1000 = 7",    "desc": "shift R by 3"},
                {"correct": True,  "expr": "47 &divide; 10 = 4.7",      "desc": "decimal appears"},
                {"correct": False, "expr": "47 &divide; 10 = 47",       "desc": "must shift, not erase"}]},
            "key_idea": {"id": "key_idea", "title": "Key idea",
                "text": "Dividing by 10 = shift digits 1 right. By 100 = shift 2 right. By 1000 = shift 3 right. The decimal point appears to move LEFT.",
                "equation": "<span class=\"ov\">345</span> &divide; <span class=\"ov\">100</span> = <span class=\"ovr\">3.45</span>",
                "caption": "Decimal point moves 2 places left"}},
        "modelled_examples": [
            example(1, "whole &divide; 10", "Calculate 80 &divide; 10",
                    ["80 has digits 8 and 0", "Shift each one column right", "= 8"],
                    "= 8", "The 8 moves from tens to ones; the 0 falls off."),
            example(2, "whole &divide; 100", "Calculate 4500 &divide; 100",
                    ["Each digit shifts 2 places right", "4500 &rarr; 45.00", "= 45"],
                    "= 45", "Two zeros become placeholders that drop off."),
            example(3, "needs decimal", "Calculate 23 &divide; 10",
                    ["The 3 moves to tenths", "Decimal point appears", "= 2.3"],
                    "= 2.3", "We can't just &lsquo;remove a zero&rsquo; here &mdash; there isn't one."),
            example(4, "decimal &divide; 1000", "Calculate 47 &divide; 1000",
                    ["Shift each digit 3 places right", "47 &rarr; 0.047", "= 0.047"],
                    "= 0.047", "Add zeros as placeholders before the digits.")],
        "practice": [
            practice(1, "&divide; 10", "#1F5FA6", "#EEF3FF", "#1F5FA6",
                     "Shift digits one column right.",
                     [("a", "60 &divide; 10 = ___", "6"), ("b", "240 &divide; 10 = ___", "24"),
                      ("c", "8 &divide; 10 = ___", "0.8"), ("d", "37 &divide; 10 = ___", "3.7")]),
            practice(2, "&divide; 100", "#1F5FA6", "#EEF3FF", "#1F5FA6",
                     "Shift digits two columns right.",
                     [("a", "500 &divide; 100 = ___", "5"), ("b", "3200 &divide; 100 = ___", "32"),
                      ("c", "6 &divide; 100 = ___", "0.06"), ("d", "145 &divide; 100 = ___", "1.45")]),
            practice(3, "&divide; 1000", "#CC0000", "#FFF0F0", "#CC0000",
                     "Shift digits three columns right.",
                     [("a", "4000 &divide; 1000 = ___", "4"), ("b", "12000 &divide; 1000 = ___", "12"),
                      ("c", "5 &divide; 1000 = ___", "0.005"), ("d", "2340 &divide; 1000 = ___", "2.34")]),
            practice(4, "Mixed scales", "#1E7D2E", "#EDFAEE", "#1E7D2E",
                     "Spot the &divide;10/100/1000 pattern.",
                     [("a", "700 &divide; ___ = 7", "100"), ("b", "30 &divide; ___ = 0.3", "100"),
                      ("c", "60 &divide; 1000 = ___", "0.06"), ("d", "840 &divide; 100 = ___", "8.4")]),
            practice(5, "Two-step", "#7B3FA0", "#F5EEFF", "#7B3FA0",
                     "Apply the rule twice or combine with multiplication.",
                     [("a", "(2500 &divide; 10) &divide; 100 = ___", "2.5"),
                      ("b", "(400 &divide; 1000) &times; 10 = ___", "4"),
                      ("c", "(700 &divide; 100) + (30 &divide; 10) = ___", "10"),
                      ("d", "(600 &divide; 1000) &times; 100 = ___", "60"),
                      ("e", "(1200 &divide; 100) &divide; 10 = ___", "1.2")])],
        "misconceptions": {"items": [
            {"id": "a", "statement": "70 &divide; 10 = 7", "correct": True},
            {"id": "b", "statement": "47 &divide; 10 = 47 (just remove zero)", "correct": False},
            {"id": "c", "statement": "5 &divide; 100 = 0.05", "correct": True},
            {"id": "d", "statement": "&divide;10 makes a number smaller", "correct": True},
            {"id": "e", "statement": "0.6 &divide; 1000 = 600", "correct": False}]},
        "challenge": {"problems": [
            {"id": "a", "text": "A factory produces <strong>4500 toys</strong> a week. They are packed in boxes of "
             "<strong>100 toys</strong>. How many boxes are made? Use &divide;100 to find out."},
            {"id": "b", "text": "<strong>3.4 km</strong> is how many <strong>metres</strong>? Then divide that "
             "answer by 1000 to convert back to km. Show that you get the original number."}]},
    })

    print("\nBatch 1 complete.")
