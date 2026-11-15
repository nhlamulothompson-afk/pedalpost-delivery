import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, Camera, CheckCircle, RefreshCw, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface DeliveryPhotoModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (photoUrl: string | null) => void;
  isSubmitting: boolean;
}

type Step = "preview" | "capture" | "confirm";

export function DeliveryPhotoModal({
  open,
  onClose,
  onConfirm,
  isSubmitting,
}: DeliveryPhotoModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [step, setStep] = useState<Step>("preview");
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) track.stop();
      streamRef.current = null;
    }
    setCameraReady(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setCameraReady(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setCameraReady(true);
      }
    } catch {
      setCameraError(
        "Camera access denied. You can skip and confirm without a photo.",
      );
    }
  }, []);

  useEffect(() => {
    if (open && step === "capture") {
      startCamera();
    }
    return () => {
      if (!open) stopStream();
    };
  }, [open, step, startCamera, stopStream]);

  const handleStartCapture = () => {
    setStep("capture");
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setCapturedUrl(dataUrl);
    stopStream();
    setStep("confirm");
  };

  const handleRetake = () => {
    setCapturedUrl(null);
    setStep("capture");
  };

  const handleConfirm = () => {
    onConfirm(capturedUrl);
  };

  const handleSkip = () => {
    toast.warning(
      "Confirming delivery without photo proof. Customer may dispute this.",
    );
    onConfirm(null);
  };

  const handleClose = () => {
    stopStream();
    setCapturedUrl(null);
    setStep("preview");
    setCameraError(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent
        className="max-w-sm p-0 overflow-hidden"
        data-ocid="delivery_photo.dialog"
      >
        <DialogHeader className="px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Camera className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="font-display text-lg">
              {step === "confirm" ? "Confirm Photo" : "Photo Proof of Delivery"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            {step === "preview" &&
              "Take a photo of the delivered package to protect both you and the customer."}
            {step === "capture" &&
              "Position the camera over the package and delivered location."}
            {step === "confirm" &&
              "Does this photo clearly show the delivery? Confirm to complete the order."}
          </DialogDescription>
        </DialogHeader>

        {/* Preview step */}
        {step === "preview" && (
          <div className="px-5 pb-5 flex flex-col gap-3">
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 flex gap-3 items-start">
              <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div className="text-sm text-foreground">
                <p className="font-semibold mb-1">Why take a photo?</p>
                <ul className="text-muted-foreground space-y-0.5 list-none">
                  <li>• Proves successful delivery</li>
                  <li>• Protects you from disputes</li>
                  <li>• Builds customer trust</li>
                </ul>
              </div>
            </div>
            <Button
              className="w-full gap-2"
              onClick={handleStartCapture}
              data-ocid="delivery_photo.open_camera_button"
            >
              <Camera className="h-4 w-4" />
              Open Camera
            </Button>
            <Button
              variant="ghost"
              className="w-full text-muted-foreground text-sm"
              onClick={handleSkip}
              data-ocid="delivery_photo.skip_button"
            >
              Skip (no photo)
            </Button>
          </div>
        )}

        {/* Capture step */}
        {step === "capture" && (
          <div className="flex flex-col">
            <div
              className="relative bg-foreground/5 overflow-hidden"
              style={{ minHeight: 260 }}
            >
              {/* biome-ignore lint/a11y/useMediaCaption: live camera preview */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full object-cover"
                style={{ maxHeight: 300 }}
              />
              {!cameraReady && !cameraError && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/60">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground text-sm">
                    <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                    <span>Starting camera…</span>
                  </div>
                </div>
              )}
              {/* Viewfinder guides */}
              {cameraReady && (
                <div className="absolute inset-4 border-2 border-primary/50 rounded-lg pointer-events-none" />
              )}
            </div>

            {cameraError ? (
              <div className="px-5 pb-5 pt-4 flex flex-col gap-3">
                <div className="flex items-start gap-3 rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                  <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                  <p className="text-sm text-destructive">{cameraError}</p>
                </div>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={startCamera}
                  data-ocid="delivery_photo.retry_camera_button"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-muted-foreground text-sm"
                  onClick={handleSkip}
                  data-ocid="delivery_photo.skip_no_camera_button"
                >
                  Skip (confirm without photo)
                </Button>
              </div>
            ) : (
              <div className="px-5 pb-5 pt-4 flex gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  onClick={handleClose}
                  data-ocid="delivery_photo.cancel_button"
                  aria-label="Cancel"
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  className="flex-1 gap-2"
                  onClick={handleCapture}
                  disabled={!cameraReady}
                  data-ocid="delivery_photo.capture_button"
                >
                  <Camera className="h-4 w-4" />
                  Capture Photo
                </Button>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        {/* Confirm step */}
        {step === "confirm" && capturedUrl && (
          <div className="flex flex-col">
            <div className="photo-proof-overlay mx-5 rounded-xl overflow-hidden">
              <img
                src={capturedUrl}
                alt="Delivery proof"
                className="photo-proof-image w-full object-cover rounded-xl"
                style={{ maxHeight: 260 }}
              />
              <div className="photo-proof-badge">
                <CheckCircle className="h-3 w-3 inline mr-1" />
                Proof
              </div>
            </div>

            <div className="px-5 pb-5 pt-4 flex gap-3">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={handleRetake}
                disabled={isSubmitting}
                data-ocid="delivery_photo.retake_button"
              >
                <RefreshCw className="h-4 w-4" />
                Retake
              </Button>
              <Button
                className="flex-1 gap-2 bg-primary hover:bg-primary/90"
                onClick={handleConfirm}
                disabled={isSubmitting}
                data-ocid="delivery_photo.confirm_button"
              >
                <CheckCircle className="h-4 w-4" />
                {isSubmitting ? "Submitting…" : "Confirm Delivery"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
