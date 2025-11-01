import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { submitCharacter } from '../api/submissions';
export function SubmissionPortal() {
    const [name, setName] = useState('');
    const [series, setSeries] = useState('');
    const [description, setDescription] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [localError, setLocalError] = useState(null);
    useEffect(() => {
        return () => {
            if (previewUrl?.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);
    const submissionMutation = useMutation({
        mutationFn: submitCharacter,
        onSuccess: () => {
            setName('');
            setSeries('');
            setDescription('');
            setImageUrl('');
            setImageFile(null);
            setPreviewUrl((prev) => {
                if (prev?.startsWith('blob:')) {
                    URL.revokeObjectURL(prev);
                }
                return null;
            });
        }
    });
    const handleFileChange = (event) => {
        const file = event.target.files?.[0] ?? null;
        setImageFile(file);
        if (file) {
            setImageUrl('');
            setPreviewUrl((prev) => {
                if (prev?.startsWith('blob:')) {
                    URL.revokeObjectURL(prev);
                }
                return URL.createObjectURL(file);
            });
        }
        else if (!imageUrl) {
            setPreviewUrl((prev) => {
                if (prev?.startsWith('blob:')) {
                    URL.revokeObjectURL(prev);
                }
                return null;
            });
        }
    };
    const handleImageUrlChange = (event) => {
        const value = event.target.value;
        setImageUrl(value);
        if (value) {
            if (imageFile) {
                setImageFile(null);
            }
            setPreviewUrl((prev) => {
                if (prev?.startsWith('blob:')) {
                    URL.revokeObjectURL(prev);
                }
                return value;
            });
        }
        else if (!imageFile) {
            setPreviewUrl((prev) => {
                if (prev?.startsWith('blob:')) {
                    URL.revokeObjectURL(prev);
                }
                return null;
            });
        }
    };
    const handleSubmit = async (event) => {
        event.preventDefault();
        setLocalError(null);
        if (!name.trim()) {
            setLocalError('Character name is required.');
            return;
        }
        if (!imageFile && !imageUrl.trim()) {
            setLocalError('Please upload an image or provide a direct image URL.');
            return;
        }
        try {
            await submissionMutation.mutateAsync({
                name: name.trim(),
                series: series.trim() || undefined,
                description: description.trim() || undefined,
                imageFile,
                imageUrl: imageFile ? undefined : imageUrl.trim()
            });
        }
        catch (error) {
            console.error(error);
        }
    };
    const submissionResult = submissionMutation.data;
    const displayPreview = previewUrl ?? null;
    return (_jsxs("section", { children: [_jsx("h2", { children: "Submission Portal" }), _jsx("p", { children: "Share your waifu and brace for impact. Upload an image or link to one, add some context, and we'll slot it into the roasting queue." }), _jsxs("form", { className: "stack", onSubmit: handleSubmit, children: [_jsxs("label", { className: "field", children: [_jsx("span", { children: "Character name" }), _jsx("input", { value: name, onChange: (event) => setName(event.target.value), placeholder: "Sailor Moon" })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "Series (optional)" }), _jsx("input", { value: series, onChange: (event) => setSeries(event.target.value), placeholder: "Sailor Moon" })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "Why should we roast them?" }), _jsx("textarea", { value: description, onChange: (event) => setDescription(event.target.value), placeholder: "Give us your best elevator pitch." })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "Upload image" }), _jsx("input", { type: "file", accept: "image/*", onChange: handleFileChange }), imageFile && _jsx("span", { className: "muted small-text", children: imageFile.name })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "Image URL (fallback)" }), _jsx("input", { value: imageUrl, onChange: handleImageUrlChange, placeholder: "https://example.com/waifu.png", disabled: Boolean(imageFile) }), imageFile && _jsx("span", { className: "muted small-text", children: "Remove the uploaded file above to switch back to URL mode." })] }), localError && _jsx("p", { className: "error", children: localError }), submissionMutation.error && (_jsx("p", { className: "error", children: submissionMutation.error.message ?? 'Something went wrong. Please try again in a bit.' })), _jsx("button", { type: "submit", disabled: submissionMutation.isPending, children: submissionMutation.isPending ? 'Submitting…' : 'Submit' })] }), _jsxs("aside", { className: "preview-card", children: [_jsx("h3", { children: "Preview" }), _jsxs("div", { className: "preview-body", children: [_jsx("div", { className: "preview-image", children: displayPreview ? _jsx("img", { src: displayPreview, alt: "" }) : '[ image goes here ]' }), _jsxs("div", { className: "preview-details", children: [_jsx("h4", { children: name || 'Character Name' }), _jsx("p", { className: "muted", children: series || 'Series' }), _jsx("p", { children: description || 'Include a short pitch so the panel has context.' })] })] })] }), submissionResult && _jsx(SubmissionReceipt, { result: submissionResult })] }));
}
function SubmissionReceipt({ result }) {
    return (_jsxs("section", { className: "card", children: [_jsx("h3", { children: "Submission received!" }), _jsx("p", { className: "muted", children: "Your character is in the queue. Hold onto this info in case the moderators need to reference it." }), _jsxs("dl", { className: "receipt-grid", children: [_jsxs("div", { children: [_jsx("dt", { children: "ID" }), _jsx("dd", { children: result.submissionId })] }), _jsxs("div", { children: [_jsx("dt", { children: "Queue Position" }), _jsx("dd", { children: result.queuePosition })] }), _jsxs("div", { children: [_jsx("dt", { children: "Status" }), _jsx("dd", { children: result.status })] }), _jsxs("div", { children: [_jsx("dt", { children: "Remaining submissions" }), _jsx("dd", { children: result.remainingSlots })] })] }), result.imagePath && (_jsxs("p", { className: "muted tiny-text", children: ["Image saved at ", _jsx("a", { href: result.imagePath, target: "_blank", rel: "noreferrer", children: result.imagePath })] }))] }));
}
