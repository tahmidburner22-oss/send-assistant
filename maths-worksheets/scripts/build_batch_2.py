#!/usr/bin/env python3
"""Batch 2 builder — 8 worksheets covering percentage change, long/short
mult/div, one/two-step equations, and expanding single brackets."""
import json, os, sys

# Reuse helpers from batch 1
sys.path.insert(0, os.path.dirname(__file__))
from build_batch_1 import practice, example, write_ws


# ── 080 — Percentage change ────────────────────────────────────────────────
write_ws("080-percentage-change.json", {
    "title": "FRACTIONS, DECIMALS AND PERCENTAGES,\n(PERCENTAGE CHANGE)",
    "objective": "LO: I can calculate percentage increase, decrease and percentage change.",
    "send_mode": False,
    "info_boxes": {
        "key_terms": {"id": "key_terms", "title": "What is percentage change?", "content": [
            {"type": "paragraph", "text": "<span class=\"ul-b\">Percentage change</span> measures how much a value has "
             "<span class=\"ul-k\">increased or decreased</span> as a percentage of the original."},
            {"type": "paragraph", "text": "<span class=\"rb\">Formula:</span> % change = (change &divide; original) &times; 100. "
             "Always divide by the ORIGINAL amount, not the new amount."}]},
        "what_we_learn": {"id": "what_we_learn", "title": "Examples", "examples": [
            {"correct": True,  "expr": "£20 &rarr; £25 = +25%",  "desc": "increase"},
            {"correct": True,  "expr": "£40 &rarr; £30 = &minus;25%", "desc": "decrease"},
            {"correct": True,  "expr": "10 &rarr; 12 = +20%",     "desc": "(2&divide;10)&times;100"},
            {"correct": False, "expr": "£20 &rarr; £30 = +33%",   "desc": "should be +50%"},
            {"correct": False, "expr": "Divide by NEW value",     "desc": "always divide by ORIGINAL"}]},
        "key_idea": {"id": "key_idea", "title": "Key idea",
            "text": "% change = (new &minus; old) &divide; old &times; 100. Positive = increase, negative = decrease.",
            "equation": "<span class=\"ov\">change</span> &divide; <span class=\"ov\">original</span> &times; 100 = <span class=\"ovr\">% change</span>",
            "caption": "Always divide by ORIGINAL"}},
    "modelled_examples": [
        example(1, "increase", "Price rises from £40 to £50. Find the % increase.",
                ["Change = 50 &minus; 40 = 10", "10 &divide; 40 = 0.25", "0.25 &times; 100 = 25%"],
                "= 25% increase", "Always divide the change by the ORIGINAL price (£40)."),
        example(2, "decrease", "Population drops from 800 to 600. Find the % decrease.",
                ["Change = 800 &minus; 600 = 200", "200 &divide; 800 = 0.25", "0.25 &times; 100 = 25%"],
                "= 25% decrease", "The change is always positive; the &lsquo;decrease&rsquo; describes the direction."),
        example(3, "from amounts", "A coat costs £80 in a sale. The original price was £100. % change?",
                ["Change = 80 &minus; 100 = &minus;20", "&minus;20 &divide; 100 = &minus;0.20", "&minus;0.20 &times; 100 = &minus;20%"],
                "= 20% decrease", "Negative answer means a decrease."),
        example(4, "growth", "Plant grows from 12 cm to 18 cm. % growth?",
                ["Change = 18 &minus; 12 = 6", "6 &divide; 12 = 0.5", "0.5 &times; 100 = 50%"],
                "= 50% growth", "Divide the increase by the original (12 cm).")],
    "practice": [
        practice(1, "Find the change", "#1F5FA6", "#EEF3FF", "#1F5FA6",
                 "Calculate the change (new &minus; old).",
                 [("a", "£50 &rarr; £65", "+£15"), ("b", "£90 &rarr; £75", "&minus;£15"),
                  ("c", "200 &rarr; 240", "+40"), ("d", "150 &rarr; 120", "&minus;30")]),
        practice(2, "% increase", "#1F5FA6", "#EEF3FF", "#1F5FA6",
                 "Calculate the percentage increase. Use (change &divide; old) &times; 100.",
                 [("a", "£20 &rarr; £25", "25%"), ("b", "£40 &rarr; £50", "25%"),
                  ("c", "60 &rarr; 90", "50%"), ("d", "200 &rarr; 240", "20%")]),
        practice(3, "% decrease", "#CC0000", "#FFF0F0", "#CC0000",
                 "Calculate the percentage decrease.",
                 [("a", "£40 &rarr; £30", "25%"), ("b", "£100 &rarr; £85", "15%"),
                  ("c", "150 &rarr; 120", "20%"), ("d", "80 &rarr; 60", "25%")]),
        practice(4, "Word problems", "#1E7D2E", "#EDFAEE", "#1E7D2E",
                 "State whether each is an increase or decrease, and find the %.",
                 [("a", "Salary £25k &rarr; £30k", "20% increase"),
                  ("b", "Houses 400 &rarr; 480", "20% increase"),
                  ("c", "Bill £80 &rarr; £64", "20% decrease"),
                  ("d", "Speed 50 &rarr; 35 mph", "30% decrease")]),
        practice(5, "Mixed % change", "#7B3FA0", "#F5EEFF", "#7B3FA0",
                 "Find the percentage change. State increase or decrease.",
                 [("a", "12 &rarr; 15", "+25%"), ("b", "£90 &rarr; £108", "+20%"),
                  ("c", "60 &rarr; 45", "&minus;25%"), ("d", "£500 &rarr; £575", "+15%"),
                  ("e", "120 &rarr; 90", "&minus;25%")])],
    "misconceptions": {"items": [
        {"id": "a", "statement": "£20 &rarr; £25 is a 25% increase", "correct": True},
        {"id": "b", "statement": "Divide by the new value, not the old", "correct": False},
        {"id": "c", "statement": "£100 &rarr; £80 is a 20% decrease", "correct": True},
        {"id": "d", "statement": "200 &rarr; 240 is a 40% increase", "correct": False},
        {"id": "e", "statement": "% change can be negative for a decrease", "correct": True}]},
    "challenge": {"problems": [
        {"id": "a", "text": "A shop sells a TV for <strong>£500</strong>. In a sale they reduce it to <strong>£425</strong>. "
         "After the sale they raise it back to <strong>£480</strong>. Find the % decrease in the sale and the % increase "
         "after the sale. Are they the same number? Explain why or why not."},
        {"id": "b", "text": "A car worth <strong>£12 000</strong> loses <strong>15% of its value</strong> in year 1, "
         "then another <strong>10%</strong> in year 2. What is the car worth after 2 years? What's the total % change?"}]},
})


# ── 097 — Long division ────────────────────────────────────────────────────
write_ws("097-long-division.json", {
    "title": "DIVISION,\n(LONG DIVISION)",
    "objective": "LO: I can divide larger numbers using the long division algorithm (bus stop method).",
    "send_mode": False,
    "info_boxes": {
        "key_terms": {"id": "key_terms", "title": "What is long division?", "content": [
            {"type": "paragraph", "text": "<span class=\"ul-b\">Long division</span> is a written method for dividing by "
             "<span class=\"ul-k\">2-digit or larger</span> numbers. We work digit-by-digit from left to right."},
            {"type": "paragraph", "text": "<span class=\"rb\">Bus stop:</span> the divisor sits outside, the dividend "
             "underneath, and the answer appears on top. Subtract, bring down, repeat."}]},
        "what_we_learn": {"id": "what_we_learn", "title": "Steps to remember", "examples": [
            {"correct": True, "expr": "Divide, multiply, subtract, bring down", "desc": "DMSB cycle"},
            {"correct": True, "expr": "672 &divide; 12 = 56",        "desc": "no remainder"},
            {"correct": True, "expr": "415 &divide; 13 = 31 r 12",   "desc": "with remainder"},
            {"correct": False, "expr": "Skip a step in DMSB",        "desc": "leads to errors"},
            {"correct": False, "expr": "Forget place value alignment", "desc": "answer wrong"}]},
        "key_idea": {"id": "key_idea", "title": "Key idea",
            "text": "Repeat the cycle: <strong>D</strong>ivide, <strong>M</strong>ultiply, <strong>S</strong>ubtract, <strong>B</strong>ring down. Stop when no more digits to bring down.",
            "equation": "<span class=\"ov\">D</span> &rarr; <span class=\"ov\">M</span> &rarr; <span class=\"ov\">S</span> &rarr; <span class=\"ovr\">B</span>",
            "caption": "Repeat until done"}},
    "modelled_examples": [
        example(1, "no remainder", "Calculate 672 &divide; 12",
                ["12 into 6? No. 12 into 67? 5 (5&times;12=60)",
                 "67 &minus; 60 = 7. Bring down 2 &rarr; 72",
                 "12 into 72? 6 (6&times;12=72)"],
                "= 56", "Answer: 56 (no remainder). Check: 56&times;12 = 672 &check;"),
        example(2, "with remainder", "Calculate 415 &divide; 13",
                ["13 into 41? 3 (3&times;13=39)",
                 "41 &minus; 39 = 2. Bring down 5 &rarr; 25",
                 "13 into 25? 1 (1&times;13=13). 25&minus;13 = 12"],
                "= 31 r 12", "31 remainder 12. Check: 31&times;13 + 12 = 403+12 = 415 &check;"),
        example(3, "3-digit divisor", "Calculate 4500 &divide; 25",
                ["25 into 45? 1 (1&times;25=25). 45&minus;25 = 20",
                 "Bring down 0 &rarr; 200. 25 into 200? 8",
                 "200 &minus; 200 = 0. Bring down 0. 25 into 0? 0"],
                "= 180", "Check: 180&times;25 = 4500 &check;"),
        example(4, "decimal answer", "Calculate 35 &divide; 4",
                ["4 into 35? 8 (8&times;4=32). 35&minus;32 = 3",
                 "Add a decimal point and zero: 30",
                 "4 into 30? 7 (7&times;4=28). 30&minus;28 = 2 &mdash; continue"],
                "= 8.75", "Keep going past decimal point until remainder is 0 or you have enough d.p.")],
    "practice": [
        practice(1, "Single-digit divisor", "#1F5FA6", "#EEF3FF", "#1F5FA6",
                 "Use the bus-stop method.",
                 [("a", "144 &divide; 6", "24"), ("b", "196 &divide; 7", "28"),
                  ("c", "315 &divide; 9", "35"), ("d", "568 &divide; 8", "71")]),
        practice(2, "Two-digit divisor (no remainder)", "#1F5FA6", "#EEF3FF", "#1F5FA6",
                 "Divide carefully &mdash; line up digits.",
                 [("a", "672 &divide; 12", "56"), ("b", "936 &divide; 13", "72"),
                  ("c", "1056 &divide; 16", "66"), ("d", "1638 &divide; 18", "91")]),
        practice(3, "With remainder", "#CC0000", "#FFF0F0", "#CC0000",
                 "Write the answer as &lsquo;quotient r remainder&rsquo;.",
                 [("a", "415 &divide; 13", "31 r 12"), ("b", "500 &divide; 17", "29 r 7"),
                  ("c", "847 &divide; 23", "36 r 19"), ("d", "1234 &divide; 41", "30 r 4")]),
        practice(4, "Decimal answers", "#1E7D2E", "#EDFAEE", "#1E7D2E",
                 "Continue past the decimal point until exact.",
                 [("a", "35 &divide; 4", "8.75"), ("b", "63 &divide; 8", "7.875"),
                  ("c", "27 &divide; 5", "5.4"), ("d", "100 &divide; 8", "12.5")]),
        practice(5, "Mixed long division", "#7B3FA0", "#F5EEFF", "#7B3FA0",
                 "Choose the right method.",
                 [("a", "504 &divide; 14", "36"), ("b", "725 &divide; 25", "29"),
                  ("c", "847 &divide; 11", "77"), ("d", "1000 &divide; 8", "125"),
                  ("e", "234 &divide; 18", "13")])],
    "misconceptions": {"items": [
        {"id": "a", "statement": "Always divide left to right", "correct": True},
        {"id": "b", "statement": "DMSB stands for Divide, Multiply, Subtract, Bring down", "correct": True},
        {"id": "c", "statement": "If divisor doesn't fit, skip the digit", "correct": False},
        {"id": "d", "statement": "Remainder must be smaller than divisor", "correct": True},
        {"id": "e", "statement": "100 &divide; 8 has remainder 4", "correct": False}]},
    "challenge": {"problems": [
        {"id": "a", "text": "A factory has <strong>2160 chocolates</strong> to pack into boxes of <strong>24</strong>. "
         "How many full boxes? Are any chocolates left over? Show your full long division."},
        {"id": "b", "text": "Mr Khan drives <strong>462 miles</strong> using <strong>14 gallons</strong> of fuel. "
         "Find his miles-per-gallon (mpg). Now do <strong>637 miles &divide; 13 gallons</strong>. Which trip was more efficient?"}]},
})


# ── 098 — Long multiplication ──────────────────────────────────────────────
write_ws("098-long-multiplication.json", {
    "title": "MULTIPLICATION,\n(LONG MULTIPLICATION)",
    "objective": "LO: I can multiply 2- and 3-digit numbers using the long multiplication (column) method.",
    "send_mode": False,
    "info_boxes": {
        "key_terms": {"id": "key_terms", "title": "What is long multiplication?", "content": [
            {"type": "paragraph", "text": "<span class=\"ul-b\">Long multiplication</span> is the column method for "
             "<span class=\"ul-k\">multi-digit</span> &times; multi-digit. We multiply by each digit separately, then add."},
            {"type": "paragraph", "text": "<span class=\"rb\">Place-value rule:</span> when multiplying by tens, "
             "put a 0 in the units column first. By hundreds, put 00."}]},
        "what_we_learn": {"id": "what_we_learn", "title": "Examples", "examples": [
            {"correct": True, "expr": "23 &times; 45 = 1035",       "desc": "2-digit"},
            {"correct": True, "expr": "146 &times; 27 = 3942",      "desc": "3-by-2 digit"},
            {"correct": True, "expr": "Multiply units, then tens",  "desc": "two rows then add"},
            {"correct": False, "expr": "Forget the placeholder 0",  "desc": "answer wrong"},
            {"correct": False, "expr": "Multiply only the units",   "desc": "incomplete"}]},
        "key_idea": {"id": "key_idea", "title": "Key idea",
            "text": "Multiply by each digit of the bottom number separately. Each new row shifts left by one column (place value).",
            "equation": "<span class=\"ov\">23</span> &times; <span class=\"ov\">45</span> = <span class=\"ovr\">1035</span>",
            "caption": "Two rows, then add"}},
    "modelled_examples": [
        example(1, "2 by 2 digit", "Calculate 23 &times; 45",
                ["23 &times; 5 = 115 (units row)", "23 &times; 40 = 920 (tens row, with 0 placeholder)",
                 "115 + 920 = 1035"],
                "= 1035", "Always add a placeholder 0 when multiplying by the tens digit."),
        example(2, "with carrying", "Calculate 47 &times; 36",
                ["47 &times; 6 = 282 (units row)", "47 &times; 30 = 1410 (tens row)",
                 "282 + 1410 = 1692"],
                "= 1692", "Show carries clearly above each column."),
        example(3, "3 by 2 digit", "Calculate 146 &times; 27",
                ["146 &times; 7 = 1022", "146 &times; 20 = 2920",
                 "1022 + 2920 = 3942"],
                "= 3942", "3-digit numbers follow the same rules; just more digits."),
        example(4, "with zeros", "Calculate 304 &times; 25",
                ["304 &times; 5 = 1520", "304 &times; 20 = 6080",
                 "1520 + 6080 = 7600"],
                "= 7600", "The zero in 304 means &times;0 gives 0 in that column.")],
    "practice": [
        practice(1, "2 by 1 digit", "#1F5FA6", "#EEF3FF", "#1F5FA6",
                 "Use column method.",
                 [("a", "34 &times; 7", "238"), ("b", "56 &times; 8", "448"),
                  ("c", "73 &times; 9", "657"), ("d", "85 &times; 6", "510")]),
        practice(2, "2 by 2 digit", "#1F5FA6", "#EEF3FF", "#1F5FA6",
                 "Two rows, then add. Don't forget the placeholder 0.",
                 [("a", "23 &times; 45", "1035"), ("b", "62 &times; 38", "2356"),
                  ("c", "47 &times; 26", "1222"), ("d", "84 &times; 19", "1596")]),
        practice(3, "3 by 2 digit", "#CC0000", "#FFF0F0", "#CC0000",
                 "Same method, more digits.",
                 [("a", "146 &times; 27", "3942"), ("b", "234 &times; 35", "8190"),
                  ("c", "508 &times; 14", "7112"), ("d", "672 &times; 25", "16800")]),
        practice(4, "Word problems", "#1E7D2E", "#EDFAEE", "#1E7D2E",
                 "Set up a multiplication, solve.",
                 [("a", "27 boxes of 36 = ___", "972"),
                  ("b", "School trip: 14 coaches &times; 52 seats = ___", "728"),
                  ("c", "8 weeks at 175 mins/week = ___", "1400"),
                  ("d", "23 packs of 48 stickers = ___", "1104")]),
        practice(5, "Mixed", "#7B3FA0", "#F5EEFF", "#7B3FA0",
                 "Use the column method.",
                 [("a", "39 &times; 46", "1794"), ("b", "125 &times; 16", "2000"),
                  ("c", "78 &times; 53", "4134"), ("d", "246 &times; 18", "4428"),
                  ("e", "100 &times; 100", "10000")])],
    "misconceptions": {"items": [
        {"id": "a", "statement": "23 &times; 45 = 23 &times; 4 &times; 5", "correct": False},
        {"id": "b", "statement": "Add a placeholder 0 when multiplying by tens", "correct": True},
        {"id": "c", "statement": "47 &times; 36 = 1692", "correct": True},
        {"id": "d", "statement": "Multiplication is commutative: 23&times;45 = 45&times;23", "correct": True},
        {"id": "e", "statement": "304 &times; 25 = 760 (forget last 0)", "correct": False}]},
    "challenge": {"problems": [
        {"id": "a", "text": "A theatre has <strong>27 rows</strong> with <strong>48 seats</strong> per row. "
         "How many seats in total? If <strong>£12.50</strong> per ticket, what's the maximum revenue per show?"},
        {"id": "b", "text": "A factory packs <strong>148 chocolates per box</strong>, "
         "<strong>36 boxes per crate</strong>, and ships <strong>12 crates a day</strong>. "
         "How many chocolates ship per day? Show your working clearly."}]},
})


# ── 102 — Short division ───────────────────────────────────────────────────
write_ws("102-short-division.json", {
    "title": "DIVISION,\n(SHORT DIVISION)",
    "objective": "LO: I can use short division (bus-stop) to divide by a single-digit number.",
    "send_mode": False,
    "info_boxes": {
        "key_terms": {"id": "key_terms", "title": "What is short division?", "content": [
            {"type": "paragraph", "text": "<span class=\"ul-b\">Short division</span> is a quick written method for "
             "dividing by a <span class=\"ul-k\">SINGLE</span>-digit number. We carry remainders mentally."},
            {"type": "paragraph", "text": "<span class=\"rb\">When to use:</span> dividing by 2-9. For 10+, use long division."}]},
        "what_we_learn": {"id": "what_we_learn", "title": "Examples", "examples": [
            {"correct": True, "expr": "84 &divide; 4 = 21",       "desc": "no remainder"},
            {"correct": True, "expr": "85 &divide; 4 = 21 r 1",   "desc": "with remainder"},
            {"correct": True, "expr": "936 &divide; 6 = 156",     "desc": "3-digit"},
            {"correct": False, "expr": "Carry to the LEFT",       "desc": "carry to the RIGHT"},
            {"correct": False, "expr": "Skip a digit if too small", "desc": "write 0 above"}]},
        "key_idea": {"id": "key_idea", "title": "Key idea",
            "text": "Divide each digit left-to-right. If a digit is too small, carry to the next as a remainder.",
            "equation": "<span class=\"ov\">936</span> &divide; <span class=\"ov\">6</span> = <span class=\"ovr\">156</span>",
            "caption": "Left to right; carry small remainders"}},
    "modelled_examples": [
        example(1, "no remainder", "Calculate 84 &divide; 4",
                ["8 &divide; 4 = 2 (write above 8)", "4 &divide; 4 = 1 (write above 4)", "Read off: 21"],
                "= 21", "Check: 21 &times; 4 = 84 &check;"),
        example(2, "with carry", "Calculate 75 &divide; 3",
                ["7 &divide; 3 = 2 r 1 (carry the 1 to next digit &rarr; 15)",
                 "15 &divide; 3 = 5", "Read off: 25"],
                "= 25", "The remainder &lsquo;1&rsquo; from 7&divide;3 joins the next digit 5 to make 15."),
        example(3, "with remainder", "Calculate 85 &divide; 4",
                ["8 &divide; 4 = 2", "5 &divide; 4 = 1 r 1", "Read off: 21 r 1"],
                "= 21 r 1", "Final remainder is left over because no more digits to bring down."),
        example(4, "writing zero", "Calculate 612 &divide; 6",
                ["6 &divide; 6 = 1", "1 &divide; 6 = 0 r 1 (carry 1 &rarr; 12)", "12 &divide; 6 = 2"],
                "= 102", "When a digit doesn't divide, write 0 in the answer.")],
    "practice": [
        practice(1, "Short division (no carry)", "#1F5FA6", "#EEF3FF", "#1F5FA6",
                 "Each digit divides exactly.",
                 [("a", "48 &divide; 4", "12"), ("b", "96 &divide; 3", "32"),
                  ("c", "84 &divide; 2", "42"), ("d", "636 &divide; 3", "212")]),
        practice(2, "With carry", "#1F5FA6", "#EEF3FF", "#1F5FA6",
                 "Carry small remainders to the next digit.",
                 [("a", "75 &divide; 3", "25"), ("b", "92 &divide; 4", "23"),
                  ("c", "68 &divide; 4", "17"), ("d", "238 &divide; 7", "34")]),
        practice(3, "With remainder", "#CC0000", "#FFF0F0", "#CC0000",
                 "Write &lsquo;quotient r remainder&rsquo;.",
                 [("a", "85 &divide; 4", "21 r 1"), ("b", "47 &divide; 5", "9 r 2"),
                  ("c", "100 &divide; 7", "14 r 2"), ("d", "153 &divide; 6", "25 r 3")]),
        practice(4, "Writing zero in answer", "#1E7D2E", "#EDFAEE", "#1E7D2E",
                 "If a digit doesn't divide, write 0 in the answer.",
                 [("a", "612 &divide; 6", "102"), ("b", "509 &divide; 5", "101 r 4"),
                  ("c", "303 &divide; 3", "101"), ("d", "808 &divide; 4", "202")]),
        practice(5, "Mixed short division", "#7B3FA0", "#F5EEFF", "#7B3FA0",
                 "Choose carefully and check.",
                 [("a", "744 &divide; 8", "93"), ("b", "925 &divide; 5", "185"),
                  ("c", "486 &divide; 9", "54"), ("d", "327 &divide; 3", "109"),
                  ("e", "1001 &divide; 7", "143")])],
    "misconceptions": {"items": [
        {"id": "a", "statement": "Carry remainders to the next digit on the RIGHT", "correct": True},
        {"id": "b", "statement": "612 &divide; 6 = 12 (skip the 1)", "correct": False},
        {"id": "c", "statement": "85 &divide; 4 = 21 r 1", "correct": True},
        {"id": "d", "statement": "Short division works for any divisor", "correct": False},
        {"id": "e", "statement": "Always check: quotient &times; divisor + remainder = dividend", "correct": True}]},
    "challenge": {"problems": [
        {"id": "a", "text": "<strong>936 sweets</strong> are shared equally between <strong>8 children</strong>. "
         "How many sweets each? Are any left over? Show your short division."},
        {"id": "b", "text": "A school orders <strong>525 textbooks</strong> packed in boxes of <strong>7</strong>. "
         "How many full boxes? Now imagine <strong>530 books</strong>. How many full boxes and how many spare?"}]},
})


# ── 103 — Short multiplication ─────────────────────────────────────────────
write_ws("103-short-multiplication.json", {
    "title": "MULTIPLICATION,\n(SHORT MULTIPLICATION)",
    "objective": "LO: I can multiply a multi-digit number by a single digit using short multiplication.",
    "send_mode": False,
    "info_boxes": {
        "key_terms": {"id": "key_terms", "title": "What is short multiplication?", "content": [
            {"type": "paragraph", "text": "<span class=\"ul-b\">Short multiplication</span> is the column method for "
             "multi-digit &times; <span class=\"ul-k\">SINGLE</span>-digit. Multiply each digit, carry tens to the next column."},
            {"type": "paragraph", "text": "<span class=\"rb\">When to use:</span> multiplying by 2-9. For 10+, use long multiplication."}]},
        "what_we_learn": {"id": "what_we_learn", "title": "Examples", "examples": [
            {"correct": True, "expr": "234 &times; 6 = 1404",  "desc": "with carrying"},
            {"correct": True, "expr": "Carry tens to next column", "desc": "left-shift"},
            {"correct": True, "expr": "47 &times; 8 = 376",    "desc": "2-digit"},
            {"correct": False, "expr": "Forget to add the carry", "desc": "answer wrong"},
            {"correct": False, "expr": "Multiply right to left", "desc": "actually right-to-left IS correct!"}]},
        "key_idea": {"id": "key_idea", "title": "Key idea",
            "text": "Multiply each digit (right to left). If the result is 10+, write the units and CARRY the tens to the next column.",
            "equation": "<span class=\"ov\">47</span> &times; <span class=\"ov\">8</span> = <span class=\"ovr\">376</span>",
            "caption": "8&times;7=56, write 6 carry 5; then 8&times;4+5=37"},},
    "modelled_examples": [
        example(1, "no carry", "Calculate 32 &times; 3",
                ["3 &times; 2 = 6 (units)", "3 &times; 3 = 9 (tens)", "Read off: 96"],
                "= 96", "No carrying needed because each multiplication is &lt; 10."),
        example(2, "single carry", "Calculate 47 &times; 8",
                ["8 &times; 7 = 56 (write 6, carry 5)", "8 &times; 4 = 32, +5 = 37",
                 "Read off: 376"],
                "= 376", "Always work right to left, carrying any tens."),
        example(3, "3-digit number", "Calculate 234 &times; 6",
                ["6 &times; 4 = 24 (write 4, carry 2)", "6 &times; 3 = 18, +2 = 20 (write 0, carry 2)",
                 "6 &times; 2 = 12, +2 = 14"],
                "= 1404", "Multiple carries: each one adds to the next column."),
        example(4, "with zero", "Calculate 305 &times; 7",
                ["7 &times; 5 = 35 (write 5, carry 3)", "7 &times; 0 = 0, +3 = 3",
                 "7 &times; 3 = 21"],
                "= 2135", "Zeros multiply to give 0 — but carries still apply.")],
    "practice": [
        practice(1, "Single-digit results", "#1F5FA6", "#EEF3FF", "#1F5FA6",
                 "No carrying needed.",
                 [("a", "13 &times; 2", "26"), ("b", "23 &times; 3", "69"),
                  ("c", "31 &times; 3", "93"), ("d", "412 &times; 2", "824")]),
        practice(2, "With carrying", "#1F5FA6", "#EEF3FF", "#1F5FA6",
                 "Carry the tens to the next column.",
                 [("a", "47 &times; 8", "376"), ("b", "56 &times; 7", "392"),
                  ("c", "83 &times; 6", "498"), ("d", "94 &times; 5", "470")]),
        practice(3, "3-digit by 1-digit", "#CC0000", "#FFF0F0", "#CC0000",
                 "Same method, one extra column.",
                 [("a", "234 &times; 6", "1404"), ("b", "457 &times; 4", "1828"),
                  ("c", "623 &times; 7", "4361"), ("d", "856 &times; 9", "7704")]),
        practice(4, "With zero in number", "#1E7D2E", "#EDFAEE", "#1E7D2E",
                 "Don't forget: 0 &times; n = 0, plus any carry.",
                 [("a", "305 &times; 7", "2135"), ("b", "402 &times; 8", "3216"),
                  ("c", "709 &times; 6", "4254"), ("d", "5006 &times; 4", "20024")]),
        practice(5, "Mixed", "#7B3FA0", "#F5EEFF", "#7B3FA0",
                 "Apply short multiplication.",
                 [("a", "78 &times; 6", "468"), ("b", "239 &times; 5", "1195"),
                  ("c", "517 &times; 8", "4136"), ("d", "1234 &times; 7", "8638"),
                  ("e", "999 &times; 9", "8991")])],
    "misconceptions": {"items": [
        {"id": "a", "statement": "Multiply right to left", "correct": True},
        {"id": "b", "statement": "Carries are added to the NEXT column's product", "correct": True},
        {"id": "c", "statement": "47 &times; 8 = 326 (forget carry)", "correct": False},
        {"id": "d", "statement": "0 &times; n = 0, ignore the carry", "correct": False},
        {"id": "e", "statement": "Short multiplication only works for single-digit multipliers", "correct": True}]},
    "challenge": {"problems": [
        {"id": "a", "text": "A book has <strong>247 pages</strong>. A library has <strong>9 copies</strong>. "
         "How many pages in total across all copies? Use short multiplication."},
        {"id": "b", "text": "A factory makes <strong>1234 widgets a day</strong>, <strong>7 days a week</strong>. "
         "How many widgets per week? How many in 4 weeks? Show your working clearly."}]},
})


# ── 165 — One-step equations ───────────────────────────────────────────────
write_ws("165-one-step-equations.json", {
    "title": "SOLVING LINEAR EQUATIONS,\n(ONE-STEP EQUATIONS)",
    "objective": "LO: I can solve one-step linear equations using inverse operations.",
    "send_mode": False,
    "info_boxes": {
        "key_terms": {"id": "key_terms", "title": "What is a one-step equation?", "content": [
            {"type": "paragraph", "text": "A <span class=\"ul-b\">one-step equation</span> needs only "
             "<span class=\"ul-k\">ONE</span> inverse operation to solve, e.g. x + 5 = 12 needs only &minus;5."},
            {"type": "paragraph", "text": "<span class=\"rb\">Golden rule:</span> whatever you do to one side, you must "
             "do to the OTHER side. This keeps the equation balanced."}]},
        "what_we_learn": {"id": "what_we_learn", "title": "Inverse operations", "examples": [
            {"correct": True, "expr": "+ &harr; &minus;",  "desc": "inverses"},
            {"correct": True, "expr": "&times; &harr; &divide;",  "desc": "inverses"},
            {"correct": True, "expr": "x + 5 = 12 &rarr; x = 7", "desc": "subtract 5"},
            {"correct": False, "expr": "3x = 12 &rarr; x = 9 (wrong: should &divide;)", "desc": "&divide; not &minus;"},
            {"correct": False, "expr": "Only do operation on one side", "desc": "must do BOTH sides"}]},
        "key_idea": {"id": "key_idea", "title": "Key idea",
            "text": "Use the INVERSE operation to undo what's done to x. Apply it to BOTH sides.",
            "equation": "<span class=\"ov\">x + 5</span> = 12 &rArr; <span class=\"ovr\">x = 7</span>",
            "caption": "Subtract 5 from both sides"},},
    "modelled_examples": [
        example(1, "addition", "Solve x + 7 = 15",
                ["Inverse of +7 is &minus;7", "x + 7 &minus; 7 = 15 &minus; 7", "x = 8"],
                "x = 8", "Check: 8 + 7 = 15 &check;"),
        example(2, "subtraction", "Solve x &minus; 9 = 4",
                ["Inverse of &minus;9 is +9", "x &minus; 9 + 9 = 4 + 9", "x = 13"],
                "x = 13", "Check: 13 &minus; 9 = 4 &check;"),
        example(3, "multiplication", "Solve 5x = 35",
                ["Inverse of &times;5 is &divide;5", "5x &divide; 5 = 35 &divide; 5", "x = 7"],
                "x = 7", "Check: 5 &times; 7 = 35 &check;"),
        example(4, "division", "Solve x &divide; 4 = 9",
                ["Inverse of &divide;4 is &times;4", "x &divide; 4 &times; 4 = 9 &times; 4", "x = 36"],
                "x = 36", "Check: 36 &divide; 4 = 9 &check;")],
    "practice": [
        practice(1, "Add/subtract", "#1F5FA6", "#EEF3FF", "#1F5FA6",
                 "Use the inverse operation.",
                 [("a", "x + 5 = 12", "x=7"), ("b", "x + 11 = 20", "x=9"),
                  ("c", "x &minus; 6 = 10", "x=16"), ("d", "x &minus; 4 = 9", "x=13")]),
        practice(2, "Multiply/divide", "#1F5FA6", "#EEF3FF", "#1F5FA6",
                 "Use the inverse operation.",
                 [("a", "3x = 18", "x=6"), ("b", "7x = 56", "x=8"),
                  ("c", "x &divide; 5 = 6", "x=30"), ("d", "x &divide; 8 = 4", "x=32")]),
        practice(3, "With negatives", "#CC0000", "#FFF0F0", "#CC0000",
                 "Be careful with sign changes.",
                 [("a", "x + 12 = 5", "x=&minus;7"), ("b", "x &minus; 3 = &minus;10", "x=&minus;7"),
                  ("c", "&minus;4x = 24", "x=&minus;6"), ("d", "x &divide; &minus;3 = 5", "x=&minus;15")]),
        practice(4, "Word problems", "#1E7D2E", "#EDFAEE", "#1E7D2E",
                 "Form an equation, then solve.",
                 [("a", "I think of x. Add 9 to get 22. Find x.", "x=13"),
                  ("b", "Multiply x by 4 to get 28. Find x.", "x=7"),
                  ("c", "Divide x by 3 to get 12. Find x.", "x=36"),
                  ("d", "Subtract 8 from x to get 0. Find x.", "x=8")]),
        practice(5, "Mixed one-step", "#7B3FA0", "#F5EEFF", "#7B3FA0",
                 "Identify the operation, then apply its inverse.",
                 [("a", "x + 17 = 25", "x=8"), ("b", "11x = 121", "x=11"),
                  ("c", "x &minus; 4.5 = 2.5", "x=7"), ("d", "x &divide; 6 = 9", "x=54"),
                  ("e", "x + 2.4 = 5.1", "x=2.7")])],
    "misconceptions": {"items": [
        {"id": "a", "statement": "x + 5 = 12 means x = 17", "correct": False},
        {"id": "b", "statement": "5x = 25 means x = 5", "correct": True},
        {"id": "c", "statement": "Whatever you do to one side, do to the other", "correct": True},
        {"id": "d", "statement": "Inverse of &times;3 is &times;3", "correct": False},
        {"id": "e", "statement": "x &divide; 4 = 8 means x = 32", "correct": True}]},
    "challenge": {"problems": [
        {"id": "a", "text": "Maya buys <strong>x cupcakes</strong> at <strong>£1.20 each</strong>, paying "
         "<strong>£14.40</strong> in total. Form a one-step equation and solve to find how many cupcakes she bought."},
        {"id": "b", "text": "A rectangle has perimeter <strong>22 cm</strong>. The length is <strong>6 cm</strong>. "
         "Form a one-step equation for the width w, and solve."}]},
})


# ── 166 — Two-step equations ───────────────────────────────────────────────
write_ws("166-two-step-equations.json", {
    "title": "SOLVING LINEAR EQUATIONS,\n(TWO-STEP EQUATIONS)",
    "objective": "LO: I can solve two-step linear equations by undoing operations in reverse order.",
    "send_mode": False,
    "info_boxes": {
        "key_terms": {"id": "key_terms", "title": "What is a two-step equation?", "content": [
            {"type": "paragraph", "text": "A <span class=\"ul-b\">two-step equation</span> needs <span class=\"ul-k\">TWO</span> "
             "inverse operations, e.g. 3x + 4 = 19 &rarr; subtract 4, then divide by 3."},
            {"type": "paragraph", "text": "<span class=\"rb\">Order matters:</span> always undo +/&minus; FIRST, then &times;/&divide;. "
             "This is the reverse of BIDMAS."}]},
        "what_we_learn": {"id": "what_we_learn", "title": "Strategy", "examples": [
            {"correct": True, "expr": "3x + 4 = 19",        "desc": "&minus;4 then &divide;3"},
            {"correct": True, "expr": "x = 5 (check: 15+4=19)", "desc": "always check"},
            {"correct": True, "expr": "Undo +/&minus; first",   "desc": "reverse BIDMAS"},
            {"correct": False, "expr": "3x + 4 = 19 &rarr; &divide;3 first", "desc": "wrong order"},
            {"correct": False, "expr": "Forget to do both sides", "desc": "must do BOTH"}]},
        "key_idea": {"id": "key_idea", "title": "Key idea",
            "text": "Undo the LAST operation first. For 3x + 4: the last operation done to x was +4, so undo +4 first.",
            "equation": "<span class=\"ov\">3x + 4</span> = 19 &rArr; <span class=\"ov\">3x</span> = 15 &rArr; <span class=\"ovr\">x = 5</span>",
            "caption": "&minus;4 then &divide;3"},},
    "modelled_examples": [
        example(1, "+/&times;", "Solve 3x + 4 = 19",
                ["Subtract 4 from both sides", "3x = 15", "Divide both sides by 3 &rarr; x = 5"],
                "x = 5", "Check: 3(5) + 4 = 15 + 4 = 19 &check;"),
        example(2, "&minus;/&times;", "Solve 5x &minus; 7 = 18",
                ["Add 7 to both sides", "5x = 25", "Divide by 5 &rarr; x = 5"],
                "x = 5", "Check: 5(5) &minus; 7 = 18 &check;"),
        example(3, "+/&divide;", "Solve x &divide; 3 + 2 = 6",
                ["Subtract 2 from both sides", "x &divide; 3 = 4", "Multiply both sides by 3 &rarr; x = 12"],
                "x = 12", "Check: 12 &divide; 3 + 2 = 4 + 2 = 6 &check;"),
        example(4, "fractional answer", "Solve 4x + 3 = 10",
                ["Subtract 3 &rarr; 4x = 7", "Divide by 4 &rarr; x = 7/4", "Or x = 1.75"],
                "x = 7/4", "Some answers are fractions or decimals.")],
    "practice": [
        practice(1, "+/&times; form", "#1F5FA6", "#EEF3FF", "#1F5FA6",
                 "Subtract first, then divide.",
                 [("a", "2x + 3 = 11", "x=4"), ("b", "5x + 7 = 32", "x=5"),
                  ("c", "4x + 8 = 32", "x=6"), ("d", "7x + 1 = 50", "x=7")]),
        practice(2, "&minus;/&times; form", "#1F5FA6", "#EEF3FF", "#1F5FA6",
                 "Add first, then divide.",
                 [("a", "3x &minus; 5 = 16", "x=7"), ("b", "6x &minus; 2 = 22", "x=4"),
                  ("c", "4x &minus; 9 = 19", "x=7"), ("d", "8x &minus; 3 = 45", "x=6")]),
        practice(3, "Division form", "#CC0000", "#FFF0F0", "#CC0000",
                 "x is divided. Undo the +/&minus; first, then multiply.",
                 [("a", "x &divide; 2 + 3 = 8", "x=10"), ("b", "x &divide; 4 &minus; 1 = 3", "x=16"),
                  ("c", "x &divide; 5 + 2 = 7", "x=25"), ("d", "x &divide; 3 &minus; 2 = 4", "x=18")]),
        practice(4, "Fractional answers", "#1E7D2E", "#EDFAEE", "#1E7D2E",
                 "Don't be put off by fractions or decimals.",
                 [("a", "4x + 3 = 10", "x=1.75"), ("b", "3x &minus; 2 = 8", "x=10/3"),
                  ("c", "5x + 1 = 8", "x=1.4"), ("d", "6x &minus; 5 = 7", "x=2")]),
        practice(5, "Mixed two-step", "#7B3FA0", "#F5EEFF", "#7B3FA0",
                 "Choose the right order of operations.",
                 [("a", "9x + 7 = 70", "x=7"), ("b", "x &divide; 6 + 4 = 9", "x=30"),
                  ("c", "12x &minus; 5 = 31", "x=3"), ("d", "x &divide; 2 &minus; 7 = &minus;3", "x=8"),
                  ("e", "11x + 9 = 86", "x=7")])],
    "misconceptions": {"items": [
        {"id": "a", "statement": "3x + 4 = 19 &rarr; first divide by 3", "correct": False},
        {"id": "b", "statement": "Subtract 4 first, THEN divide", "correct": True},
        {"id": "c", "statement": "5x &minus; 7 = 18 means x = 5", "correct": True},
        {"id": "d", "statement": "Undo BIDMAS in reverse order", "correct": True},
        {"id": "e", "statement": "x can never be a fraction", "correct": False}]},
    "challenge": {"problems": [
        {"id": "a", "text": "A taxi charges <strong>£3 fixed fee</strong> plus <strong>£2 per mile</strong>. "
         "A journey costs <strong>£17</strong>. Form an equation 2x + 3 = 17 and solve to find the distance."},
        {"id": "b", "text": "I think of a number, multiply by <strong>4</strong>, then subtract <strong>9</strong>. "
         "The result is <strong>23</strong>. Form a two-step equation and solve to find my number."}]},
})


# ── 024 — Expanding single brackets ────────────────────────────────────────
write_ws("024-expanding-single-brackets.json", {
    "title": "ALGEBRAIC EXPRESSIONS,\n(EXPANDING SINGLE BRACKETS)",
    "objective": "LO: I can expand single brackets by multiplying every term inside by the term outside.",
    "send_mode": False,
    "info_boxes": {
        "key_terms": {"id": "key_terms", "title": "What does &lsquo;expand&rsquo; mean?", "content": [
            {"type": "paragraph", "text": "<span class=\"ul-b\">Expanding</span> means removing the brackets by "
             "multiplying <span class=\"ul-k\">every term</span> inside by the term outside."},
            {"type": "paragraph", "text": "<span class=\"rb\">Common error:</span> only multiplying the first term. "
             "You must multiply BOTH terms inside the bracket."}]},
        "what_we_learn": {"id": "what_we_learn", "title": "Examples", "examples": [
            {"correct": True, "expr": "3(x + 2) = 3x + 6",       "desc": "both terms"},
            {"correct": True, "expr": "&minus;2(x &minus; 5) = &minus;2x + 10", "desc": "watch signs"},
            {"correct": True, "expr": "x(x + 3) = x&sup2; + 3x", "desc": "x &times; x = x&sup2;"},
            {"correct": False, "expr": "3(x + 2) = 3x + 2",      "desc": "missed second term"},
            {"correct": False, "expr": "&minus;2(x + 3) = &minus;2x + 6", "desc": "should be &minus;6"}]},
        "key_idea": {"id": "key_idea", "title": "Key idea",
            "text": "Multiply the term outside by EVERY term inside. Watch the signs carefully when there's a negative outside.",
            "equation": "<span class=\"ov\">3(x + 2)</span> = <span class=\"ovr\">3x + 6</span>",
            "caption": "Multiply both terms"},},
    "modelled_examples": [
        example(1, "all positive", "Expand 3(x + 4)",
                ["3 &times; x = 3x", "3 &times; 4 = 12", "Combine: 3x + 12"],
                "= 3x + 12", "Multiply each term inside by 3."),
        example(2, "with subtraction", "Expand 5(x &minus; 2)",
                ["5 &times; x = 5x", "5 &times; (&minus;2) = &minus;10", "Combine: 5x &minus; 10"],
                "= 5x &minus; 10", "The minus sign belongs to the 2."),
        example(3, "negative outside", "Expand &minus;2(x + 3)",
                ["&minus;2 &times; x = &minus;2x", "&minus;2 &times; 3 = &minus;6", "Combine: &minus;2x &minus; 6"],
                "= &minus;2x &minus; 6", "Negative &times; positive = negative."),
        example(4, "variable outside", "Expand x(x + 5)",
                ["x &times; x = x&sup2;", "x &times; 5 = 5x", "Combine: x&sup2; + 5x"],
                "= x&sup2; + 5x", "x times x is x squared.")],
    "practice": [
        practice(1, "Number outside, all positive", "#1F5FA6", "#EEF3FF", "#1F5FA6",
                 "Multiply each term inside.",
                 [("a", "2(x + 5)", "2x+10"), ("b", "4(x + 3)", "4x+12"),
                  ("c", "7(x + 2)", "7x+14"), ("d", "5(x + 6)", "5x+30")]),
        practice(2, "With subtraction inside", "#1F5FA6", "#EEF3FF", "#1F5FA6",
                 "The minus sign stays with its term.",
                 [("a", "3(x &minus; 4)", "3x&minus;12"), ("b", "6(x &minus; 1)", "6x&minus;6"),
                  ("c", "8(x &minus; 5)", "8x&minus;40"), ("d", "9(x &minus; 2)", "9x&minus;18")]),
        practice(3, "Negative outside", "#CC0000", "#FFF0F0", "#CC0000",
                 "Watch signs carefully.",
                 [("a", "&minus;2(x + 3)", "&minus;2x&minus;6"), ("b", "&minus;5(x + 4)", "&minus;5x&minus;20"),
                  ("c", "&minus;3(x &minus; 2)", "&minus;3x+6"), ("d", "&minus;4(x &minus; 7)", "&minus;4x+28")]),
        practice(4, "Variable outside", "#1E7D2E", "#EDFAEE", "#1E7D2E",
                 "x &times; x = x&sup2;.",
                 [("a", "x(x + 4)", "x&sup2;+4x"), ("b", "x(x &minus; 3)", "x&sup2;&minus;3x"),
                  ("c", "2x(x + 5)", "2x&sup2;+10x"), ("d", "3x(x &minus; 2)", "3x&sup2;&minus;6x")]),
        practice(5, "Mixed expand and simplify", "#7B3FA0", "#F5EEFF", "#7B3FA0",
                 "Expand, then collect any like terms.",
                 [("a", "3(x + 2) + 4", "3x+10"), ("b", "5(x &minus; 1) + 2x", "7x&minus;5"),
                  ("c", "2(x + 3) + 3(x &minus; 1)", "5x+3"), ("d", "x(x + 2) &minus; x", "x&sup2;+x"),
                  ("e", "&minus;2(x &minus; 4) + 5", "&minus;2x+13")])],
    "misconceptions": {"items": [
        {"id": "a", "statement": "3(x + 2) = 3x + 2", "correct": False},
        {"id": "b", "statement": "5(x &minus; 3) = 5x &minus; 15", "correct": True},
        {"id": "c", "statement": "&minus;4(x + 2) = &minus;4x + 8", "correct": False},
        {"id": "d", "statement": "x(x + 3) = x&sup2; + 3x", "correct": True},
        {"id": "e", "statement": "&minus;2(x &minus; 5) = &minus;2x + 10", "correct": True}]},
    "challenge": {"problems": [
        {"id": "a", "text": "A rectangle has length <strong>(x + 4)</strong> cm and width <strong>3</strong> cm. "
         "Write an expanded expression for its perimeter and area."},
        {"id": "b", "text": "Expand and simplify <strong>4(2x + 3) &minus; 2(x &minus; 5)</strong>. "
         "Show your full working step by step."}]},
})

print("\nBatch 2 complete (8 worksheets).")
