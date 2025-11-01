import { useMutation } from '@tanstack/react-query';
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';

import { submitCharacter, type SubmissionResponse } from '../api/submissions';

export function SubmissionPortal() {
  const [name, setName] = useState('');
  const [series, setSeries] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

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

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
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
    } else if (!imageUrl) {
      setPreviewUrl((prev) => {
        if (prev?.startsWith('blob:')) {
          URL.revokeObjectURL(prev);
        }
        return null;
      });
    }
  };

  const handleImageUrlChange = (event: ChangeEvent<HTMLInputElement>) => {
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
    } else if (!imageFile) {
      setPreviewUrl((prev) => {
        if (prev?.startsWith('blob:')) {
          URL.revokeObjectURL(prev);
        }
        return null;
      });
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
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
    } catch (error) {
      console.error(error);
    }
  };

  const submissionResult = submissionMutation.data;
  const displayPreview = previewUrl ?? null;

  return (
    <section>
      <h2>Submission Portal</h2>
      <p>Share your waifu and brace for impact. Upload an image or link to one, add some context, and we&apos;ll slot it into the roasting queue.</p>

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
          <span>Upload image</span>
          <input type="file" accept="image/*" onChange={handleFileChange} />
          {imageFile && <span className="muted small-text">{imageFile.name}</span>}
        </label>

        <label className="field">
          <span>Image URL (fallback)</span>
          <input
            value={imageUrl}
            onChange={handleImageUrlChange}
            placeholder="https://example.com/waifu.png"
            disabled={Boolean(imageFile)}
          />
          {imageFile && <span className="muted small-text">Remove the uploaded file above to switch back to URL mode.</span>}
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
          <div className="preview-image">
            {displayPreview ? <img src={displayPreview} alt="" /> : '[ image goes here ]'}
          </div>
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
      {result.imagePath && (
        <p className="muted tiny-text">
          Image saved at <a href={result.imagePath} target="_blank" rel="noreferrer">{result.imagePath}</a>
        </p>
      )}
    </section>
  );
}
