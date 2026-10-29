import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CameraSignature } from '@components/signatures/CameraSignature';
import { SignatureModal } from '@components/signatures/SignatureModal';
import { Toolbar } from '@components/layout/Toolbar';
import { useSignatureStore } from '@stores/signatureStore';

describe('CameraSignature', () => {
  const stop = vi.fn();
  const play = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    stop.mockClear();
    play.mockClear();
    Object.defineProperty(HTMLMediaElement.prototype, 'play', {
      configurable: true,
      value: play,
    });
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{ stop }],
        }),
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function withFrameSize(width: number, height: number) {
    Object.defineProperty(HTMLVideoElement.prototype, 'videoWidth', {
      configurable: true,
      get: () => width,
    });
    Object.defineProperty(HTMLVideoElement.prototype, 'videoHeight', {
      configurable: true,
      get: () => height,
    });
  }

  it('asks for the camera and mirrors the live preview', async () => {
    render(<CameraSignature onSignatureChange={() => {}} />);

    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
    });
    expect(screen.getByTestId('signature-camera')).toHaveStyle({ transform: 'scaleX(-1)' });
  });

  it('stays disabled until the camera reports a frame size', async () => {
    withFrameSize(0, 0);
    const onSignatureChange = vi.fn();
    render(<CameraSignature onSignatureChange={onSignatureChange} />);

    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
    });
    expect(screen.getByTestId('capture-signature')).toBeDisabled();
    fireEvent.click(screen.getByTestId('capture-signature'));
    expect(onSignatureChange).not.toHaveBeenCalled();
  });

  it('saves a horizontally mirrored frame', async () => {
    withFrameSize(2, 1);
    const putImageData = vi.fn();
    const pixels = new Uint8ClampedArray([9, 0, 0, 255, 3, 0, 0, 255]);
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => {
      return {
        drawImage: vi.fn(),
        getImageData: () => ({ data: pixels, width: 2, height: 1 }),
        putImageData,
      } as unknown as CanvasRenderingContext2D;
    });
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,abc');

    const onSignatureChange = vi.fn();
    render(<CameraSignature onSignatureChange={onSignatureChange} />);
    await waitFor(() => expect(screen.getByTestId('capture-signature')).toBeEnabled());

    fireEvent.click(screen.getByTestId('capture-signature'));

    expect(Array.from(pixels)).toEqual([3, 0, 0, 255, 9, 0, 0, 255]);
    expect(putImageData).toHaveBeenCalledWith(expect.objectContaining({ data: pixels }), 0, 0);
    expect(onSignatureChange).toHaveBeenCalledWith('data:image/png;base64,abc');
  });

  it('shows the camera tab on the signature modal', () => {
    render(<SignatureModal isOpen onClose={() => {}} />);
    expect(screen.getByText('Camera')).toBeInTheDocument();
  });

  it('opens the camera tab from the editor toolbar', async () => {
    useSignatureStore.setState({ isModalOpen: false, isInitialsMode: false });
    render(<Toolbar />);
    fireEvent.click(screen.getByTestId('tool-signature'));
    fireEvent.click(screen.getByText('Camera'));
    expect(await screen.findByTestId('signature-camera')).toBeInTheDocument();
  });
});
