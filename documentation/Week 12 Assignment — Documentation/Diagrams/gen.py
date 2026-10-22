# Generates the four RESUMIND diagrams (Graphviz) in one consistent visual style.
import subprocess, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))

# category colours: (header, light fill, border)
C = {
    "fe":  ("#4F46E5", "#EEF2FF", "#C7D2FE"),   # frontend / browser
    "be":  ("#0F766E", "#F0FDFA", "#99F6E4"),   # backend
    "db":  ("#15803D", "#F0FDF4", "#BBF7D0"),   # database
    "ext": ("#BE185D", "#FDF2F8", "#FBCFE8"),   # Google services
    "ci":  ("#334155", "#F8FAFC", "#CBD5E1"),   # GitHub / CI
    "ok":  ("#B45309", "#FFFBEB", "#FDE68A"),   # decision / check
}
INK, MUTE = "#0F172A", "#475569"
FONT = "Inter"

def esc(t): return t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

def card(title, lines, cat, badge=None, width=None):
    h, light, border = C[cat]
    w = f' width="{width}"' if width else ""
    head = f'<font color="white"><b>{esc(title)}</b></font>'
    if badge is not None:
        head = f'<font color="white" point-size="11"><b>{badge}</b></font>  ' + head
    body = "".join(f'<tr><td align="left" balign="left"{w}><font color="{MUTE}" point-size="11">{esc(l)}</font></td></tr>' for l in lines)
    return (f'<<table border="1" cellborder="0" cellspacing="0" cellpadding="7" color="{h}" bgcolor="white">'
            f'<tr><td bgcolor="{h}" align="left"{w}>{head}</td></tr>{body}</table>>')

HEAD = f'''
  graph [fontname="{FONT}", bgcolor="white", pad=0.35, splines=spline, newrank=true];
  node  [shape=plain, fontname="{FONT}", fontsize=13, fontcolor="{INK}"];
  edge  [fontname="{FONT}", fontsize=10, color="#64748B", fontcolor="{MUTE}", penwidth=1.6, arrowsize=0.75];
'''

def cluster(name, label, cat, body):
    h, light, border = C[cat]
    return (f'  subgraph cluster_{name} {{ label=<<font color="{h}"><b>{esc(label)}</b></font>>; labeljust=l; labelloc=b; fontsize=14; '
            f'style="rounded,filled"; fillcolor="{light}"; color="{border}"; penwidth=1.4; margin=14;\n{body}\n  }}\n')

def legend(items):
    cells = "".join(f'<td bgcolor="{C[c][0]}" width="14" height="14" fixedsize="true"></td><td align="left"><font point-size="11" color="{MUTE}">{esc(t)}</font></td><td width="10"></td>' for c, t in items)
    return f'  legend [label=<<table border="0" cellborder="0" cellspacing="4"><tr>{cells}</tr></table>>];\n'

def render(name, dot):
    open(name + ".dot", "w").write(dot)
    subprocess.run(["dot", "-Tpng", "-Gdpi=220", name + ".dot", "-o", name + ".png"], check=True)
    print("ok", name)

# ---------------- 1. Architecture ----------------
a = "digraph Architecture {" + HEAD + '  graph [rankdir=TB, nodesep=0.5, ranksep=0.65];\n'
a += f'  user [label={card("User", ["Browser or phone", "HTTPS"], "fe")}];\n'
a += f'  gh [label={card("GitHub", ["Push to main", "CI: 48 tests + build", "auto-deploy"], "ci")}];\n'
a += cluster("fe", "1  Presentation tier — Vercel", "fe",
    f'    spa [label={card("React 19 SPA", ["React Router 8 · Tailwind CSS 4", "Zustand auth store"], "fe")}];\n'
    f'    pdfjs [label={card("pdf.js", ["page-1 preview image"], "fe")}];\n'
    f'    apic [label={card("API client", ["fetch + Bearer JWT", "401 → log out"], "fe")}];\n'
    '    {rank=same; pdfjs; spa; apic;}')
a += cluster("be", "2  Application tier — Render", "be",
    f'    mw [label={card("Middleware", ["helmet · CORS · rate limit", "JWT auth · validation · Multer"], "be")}];\n'
    f'    ctrl [label={card("Controllers", ["auth · resume", "improve · cover letter"], "be")}];\n'
    f'    svc [label={card("Services", ["pdf-parse · Gemini JSON mode", "Europass post-check · GridFS"], "be")}];\n'
    '    {rank=same; mw; ctrl; svc;}')
a += cluster("data", "3  Data & external services", "db",
    f'    db [label={card("MongoDB Atlas", ["5 collections", "GridFS: PDFs + previews"], "db")}];\n'
    f'    gem [label={card("Google Gemini", ["analysis · rewrite", "score · cover letter"], "ext")}];\n'
    f'    gid [label={card("Google Identity", ["Sign in with Google", "ID-token verification"], "ext")}];\n'
    '    {rank=same; gid; db; gem;}')
a += '''  {rank=same; user; gh;}
  user -> spa [color="#4F46E5"];
  pdfjs -> spa [style=dashed, color="#4F46E5", dir=back];
  spa -> apic [color="#4F46E5"];
  apic -> mw [label="  HTTPS · JSON · JWT", color="#4F46E5", penwidth=2.2];
  mw -> ctrl [color="#0F766E"]; ctrl -> svc [color="#0F766E"];
  svc -> db [label="  Mongoose", color="#15803D"];
  svc -> gem [label="  prompt + JSON schema", color="#BE185D"];
  ctrl -> gid [label="  verify token", style=dashed, color="#BE185D"];
  gh -> spa [label="  auto-deploy\n  Vercel + Render", style=dashed, color="#334155"];
}'''
render("architecture", a)

# ---------------- 2. ERD ----------------
def entity(name, rows, cat="db"):
    h, light, border = C[cat]
    tr = ""
    for key, field in rows:
        badge = ""
        if key == "PK": badge = f'<font color="#B45309" point-size="10"><b>PK</b></font>'
        elif key == "FK": badge = f'<font color="#4F46E5" point-size="10"><b>FK</b></font>'
        elif key == "U": badge = f'<font color="#0F766E" point-size="10"><b>UQ</b></font>'
        tr += f'<tr><td align="left" width="26">{badge}</td><td align="left"><font point-size="11" color="{INK}">{esc(field)}</font></td></tr>'
    return (f'<<table border="1" cellborder="0" cellspacing="0" cellpadding="5" color="{h}" bgcolor="white">'
            f'<tr><td colspan="2" bgcolor="{h}" align="left"><font color="white"><b>{esc(name)}</b></font></td></tr>{tr}</table>>')

e = "digraph ERD {" + HEAD + '  graph [rankdir=TB, nodesep=0.9, ranksep=0.7];\n  edge [arrowhead=crow, arrowtail=tee, dir=both, color="#15803D", fontcolor="#15803D", fontsize=11];\n'
e += f'  users [label={entity("users", [("PK","_id"),("U","username"),("U","email"),("","passwordHash (bcrypt)"),("","hasPassword"),("U","googleId"),("","passwordChangedAt"),("","createdAt")])}];\n'
e += f'  resumes [label={entity("resumes", [("PK","_id"),("FK","userId"),("FK","fileId → GridFS"),("FK","imageId → GridFS"),("","originalName"),("","fileSize"),("","uploadDate")])}];\n'
e += f'  analyses [label={entity("analyses", [("PK","_id"),("FK","resumeId"),("FK","userId"),("","companyName · jobTitle"),("","jobDescription"),("","feedback { overallScore, ATS,"),("","  toneAndStyle, content,"),("","  structure, skills }"),("","createdAt")])}];\n'
e += f'  improved [label={entity("improvedresumes", [("PK","_id"),("U","analysisId (FK)"),("FK","resumeId · userId"),("","europassCv · editedCv"),("","changes [ ]"),("","afterFeedback · scoredAt"),("","createdAt")])}];\n'
e += f'  letters [label={entity("coverletters", [("PK","_id"),("U","improvedResumeId (FK)"),("U","analysisId (FK)"),("FK","userId"),("","inputs { name, address,"),("","  source, tone }"),("","letter · editedText"),("","createdAt · updatedAt")])}];\n'
e += f'  gridfs [label={entity("GridFS  uploads.files / chunks", [("","PDF and PNG bytes"),("","255 KB chunks")], "ci")}];\n'
e += '''  users -> resumes [label="1 : N"];
  resumes -> analyses [label="1 : N"];
  analyses -> improved [label="1 : 0..1", arrowhead=teeodot];
  letters -> improved [label="1 : 0..1", arrowtail=teeodot, arrowhead=tee, dir=both];
  resumes -> gridfs [label=" files", style=dashed, color="#334155", fontcolor="#334155", arrowhead=normal, arrowtail=none];
  {rank=same; users; resumes; analyses;}
  {rank=same; gridfs; letters; improved;}
}'''
render("erd", e)

# ---------------- 3. AI workflow ----------------
w = "digraph AI {" + HEAD + '  graph [rankdir=TB, nodesep=0.5, ranksep=0.42];\n'
A = [
    ("in", "1", "Input", ["Resume PDF + company,", "job title, job description"], "fe"),
    ("parse", "2", "Extract text", ["pdf-parse (max 30 000 chars)", "no text → 422 scanned PDF"], "be"),
    ("prompt", "3", "Build prompt", ["expert ATS reviewer rules", "honest 0–100 scores, 3–4 tips"], "be"),
    ("gem", "4", "Google Gemini", ["JSON mode + responseJsonSchema", "→ always the Feedback shape"], "ext"),
    ("norm", "5", "Validate", ["clamp scores to 0–100", "drop malformed tips"], "be"),
    ("save", "6", "Save & show", ["Analysis in MongoDB", "→ result page"], "db"),
]
B = [
    ("imp", "7", "Europass rewrite", ["resume + every \"improve\" tip + job", "never invent facts"], "ext"),
    ("post", "8", "postCheck() in code", ["new numbers → placeholders", "MM/YYYY dates · EQF · grades"], "ok"),
    ("score", "9a", "Before / after score", ["improved CV → text", "same prompt, same job"], "ext"),
    ("cl", "9b", "Cover letter", ["CV facts only · 250–400 words", "code adds header & sign-off"], "ext"),
]
body = "".join(f'    {nid} [label={card(t, lines, cat, badge=b, width=240)}];\n' for nid, b, t, lines, cat in A)
body += '    retry [shape=diamond, style="filled", fillcolor="#FFFBEB", color="#F59E0B", penwidth=1.4, fontsize=11, fontcolor="#92400E", label="busy?\\n500/503/504"];\n'
body += '    wait [shape=box, style="rounded,filled", fillcolor="#FFFBEB", color="#FDE68A", fontsize=10, fontcolor="#92400E", label="wait 2 s, then 4 s\\n(max 3 tries)"];\n    {rank=same; retry; wait;}'
w += cluster("a", "A  Analyse the resume", "be", body)
bb = '    start [shape=box, style="rounded,filled", fillcolor="#FDF2F8", color="#BE185D", penwidth=1.4, fontsize=12, fontcolor="#9D174D", label="after step 6: user clicks\\n\\"Improve My CV (Europass)\\""];\n'
bb += "".join(f'    {nid} [label={card(t, lines, cat, badge=b, width=240)}];\n' for nid, b, t, lines, cat in B)
bb += '    {rank=same; score; cl;}'
w += cluster("b", "B  Improve and apply", "ext", bb)
w += '''  in -> parse -> prompt -> gem;
  gem -> retry [color="#B45309"];
  retry -> wait [label=" yes", color="#B45309", fontcolor="#B45309"];
  wait -> gem [style=dashed, color="#B45309", constraint=false];
  retry -> norm [label=" no", color="#0F766E", fontcolor="#0F766E"];
  norm -> save;
  start -> imp [color="#BE185D"];
  imp -> post [color="#BE185D"];
  post -> score [label=" optional", color="#BE185D"];
  post -> cl [label=" optional", color="#BE185D"];
  {rank=same; in; start;}
}'''
render("ai-workflow", w)

# ---------------- 4. Authentication flow ----------------
f = "digraph Auth {" + HEAD + '  graph [rankdir=TB, nodesep=0.55, ranksep=0.6];\n'
au = [
    ("a", "1", "Sign up / log in", ["email + password (8–72)", "or Google ID token"], "fe"),
    ("b", "2", "Backend checks", ["validation · 20 req / 15 min", "bcrypt compare / Google verify"], "be"),
    ("c", "3", "JWT issued", ["signed with JWT_SECRET", "valid 7 days"], "be"),
    ("d", "4", "Browser stores", ["Zustand + localStorage"], "fe"),
    ("e", "5", "Every API call", ["Authorization: Bearer <JWT>"], "fe"),
    ("g", "6", "requireAuth", ["verify signature & expiry", "reject if older than", "passwordChangedAt"], "be"),
    ("h", "7", "Owner's data only", ["queries filtered by userId", "others' ids → 404"], "db"),
]
for nid, b, t, lines, cat in au:
    f += f'  {nid} [label={card(t, lines, cat, badge=b)}];\n'
f += '''  {rank=same; a; b; c; d;}
  {rank=same; h; g; e;}
  a -> b -> c [color="#0F766E"];
  c -> d [color="#4F46E5"];
  d -> e [color="#4F46E5"];
  h -> g [dir=back, color="#0F766E"];
  g -> e [dir=back, color="#0F766E"];
}'''
render("auth-flow", f)
