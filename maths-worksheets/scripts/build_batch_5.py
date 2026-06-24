#!/usr/bin/env python3
"""Batch 5 builder — 2 remaining KS3/KS4 worksheets:
101 (Factor pairs and commutativity) and 134 (Reading and writing large integers)."""
import json, os, sys

# Reuse helpers from batch 1
sys.path.insert(0, os.path.dirname(__file__))
from build_batch_1 import practice, example, write_ws


# ── 101 — Factor pairs and commutativity ───────────────────────────────────
write_ws("101-factor-pairs-and-commutativity.json", {
    "title": "MULTIPLICATION AND DIVISION \u2014 TIMES TABLES TO 12&times;12,\n(FACTOR PAIRS AND COMMUTATIVITY)",
    "objective": "LO: I can identify factor pairs of a number and use the commutative law of multiplication.",
    "send_mode": False,
    "info_boxes": {
        "key_terms": {"id": "key_terms", "title": "Factors and commutativity", "content": [
            {"type": "paragraph", "text": "A <span class=\"ul-b\">factor</span> is a whole number that divides exactly into another number. <span class=\"ul-k\">Factor pairs</span> are two factors that multiply together to give a particular product."},
            {"type": "paragraph", "text": "<span class=\"rb\">Commutativity</span> means the order of multiplication does not change the answer: a &times; b = b &times; a. This makes it easier to learn times tables because every fact gives you two results."}]},
        "what_we_learn": {"id": "what_we_learn", "title": "Quick examples", "examples": [
            {"correct": True, "expr": "1 &times; 12 = 12", "desc": "factor pair of 12"},
            {"correct": True, "expr": "3 &times; 4 = 4 &times; 3 = 12", "desc": "commutativity shown"},
            {"correct": True, "expr": "2 &times; 6 = 12", "desc": "another factor pair of 12"},
            {"correct": False, "expr": "5 &times; 3 = 12", "desc": "5 &times; 3 = 15, not 12"},
            {"correct": False, "expr": "3 + 4 = 3 &times; 4", "desc": "addition and multiplication are different operations"}]},
        "key_idea": {"id": "key_idea", "title": "Key idea",
            "text": "To find all factor pairs, start from 1 and work up; stop when the factors begin to repeat.",
            "equation": "24 = <span class=\"ov\">1 &times; 24</span> = <span class=\"ov\">2 &times; 12</span> = <span class=\"ov\">3 &times; 8</span> = <span class=\"ovr\">4 &times; 6</span>",
            "caption": "Four factor pairs of 24"}},
    "modelled_examples": [
        example(1, "listing factor pairs", "Find all the factor pairs of 18.",
                ["Start: 1 &times; 18", "Check 2: 2 &times; 9", "Check 3: 3 &times; 6; 4 does not divide 18 exactly, so stop"],
                "Factor pairs: (1, 18), (2, 9), (3, 6)", "Work systematically from 1 upwards until factors repeat."),
        example(2, "using commutativity", "Use the commutative law to write two multiplication facts from 7 &times; 8 = 56.",
                ["First fact: 7 &times; 8 = 56", "Swap: 8 &times; 7 = 56", "Both give the same product"],
                "7 &times; 8 = 56 and 8 &times; 7 = 56", "The commutative law means a &times; b = b &times; a always."),
        example(3, "identifying missing factors", "Find the missing number: ___ &times; 9 = 36.",
                ["We need a number that multiplies by 9 to give 36", "36 &divide; 9 = 4", "Check: 4 &times; 9 = 36 &#10003;"],
                "The missing number is 4", "Division is the inverse of multiplication; use it to find a missing factor."),
        example(4, "factor pairs of a larger number", "List all factor pairs of 36.",
                ["1 &times; 36, 2 &times; 18, 3 &times; 12, 4 &times; 9, 6 &times; 6", "Stop at 6 &times; 6 because 7 does not divide 36 exactly", "There are 5 factor pairs (including the square root pair)"],
                "Factor pairs: (1, 36), (2, 18), (3, 12), (4, 9), (6, 6)", "36 is a square number so one pair has the same factor repeated.")],
    "practice": [
        practice(1, "Finding factor pairs", "#1F5FA6", "#EEF3FF", "#1F5FA6",
                 "List all the factor pairs of each number.",
                 [("a", "12", "(1,12), (2,6), (3,4)"), ("b", "20", "(1,20), (2,10), (4,5)"),
                  ("c", "30", "(1,30), (2,15), (3,10), (5,6)"), ("d", "16", "(1,16), (2,8), (4,4)")]),
        practice(2, "Using commutativity", "#1F5FA6", "#EEF3FF", "#1F5FA6",
                 "Write two multiplication facts for each product.",
                 [("a", "Product = 42 (use 6 and 7)", "6 &times; 7 = 42 and 7 &times; 6 = 42"),
                  ("b", "Product = 54 (use 6 and 9)", "6 &times; 9 = 54 and 9 &times; 6 = 54"),
                  ("c", "Product = 72 (use 8 and 9)", "8 &times; 9 = 72 and 9 &times; 8 = 72"),
                  ("d", "Product = 48 (use 6 and 8)", "6 &times; 8 = 48 and 8 &times; 6 = 48")]),
        practice(3, "Missing factors", "#CC0000", "#FFF0F0", "#CC0000",
                 "Find the missing number in each multiplication.",
                 [("a", "___ &times; 7 = 63", "9"), ("b", "8 &times; ___ = 96", "12"),
                  ("c", "___ &times; 11 = 132", "12"), ("d", "4 &times; ___ = 48", "12")]),
        practice(4, "Factors of larger numbers", "#1E7D2E", "#EDFAEE", "#1E7D2E",
                 "List all factor pairs. State how many factors each number has.",
                 [("a", "48", "(1,48),(2,24),(3,16),(4,12),(6,8) &mdash; 10 factors"),
                  ("b", "60", "(1,60),(2,30),(3,20),(4,15),(5,12),(6,10) &mdash; 12 factors"),
                  ("c", "25", "(1,25),(5,5) &mdash; 3 factors"),
                  ("d", "100", "(1,100),(2,50),(4,25),(5,20),(10,10) &mdash; 9 factors")]),
        practice(5, "True or false", "#7B3FA0", "#F5EEFF", "#7B3FA0",
                 "State whether each statement is true or false. Explain your answer.",
                 [("a", "7 is a factor of 49", "True (7 &times; 7 = 49)"),
                  ("b", "5 &times; 8 = 8 &times; 5 because multiplication is commutative", "True"),
                  ("c", "The factor pairs of 9 are (1,9) and (3,3)", "True"),
                  ("d", "15 has exactly 4 factors", "True (1, 3, 5, 15)"),
                  ("e", "Division is commutative", "False (e.g. 12 &divide; 3 &ne; 3 &divide; 12)")])],
    "misconceptions": {"items": [
        {"id": "a", "statement": "3 &times; 5 = 5 &times; 3 because multiplication is commutative", "correct": True},
        {"id": "b", "statement": "12 &divide; 4 = 4 &divide; 12 because division is also commutative", "correct": False},
        {"id": "c", "statement": "Factor pairs of 24 include (3, 8) and (4, 6)", "correct": True},
        {"id": "d", "statement": "7 is a factor of 50", "correct": False},
        {"id": "e", "statement": "Every number has at least two factors: 1 and itself", "correct": True}]},
    "challenge": {"problems": [
        {"id": "a", "text": "A teacher has <strong>36 exercise books</strong> to arrange into equal piles. List all the ways she can arrange them into equal piles (each pile having the same number of books). Which arrangement uses the most piles?"},
        {"id": "b", "text": "Two numbers have a product of <strong>144</strong>. One number is <strong>twice</strong> the other. Use factor pairs to find the two numbers. Explain how commutativity helps you check your answer."}]},
})


# ── 134 — Reading and writing large integers ───────────────────────────────
write_ws("134-reading-and-writing-large-integers.json", {
    "title": "PLACE VALUE AND ORDERING INTEGERS,\n(READING AND WRITING LARGE INTEGERS)",
    "objective": "LO: I can read and write integers up to millions using digits and words.",
    "send_mode": False,
    "info_boxes": {
        "key_terms": {"id": "key_terms", "title": "Place value in large numbers", "content": [
            {"type": "paragraph", "text": "Each digit in a number has a <span class=\"ul-b\">place value</span> that depends on its position. From right to left the columns are: ones, tens, hundreds, thousands, ten-thousands, hundred-thousands, millions."},
            {"type": "paragraph", "text": "<span class=\"rb\">Tip:</span> Group digits in threes from the right (using commas or spaces) to make large numbers easier to read: 3,450,000 is <span class=\"ul-k\">three million four hundred and fifty thousand</span>."}]},
        "what_we_learn": {"id": "what_we_learn", "title": "Quick examples", "examples": [
            {"correct": True, "expr": "250,000 = two hundred and fifty thousand", "desc": "correctly read"},
            {"correct": True, "expr": "3,004,500 = three million four thousand five hundred", "desc": "note the zero place holders"},
            {"correct": True, "expr": "47,000 = forty-seven thousand", "desc": "no hundreds, tens or ones"},
            {"correct": False, "expr": "6,300 = sixty-three hundred", "desc": "should be six thousand three hundred"},
            {"correct": False, "expr": "1,000,000 = one hundred thousand", "desc": "that is 100,000 not 1,000,000"}]},
        "key_idea": {"id": "key_idea", "title": "Key idea",
            "text": "Break the number into groups of three digits: millions | thousands | ones, then read each group.",
            "equation": "4,<span class=\"ov\">567</span>,<span class=\"ovr\">890</span> &rarr; 4 million, 567 thousand, 890",
            "caption": "Split at the commas, read each group"}},
    "modelled_examples": [
        example(1, "reading a large number", "Write 3,250,000 in words.",
                ["Split: 3 | 250 | 000", "3 million, 250 thousand, 0 ones", "In words: three million two hundred and fifty thousand"],
                "Three million two hundred and fifty thousand", "Group into millions, thousands and ones, then read each section."),
        example(2, "writing from words", "Write 'seven million forty-five thousand' in digits.",
                ["Seven million = 7,000,000", "Forty-five thousand = 45,000", "Combine: 7,045,000"],
                "7,045,000", "Write each section as digits, using zeros as place holders."),
        example(3, "identifying digit value", "What is the value of the digit 6 in 2,600,450?",
                ["Position the digit: 2, 6 0 0, 4 5 0", "6 is in the hundred-thousands column", "Value = 6 &times; 100,000 = 600,000"],
                "600,000 (six hundred thousand)", "The value of a digit depends on its position in the number."),
        example(4, "ordering large numbers", "Write these in ascending order: 1,450,000; 1,045,000; 1,500,000; 1,405,000.",
                ["Compare millions: all are 1 million", "Compare hundred-thousands: 0, 4, 4, 5", "Refine: 1,045,000 &lt; 1,405,000 &lt; 1,450,000 &lt; 1,500,000"],
                "1,045,000; 1,405,000; 1,450,000; 1,500,000", "When millions are equal, compare the next place value column.")],
    "practice": [
        practice(1, "Reading numbers", "#1F5FA6", "#EEF3FF", "#1F5FA6",
                 "Write each number in words.",
                 [("a", "450,000", "Four hundred and fifty thousand"),
                  ("b", "2,300,000", "Two million three hundred thousand"),
                  ("c", "5,060,200", "Five million sixty thousand two hundred"),
                  ("d", "10,500,000", "Ten million five hundred thousand")]),
        practice(2, "Writing numbers", "#1F5FA6", "#EEF3FF", "#1F5FA6",
                 "Write each number using digits.",
                 [("a", "Six hundred thousand", "600,000"),
                  ("b", "Three million twenty thousand", "3,020,000"),
                  ("c", "Nine million five hundred and one", "9,000,501"),
                  ("d", "Forty-two million", "42,000,000")]),
        practice(3, "Digit values", "#CC0000", "#FFF0F0", "#CC0000",
                 "State the value of the underlined digit.",
                 [("a", "The 7 in 7,230,000", "7,000,000 (seven million)"),
                  ("b", "The 4 in 1,403,000", "400,000 (four hundred thousand)"),
                  ("c", "The 5 in 6,050,800", "50,000 (fifty thousand)"),
                  ("d", "The 9 in 3,009,100", "9,000 (nine thousand)")]),
        practice(4, "Ordering large numbers", "#1E7D2E", "#EDFAEE", "#1E7D2E",
                 "Arrange each set in ascending order.",
                 [("a", "320,000; 302,000; 230,000; 300,200", "230,000; 300,200; 302,000; 320,000"),
                  ("b", "5,100,000; 5,010,000; 5,001,000; 5,110,000", "5,001,000; 5,010,000; 5,100,000; 5,110,000"),
                  ("c", "48,000; 408,000; 4,800,000; 480,000", "48,000; 408,000; 480,000; 4,800,000"),
                  ("d", "1,999,000; 2,000,000; 1,990,000; 1,909,000", "1,909,000; 1,990,000; 1,999,000; 2,000,000")]),
        practice(5, "Mixed problems", "#7B3FA0", "#F5EEFF", "#7B3FA0",
                 "Answer each question about large numbers.",
                 [("a", "Write 2.5 million in digits", "2,500,000"),
                  ("b", "How many thousands in 3,000,000?", "3,000"),
                  ("c", "Round 4,567,890 to the nearest million", "5,000,000"),
                  ("d", "What number is 100,000 more than 2,900,000?", "3,000,000"),
                  ("e", "Write the number that is halfway between 1,000,000 and 2,000,000", "1,500,000")])],
    "misconceptions": {"items": [
        {"id": "a", "statement": "In 3,450,000 the digit 4 represents four hundred thousand", "correct": True},
        {"id": "b", "statement": "One million is written as 100,000", "correct": False},
        {"id": "c", "statement": "5,060,000 in words is five million and sixty thousand", "correct": True},
        {"id": "d", "statement": "The number 7,000,300 has no thousands", "correct": False},
        {"id": "e", "statement": "Grouping digits in threes from the right helps read large numbers", "correct": True}]},
    "challenge": {"problems": [
        {"id": "a", "text": "The population of a city is <strong>2,450,000</strong>. Write this in words. If the population grows by <strong>150,000</strong> each year, write the population after 3 years in both digits and words."},
        {"id": "b", "text": "A country's national debt is reported as <strong>&pound;45,200,000,000</strong> (45.2 billion). Write this number in words. If the debt decreases by <strong>&pound;1,500,000,000</strong> per year, what will it be after 2 years? Write your answer in digits."}]},
})


print("Batch 5 complete: 2 worksheets generated.")
