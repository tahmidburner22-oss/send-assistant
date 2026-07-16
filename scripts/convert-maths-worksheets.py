#!/usr/bin/env python3
"""
Convert 128 maths-worksheets/json/*.json source files into the 
worksheet-library target format (SCHEMA.md).

Usage:
    python3 scripts/convert-maths-worksheets.py

Outputs to: worksheet-library/worksheets/maths/<topic-slug>__<subtopic-slug>.json
"""

import json
import os
import re
import sys
import html

# ─── Paths ────────────────────────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR)
SOURCE_DIR = os.path.join(ROOT_DIR, "maths-worksheets", "json")
OUTPUT_DIR = os.path.join(ROOT_DIR, "worksheet-library", "worksheets", "maths")
MAPPING_PATH = os.path.join(SCRIPT_DIR, "topic-mapping.json")

# ─── Load mapping ─────────────────────────────────────────────────────────────
with open(MAPPING_PATH) as f:
    MAPPING = json.load(f)

TOPIC_MAP = MAPPING["topic_map"]
SUBTOPIC_MAP = MAPPING["subtopic_map"]
KS3_TOPICS = MAPPING["ks3_topics"]
KS4_YEAR10_TOPICS = MAPPING["ks4_year10_topics"]
KS4_YEAR11_TOPICS = MAPPING["ks4_year11_topics"]

# Load the actual SUBTOPICS_MAP from the parsed TypeScript
SUBTOPICS_LOOKUP_PATH = os.path.join(SCRIPT_DIR, "subtopics-lookup.json")
with open(SUBTOPICS_LOOKUP_PATH) as f:
    SUBTOPICS_LOOKUP = json.load(f)


def strip_html(text):
    """Remove HTML tags and decode entities."""
    if not text:
        return ""
    # Decode HTML entities
    text = html.unescape(text)
    # Remove span tags
    text = re.sub(r'<[^>]+>', '', text)
    return text.strip()


def slugify(text):
    """Convert to slug: lowercase, spaces to hyphens, strip punctuation."""
    s = text.lower().strip()
    # Replace special chars
    s = s.replace("'", "")
    s = s.replace("\u2014", "-")  # em dash
    s = s.replace("\u2013", "-")  # en dash
    s = s.replace("\u00d7", "x")  # multiplication sign
    s = re.sub(r'[^a-z0-9\s-]', '', s)
    s = re.sub(r'\s+', '-', s)
    s = re.sub(r'-+', '-', s)
    return s.strip('-')


def extract_file_number(filename):
    """Extract the numeric prefix from a filename like '046-rounding-...'."""
    m = re.match(r'^(\d+)-', filename)
    return m.group(1) if m else ""


def parse_title(title_raw):
    """Parse 'TOPIC,\\n(SUBTOPIC)' or 'TOPIC\\n(SUBTOPIC)' format."""
    # Remove parentheses from subtopic part
    # Handle both "TOPIC,\n(SUBTOPIC)" and "TOPIC\n(SUBTOPIC)" patterns
    parts = re.split(r',?\s*\n\s*', title_raw, maxsplit=1)
    topic_raw = parts[0].strip()
    subtopic_raw = ""
    if len(parts) > 1:
        subtopic_raw = parts[1].strip()
        # Remove surrounding parentheses
        subtopic_raw = re.sub(r'^\((.+)\)$', r'\1', subtopic_raw)
    return topic_raw, subtopic_raw


def resolve_topic(topic_raw, file_number):
    """Map source topic (UPPERCASE) to exact SUBTOPICS_MAP key."""
    topic_upper = topic_raw.strip()
    if topic_upper not in TOPIC_MAP:
        # Fallback: title case
        return topic_upper.title()
    
    entry = TOPIC_MAP[topic_upper]
    # Check file-specific overrides
    if "overrides" in entry and file_number in entry["overrides"]:
        return entry["overrides"][file_number]
    return entry["default"]


def resolve_subtopic(subtopic_raw, topic, file_number, topic_raw=""):
    """Map source subtopic (UPPERCASE) to exact SUBTOPICS_MAP entry."""
    sub_upper = subtopic_raw.strip()
    
    # Check explicit mapping first
    if sub_upper in SUBTOPIC_MAP:
        mapped = SUBTOPIC_MAP[sub_upper]
        if mapped is not None:
            return mapped
        # null means we need context-specific logic
        # "BY 10, 100 AND 1000" depends on division vs multiplication
        if sub_upper == "BY 10, 100 AND 1000":
            # Use raw topic to distinguish: "DIVISION" vs "MULTIPLICATION"
            if topic_raw.upper().startswith("DIVISION"):
                return "Dividing by 10, 100 and 1000"
            else:
                return "Multiplying by 10, 100 and 1000"
        # "PERCENTAGE INCREASE AND DECREASE" - depends on topic context
        if sub_upper == "PERCENTAGE INCREASE AND DECREASE":
            return "Percentage increase and decrease"
    
    # Try to match against actual SUBTOPICS_MAP entries for this topic
    # using case-insensitive comparison
    if topic in SUBTOPICS_LOOKUP:
        sub_lower = sub_upper.lower()
        for entry in SUBTOPICS_LOOKUP[topic]:
            if entry.lower() == sub_lower:
                return entry
        # Try partial match (strip common differences)
        sub_normalized = sub_lower.replace(" - ", " ").replace("--", "").strip()
        for entry in SUBTOPICS_LOOKUP[topic]:
            entry_normalized = entry.lower().replace(" - ", " ").replace("--", "").strip()
            if entry_normalized == sub_normalized:
                return entry
    
    # Default: convert to sentence case (only first letter capital)
    result = sub_upper[0] + sub_upper[1:].lower() if sub_upper else ""
    # Fix known patterns that should stay uppercase/special
    result = result.replace(" fdp", " FDP")
    result = result.replace("2d ", "2D ")
    result = result.replace("3d ", "3D ")
    result = result.replace("bidmas", "BIDMAS")
    result = result.replace("bodmas", "BODMAS")
    
    return result


def determine_year_group(topic):
    """Determine year group based on topic."""
    if topic in KS3_TOPICS:
        return "Year 9"
    elif topic in KS4_YEAR11_TOPICS:
        return "Year 11"
    elif topic in KS4_YEAR10_TOPICS:
        return "Year 10"
    else:
        return "Year 10"  # Default to Year 10 for secondary


def extract_key_vocab(info_boxes):
    """Extract key vocabulary from info_boxes.key_terms."""
    vocab = []
    key_terms = info_boxes.get("key_terms", {})
    content = key_terms.get("content", [])
    
    for item in content:
        text = item.get("text", "")
        # Extract terms marked with ul-b spans
        terms = re.findall(r'<span class="ul-b">([^<]+)</span>', text)
        # The definition is the full text stripped of HTML
        definition = strip_html(text)
        
        for term in terms:
            vocab.append({
                "term": term,
                "definition": definition
            })
    
    # If no ul-b spans found, use the title + first content text
    if not vocab and content:
        title = key_terms.get("title", "Key terms")
        for item in content:
            text = strip_html(item.get("text", ""))
            if text:
                # Try to split on " means " or " - " or ": "
                for sep in [" means ", " -- ", ": "]:
                    if sep in text:
                        parts = text.split(sep, 1)
                        vocab.append({"term": parts[0].strip(), "definition": parts[1].strip()})
                        break
                else:
                    # Use the whole thing as one definition
                    vocab.append({"term": title, "definition": text})
                    break
    
    return vocab


def build_vocabulary_content(key_vocab):
    """Build vocabulary section content string from key_vocab array."""
    lines = []
    for v in key_vocab:
        lines.append(f"{v['term']} -- {v['definition']}")
    return "\n".join(lines) if lines else "See key terms above."


def build_method_content(info_boxes):
    """Build method section content from key_idea."""
    key_idea = info_boxes.get("key_idea", {})
    parts = []
    
    text = key_idea.get("text", "")
    if text:
        parts.append(strip_html(text))
    
    equation = key_idea.get("equation", "")
    if equation:
        parts.append(strip_html(equation))
    
    caption = key_idea.get("caption", "")
    if caption:
        parts.append(strip_html(caption))
    
    # Also incorporate what_we_learn if it has steps
    what_we_learn = info_boxes.get("what_we_learn", {})
    examples = what_we_learn.get("examples", [])
    if examples:
        parts.append("")
        parts.append("Key examples:")
        for ex in examples:
            expr = strip_html(ex.get("expr", ""))
            desc = strip_html(ex.get("desc", ""))
            mark = "\u2713" if ex.get("correct") else "\u2717"
            parts.append(f"  {mark} {expr}  ({desc})")
    
    return "\n".join(parts) if parts else "See method steps."


def build_worked_example_content(modelled_examples):
    """Build worked example section content from modelled_examples."""
    parts = []
    # Use first 2 examples for the worked example section
    for i, ex in enumerate(modelled_examples[:2], 1):
        label = strip_html(ex.get("label", f"Example {i}"))
        question = strip_html(ex.get("question", ""))
        steps = ex.get("steps", [])
        answer = strip_html(ex.get("answer", ""))
        explanation = strip_html(ex.get("explanation", ""))
        
        parts.append(label)
        if question:
            parts.append(f"  {question}")
        for step in steps:
            parts.append(f"  {strip_html(step)}")
        if answer:
            parts.append(f"  {answer}")
        if explanation:
            parts.append(f"  ({explanation})")
        parts.append("")
    
    return "\n".join(parts).strip()


def build_question_sections(practice, start_id):
    """Convert practice sections to question sections."""
    sections = []
    sid = start_id
    
    for p_section in practice:
        heading = p_section.get("heading", "")
        instruction = p_section.get("instruction", "")
        questions = p_section.get("questions", [])
        
        if not questions:
            continue
        
        # Group questions from each practice section into one question section
        # with sub-parts (a), (b), (c), etc.
        content_parts = []
        if instruction:
            content_parts.append(strip_html(instruction))
            content_parts.append("")
        
        for q in questions:
            q_id = q.get("id", "")
            expression = strip_html(q.get("expression", ""))
            content_parts.append(f"({q_id}) {expression}")
        
        content = "\n".join(content_parts)
        
        # Determine marks (1 mark per sub-question)
        marks = len(questions)
        
        section = {
            "id": f"s{sid}",
            "title": strip_html(heading) if heading else f"Practice {sid - start_id + 1}",
            "type": "q-short-answer",
            "marks": marks,
            "content": content
        }
        
        sections.append(section)
        sid += 1
    
    return sections, sid


def build_misconceptions_content(misconceptions):
    """Build common mistakes section content."""
    items = misconceptions.get("items", [])
    lines = []
    for item in items:
        statement = strip_html(item.get("statement", ""))
        correct = item.get("correct", True)
        mark = "\u2713" if correct else "\u2717"
        lines.append(f"{mark} {statement}")
    return "\n".join(lines) if lines else "Watch out for common errors."


def build_mark_scheme(modelled_examples, practice):
    """Build mark scheme content from answers."""
    parts = []
    parts.append("Award marks for correct working and final answers.")
    parts.append("")
    
    for i, p_section in enumerate(practice, 1):
        heading = strip_html(p_section.get("heading", f"Section {i}"))
        questions = p_section.get("questions", [])
        if not questions:
            continue
        parts.append(f"{heading}:")
        for q in questions:
            q_id = q.get("id", "")
            answer = strip_html(q.get("answer", ""))
            parts.append(f"  ({q_id}) {answer}")
        parts.append("")
    
    # Add challenge answers if present
    return "\n".join(parts).strip()


def convert_worksheet(source_path, filename):
    """Convert a single source worksheet to library format."""
    with open(source_path) as f:
        data = json.load(f)
    
    file_number = extract_file_number(filename)
    
    # Parse title
    title_raw = data.get("title", "")
    topic_raw, subtopic_raw = parse_title(title_raw)
    
    # Resolve topic and subtopic
    topic = resolve_topic(topic_raw, file_number)
    subtopic = resolve_subtopic(subtopic_raw, topic, file_number, topic_raw)
    
    # Determine year group
    year_group = determine_year_group(topic)
    
    # Extract objective
    objective_raw = data.get("objective", "")
    # Remove "LO: " prefix and decode HTML entities
    learning_objective = strip_html(re.sub(r'^LO:\s*', '', objective_raw)).strip()
    
    # Build key_vocab
    info_boxes = data.get("info_boxes", {})
    key_vocab = extract_key_vocab(info_boxes)
    
    # Build title and subtitle
    title = subtopic
    subtitle = f"{topic} \u00b7 {'KS3' if year_group == 'Year 9' else 'GCSE'} Maths"
    
    # Build sections
    sections = []
    sid = 1
    
    # s1: objective
    sections.append({
        "id": f"s{sid}",
        "title": "Learning Objective",
        "type": "objective",
        "content": learning_objective
    })
    sid += 1
    
    # s2: vocabulary
    vocab_content = build_vocabulary_content(key_vocab)
    sections.append({
        "id": f"s{sid}",
        "title": "Key Words",
        "type": "vocabulary",
        "content": vocab_content
    })
    sid += 1
    
    # s3: method
    method_content = build_method_content(info_boxes)
    sections.append({
        "id": f"s{sid}",
        "title": "Method",
        "type": "example",
        "content": method_content
    })
    sid += 1
    
    # s4: worked example
    modelled_examples = data.get("modelled_examples", [])
    worked_content = build_worked_example_content(modelled_examples)
    sections.append({
        "id": f"s{sid}",
        "title": "Worked Example",
        "type": "example",
        "content": worked_content
    })
    sid += 1
    
    # s5-sN: practice questions
    practice = data.get("practice", [])
    q_sections, sid = build_question_sections(practice, sid)
    sections.extend(q_sections)
    
    # sN+1: common mistakes
    misconceptions = data.get("misconceptions", {})
    misc_content = build_misconceptions_content(misconceptions)
    sections.append({
        "id": f"s{sid}",
        "title": "Common Mistakes",
        "type": "common-mistakes",
        "content": misc_content
    })
    sid += 1
    
    # sN+2: self-reflection
    sections.append({
        "id": f"s{sid}",
        "title": "How Did I Do?",
        "type": "self-reflection",
        "content": "How confident do you feel with this topic now? (tick one)\n\u2610 Not yet   \u2610 Getting there   \u2610 Confident   \u2610 Really confident\n\n\u2022 Which question did you find the hardest, and why?\n\u2022 One method step I want to remember next time:\n\u2022 One thing I will practise before the next lesson:"
    })
    
    # Build teacher_sections
    mark_scheme_content = build_mark_scheme(modelled_examples, practice)
    teacher_sections = [{
        "id": "ts1",
        "title": "Teacher Key & Mark Scheme",
        "type": "mark-scheme",
        "teacherOnly": True,
        "content": mark_scheme_content
    }]
    
    # Build output
    output = {
        "subject": "Maths",
        "topic": topic,
        "subtopic": subtopic,
        "yearGroup": year_group,
        "tier": "mixed",
        "title": title,
        "subtitle": subtitle,
        "learning_objective": learning_objective,
        "key_vocab": key_vocab,
        "sections": sections,
        "teacher_sections": teacher_sections
    }
    
    return output


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    source_files = sorted([f for f in os.listdir(SOURCE_DIR) if f.endswith('.json')])
    
    success_count = 0
    error_count = 0
    errors = []
    
    for filename in source_files:
        source_path = os.path.join(SOURCE_DIR, filename)
        try:
            output = convert_worksheet(source_path, filename)
            
            # Generate output filename
            topic_slug = slugify(output["topic"])
            subtopic_slug = slugify(output["subtopic"])
            out_filename = f"{topic_slug}__{subtopic_slug}.json"
            out_path = os.path.join(OUTPUT_DIR, out_filename)
            
            with open(out_path, 'w') as f:
                json.dump(output, f, indent=2, ensure_ascii=False)
            
            success_count += 1
            print(f"  OK: {filename} -> {out_filename}")
            
        except Exception as e:
            error_count += 1
            errors.append((filename, str(e)))
            print(f"  ERROR: {filename}: {e}", file=sys.stderr)
    
    print(f"\n{'='*60}")
    print(f"Converted: {success_count}/{len(source_files)} files")
    if errors:
        print(f"Errors: {error_count}")
        for fn, err in errors:
            print(f"  - {fn}: {err}")
    
    return 0 if error_count == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
