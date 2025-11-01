import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import { submitCharacter, type SubmissionResponse } from '../api/submissions';

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

  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
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
    } catch (error) {
      console.error(error);
    }
  };

  const submissionResult = submissionMutation.data;

  return (
    <section>
      <h2>Submission Portal</h2>
      <p>Attendees can submit a character for the panel. We&apos;ll hook up uploads shortly; use an image URL placeholder for now.</p>

      <form className="stack" onSubmit={handleSubmit}>
        <label className="field">
          <span>Character name</span>
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Sailor Moon" />
        </label>

        <label className="field">
          <span>Series (optional)</span>
          <input value={series} onChange={(event) => setSeries(event.target.value)} placeholder="Sailor Moon" />
        </label>

        <label className="field">
          <span>Why should we roast them?</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Give us your best elevator pitch."
          />
        </label>

        <label className="field">
          <span>Image URL (temporary)</span>
          <input
            value={image}
            onChange={(event) => setImage(event.target.value)}
            placeholder="https://example.com/waifu.png"
          />
        </label>

        {localError && <p className="error">{localError}</p>}

        {submissionMutation.error && (
          <p className="error">
            {(submissionMutation.error as Error).message ?? 'Something went wrong. Please try again in a bit.'}
          </p>
        )}

        <button type="submit" disabled={submissionMutation.isPending}>
          {submissionMutation.isPending ? 'Submitting…' : 'Submit'}
        </button>
      </form>

      <aside className="preview-card">
        <h3>Preview</h3>
        <div className="preview-body">
          <div className="preview-image">{image ? <img src={image} alt="" /> : '[ image goes here ]'}</div>
          <div className="preview-details">
            <h4>{name || 'Character Name'}</h4>
            <p className="muted">{series || 'Series'}</p>
            <p>{description || 'Include a short pitch so the panel has context.'}</p>
          </div>
        </div>
      </aside>

      {submissionResult && <SubmissionReceipt result={submissionResult} />}
    </section>
  );
}

function SubmissionReceipt({ result }: { result: SubmissionResponse }) {
  return (
    <section className="card">
      <h3>Submission received!</h3>
      <p className="muted">
        Your character is in the queue. Hold onto this info in case the moderators need to reference it.
      </p>
      <dl className="receipt-grid">
        <div>
          <dt>ID</dt>
          <dd>{result.submissionId}</dd>
        </div>
        <div>
          <dt>Queue Position</dt>
          <dd>{result.queuePosition}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{result.status}</dd>
        </div>
        <div>
          <dt>Remaining submissions</dt>
          <dd>{result.remainingSlots}</dd>
        </div>
      </dl>
    </section>
  );
}
