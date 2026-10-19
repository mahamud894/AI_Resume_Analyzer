// Reads the user's inline edits back out of the rendered CV.
// Every editable field in <EuropassCv> has a data-path such as "workExperience.0.responsibilities.1";
// we copy the CV and write each field's current text into that path.
export function collectCvEdits(root: HTMLElement, cv: EuropassCv): EuropassCv {
    const edited = structuredClone(cv);
    root.querySelectorAll<HTMLElement>("[data-path]").forEach((el) => {
        const keys = el.dataset.path!.split(".");
        let target: any = edited;
        for (const key of keys.slice(0, -1)) {
            target = target?.[key];
            if (target == null) return;
        }
        target[keys[keys.length - 1]] = el.innerText.replace(/\s+/g, " ").trim();
    });
    return edited;
}

// The CV the user sees: their saved edits win over the AI version
export const currentCv = (improved: ImprovedResume) => improved.editedCv ?? improved.europassCv;
