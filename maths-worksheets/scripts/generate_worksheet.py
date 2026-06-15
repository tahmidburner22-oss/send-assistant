import json
import sys
from weasyprint import HTML
from weasyprint.text.fonts import FontConfiguration

def generate_pdf(json_path, output_pdf):
    with open(json_path, "r") as f:
        data = json.load(f)

    # Use exact colors from the prompt and original PDF
    # Example 1 / Sec 1+2: Blue #1F5FA6 / #EEF3FF
    # Example 2 / Sec 3:   Red #CC0000 / #FFF0F0
    # Example 3 / Sec 4:   Green #1E7D2E / #EDFAEE
    # Example 4 / Sec 5:   Purple #7B3FA0 / #F5EEFF
    # Key Terms: Blue #1F5FA6
    # What We Learn: Green #1E7D2E
    # Key Idea: Gold #B8860B
    # Misconceptions: Red #CC0000
    # Challenge: Gold #B8860B

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Worksheet</title>
<style>
@page {{
    size: A4 landscape;
    margin: 7mm 9mm;
}}
* {{ box-sizing: border-box; margin: 0; padding: 0; }}
body {{
    font-family: Arial, Helvetica, sans-serif;
    font-size: 9pt;
    color: #111;
    background: white;
}}

/* ── Page wrapper ─────────────────── */
.page {{
    width: 279mm;
    height: 196mm;
    position: relative;
    overflow: hidden;
    page-break-after: always;
}}
.page:last-child {{ page-break-after: avoid; }}

/* ════════ PAGE 1 ════════ */
/* Row 1: Header  top:0  height:14mm */
.p1-header {{
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 14mm;
    display: table;
    width: 100%;
}}
.p1-hl, .p1-hr {{
    display: table-cell;
    width: 60mm;
    vertical-align: middle;
    font-size: 9pt;
    font-weight: bold;
}}
.p1-hr {{ text-align: right; }}
.p1-hc {{
    display: table-cell;
    text-align: center;
    vertical-align: middle;
}}
.t1 {{
    font-family: 'Trebuchet MS', Arial, sans-serif;
    font-size: 20pt;
    font-weight: bold;
    color: #0f204b;
    line-height: 1.1;
}}
.t2 {{
    font-family: 'Trebuchet MS', Arial, sans-serif;
    font-size: 18pt;
    font-weight: bold;
    color: #0f204b;
    line-height: 1.1;
}}

/* Row 2: LO Banner  top:16mm  height:9mm */
.lo {{
    position: absolute;
    top: 16mm; left: 0; right: 0;
    height: 9mm;
    background: #eef3ff;
    border: 1.5px solid #1f5fa6;
    border-radius: 4px;
    text-align: center;
    line-height: 9mm;
    font-weight: bold;
    font-size: 10.5pt;
}}

/* Row 3: Three columns  top:26mm  height:52mm */
.three-cols {{
    position: absolute;
    top: 26mm; left: 0; right: 0;
    height: 52mm;
    display: table;
    width: 100%;
    border-spacing: 4px;
}}
.ic {{
    display: table-cell;
    width: 33.33%;
    vertical-align: top;
    border-radius: 5px;
    padding: 6px 8px;
    font-size: 9pt;
    line-height: 1.4;
}}
.ic-blue   {{ border: 1.5px solid #1f5fa6; background: #f4f8ff; }}
.ic-green  {{ border: 1.5px solid #1e7d2e; background: #f5fdf5; }}
.ic-yellow {{ border: 1.5px solid #b8860b; background: #fffdf5; }}

.ct-blue   {{ color: #1f5fa6; font-weight: bold; font-size: 11pt; text-align: center; margin-bottom: 6px; }}
.ct-green  {{ color: #1e7d2e; font-weight: bold; font-size: 11pt; text-align: center; margin-bottom: 6px; }}
.ct-yellow {{ color: #b8860b; font-weight: bold; font-size: 11pt; text-align: center; margin-bottom: 6px; }}

.ul-b  {{ text-decoration: underline; color: #1f5fa6; font-weight: bold; }}
.ul-k  {{ text-decoration: underline; font-weight: bold; }}
.rb    {{ color: #cc0000; font-weight: bold; }}
.pgap  {{ margin-bottom: 6px; }}

.eg-t {{ width: 100%; border-collapse: collapse; background: white; font-size: 9pt; }}
.eg-t td {{ border: 1px solid #a5d6a7; padding: 4px 5px; text-align: center; }}
.ok {{ color: white; background: #4caf50; border-radius: 50%; display: inline-block; width: 16px; height: 16px; line-height: 16px; font-weight: bold; font-size: 9pt; }}
.no {{ color: white; background: #f44336; border-radius: 50%; display: inline-block; width: 16px; height: 16px; line-height: 16px; font-weight: bold; font-size: 9pt; }}

.kt  {{ text-align: center; margin-bottom: 7px; }}
.eqr {{ text-align: center; margin-bottom: 6px; font-size: 14pt; font-weight: bold; }}
.ov  {{ border: 1.5px solid #111; border-radius: 50%; padding: 4px 10px; display: inline-block; }}
.ovr {{ border: 1.5px solid #cc0000; border-radius: 50%; padding: 4px 10px; color: #cc0000; display: inline-block; }}
.eqc {{ text-align: center; font-size: 9pt; font-weight: bold; }}

/* Row 4: Modelled Examples  top:79mm  height:117mm */
.mod-wrap {{
    position: absolute;
    top: 79mm; left: 0; right: 0;
    height: 117mm;
    background: white;
    border: 1.5px solid #7b3fa0;
    border-radius: 5px;
    overflow: hidden;
}}
.mod-head {{
    background: #f5eeff;
    text-align: center;
    padding: 4px 0 3px;
    height: 14mm;
    line-height: 1.2;
}}
.mht {{ font-size: 13pt; font-weight: bold; color: #4a148c; }}
.mhs {{ font-size: 9pt; color: #111; }}
.mod-body {{
    position: absolute;
    top: 14mm; left: 5px; right: 5px; bottom: 5px;
    background: white;
}}
.ex-c {{
    position: absolute;
    top: 0; bottom: 0;
    border-radius: 4px;
    text-align: center;
    font-size: 9pt;
    padding: 0;
    overflow: hidden;
}}
.ex-c-1 {{ left: 0;      width: calc(25% - 4px); border: 1.5px solid #1f5fa6; background: #eef3ff; }}
.ex-c-2 {{ left: calc(25% + 1px); width: calc(25% - 4px); border: 1.5px solid #1f5fa6; background: #eef3ff; }}
.ex-c-3 {{ left: calc(50% + 2px); width: calc(25% - 4px); border: 1.5px solid #cc0000; background: #fff0f0; }}
.ex-c-4 {{ left: calc(75% + 3px); right: 0; width: calc(25% - 4px); border: 1.5px solid #1e7d2e; background: #edfaee; }}

.ex-t {{
    font-weight: bold;
    font-size: 10pt;
    padding: 6px;
    display: block;
}}
.t-1 {{ background: #d0e4ff; color: #1f5fa6; }}
.t-2 {{ background: #d0e4ff; color: #1f5fa6; }}
.t-3 {{ background: #ffd0d0; color: #cc0000; }}
.t-4 {{ background: #c8f0cc; color: #1e7d2e; }}

.ex-i {{
    padding: 8px 6px 5px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: absolute;
    top: 28px; left: 0; right: 0; bottom: 0;
}}
.ex-p {{ margin-bottom: 10px; font-size: 11.5pt; }}
.ex-s {{ margin: 8px 0 10px; line-height: 2; font-size: 12pt; }}
.ex-a {{
    padding: 6px 16px;
    font-weight: bold;
    font-size: 14pt;
    margin: 8px auto;
    display: inline-block;
    border-radius: 2px;
}}
.a-1 {{ border: 1.5px solid #1f5fa6; color: #1f5fa6; }}
.a-2 {{ border: 1.5px solid #1f5fa6; color: #1f5fa6; }}
.a-3 {{ border: 1.5px solid #cc0000; color: #cc0000; }}
.a-4 {{ border: 1.5px solid #1e7d2e; color: #1e7d2e; }}

.ex-n {{ font-size: 9.5pt; color: #111; margin-top: 10px; font-weight: bold; }}


/* ════════ PAGE 2 ════════ */
/* Row 1: Practice  top:0  height:65mm */
.prac-wrap {{
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 65mm;
    border: 1.5px solid #1f5fa6;
    border-radius: 5px;
    overflow: hidden;
}}
.prac-head {{
    background: #1f5fa6;
    color: white;
    font-weight: bold;
    font-size: 11pt;
    text-align: center;
    height: 9mm;
    line-height: 9mm;
}}
.prac-cols {{
    display: table;
    width: 100%;
    height: 40mm;
    border-spacing: 0;
}}
.pc {{
    display: table-cell;
    width: 25%;
    vertical-align: top;
    padding: 5px 8px;
    font-size: 9pt;
}}
.pc-1 {{ border-right: 1px solid #1f5fa6; }}
.pc-2 {{ border-right: 1px solid #1f5fa6; }}
.pc-3 {{ border-right: 1px solid #1f5fa6; }}
.pct {{ font-weight: bold; font-size: 9pt; margin-bottom: 2px; }}
.t-p1 {{ color: #1f5fa6; }}
.t-p2 {{ color: #1f5fa6; }}
.t-p3 {{ color: #cc0000; }}
.t-p4 {{ color: #1e7d2e; }}
.t-p5 {{ color: #7b3fa0; }}

.pci {{ font-size: 8pt; color: #111; margin-bottom: 4px; }}
.pi  {{ line-height: 1.9; font-weight: bold; }}

.prac-mixed {{
    padding: 4px 10px 5px;
    border-top: 1px solid #1f5fa6;
    height: 15mm;
}}
.pmr {{ display: table; width: 100%; margin-top: 2px; }}
.pmd {{ display: table-cell; width: 20%; font-size: 9pt; font-weight: bold; }}

/* Row 2: Misconceptions  top:67mm  height:44mm */
.misc-wrap {{
    position: absolute;
    top: 67mm; left: 0; right: 0;
    height: 44mm;
    border: 1.5px solid #cc0000;
    border-radius: 5px;
    overflow: hidden;
}}
.misc-head {{
    background: #fff0f0;
    color: #cc0000;
    font-weight: bold;
    font-size: 11pt;
    text-align: center;
    height: 9mm;
    line-height: 9mm;
}}
.misc-body {{ padding: 6px 10px 8px; }}
.misc-inst {{ font-size: 9pt; margin-bottom: 8px; }}
.misc-row  {{
    display: table;
    width: 100%;
    border: 1px solid #cc0000;
    border-radius: 3px;
}}
.mi {{
    display: table-cell;
    width: 20%;
    padding: 8px 6px;
    border-right: 1px solid #cc0000;
    font-size: 9pt;
    text-align: center;
    vertical-align: top;
}}
.mi:last-child {{ border-right: none; }}
.mip {{ margin-bottom: 8px; font-weight: bold; }}
.cb  {{ display: inline-block; width: 14px; height: 14px; border: 1px solid #555; vertical-align: middle; margin-left: 4px; }}
.mia {{ font-size: 8.5pt; color: #111; margin-bottom: 6px; }}
.mir {{ font-size: 8.5pt; color: #111; }}

/* Row 3: Challenge  top:112mm  bottom:37mm */
.chal-wrap {{
    position: absolute;
    top: 112mm; left: 0; right: 0; bottom: 37mm;
    border: 1.5px solid #b8860b;
    border-radius: 5px;
    background: #fffdf5;
    overflow: hidden;
}}
.chal-head {{
    color: #b8860b;
    font-weight: bold;
    font-size: 11pt;
    text-align: center;
    height: 8mm;
    line-height: 8mm;
    border-bottom: 1px solid #b8860b;
}}
.chal-body {{
    position: absolute;
    top: 8mm; left: 0; right: 0; bottom: 0;
}}
.cc {{
    position: absolute;
    top: 0; bottom: 0;
    width: 50%;
    padding: 8px 12px;
    font-size: 9pt;
    line-height: 1.6;
    overflow: hidden;
}}
.cc:first-child {{ left: 0; border-right: 1px solid #b8860b; }}
.cc:last-child  {{ left: 50%; }}
.ccf {{ margin-top: 10px; font-weight: bold; }}
.ccf div {{ margin-top: 8px; }}
.ul_ {{ display: inline-block; border-bottom: 1px solid #555; width: 160px; margin-left: 5px; }}

/* Row 4: Footer  bottom:0  height:36mm */
.foot-row {{
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 36mm;
    display: table;
    width: 100%;
    border-spacing: 5px;
}}
.fb {{
    display: table-cell;
    vertical-align: middle;
    border-radius: 5px;
    padding: 7px 10px;
}}
.fb-tips  {{ width: 40%; border: 1.5px solid #1f5fa6; background: #f4f8ff; }}
.fb-check {{ width: 40%; border: 1.5px solid #1e7d2e; background: #f5fdf5; }}
.fb-badge {{ width: 20%; border: 1.5px solid #1e7d2e; background: #f5fdf5; text-align: center; vertical-align: middle; }}

.fbi {{ display: table; }}
.fbic {{ display: table-cell; vertical-align: middle; padding-right: 10px; font-size: 20pt; white-space: nowrap; color: #1f5fa6; }}
.fbic2 {{ display: table-cell; vertical-align: middle; padding-right: 10px; font-size: 20pt; white-space: nowrap; color: #1e7d2e; }}
.fbtc {{ display: table-cell; vertical-align: middle; font-size: 9pt; }}
.ftt  {{ font-weight: bold; font-size: 10pt; color: #1f5fa6; margin-bottom: 4px; }}
.ftg  {{ font-weight: bold; font-size: 10pt; color: #1e7d2e; margin-bottom: 4px; }}
.ci   {{ line-height: 1.8; font-weight: bold; }}

.badge {{
    display: inline-block;
    background: #4caf50;
    color: white;
    font-weight: bold;
    font-size: 12pt;
    border-radius: 50%;
    width: 65px;
    height: 65px;
    text-align: center;
    padding-top: 14px;
    line-height: 1.25;
    border: 3px dashed white;
    outline: 3px solid #4caf50;
    transform: rotate(-10deg);
}}
</style>
</head>
<body>

<div class="page">
    <div class="p1-header">
        <div class="p1-hl">Name: ___________________________</div>
        <div class="p1-hc">
            <div class="t1">{data['title'].split(chr(10))[0]}</div>
            <div class="t2">{data['title'].split(chr(10))[1] if chr(10) in data['title'] else ''}</div>
        </div>
        <div class="p1-hr">Date: _____________________</div>
    </div>
    <div class="lo">{data['objective']}</div>
    <div class="three-cols">
        <div class="ic ic-blue">
            <div class="ct-blue">{data['info_boxes']['key_terms']['title']}</div>
            <p class="pgap">{data['info_boxes']['key_terms']['content'][0]['text']}</p>
            <p>{data['info_boxes']['key_terms']['content'][1]['text']}</p>
        </div>
        <div class="ic ic-green">
            <div class="ct-green">{data['info_boxes']['what_we_learn']['title']}</div>
            <table class="eg-t">
"""
    for eg in data['info_boxes']['what_we_learn']['examples']:
        icon = '<span class="ok">&#10003;</span>' if eg['correct'] else '<span class="no">&#10007;</span>'
        html_content += f"                <tr><td>{icon}</td><td>{eg['expr']}</td><td>{eg['desc']}</td></tr>\n"

    html_content += f"""            </table>
        </div>
        <div class="ic ic-yellow">
            <div class="ct-yellow">{data['info_boxes']['key_idea']['title']}</div>
            <div class="kt">{data['info_boxes']['key_idea']['text']}</div>
            <div class="eqr">{data['info_boxes']['key_idea']['equation']}</div>
            <div class="eqc">{data['info_boxes']['key_idea']['caption']}</div>
        </div>
    </div>

    <div class="mod-wrap">
        <div class="mod-head">
            <div class="mht">MODELLED EXAMPLES</div>
            <div class="mhs">Study each example carefully before attempting the practice questions.</div>
        </div>
        <div class="mod-body">
"""
    for i, ex in enumerate(data['modelled_examples']):
        html_content += f"""            <div class="ex-c ex-c-{i+1}">
                <span class="ex-t t-{i+1}">{ex['label']}</span>
                <div class="ex-i">
                    <div class="ex-p">{ex['question']}</div>
                    <div class="ex-s">{ex['steps'][0]}<br>{ex['steps'][1]}<br>{ex['steps'][2]}</div>
                    <div class="ex-a a-{i+1}">{ex['answer']}</div>
                    <div class="ex-n">{ex['explanation']}</div>
                </div>
            </div>
"""
    html_content += """        </div>
    </div>
</div>

<div class="page">
    <div class="prac-wrap">
        <div class="prac-head">YOUR TURN &ndash; PRACTICE (deliberate practice)</div>
        <div class="prac-cols">
"""
    for i in range(4):
        p = data['practice'][i]
        html_content += f"""            <div class="pc pc-{i+1}">
                <div class="pct t-p{i+1}">{p['number']}. {p['heading']}</div>
                <div class="pci">{p['instruction']}</div>
"""
        for q in p['questions']:
            html_content += f"                <div class=\"pi\">{q['id']}) {q['expression']}</div>\n"
        html_content += "            </div>\n"

    p5 = data['practice'][4]
    html_content += f"""        </div>
        <div class="prac-mixed">
            <div class="pct t-p5">{p5['number']}. {p5['heading']}</div>
            <div class="pci">{p5['instruction']}</div>
            <div class="pmr">
"""
    for q in p5['questions']:
        html_content += f"                <div class=\"pmd\">{q['id']}) {q['expression']}</div>\n"
    html_content += """            </div>
        </div>
    </div>

    <div class="misc-wrap">
        <div class="misc-head">COMMON MISCONCEPTIONS &ndash; SPOT THE MISTAKE</div>
        <div class="misc-body">
            <div class="misc-inst">
                <strong>Each statement shows a student&rsquo;s answer. Tick (&radic;) the ones that are correct.</strong> If it is wrong, write the correct answer.
            </div>
            <div class="misc-row">
"""
    for m in data['misconceptions']['items']:
        html_content += f"""                <div class="mi">
                    <div class="mip">{m['id']}) {m['statement']} <span class="cb"></span></div>
                    <div class="mia">Correct answer: ___________</div>
                    <div class="mir">Reason: ___________________</div>
                </div>\n"""
    html_content += """            </div>
        </div>
    </div>

    <div class="chal-wrap">
        <div class="chal-head">6. CHALLENGE &ndash; WORD PROBLEMS (apply your skills)</div>
        <div class="chal-body">
"""
    for p in data['challenge']['problems']:
        html_content += f"""            <div class="cc">
                <div>{p['id']}) {p['text']}</div>
                <div class="ccf">
                    <div>Expression: <span class="ul_"></span></div>
                    <div>Simplified:&nbsp;&nbsp;<span class="ul_"></span></div>
                </div>
            </div>\n"""
    html_content += """        </div>
    </div>

    <div class="foot-row">
        <div class="fb fb-tips">
            <div class="fbi">
                <div class="fbic">&#9733;</div>
                <div class="fbtc">
                    <div class="ftt">TOP TIPS</div>
                    <div>Read the question carefully. Show all your working step by step. Check your answer makes sense.</div>
                </div>
            </div>
        </div>
        <div class="fb fb-check">
            <div class="fbi">
                <div class="fbic2">&#129504;</div>
                <div class="fbtc">
                    <div class="ftg">CHECK YOUR WORK</div>
                    <div class="ci">&#10003; Have I shown all my working clearly?</div>
                    <div class="ci">&#10003; Did I check my answer using a different method?</div>
                    <div class="ci">&#10003; Does my answer look reasonable?</div>
                </div>
            </div>
        </div>
        <div class="fb fb-badge">
            <div class="badge">WELL<br>DONE!</div>
        </div>
    </div>
</div>

</body>
</html>"""

    font_config = FontConfiguration()
    HTML(string=html_content).write_pdf(output_pdf, font_config=font_config)
    print(f"PDF generated: {output_pdf}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python3 generate_worksheet.py <input.json> <output.pdf>")
        sys.exit(1)
    generate_pdf(sys.argv[1], sys.argv[2])
