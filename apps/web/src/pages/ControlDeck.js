import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { fetchQueue } from '../api/queue';
import { moderateCharacter } from '../api/moderation';
import { getSocket } from '../socket/socket';
import { useQueueSocket } from '../socket/useQueueSocket';
import { useRoundSocket } from '../socket/useRoundSocket';
import { useRoundState } from '../socket/useRoundState';
import { resolveImageUrl } from '../utils/media';
import { endRound, startRound, skipRound } from '../api/rounds';
import { fetchControlStatus, loginControl, logoutControl } from '../api/auth';
export function ControlDeck() {
    const queryClient = useQueryClient();
    const authQuery = useQuery({
        queryKey: ['control-auth'],
        queryFn: fetchControlStatus,
        staleTime: Infinity
    });
    const isAuthed = authQuery.data?.authenticated ?? false;
    useQueueSocket('/control', isAuthed);
    useRoundSocket('/control', isAuthed);
    const roundState = useRoundState({ enabled: isAuthed });
    const queueQuery = useQuery({
        queryKey: ['queue'],
        queryFn: fetchQueue,
        refetchOnWindowFocus: false,
        refetchInterval: false,
        staleTime: Infinity,
        enabled: isAuthed
    });
    const moderationMutation = useMutation({
        mutationFn: ({ characterId, action, reason }) => moderateCharacter(characterId, action, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['queue'] });
        }
    });
    const startRoundMutation = useMutation({
        mutationFn: startRound,
        onError: (error) => {
            const message = error?.body?.message ?? error?.message ?? 'Failed to start round';
            window.alert(message);
        }
    });
    const endRoundMutation = useMutation({
        mutationFn: endRound,
        onError: (error) => {
            const message = error?.body?.message ?? error?.message ?? 'Failed to end round';
            window.alert(message);
        }
    });
    const skipRoundMutation = useMutation({
        mutationFn: skipRound,
        onError: (error) => {
            const message = error?.body?.message ?? error?.message ?? 'Failed to skip round';
            window.alert(message);
        }
    });
    const queue = queueQuery.data?.queue ?? [];
    const queueError = queueQuery.error instanceof Error ? queueQuery.error : null;
    const nextUp = queue[0] ?? null;
    const currentRound = roundState.data;
    const queueMessage = useMemo(() => {
        if (queueQuery.isLoading && isAuthed)
            return 'Loading queue…';
        if (queueError)
            return queueError.message ?? 'Failed to load queue.';
        if (queue.length === 0)
            return 'Queue is empty. Approve a submission to get started.';
        return null;
    }, [queueQuery.isLoading, queueError, queue.length]);
    const handleModeration = (entry, action) => {
        if (moderationMutation.isPending)
            return;
        let reason;
        if (action === 'reject') {
            const input = window.prompt(`Reason for rejecting ${entry.name}? (optional)`);
            reason = input ?? undefined;
        }
        else if (action === 'skip') {
            const confirmSkip = window.confirm(`Skip ${entry.name}?`);
            if (!confirmSkip)
                return;
        }
        moderationMutation.mutate({ characterId: entry.id, action, reason });
    };
    const handleStartRound = (mode) => {
        if (!nextUp || startRoundMutation.isPending || currentRound?.status === 'live') {
            return;
        }
        const scale = mode === 'scale' ? { min: 1, max: 5 } : undefined;
        startRoundMutation.mutate({ characterId: nextUp.id, mode, scale });
    };
    const handleEndRound = () => {
        if (!currentRound || currentRound.status !== 'live' || endRoundMutation.isPending) {
            return;
        }
        endRoundMutation.mutate({ roundId: currentRound.id });
    };
    const handleSkipRound = () => {
        if (!currentRound || currentRound.status !== 'live' || skipRoundMutation.isPending) {
            return;
        }
        const confirmSkip = window.confirm(`Skip ${currentRound.character.name}? Audience votes will be discarded.`);
        if (!confirmSkip)
            return;
        skipRoundMutation.mutate({ roundId: currentRound.id });
    };
    const logoutMutation = useMutation({
        mutationFn: logoutControl,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['control-auth'] });
            queryClient.removeQueries({ queryKey: ['queue'] });
            queryClient.setQueryData(['round', 'current'], null);
        }
    });
    if (!isAuthed) {
        return (_jsxs("section", { children: [_jsx("h2", { children: "Control Deck" }), _jsx("p", { children: "Enter the moderator passcode to unlock controls." }), _jsx(ControlLoginCard, { isLoading: authQuery.isLoading })] }));
    }
    return (_jsxs("section", { children: [_jsx("h2", { children: "Control Deck" }), _jsx("p", { children: "Moderate submissions, prep the next roast, and keep the show moving. Queue updates stream in live; use refresh if the network hiccups." }), _jsx("div", { className: "control-actions", children: _jsx("button", { type: "button", className: "ghost", onClick: () => logoutMutation.mutate(), disabled: logoutMutation.isPending, children: logoutMutation.isPending ? 'Logging out…' : 'Log out' }) }), _jsxs("div", { className: "control-grid", children: [_jsxs("div", { className: "card", children: [_jsxs("header", { className: "card-header", children: [_jsx("h3", { children: "Current Round" }), _jsx("span", { className: `status-tag ${currentRound ? 'status-tag--live' : 'status-tag--disabled'}`, children: currentRound ? currentRound.status : 'idle' })] }), currentRound ? (_jsxs("div", { className: "current-round", children: [_jsx("div", { className: "current-round__image", children: _jsx("img", { src: resolveImageUrl(currentRound.character.imagePath), alt: "" }) }), _jsxs("div", { className: "current-round__details", children: [_jsx("h4", { children: currentRound.character.name }), currentRound.character.series && _jsx("p", { className: "muted", children: currentRound.character.series }), _jsxs("p", { className: "muted small-text", children: ["Mode: ", currentRound.mode === 'yn' ? 'Yes / No' : `${currentRound.scale.min} – ${currentRound.scale.max}`] })] })] })) : (_jsx("p", { className: "muted", children: "No character live. Start a round when you are ready to roast." })), _jsxs("div", { className: "actions", children: [_jsx("button", { disabled: !currentRound || currentRound.status !== 'live' || endRoundMutation.isPending, onClick: handleEndRound, children: endRoundMutation.isPending ? 'Ending…' : 'End Round' }), _jsx("button", { className: "secondary", disabled: !currentRound || currentRound.status !== 'live' || skipRoundMutation.isPending, onClick: handleSkipRound, children: skipRoundMutation.isPending ? 'Skipping…' : 'Skip Character' })] })] }), _jsxs("div", { className: "card", children: [_jsxs("header", { className: "card-header", children: [_jsx("h3", { children: "Next Up" }), queueQuery.isFetching && _jsx("span", { className: "status-tag", children: "syncing" })] }), nextUp ? (_jsx(NextUpCard, { entry: nextUp, onModerate: handleModeration, isMutating: moderationMutation.isPending })) : (_jsx("p", { className: "muted", children: queueMessage })), _jsxs("div", { className: "actions", children: [_jsx("button", { disabled: !nextUp || currentRound?.status === 'live' || startRoundMutation.isPending, onClick: () => handleStartRound('yn'), children: startRoundMutation.isPending ? 'Starting…' : 'Start Round (Yes/No)' }), _jsx("button", { disabled: !nextUp || currentRound?.status === 'live' || startRoundMutation.isPending, onClick: () => handleStartRound('scale'), children: startRoundMutation.isPending ? 'Starting…' : 'Start Round (1–5)' })] })] }), _jsxs("div", { className: "card wide", children: [_jsxs("header", { className: "card-header", children: [_jsx("h3", { children: "Submission Queue" }), _jsxs("div", { className: "queue-controls", children: [_jsx("button", { type: "button", className: "secondary", onClick: () => {
                                                    getSocket('/control').emit('queue:fetch');
                                                    queueQuery.refetch().catch(() => {
                                                        // ignore errors, socket will push updates
                                                    });
                                                }, disabled: queueQuery.isFetching, children: "Refresh" }), _jsx("span", { className: "muted small-text", children: queueQuery.isFetching ? 'Refreshing…' : `${queue.length} item${queue.length === 1 ? '' : 's'}` })] })] }), queueMessage && queue.length === 0 ? (_jsx("p", { className: "muted", children: queueMessage })) : (_jsx("ul", { className: "queue-list", children: queue.map((entry, index) => (_jsx(QueueListItem, { entry: entry, place: index + 1, isMutating: moderationMutation.isPending, onModerate: handleModeration }, entry.id))) }))] })] })] }));
}
function ControlLoginCard({ isLoading }) {
    const queryClient = useQueryClient();
    const [passcode, setPasscode] = useState('');
    const [error, setError] = useState(null);
    const loginMutation = useMutation({
        mutationFn: (code) => loginControl(code),
        onSuccess: () => {
            setPasscode('');
            setError(null);
            queryClient.invalidateQueries({ queryKey: ['control-auth'] });
        },
        onError: () => {
            setError('Incorrect passcode. Try again.');
        }
    });
    const handleSubmit = (event) => {
        event.preventDefault();
        if (!passcode.trim())
            return;
        loginMutation.mutate(passcode.trim());
    };
    return (_jsx("div", { className: "card login-card", children: _jsxs("form", { className: "stack", onSubmit: handleSubmit, children: [_jsxs("label", { className: "field", children: [_jsx("span", { children: "Passcode" }), _jsx("input", { type: "password", value: passcode, onChange: (event) => setPasscode(event.target.value), disabled: isLoading || loginMutation.isPending })] }), error && _jsx("p", { className: "error", children: error }), _jsx("button", { type: "submit", disabled: isLoading || loginMutation.isPending, children: loginMutation.isPending ? 'Verifying…' : 'Unlock Control Deck' })] }) }));
}
function NextUpCard({ entry, onModerate, isMutating }) {
    return (_jsxs("div", { className: "next-up", children: [_jsx("div", { className: "next-up__image", children: _jsx("img", { src: resolveImageUrl(entry.imagePath), alt: "" }) }), _jsxs("div", { className: "next-up__details", children: [_jsx("h4", { children: entry.name }), entry.series && _jsx("p", { className: "muted", children: entry.series }), _jsxs("div", { className: "actions", children: [_jsx("button", { type: "button", disabled: isMutating, onClick: () => onModerate(entry, 'approve'), children: "Approve" }), _jsx("button", { type: "button", className: "secondary", disabled: isMutating, onClick: () => onModerate(entry, 'reject'), children: "Reject" })] })] })] }));
}
function QueueListItem({ entry, onModerate, place, isMutating }) {
    return (_jsxs("li", { className: "queue-item", children: [_jsx("div", { className: "queue-item__index", children: place }), _jsx("div", { className: "queue-item__image", children: _jsx("img", { src: resolveImageUrl(entry.imagePath), alt: "" }) }), _jsxs("div", { className: "queue-item__details", children: [_jsxs("div", { className: "queue-item__title", children: [_jsx("span", { className: "queue-item__name", children: entry.name }), entry.series && _jsx("span", { className: "queue-item__series", children: entry.series })] }), _jsx("div", { className: "queue-item__status", children: _jsx("span", { className: `status-tag status-tag--${entry.status}`, children: entry.status }) })] }), _jsxs("div", { className: "queue-item__actions", children: [_jsx("button", { type: "button", disabled: isMutating, onClick: () => onModerate(entry, 'approve'), children: "Approve" }), _jsx("button", { type: "button", className: "secondary", disabled: isMutating, onClick: () => onModerate(entry, 'reject'), children: "Reject" }), _jsx("button", { type: "button", className: "ghost", disabled: isMutating, onClick: () => onModerate(entry, 'skip'), children: "Skip" })] })] }));
}
