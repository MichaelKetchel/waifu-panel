import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from '@tanstack/react-query';
import { fetchQueue } from '../api/queue';
import { useQueueSocket } from '../socket/useQueueSocket';
import { resolveImageUrl } from '../utils/media';
import { useRoundSocket } from '../socket/useRoundSocket';
import { useRoundState } from '../socket/useRoundState';
export function DisplayBoard() {
    useQueueSocket('/display');
    useRoundSocket('/display');
    const roundQuery = useRoundState();
    const queueQuery = useQuery({
        queryKey: ['queue'],
        queryFn: fetchQueue,
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        refetchInterval: false
    });
    const queue = queueQuery.data?.queue ?? [];
    const upcoming = queue.slice(0, 3);
    const currentRound = roundQuery.data;
    return (_jsxs("section", { className: "projector", children: [_jsxs("header", { className: "projector__header", children: [_jsxs("div", { children: [_jsx("h2", { children: "Current Roast" }), _jsx("p", { className: "muted", children: "Vote now at waifu-panel.local" })] }), _jsx("div", { className: "status-tag status-tag--live", children: currentRound ? currentRound.status : 'Idle' })] }), currentRound ? (_jsx(LiveRoundBoard, { round: currentRound })) : queue.length > 0 ? (_jsx(UpcomingPreview, { next: queue[0], upcoming: queue.slice(1, 4) })) : (_jsx("div", { className: "card projector__empty", children: _jsx("p", { className: "muted", children: "Submissions are open! Get your waifu into the queue." }) })), _jsxs("section", { className: "projector__upcoming card", children: [_jsx("h3", { children: "Up Next" }), upcoming.length === 0 ? (_jsx("p", { className: "muted", children: "More characters coming soon." })) : (_jsx("ol", { className: "upcoming-list-detailed", children: upcoming.map((entry, index) => (_jsxs("li", { children: [_jsx("span", { className: "position", children: index + 1 }), _jsxs("div", { children: [_jsx("strong", { children: entry.name }), entry.series && _jsx("span", { className: "muted", children: entry.series })] })] }, entry.id))) }))] })] }));
}
function LiveRoundBoard({ round }) {
    return (_jsxs("div", { className: "display-board display-board--live", children: [_jsx("div", { className: "display-image", children: _jsx("img", { src: resolveImageUrl(round.character.imagePath), alt: "" }) }), _jsxs("div", { className: "display-metadata live-metadata", children: [_jsx("h1", { children: round.character.name }), round.character.series && _jsx("p", { className: "muted", children: round.character.series }), round.mode === 'yn' ? _jsx(YesNoTallies, { tallies: round.tallies }) : _jsx(ScaleTallies, { round: round })] })] }));
}
function YesNoTallies({ tallies }) {
    const yes = tallies.find((entry) => entry.value === 1)?.count ?? 0;
    const no = tallies.find((entry) => entry.value === 0)?.count ?? 0;
    const total = Math.max(yes + no, 1);
    const yesPercent = Math.round((yes / total) * 100);
    const noPercent = 100 - yesPercent;
    return (_jsxs("div", { className: "yes-no-tally", children: [_jsxs("div", { className: "tally-bar", children: [_jsxs("div", { className: "tally-bar__segment tally-bar__segment--yes", style: { width: `${yesPercent}%` }, children: ["Yes ", yes] }), _jsxs("div", { className: "tally-bar__segment tally-bar__segment--no", style: { width: `${noPercent}%` }, children: ["No ", no] })] }), _jsx("p", { className: "muted small-text", children: "Live votes updating in real time" })] }));
}
function ScaleTallies({ round }) {
    const votesByValue = new Map(round.tallies.map((entry) => [entry.value, entry.count]));
    const values = Array.from({ length: round.scale.max - round.scale.min + 1 }, (_, idx) => round.scale.min + idx);
    return (_jsx("div", { className: "scale-tally-grid", children: values.map((value) => (_jsxs("div", { className: "scale-tally-cell", children: [_jsx("span", { className: "scale-tally-value", children: value }), _jsx("span", { className: "scale-tally-count", children: votesByValue.get(value) ?? 0 })] }, value))) }));
}
function UpcomingPreview({ next, upcoming }) {
    return (_jsxs("div", { className: "display-board", children: [_jsx("div", { className: "display-image", children: _jsx("img", { src: resolveImageUrl(next.imagePath), alt: "" }) }), _jsxs("div", { className: "display-metadata", children: [_jsx("h3", { children: next.name }), next.series && _jsx("p", { className: "muted", children: next.series }), _jsxs("p", { className: "muted small-text", children: ["Status: ", next.status] }), _jsxs("div", { className: "tally full-width", children: [_jsx("span", { className: "label", children: "Upcoming" }), _jsx("span", { className: "value upcoming-list", children: upcoming.length > 0 ? upcoming.map((item) => item.name).join(' · ') : 'Waiting for the next challenger' })] })] })] }));
}
