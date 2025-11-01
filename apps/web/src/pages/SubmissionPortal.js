import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { submitCharacter } from '../api/submissions';
export function SubmissionPortal() {
    const [name, setName] = useState('');
    const [series, setSeries] = useState('');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState('');
    const submissionMutation = useMutation({
        mutationFn: submitCharacter,
        onSuccess: () => {
            setName('');
            setSeries('');
            setDescription('');
            setImage('');
        }
    });
    const [localError, setLocalError] = useState(null);
    const handleSubmit = async (event) => {
        event.preventDefault();
        setLocalError(null);
        if (!name.trim()) {
            setLocalError('Character name is required.');
            return;
        }
        if (!image.trim()) {
            setLocalError('Please provide an image URL for now (upload tooling TBD).');
            return;
        }
        try {
            await submissionMutation.mutateAsync({
                name: name.trim(),
                series: series.trim() || undefined,
                description: description.trim() || undefined,
                imagePath: image.trim()
            });
        }
        catch (error) {
            console.error(error);
        }
    };
    const submissionResult = submissionMutation.data;
    return (_jsxs("section", { children: [_jsx("h2", { children: "Submission Portal" }), _jsx("p", { children: "Attendees can submit a character for the panel. We'll hook up uploads shortly; use an image URL placeholder for now." }), _jsxs("form", { className: "stack", onSubmit: handleSubmit, children: [_jsxs("label", { className: "field", children: [_jsx("span", { children: "Character name" }), _jsx("input", { value: name, onChange: (event) => setName(event.target.value), placeholder: "Sailor Moon" })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "Series (optional)" }), _jsx("input", { value: series, onChange: (event) => setSeries(event.target.value), placeholder: "Sailor Moon" })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "Why should we roast them?" }), _jsx("textarea", { value: description, onChange: (event) => setDescription(event.target.value), placeholder: "Give us your best elevator pitch." })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "Image URL (temporary)" }), _jsx("input", { value: image, onChange: (event) => setImage(event.target.value), placeholder: "https://example.com/waifu.png" })] }), localError && _jsx("p", { className: "error", children: localError }), submissionMutation.error && (_jsx("p", { className: "error", children: submissionMutation.error.message ?? 'Something went wrong. Please try again in a bit.' })), _jsx("button", { type: "submit", disabled: submissionMutation.isPending, children: submissionMutation.isPending ? 'Submitting…' : 'Submit' })] }), _jsxs("aside", { className: "preview-card", children: [_jsx("h3", { children: "Preview" }), _jsxs("div", { className: "preview-body", children: [_jsx("div", { className: "preview-image", children: image ? _jsx("img", { src: image, alt: "" }) : '[ image goes here ]' }), _jsxs("div", { className: "preview-details", children: [_jsx("h4", { children: name || 'Character Name' }), _jsx("p", { className: "muted", children: series || 'Series' }), _jsx("p", { children: description || 'Include a short pitch so the panel has context.' })] })] })] }), submissionResult && _jsx(SubmissionReceipt, { result: submissionResult })] }));
}
function SubmissionReceipt({ result }) {
    return (_jsxs("section", { className: "card", children: [_jsx("h3", { children: "Submission received!" }), _jsx("p", { className: "muted", children: "Your character is in the queue. Hold onto this info in case the moderators need to reference it." }), _jsxs("dl", { className: "receipt-grid", children: [_jsxs("div", { children: [_jsx("dt", { children: "ID" }), _jsx("dd", { children: result.submissionId })] }), _jsxs("div", { children: [_jsx("dt", { children: "Queue Position" }), _jsx("dd", { children: result.queuePosition })] }), _jsxs("div", { children: [_jsx("dt", { children: "Status" }), _jsx("dd", { children: result.status })] }), _jsxs("div", { children: [_jsx("dt", { children: "Remaining submissions" }), _jsx("dd", { children: result.remainingSlots })] })] })] }));
}
