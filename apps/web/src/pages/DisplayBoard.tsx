import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { fetchQueue } from '../api/queue';
import { usePublicConfig } from '../config/publicConfig';
import { resolveFrontendRoute } from '../routes';
import { useQueueSocket } from '../socket/useQueueSocket';
import { resolveImageUrl } from '../utils/media';
import { createQrCode } from '../utils/qr';
import { useRoundSocket } from '../socket/useRoundSocket';
import { useRoundState } from '../socket/useRoundState';
import {getRandomItem} from "../utils/misc";


export function trashSmall(name: string) {
  let choices = [
      name,
      `${name}? Seriously?`,
      `${name}. Again.`,
      `${name}. Surprise, surprise.`,
      `Who the fuck is ${name}?`,
      `Gaze upon ${name} and weep.`,
      `Is that....${name}?!`,

  ]
  return getRandomItem(choices)
}

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

  const queue = (queueQuery.data?.queue ?? []).filter((entry) => entry.status === 'approved');
  const upcoming = queue.slice(0, 3);
  const currentRound = roundQuery.data;
  const { frontendBaseUrl } = usePublicConfig();
  // const audienceUrl = resolveFrontendRoute('audience', frontendBaseUrl);
  const audienceUrl = resolveFrontendRoute('audience');

  return (
    <section className="projector">
      <header className="projector__header">
        <div>
          <p className="projector__eyebrow">Your Waifu Ain't Shit!</p>
          <h1>{currentRound ? trashSmall(currentRound.character.name) : queue.length > 0 ? 'Next Up' : 'Submissions Open'}</h1>
        </div>
        <div className="projector__status">
          <div className="projector__status-copy">
            <span className={`status-tag ${currentRound ? 'status-tag--live' : 'status-tag--disabled'}`}>
              {currentRound ? currentRound.status : 'Idle'}
            </span>
          </div>
        </div>
      </header>

      <div className="projector__stage">
        {currentRound ? (
          <LiveRoundBoard round={currentRound} audienceUrl={audienceUrl}  />
        )
        //     : queue.length > 0 ? (
        //   <UpcomingPreview next={queue[0]} upcoming={queue.slice(1, 4)} />
        // )
                : (
          <div className="projector__empty">
            <p>Submissions are open.</p>
            <span className="muted">Throw that bitch to the wolves!</span>
          </div>
        )}
      </div>

      {/*<footer className="projector__upcoming">*/}
      {/*  <h2>Up Next</h2>*/}
      {/*  {upcoming.length === 0 ? <p className="muted">More characters coming soon.</p> : <UpcomingList upcoming={upcoming} />}*/}
      {/*</footer>*/}
    </section>
  );
}

function AudienceQrCode({ url }: { url: string|undefined }) {
  const qr = url ? useMemo(() => createQrCode(url), [url]) : undefined;

  return (
      <div className="audience-qr">
              {/*<span className="audience-qr__label">Scan to vote</span>*/}
        {qr ? <QrSvg modules={qr.modules} /> : <div className="audience-qr__fallback">QR unavailable</div>}
      </div>
    // <div className="audience-qr">
    //   {qr ? <QrSvg modules={qr.modules} /> : <div className="audience-qr__fallback">QR unavailable</div>}
    //   <div className="audience-qr__details">
    //     <span className="audience-qr__label">Scan to vote</span>
    //     <strong className="audience-qr__url">{formatDisplayUrl(url)}</strong>
    //   </div>
    // </div>
  );
}

function QrSvg({ modules }: { modules: boolean[][] }) {
  const quietZone = 4;
  const size = modules.length;
  const viewSize = size + quietZone * 2;
  const darkPath = modules
    .flatMap((row, y) =>
      row.map((isDark, x) => (isDark ? `M${x + quietZone} ${y + quietZone}h1v1h-1z` : '')).filter(Boolean)
    )
    .join('');

  return (
    <svg className="audience-qr__code" viewBox={`0 0 ${viewSize} ${viewSize}`} role="img" aria-label="QR code for audience voting">
      <rect width={viewSize} height={viewSize} fill="#fff" />
      <path d={darkPath} fill="#05070d" />
    </svg>
  );
}

function formatDisplayUrl(url: string) {
  try {
    const parsed = new URL(url);
    return `${parsed.host}${parsed.pathname}`;
  } catch {
    return url;
  }
}

function LiveRoundBoard({round, audienceUrl}: {
    round: NonNullable<ReturnType<typeof useRoundState>['data']>,
    audienceUrl?: string
}) {
  return (
    <div className="projector-board projector-board--live">
      <div className="display-image">
        <img src={resolveImageUrl(round.character.imagePath)} alt="" />
      </div>
      <div className="display-metadata live-metadata">
          <div>
              <h1 className="character-name">{round.character.name}</h1>
              {round.character.series && <h2 className="character-series">From {round.character.series}</h2>}
              {round.character.submitterAlias && <h2 className="muted character-submitter">Thanks to: {round.character.submitterAlias}</h2>}
          </div>


          <div>
              <h3>You said:</h3>
              <br/>
              { round.character.description ?
              <p className="character-desc" style={{ fontStyle: 'italic' }}>{round.character.description}</p>
                  :
                  <p className="character-desc" style={{ fontStyle: 'italic' }}>Absolutely nothing! You didn't even try to defend your waifu!</p>
              }
          </div>

        {round.mode === 'yn' ? <YesNoTallies tallies={round.tallies} /> : <ScaleTallies round={round} />}
          <div className="audience-qr-wrapper"> <AudienceQrCode url={audienceUrl} /></div>
      </div>
    </div>
  );
}

function YesNoTallies({ tallies }: { tallies: Array<{ value: number; count: number }> }) {
  const yes = tallies.find((entry) => entry.value === 1)?.count ?? 0;
  const no = tallies.find((entry) => entry.value === 0)?.count ?? 0;
  const total = Math.max(yes + no, 1);
  const yesPercent = Math.round((yes / total) * 100);
  const noPercent = 100 - yesPercent;

  return (
    <div className="yes-no-tally">
      <div className="tally-bar">
        <div className="tally-bar__segment tally-bar__segment--yes" style={{ width: `${yesPercent}%` }}>
          Yes {yes}
        </div>
        <div className="tally-bar__segment tally-bar__segment--no" style={{ width: `${noPercent}%` }}>
          No {no}
        </div>
      </div>
      <p className="muted small-text">Live votes updating in real time</p>
    </div>
  );
}

function ScaleTallies({ round }: { round: NonNullable<ReturnType<typeof useRoundState>['data']> }) {
  const votesByValue = new Map(round.tallies.map((entry) => [entry.value, entry.count]));
  const values = Array.from({ length: round.scale.max - round.scale.min + 1 }, (_, idx) => round.scale.min + idx);
  const maxCount = Math.max(...values.map((value) => votesByValue.get(value) ?? 0), 1);
  const totalVotes = round.tallies.reduce((sum, entry) => sum + entry.count, 0);

  return (
    <div className="scale-bar-chart" aria-label="Vote distribution">
      {values.map((value) => (
        <div key={value} className="scale-bar-chart__row">
          <span className="scale-bar-chart__label">{value}</span>
          <div className="scale-bar-chart__track">
            <div
              className="scale-bar-chart__bar"
              style={{ width: `${((votesByValue.get(value) ?? 0) / maxCount) * 100}%` }}
            />
          </div>
          <span className="scale-bar-chart__count">{votesByValue.get(value) ?? 0}</span>
        </div>
      ))}
      <p className="muted small-text">{totalVotes} vote{totalVotes === 1 ? '' : 's'} counted</p>
    </div>
  );
}

function UpcomingPreview({
  next,
  upcoming
}: {
  next: { name: string; series: string | null; imagePath: string; status: string };
  upcoming: Array<{ name: string; series: string | null; id: string }>;
}) {
  return (
    <div className="projector-board">
      <div className="display-image">
        <img src={resolveImageUrl(next.imagePath)} alt="" />
      </div>
      <div className="display-metadata">
        <h3>{next.name}</h3>
        {next.series && <p className="muted">{next.series}</p>}
        <p className="muted small-text">Status: {next.status}</p>
        <div className="tally full-width">
          <span className="label">Upcoming</span>
          <span className="value upcoming-list">
            {upcoming.length > 0 ? upcoming.map((item) => item.name).join(' · ') : 'Waiting for the next challenger'}
          </span>
        </div>
      </div>
    </div>
  );
}

function UpcomingList({ upcoming }: { upcoming: Array<{ name: string; series: string | null; id: string }> }) {
  return (
    <ol className="upcoming-list-detailed">
      {upcoming.map((entry, index) => (
        <li key={entry.id}>
          <span className="position">{index + 1}</span>
          <div>
            <strong>{entry.name}</strong>
            {entry.series && <span className="muted">{entry.series}</span>}
          </div>
        </li>
      ))}
    </ol>
  );
}
