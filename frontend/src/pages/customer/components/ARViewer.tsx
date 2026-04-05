import { useEffect, useRef, useState, useCallback } from "react";
import "@google/model-viewer";
import "./ARViewer.css";
import type { MenuItem } from "../data/menuItems";

// Extend JSX to recognise the <model-viewer> web component
type ModelViewerProps = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLElement> & {
    src?: string;
    ar?: boolean;
    "ar-modes"?: string;
    "ar-scale"?: string;
    "ar-placement"?: string;
    "xr-environment"?: boolean;
    "camera-controls"?: boolean;
    "touch-action"?: string;
    "auto-rotate"?: boolean;
    "auto-rotate-delay"?: string;
    "rotation-per-second"?: string;
    "shadow-intensity"?: string;
    "shadow-softness"?: string;
    "environment-image"?: string;
    exposure?: string;
    loading?: string;
    reveal?: string;
    "interpolation-decay"?: string;
    "camera-orbit"?: string;
    "min-camera-orbit"?: string;
    "max-camera-orbit"?: string;
    "interaction-prompt"?: string;
    "interaction-prompt-threshold"?: string;
  },
  HTMLElement
>;

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": ModelViewerProps;
    }
  }
}

// Target size in meters — the model's largest dimension will be scaled to this.
const TARGET_SIZE_M = 0.3;
const MIN_SCALE = 0.01;
const MAX_SCALE = 100;

const STATUS = {
  LOADING: "loading",
  READY: "ready",
  ERROR: "error",
  AR_ACTIVE: "ar-active",
  CAMERA_DENIED: "camera-denied",
  AR_UNSUPPORTED: "ar-unsupported",
} as const;

type StatusType = (typeof STATUS)[keyof typeof STATUS];

interface ARViewerProps {
  item: MenuItem;
  onClose: () => void;
}

export default function ARViewer({ item, onClose }: ARViewerProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const viewerRef = useRef<any>(null);
  const [status, setStatus] = useState<StatusType>(STATUS.LOADING);
  const [arSupported, setArSupported] = useState(false);
  const [arTracking, setArTracking] = useState<string | null>(null);
  const [placed, setPlaced] = useState(false);

  // ─── Auto-normalize model size on load ───
  const handleLoad = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer) {
      setStatus(STATUS.READY);
      return;
    }

    try {
      const size = viewer.getDimensions();

      if (size && (size.x > 0 || size.y > 0 || size.z > 0)) {
        const maxDim = Math.max(size.x, size.y, size.z);
        const targetSize = item.arScale || TARGET_SIZE_M;
        let scale = targetSize / maxDim;

        scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale));

        viewer.scale = `${scale} ${scale} ${scale}`;

        requestAnimationFrame(() => {
          viewer.updateFraming();
        });
      }
    } catch {
      // getDimensions not available — leave default scale
    }

    setStatus(STATUS.READY);
  }, [item.arScale]);

  const handleError = useCallback(() => setStatus(STATUS.ERROR), []);

  // ─── AR lifecycle events ───
  const handleARStatus = useCallback((e: Event) => {
    const s = (e as CustomEvent).detail.status;
    if (s === "session-started") {
      setStatus(STATUS.AR_ACTIVE);
      setPlaced(false);
      setArTracking(null);
    } else if (s === "object-placed") {
      setPlaced(true);
    } else if (s === "not-presenting") {
      setStatus(STATUS.READY);
      setPlaced(false);
      setArTracking(null);
    } else if (s === "failed") {
      setStatus(STATUS.READY);
    }
  }, []);

  // ─── AR tracking quality (WebXR only) ───
  const handleARTracking = useCallback((e: Event) => {
    setArTracking((e as CustomEvent).detail.status);
  }, []);

  // ─── Setup / teardown ───
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    viewer.addEventListener("load", handleLoad);
    viewer.addEventListener("error", handleError);
    viewer.addEventListener("ar-status", handleARStatus);
    viewer.addEventListener("ar-tracking", handleARTracking);

    const checkAR = async () => {
      await viewer.updateComplete;
      try {
        const supported = await viewer.canActivateAR;
        setArSupported(Boolean(supported));
        if (!supported)
          setStatus((prev: StatusType) =>
            prev === STATUS.LOADING ? STATUS.LOADING : STATUS.AR_UNSUPPORTED
          );
      } catch {
        setArSupported(false);
      }
    };
    checkAR();

    return () => {
      viewer.removeEventListener("load", handleLoad);
      viewer.removeEventListener("error", handleError);
      viewer.removeEventListener("ar-status", handleARStatus);
      viewer.removeEventListener("ar-tracking", handleARTracking);
    };
  }, [handleLoad, handleError, handleARStatus, handleARTracking]);

  // ─── Escape to close ───
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // ─── Lock body scroll ───
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // ─── Camera permission check + AR launch ───
  const launchAR = async () => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    try {
      const permissionStatus = await navigator.permissions?.query({
        name: "camera" as PermissionName,
      });
      if (permissionStatus?.state === "denied") {
        setStatus(STATUS.CAMERA_DENIED);
        return;
      }
    } catch {
      // permissions API not available (iOS Safari)
    }

    viewer.activateAR();
  };

  const isARActive = status === STATUS.AR_ACTIVE;

  return (
    <div className="ar-overlay" onClick={onClose}>
      <div className="ar-modal" onClick={(e) => e.stopPropagation()}>
        {/* ─── Header ─── */}
        <div className="ar-modal-header">
          <div className="ar-item-info">
            <h2>{item.name}</h2>
            <span className="ar-item-price">${item.price.toFixed(2)}</span>
          </div>
          <button className="ar-close-btn" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        {/* ─── 3D / AR Viewer ─── */}
        <div className="ar-viewer-container">
          {status === STATUS.LOADING && (
            <div className="ar-status-overlay">
              <div className="ar-spinner" />
              <p>Loading 3D model...</p>
            </div>
          )}

          {status === STATUS.ERROR && (
            <div className="ar-status-overlay">
              <p className="ar-status-title">Failed to load 3D model</p>
              <p className="ar-status-hint">
                Place your <code>.glb</code> file at: <code>{item.glbUrl}</code>
              </p>
            </div>
          )}

          {status === STATUS.CAMERA_DENIED && (
            <div className="ar-status-overlay">
              <p className="ar-status-title">Camera access denied</p>
              <p className="ar-status-hint">
                Enable camera permission in your browser settings to use AR.
              </p>
              <button
                className="ar-retry-btn"
                onClick={() => setStatus(STATUS.READY)}
              >
                Back to 3D view
              </button>
            </div>
          )}

          <model-viewer
            ref={viewerRef}
            src={item.glbUrl || undefined}
            ar
            ar-modes="scene-viewer webxr quick-look"
            ar-scale="auto"
            ar-placement="floor"
            xr-environment
            camera-controls
            touch-action="pan-y"
            auto-rotate
            auto-rotate-delay="1000"
            rotation-per-second="20deg"
            shadow-intensity="1.2"
            shadow-softness="1"
            environment-image="neutral"
            exposure="1"
            loading="eager"
            reveal="auto"
            interpolation-decay="100"
            camera-orbit="30deg 65deg auto"
            min-camera-orbit="auto auto auto"
            max-camera-orbit="auto auto auto"
            interaction-prompt="auto"
            interaction-prompt-threshold="3000"
            style={{
              width: "100%",
              height: "100%",
              visibility:
                status === STATUS.ERROR || status === STATUS.CAMERA_DENIED
                  ? "hidden"
                  : "visible",
            }}
          >
            {/* Hide model-viewer's built-in AR button — we use our own footer button */}
            <button slot="ar-button" style={{ display: "none" }} />

            <div slot="progress-bar" className="ar-progress-bar">
              <div className="ar-progress-fill" />
            </div>
          </model-viewer>

          {/* WebXR tracking quality indicator */}
          {isARActive && arTracking === "not-tracking" && (
            <div className="ar-tracking-hint">
              Move your phone slowly to detect the surface
            </div>
          )}

          {isARActive && arTracking === "tracking" && !placed && (
            <div className="ar-tracking-hint ar-tracking-good">
              Tap on the table to place {item.name}
            </div>
          )}
        </div>

        {/* ─── Footer ─── */}
        <div className="ar-modal-footer">
          {status === STATUS.CAMERA_DENIED ? (
            <p className="ar-hint-text">
              Camera permission is required. Check your browser or device
              settings.
            </p>
          ) : arSupported ? (
            <button
              className="ar-launch-btn"
              onClick={launchAR}
              disabled={status === STATUS.LOADING}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
              View on Your Table
            </button>
          ) : (
            <div className="ar-footer-info">
              <p className="ar-hint-text">
                Rotate and zoom the 3D model with your fingers.
              </p>
              <p className="ar-hint-sub">
                Open on a mobile device for AR table placement.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
