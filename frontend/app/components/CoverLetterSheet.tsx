import {PlaceholderText} from "~/components/EuropassCv";

const T = PlaceholderText;

// One block of lines (sender / recipient); empty lines are skipped
const Lines = ({ items, className }: { items: string[]; className?: string }) => (
    <div className={className}>
        {items.filter(Boolean).map((line, i) => <p key={i}><T text={line} /></p>)}
    </div>
);

// The user's own edited version (plain text, paragraphs separated by blank lines).
// Blocks that still match the generated sender / date / subject keep their letter styling,
// so an edited letter looks like the same matching set as the CV.
const EditedLetter = ({ letter, text }: { letter: CoverLetterContent; text: string }) => {
    const blocks = text.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
    return (
        <article className="letter-sheet">
            <div className="letter-plain">
                {blocks.map((block, i) => {
                    const [first, ...rest] = block.split("\n");
                    if (i === 0 && first.trim() === letter.sender.fullName) {
                        return (
                            <header key={i} className="letter-sender">
                                <p className="letter-sender-name"><T text={first} /></p>
                                <Lines items={rest} className="letter-sender-details" />
                            </header>
                        );
                    }
                    if (block === letter.date) return <p key={i} className="letter-date">{block}</p>;
                    if (block === letter.subject) return <p key={i} className="letter-subject"><T text={block} /></p>;
                    return <p key={i}><T text={block} /></p>;
                })}
            </div>
        </article>
    );
};

// The cover letter on an A4-looking sheet, in the same style as the Europass CV.
// If the user saved their own version (`editedText`), that text is shown instead.
const CoverLetterSheet = ({ letter, editedText }: { letter: CoverLetterContent; editedText?: string | null }) => {
    if (editedText) return <EditedLetter letter={letter} text={editedText} />;

    const { sender, recipient } = letter;
    return (
        <article className="letter-sheet">
            <header className="letter-sender">
                <p className="letter-sender-name"><T text={sender.fullName} /></p>
                <Lines items={[sender.address, sender.phone, sender.email, sender.linkedin]} className="letter-sender-details" />
            </header>

            <p className="letter-date">{letter.date}</p>

            <Lines items={[recipient.name, recipient.title, recipient.company, recipient.address]} className="letter-recipient" />

            <p className="letter-subject"><T text={letter.subject} /></p>

            <div className="letter-body">
                <p>{letter.salutation}</p>
                <p><T text={letter.opening} /></p>
                {letter.body.map((paragraph, i) => <p key={i}><T text={paragraph} /></p>)}
                <p><T text={letter.closing} /></p>
            </div>

            <div className="letter-signoff">
                <p>{letter.signOff}</p>
                <p className="letter-signature"><T text={letter.signatureName} /></p>
            </div>
        </article>
    );
};

export default CoverLetterSheet;
