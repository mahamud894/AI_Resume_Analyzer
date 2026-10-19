import {Accordion, AccordionContent, AccordionHeader, AccordionItem} from "~/components/Accordion";
import {PlaceholderText} from "~/components/EuropassCv";

// Same order and titles as the feedback on the review page
const CATEGORIES: { key: ImprovementCategory; title: string }[] = [
    { key: "ATS", title: "ATS" },
    { key: "toneAndStyle", title: "Tone & Style" },
    { key: "content", title: "Content" },
    { key: "structure", title: "Structure" },
    { key: "skills", title: "Skills" },
];

const ChangeCard = ({ change }: { change: ImprovementChange }) => (
    <div className="flex flex-col gap-3 rounded-2xl p-3 sm:p-4 bg-white border border-gray-200 min-w-0">
        {change.section && (
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">{change.section}</p>
        )}
        {/* Phone: Before card above After card. Larger screens: badge column + text column. */}
        <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-x-3 gap-y-2 items-start">
            <span className="w-fit text-xs font-semibold rounded-full px-2 py-0.5 bg-badge-red text-badge-red-text">Before</span>
            <p className="text-gray-500 line-through decoration-gray-300 break-words max-sm:bg-gray-50 max-sm:rounded-lg max-sm:px-3 max-sm:py-2">{change.before || "(missing)"}</p>
            <span className="w-fit text-xs font-semibold rounded-full px-2 py-0.5 bg-badge-green text-badge-green-text max-sm:mt-1">After</span>
            <p className="text-gray-800 break-words max-sm:bg-green-50/60 max-sm:rounded-lg max-sm:px-3 max-sm:py-2"><PlaceholderText text={change.after} /></p>
        </div>
        {change.reason && (
            <p className="text-sm bg-gray-50 rounded-lg px-3 py-2 text-dark-200">
                <span className="font-semibold">Why: </span>{change.reason}
            </p>
        )}
    </div>
);

const ImprovementReport = ({ changes }: { changes: ImprovementChange[] }) => {
    const groups = CATEGORIES
        .map(({ key, title }) => ({ key, title, items: changes.filter((c) => c.category === key) }))
        .filter((g) => g.items.length > 0);

    if (groups.length === 0) {
        return <p className="text-gray-500">No individual changes were reported.</p>;
    }

    return (
        <Accordion allowMultiple defaultOpen={groups[0].key}>
            {groups.map(({ key, title, items }) => (
                <AccordionItem id={key} key={key}>
                    <AccordionHeader itemId={key}>
                        <div className="flex flex-row flex-wrap gap-x-4 gap-y-1 items-center py-1 sm:py-2">
                            <p className="text-lg sm:text-2xl font-semibold">{title}</p>
                            <span className="text-sm font-medium rounded-full px-2 py-0.5 bg-badge-green text-badge-green-text">
                                {items.length} {items.length === 1 ? "change" : "changes"}
                            </span>
                        </div>
                    </AccordionHeader>
                    <AccordionContent itemId={key}>
                        <div className="flex flex-col gap-4 w-full">
                            {items.map((change, index) => (
                                <ChangeCard key={index} change={change} />
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    );
};

export default ImprovementReport;
