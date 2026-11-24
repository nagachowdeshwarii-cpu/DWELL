import {
  Camera,
  CheckCircle2,
  RefreshCw,
  ScanFace,
  ShieldAlert,
  Upload,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { FaceVerificationChecks } from '../types/dwell';

interface FaceVerificationCaptureProps {
  existingAvatarUrl?: string;
  isFaceVerified?: boolean;
  existingConfidence?: number;
  existingChecks?: FaceVerificationChecks;
  onVerified: (payload: {
    avatarUrl: string;
    confidenceScore: number;
    checks: FaceVerificationChecks;
    summary: string;
  }) => void;
}

interface VerifyApiResponse {
  verified: boolean;
  confidenceScore: number;
  singleFaceDetected: boolean;
  clearUnobstructedFace: boolean;
  antiSpoofPassed: boolean;
  idFaceMatch: boolean;
  idCompared: boolean;
  captureSource: 'camera' | 'upload';
  summary: string;
  rejectionReason: string;
  error?: string;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Could not read selected image file.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}

export function FaceVerificationCapture({
  existingAvatarUrl,
  isFaceVerified,
  existingConfidence,
  existingChecks,
  onVerified,
}: FaceVerificationCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [selfieDataUrl, setSelfieDataUrl] = useState<string>(
    existingAvatarUrl ?? ''
  );
  const [captureSource, setCaptureSource] = useState<'camera' | 'upload'>(
    'camera'
  );
  const [idPhotoDataUrl, setIdPhotoDataUrl] = useState<string>('');
  const [idFileName, setIdFileName] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerifyApiResponse | null>(null);
  const [apiError, setApiError] = useState('');

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraActive]);

  const handleStartCamera = async () => {
    setCameraError('');
    setApiError('');
    setResult(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(
        'Camera access is unavailable in this browser. Upload a clear selfie photo below instead.'
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
    } catch {
      setCameraError(
        'Camera permission was denied or no webcam was found. You can upload a clear selfie photo below.'
      );
    }
  };

  const handleCaptureFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);
    const jpegUrl = canvas.toDataURL('image/jpeg', 0.88);
    setSelfieDataUrl(jpegUrl);
    setCaptureSource('camera');
    setResult(null);
    setApiError('');
    stopCamera();
  };

  const handleSelfieUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCameraError('');
    setApiError('');
    setResult(null);
    stopCamera();
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setSelfieDataUrl(dataUrl);
      setCaptureSource('upload');
    } catch (err) {
      setCameraError(
        err instanceof Error ? err.message : 'Unable to read selfie photo.'
      );
    }
  };

  const handleIdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setApiError('');
    setResult(null);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setIdPhotoDataUrl(dataUrl);
      setIdFileName(file.name);
    } catch (err) {
      setApiError(
        err instanceof Error ? err.message : 'Unable to read ID photo.'
      );
    }
  };

  const handleRunVerification = async () => {
    if (!selfieDataUrl) {
      setApiError('Capture a live selfie or upload a clear photo first.');
      return;
    }

    setIsVerifying(true);
    setApiError('');
    setResult(null);

    try {
      const response = await fetch('/api/verify-face', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selfieBase64: selfieDataUrl,
          idPhotoBase64: idPhotoDataUrl || undefined,
          captureSource,
        }),
      });

      const data = (await response.json()) as VerifyApiResponse;

      if (!response.ok) {
        setApiError(data.error ?? 'Face verification request failed.');
        return;
      }

      setResult(data);

      if (data.verified) {
        onVerified({
          avatarUrl: selfieDataUrl,
          confidenceScore: data.confidenceScore,
          summary: data.summary,
          checks: {
            singleFaceDetected: data.singleFaceDetected,
            clearUnobstructedFace: data.clearUnobstructedFace,
            antiSpoofPassed: data.antiSpoofPassed,
            idFaceMatch: data.idFaceMatch,
            idCompared: data.idCompared,
            captureSource: data.captureSource,
            verifiedAt: new Date().toISOString(),
          },
        });
      }
    } catch {
      setApiError(
        'Could not reach the verification service. Please check your connection and try again.'
      );
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Existing Verified Banner if already passed */}
      {isFaceVerified && !result && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-[#0F5C4D]/5 border border-[#0F5C4D]/25">
          <CheckCircle2 className="w-5 h-5 text-[#0F5C4D] shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-[#14191F] flex-1">
            <div className="font-semibold flex items-center justify-between gap-2">
              <span>Face Recognition Passed</span>
              {typeof existingConfidence === 'number' && (
                <span className="font-mono text-xs text-[#0F5C4D] tabular-nums">
                  {existingConfidence}% confidence
                </span>
              )}
            </div>
            <p className="text-xs text-[#5A6270] mt-0.5">
              {existingChecks?.idCompared
                ? 'Live face liveness, anti-spoof, and photo ID match confirmed.'
                : 'Single live human face and anti-spoof checks confirmed.'}
            </p>
          </div>
        </div>
      )}

      {/* Camera / Selfie Preview Area */}
      <div className="border border-stone-200 rounded-xl p-4 bg-stone-50/50 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ScanFace className="w-4 h-4 text-[#0F5C4D]" />
            <span className="text-sm font-semibold text-[#14191F]">
              Step 1: Live Face Scan
            </span>
          </div>
          {selfieDataUrl && !cameraActive && (
            <button
              type="button"
              onClick={() => {
                setSelfieDataUrl('');
                setResult(null);
                handleStartCamera();
              }}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0F5C4D] hover:underline underline-offset-4 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retake
            </button>
          )}
        </div>

        {/* Live Video Stream */}
        {cameraActive && (
          <div className="space-y-3">
            <div className="relative w-full aspect-video max-h-64 bg-stone-900 rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
              {/* Subtle face alignment guide */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 flex items-center justify-center"
              >
                <div className="w-36 h-44 rounded-full border-2 border-dashed border-white/80" />
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-[#5A6270]">
                Center your face inside the oval with even lighting.
              </p>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-3 py-2 text-xs font-medium text-[#5A6270] hover:text-[#14191F] border border-stone-200 bg-white rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCaptureFrame}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#0F5C4D] text-white rounded-lg hover:bg-[#0B473B] transition-colors cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Capture Live Selfie
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Captured / Uploaded Selfie Preview */}
        {!cameraActive && selfieDataUrl && (
          <div className="flex items-center gap-4">
            <img
              src={selfieDataUrl}
              alt="Captured face verification preview"
              className="w-20 h-20 rounded-lg object-cover border border-stone-200 bg-white shrink-0"
            />
            <div className="text-xs text-[#5A6270] space-y-1">
              <div className="font-medium text-[#14191F]">
                {captureSource === 'camera'
                  ? 'Live webcam photo ready'
                  : 'Uploaded selfie photo ready'}
              </div>
              <p>
                This photo will be checked for single-face liveness and anti-spoofing
                {idPhotoDataUrl ? ', and compared against your ID photo.' : '.'}
              </p>
            </div>
          </div>
        )}

        {/* Initial Capture Controls */}
        {!cameraActive && !selfieDataUrl && (
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleStartCamera}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium bg-[#14191F] text-white rounded-lg hover:bg-[#262E38] transition-colors cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              Open Camera for Face Scan
            </button>

            <label className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium bg-white border border-stone-300 text-[#14191F] rounded-lg hover:border-stone-400 transition-colors cursor-pointer">
              <Upload className="w-4 h-4" />
              Upload Selfie Photo
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="user"
                onChange={handleSelfieUpload}
                className="sr-only"
              />
            </label>
          </div>
        )}

        {cameraError && (
          <div className="flex items-start gap-2 text-xs text-[#B45309]">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{cameraError}</span>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Optional ID Photo Comparison */}
      <div className="border border-stone-200 rounded-xl p-4 bg-white space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-[#14191F]">
            Step 2: Student or Govt Photo ID (Recommended)
          </span>
          {idPhotoDataUrl && (
            <button
              type="button"
              onClick={() => {
                setIdPhotoDataUrl('');
                setIdFileName('');
                setResult(null);
              }}
              className="text-xs text-[#5A6270] hover:text-[#14191F] cursor-pointer"
            >
              Remove
            </button>
          )}
        </div>
        <p className="text-xs text-[#5A6270]">
          Upload your student card or photo ID to match your live face against
          your document and block impersonation.
        </p>

        <div className="flex items-center gap-3 pt-1">
          <label className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium border border-stone-300 rounded-lg text-[#14191F] hover:border-[#0F5C4D] transition-colors cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            {idFileName ? 'Change ID Photo' : 'Attach ID Photo'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleIdUpload}
              className="sr-only"
            />
          </label>
          {idFileName && (
            <span className="text-xs text-[#0F5C4D] font-medium truncate max-w-[220px]">
              {idFileName}
            </span>
          )}
        </div>
      </div>

      {/* Run Face Verification CTA */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-[#5A6270]">
          Photos are analyzed solely to verify real identity and prevent fake accounts.
        </p>
        <button
          type="button"
          disabled={!selfieDataUrl || isVerifying}
          onClick={handleRunVerification}
          className="px-4 py-2.5 text-xs sm:text-sm font-semibold bg-[#0F5C4D] text-white rounded-lg hover:bg-[#0B473B] transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed whitespace-nowrap shrink-0"
        >
          {isVerifying ? 'Verifying Face...' : 'Verify My Face'}
        </button>
      </div>

      {/* Verification Error */}
      {apiError && (
        <div className="p-3.5 rounded-lg bg-[#B91C1C]/5 border border-[#B91C1C]/25 flex items-start gap-2.5 text-xs text-[#B91C1C]">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{apiError}</span>
        </div>
      )}

      {/* Verification Result Breakdown */}
      {result && (
        <div
          className={`p-4 rounded-lg border space-y-2.5 ${
            result.verified
              ? 'bg-[#0F5C4D]/5 border-[#0F5C4D]/25'
              : 'bg-[#B91C1C]/5 border-[#B91C1C]/25'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span
              className={`text-sm font-semibold ${
                result.verified ? 'text-[#0F5C4D]' : 'text-[#B91C1C]'
              }`}
            >
              {result.verified
                ? 'Face Recognition Verified'
                : 'Verification Needs Attention'}
            </span>
            <span className="font-mono text-xs font-semibold tabular-nums text-[#14191F]">
              {result.confidenceScore}% match confidence
            </span>
          </div>

          <p className="text-xs text-[#3F4752]">
            {result.verified ? result.summary : result.rejectionReason || result.summary}
          </p>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 pt-2 border-t border-stone-200/70 text-xs">
            <div className="flex justify-between">
              <dt className="text-[#5A6270]">Single face</dt>
              <dd className="font-medium text-[#14191F]">
                {result.singleFaceDetected ? 'Passed' : 'Failed'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#5A6270]">Unobstructed</dt>
              <dd className="font-medium text-[#14191F]">
                {result.clearUnobstructedFace ? 'Passed' : 'Failed'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#5A6270]">Liveness / Anti-spoof</dt>
              <dd className="font-medium text-[#14191F]">
                {result.antiSpoofPassed ? 'Passed' : 'Failed'}
              </dd>
            </div>
            {result.idCompared && (
              <div className="flex justify-between">
                <dt className="text-[#5A6270]">ID face match</dt>
                <dd className="font-medium text-[#14191F]">
                  {result.idFaceMatch ? 'Matched' : 'Mismatch'}
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}
