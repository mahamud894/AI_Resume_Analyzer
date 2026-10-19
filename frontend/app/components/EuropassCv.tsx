import {Children, memo, type ReactNode} from "react";

// Highlights "[Add ...]" placeholders in yellow so the user sees what still needs filling in.
export const PlaceholderText = ({ text }: { text: string }) => (
    <>
        {text.split(/(\[[^\]]+\])/g).map((part, i) =>
            /^\[[^\]]+\]$/.test(part)
                ? <mark key={i} className="europass-placeholder">{part}</mark>
                : part
        )}
    </>
);

const T = PlaceholderText;

// One editable field. `path` says where its text is stored in the CV (e.g. "education.0.grade"),
// so collectCvEdits() can save what the user typed.
const F = ({ path, text, className }: { path: string; text: string; className?: string }) => (
    <span data-path={path} className={className} contentEditable suppressContentEditableWarning spellCheck={false}>
        <T text={text} />
    </span>
);

// Joins several editable fields with a separator that itself is not editable
const Join = ({ parts, sep }: { parts: [string, string][]; sep: string }) => (
    <>
        {parts.filter(([, text]) => text).map(([path, text], i) => (
            <span key={path}>
                {i > 0 && <span contentEditable={false}>{sep}</span>}
                <F path={path} text={text} />
            </span>
        ))}
    </>
);

// One Europass row: label/date on the left, content on the right
const Row = ({ label, children }: { label?: ReactNode; children: ReactNode }) => (
    <div className="europass-row">
        <div className="europass-label">{label}</div>
        <div className="europass-content">{children}</div>
    </div>
);

// The heading is kept together with the first entry, so a heading is never left alone at the
// bottom of a printed page.
const Section = ({ title, children }: { title: string; children: ReactNode }) => {
    const [first, ...rest] = Children.toArray(children);
    return (
        <section className="europass-section">
            <div className="europass-keep">
                <h3 className="europass-heading"><span>{title}</span></h3>
                {first}
            </div>
            {rest}
        </section>
    );
};

const LinkField = ({ path, href }: { path: string; href: string }) =>
    /^https?:\/\//.test(href)
        // A normal click edits the text; Ctrl/Cmd + click opens the link
        ? <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#0b4ea2] underline break-all"
             title="Ctrl + click to open" onClick={(e) => { if (!e.ctrlKey && !e.metaKey) e.preventDefault(); }}>
              <F path={path} text={href} />
          </a>
        : <F path={path} text={href} />;

const CEFR_COLUMNS: (keyof Omit<CefrLanguage, "language">)[] = [
    "listening", "reading", "spokenProduction", "spokenInteraction", "writing",
];

// The CV in classic Europass layout. Every text field can be edited in place (contentEditable).
// Wrapped in memo() so React never re-renders it while the user is typing — the parent reads the
// edits with collectCvEdits() when the user clicks "Save changes".
const EuropassCv = memo(({ cv, onEdit }: { cv: EuropassCv; onEdit?: () => void }) => {
    const p = cv.personalInfo;
    const contacts: [string, keyof EuropassCv["personalInfo"], boolean][] = [
        ["Email", "email", false], ["Phone", "phone", false], ["Address", "address", false],
        ["LinkedIn", "linkedin", true], ["GitHub", "github", true], ["Website", "website", true],
    ];
    const langs = cv.languageSkills;

    return (
        <article className="europass-cv" onInput={onEdit}>
            <header className="europass-header">
                <div className="europass-brand">
                    <span className="europass-title">Curriculum Vitae</span>
                    <span className="europass-subtitle">Europass format</span>
                </div>
                <div>
                    <h2 className="europass-name"><F path="personalInfo.fullName" text={p.fullName || "[Add your full name]"} /></h2>
                    <dl className="europass-contacts">
                        {contacts.filter(([, key]) => p[key]).map(([label, key, isLink]) => (
                            <div key={key}>
                                <dt>{label}:</dt>
                                <dd>
                                    {isLink
                                        ? <LinkField path={`personalInfo.${key}`} href={p[key]} />
                                        : <F path={`personalInfo.${key}`} text={p[key]} />}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </header>

            {cv.aboutMe && (
                <Section title="About Me">
                    <Row><p><F path="aboutMe" text={cv.aboutMe} /></p></Row>
                </Section>
            )}

            {cv.workExperience.length > 0 && (
                <Section title="Work Experience">
                    {cv.workExperience.map((w, i) => (
                        <Row key={i} label={<Join sep=" – " parts={[[`workExperience.${i}.startDate`, w.startDate], [`workExperience.${i}.endDate`, w.endDate]]} />}>
                            <p className="europass-item-title"><F path={`workExperience.${i}.jobTitle`} text={w.jobTitle} /></p>
                            <p className="europass-item-sub">
                                <Join sep=", " parts={[[`workExperience.${i}.employer`, w.employer], [`workExperience.${i}.city`, w.city], [`workExperience.${i}.country`, w.country]]} />
                            </p>
                            {w.responsibilities.length > 0 && (
                                <ul className="europass-list">
                                    {w.responsibilities.map((r, j) => (
                                        <li key={j}><F path={`workExperience.${i}.responsibilities.${j}`} text={r} /></li>
                                    ))}
                                </ul>
                            )}
                        </Row>
                    ))}
                </Section>
            )}

            {cv.education.length > 0 && (
                <Section title="Education and Training">
                    {cv.education.map((e, i) => (
                        <Row key={i} label={<Join sep=" – " parts={[[`education.${i}.startDate`, e.startDate], [`education.${i}.endDate`, e.endDate]]} />}>
                            <p className="europass-item-title"><F path={`education.${i}.qualification`} text={e.qualification} /></p>
                            <p className="europass-item-sub">
                                <Join sep=", " parts={[[`education.${i}.institution`, e.institution], [`education.${i}.city`, e.city], [`education.${i}.country`, e.country]]} />
                            </p>
                            {e.fieldOfStudy && (
                                <p><span className="europass-key" contentEditable={false}>Field(s) of study: </span><F path={`education.${i}.fieldOfStudy`} text={e.fieldOfStudy} /></p>
                            )}
                            {e.grade && (
                                <p><span className="europass-key" contentEditable={false}>Final grade: </span><F path={`education.${i}.grade`} text={e.grade} /></p>
                            )}
                            {e.eqfLevel && (
                                <p className="europass-eqf">
                                    <span contentEditable={false}>EQF level </span><F path={`education.${i}.eqfLevel`} text={e.eqfLevel} />
                                </p>
                            )}
                        </Row>
                    ))}
                </Section>
            )}

            {(langs.motherTongue.length > 0 || langs.otherLanguages.length > 0) && (
                <Section title="Language Skills">
                    {langs.motherTongue.length > 0 && (
                        <Row label="Mother tongue(s)">
                            <p className="europass-item-title">
                                <Join sep=", " parts={langs.motherTongue.map((m, i) => [`languageSkills.motherTongue.${i}`, m])} />
                            </p>
                        </Row>
                    )}
                    {langs.otherLanguages.length > 0 && (
                        <Row label="Other language(s)">
                            <div className="europass-cefr-scroll overflow-x-auto">
                                <table className="europass-cefr">
                                    <thead>
                                        <tr>
                                            <th rowSpan={2}></th>
                                            <th colSpan={2}>Understanding</th>
                                            <th colSpan={2}>Speaking</th>
                                            <th>Writing</th>
                                        </tr>
                                        <tr>
                                            <th>Listening</th>
                                            <th>Reading</th>
                                            <th>Spoken production</th>
                                            <th>Spoken interaction</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {langs.otherLanguages.map((l, i) => (
                                            <tr key={i}>
                                                <th scope="row"><F path={`languageSkills.otherLanguages.${i}.language`} text={l.language} /></th>
                                                {CEFR_COLUMNS.map((col) => (
                                                    <td key={col}><F path={`languageSkills.otherLanguages.${i}.${col}`} text={l[col]} /></td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Levels: A1 and A2: Basic user; B1 and B2: Independent user; C1 and C2: Proficient user
                            </p>
                        </Row>
                    )}
                </Section>
            )}

            {cv.digitalSkills.length > 0 && (
                <Section title="Digital Skills">
                    <Row>
                        <ul className="europass-list">
                            {cv.digitalSkills.map((s, i) => <li key={i}><F path={`digitalSkills.${i}`} text={s} /></li>)}
                        </ul>
                    </Row>
                </Section>
            )}

            {cv.projects.length > 0 && (
                <Section title="Projects">
                    {cv.projects.map((pr, i) => (
                        <Row key={i}>
                            <p className="europass-item-title"><F path={`projects.${i}.name`} text={pr.name} /></p>
                            {pr.description && <p><F path={`projects.${i}.description`} text={pr.description} /></p>}
                            {pr.technologies.length > 0 && (
                                <p>
                                    <span className="europass-key" contentEditable={false}>Technologies: </span>
                                    <Join sep=", " parts={pr.technologies.map((t, j) => [`projects.${i}.technologies.${j}`, t])} />
                                </p>
                            )}
                            {pr.link && (
                                <p><span className="europass-key" contentEditable={false}>Link: </span><LinkField path={`projects.${i}.link`} href={pr.link} /></p>
                            )}
                        </Row>
                    ))}
                </Section>
            )}

            {cv.certifications.length > 0 && (
                <Section title="Certifications">
                    {cv.certifications.map((c, i) => (
                        <Row key={i} label={<F path={`certifications.${i}.date`} text={c.date} />}>
                            <p className="europass-item-title"><F path={`certifications.${i}.name`} text={c.name} /></p>
                            {c.issuer && <p className="europass-item-sub"><F path={`certifications.${i}.issuer`} text={c.issuer} /></p>}
                        </Row>
                    ))}
                </Section>
            )}

            {cv.communicationSkills && (
                <Section title="Communication and Interpersonal Skills">
                    <Row><p><F path="communicationSkills" text={cv.communicationSkills} /></p></Row>
                </Section>
            )}

            {cv.organisationalSkills && (
                <Section title="Organisational Skills">
                    <Row><p><F path="organisationalSkills" text={cv.organisationalSkills} /></p></Row>
                </Section>
            )}

            {cv.volunteering.length > 0 && (
                <Section title="Volunteering">
                    <Row>
                        <ul className="europass-list">
                            {cv.volunteering.map((v, i) => <li key={i}><F path={`volunteering.${i}`} text={v} /></li>)}
                        </ul>
                    </Row>
                </Section>
            )}

            {cv.references && (
                <Section title="References">
                    <Row><p><F path="references" text={cv.references} /></p></Row>
                </Section>
            )}
        </article>
    );
});

export default EuropassCv;
