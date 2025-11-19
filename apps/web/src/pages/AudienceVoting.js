import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRoundSocket } from '../socket/useRoundSocket';
import { useRoundState } from '../socket/useRoundState';
import { submitVote } from '../api/votes';
import { resolveImageUrl } from '../utils/media';
export function AudienceVoting() {
    useRoundSocket('/audience');
    const roundQuery = useRoundState();
    const currentRound = roundQuery.data;
    const [selectedValue, setSelectedValue] = useState(null);
    const [feedback, setFeedback] = useState(null);
    useEffect(() => {
        setSelectedValue(null);
        setFeedback(null);
    }, [currentRound?.id]);
    const voteMutation = useMutation({
        mutationFn: submitVote,
        onError: (error) => {
            const message = error?.body?.message ?? error?.message ?? 'Vote failed. Please try again.';
            setFeedback(message);
        },
        onSuccess: () => {
            setFeedback('Vote received! You can change it until the round ends.');
        }
    });
    const handleVote = (value) => {
        if (!currentRound)
            return;
        const normalized = currentRound.mode === 'yn' ? (value > 0 ? 1 : 0) : value;
        setSelectedValue(normalized);
        voteMutation.mutate({ roundId: currentRound.id, value });
    };
    return (_jsxs("section", { children: [_jsx("h2", { children: "Audience Voting" }), _jsx("p", { children: "Tap to vote as soon as a character goes live. Votes update in real time on the main display." }), _jsx("div", { className: "card audience-card", children: currentRound ? (_jsx(LiveVoteCard, { round: currentRound, selectedValue: selectedValue, onVote: handleVote, isSubmitting: voteMutation.isPending, feedback: feedback })) : roundQuery.isLoading ? (_jsx("p", { className: "muted", children: "Checking for active rounds\u2026" })) : (_jsx("p", { className: "muted", children: "No active round. Submissions are being queued\u2014hang tight!" })) })] }));
}
function LiveVoteCard({ round, selectedValue, onVote, isSubmitting, feedback }) {
    if (!round)
        return null;
    const yesCount = round.tallies.find((tally) => tally.value === 1)?.count ?? 0;
    const noCount = round.tallies.find((tally) => tally.value === 0)?.count ?? 0;
    return (_jsxs("div", { className: "live-vote", children: [_jsx("div", { className: "live-vote__image", children: _jsx("img", { src: resolveImageUrl(round.character.imagePath), alt: "" }) }), _jsxs("div", { className: "live-vote__details", children: [_jsx("h3", { children: round.character.name }), round.character.series && _jsx("p", { className: "muted", children: round.character.series }), _jsxs("p", { className: "muted small-text", children: ["Mode: ", round.mode === 'yn' ? 'Yes / No' : `${round.scale.min} – ${round.scale.max}`] }), round.mode === 'yn' ? (_jsxs("div", { className: "vote-controls", children: [_jsxs("button", { type: "button", className: selectedValue === 1 ? 'active' : '', onClick: () => onVote(1), disabled: round.status !== 'live' || isSubmitting, children: ["Yes (", yesCount, ")"] }), _jsxs("button", { type: "button", className: selectedValue === 0 ? 'active' : '', onClick: () => onVote(0), disabled: round.status !== 'live' || isSubmitting, children: ["No (", noCount, ")"] })] })) : (_jsx(ScaleVoteControls, { round: round, selectedValue: selectedValue, onVote: onVote, isSubmitting: isSubmitting })), feedback && _jsx("p", { className: "muted small-text", children: feedback }), round.status === 'ended' && _jsx("p", { className: "muted", children: "Round closed. New character coming soon." })] })] }));
}
function ScaleVoteControls({ round, selectedValue, onVote, isSubmitting }) {
    const votesByValue = new Map(round.tallies.map((entry) => [entry.value, entry.count]));
    const values = Array.from({ length: round.scale.max - round.scale.min + 1 }, (_, idx) => round.scale.min + idx);
    return (_jsx("div", { className: "scale-vote", children: values.map((value) => (_jsxs("button", { type: "button", className: `scale-vote__option ${selectedValue === value ? 'active' : ''}`, onClick: () => onVote(value), disabled: round.status !== 'live' || isSubmitting, children: [_jsx("span", { className: "scale-vote__value", children: value }), _jsx("span", { className: "scale-vote__count", children: votesByValue.get(value) ?? 0 })] }, value))) }));
}
