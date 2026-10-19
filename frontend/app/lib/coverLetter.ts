// Turns the structured cover letter into plain text — used for "Copy text" and as the
// starting point of "Edit" mode. Empty optional lines (e.g. no LinkedIn) are left out.
export function letterToText(letter: CoverLetterContent): string {
    const lines = (...items: string[]) => items.filter(Boolean).join("\n");
    const { sender, recipient } = letter;

    return [
        lines(sender.fullName, sender.address, sender.phone, sender.email, sender.linkedin),
        letter.date,
        lines(recipient.name, recipient.title, recipient.company, recipient.address),
        letter.subject,
        letter.salutation,
        letter.opening,
        ...letter.body,
        letter.closing,
        lines(letter.signOff, letter.signatureName),
    ]
        .filter(Boolean)
        .join("\n\n");
}

export const countWords = (text: string) =>
    text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
