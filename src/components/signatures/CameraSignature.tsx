import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { mirrorPixels } from '@lib/signatures/cameraCorrection';

interface CameraSignatureProps {
  onSignatureChange: (dataUrl: string | null) => void;
}

/**
 * Capture a signature from the camera and mirror it so the ink reads correctly.
 * The live preview uses the same left-to-right reverse as the saved image.
 */
export function CameraSignature({ onSignatureChange }: CameraSignatureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('This browser has no camera.');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          void video.play?.().catch(() => undefined);
        }
        if (!cancelled) setReady(true);
      } catch {
        if (!cancelled) {
          setError('The camera is unavailable.');
        }
      }
    }

    void start();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);
    const frame = ctx.getImageData(0, 0, width, height);
    const mirrored = mirrorPixels(frame.data, frame.width, frame.height);
    frame.data.set(mirrored);
    ctx.putImageData(frame, 0, 0);
    onSignatureChange(canvas.toDataURL('image/png'));
  }, [onSignatureChange]);

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600 dark:text-gray-300">
        Hold the signature toward the camera. The picture is mirrored so the ink reads correctly.
      </p>
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : (
        <video
          ref={videoRef}
          className="h-40 w-full rounded-md bg-gray-900 object-cover"
          style={{ transform: 'scaleX(-1)' }}
          muted
          playsInline
          data-testid="signature-camera"
        />
      )}
      <Button type="button" onClick={handleCapture} disabled={!ready} data-testid="capture-signature">
        <Camera className="mr-1 h-4 w-4" />
        Capture
      </Button>
    </div>
  );
}
