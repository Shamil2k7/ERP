"use client";

import { useEffect, useRef, useState } from "react";
import {
  IconSearch,
  IconBarcode,
  IconChevronDown,
  IconGrid,
} from "./icons";
import { BrowserMultiFormatReader } from "@zxing/browser";
import Swal from "@/utils/swal";

export default function PosToolbar({
  query = "",
  onQueryChange,
  onScan,
  onBarcodeScan,
  selectedCategory = "All",
  onCategoryChange,
  selectedBrand = "All",
  onBrandChange,
  categories = [],
  brands = [],
  activeTab = "Products",
  onTabChange,
}) {
  const triggerScan = onScan || onBarcodeScan;
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const [isStarting, setIsStarting] = useState(false);

  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const controlsRef = useRef(null);
  const streamRef = useRef(null);
  const scannedRef = useRef(false);

  /*
   * Stop camera and barcode reader
   */
  const stopScanner = () => {
    try {
      controlsRef.current?.stop();
    } catch (error) {
      console.error("Scanner stop error:", error);
    }

    controlsRef.current = null;

    try {
      readerRef.current?.reset();
    } catch (error) {
      // Ignore reset errors
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  /*
   * Close scanner
   */
  const closeScanner = () => {
    stopScanner();

    scannedRef.current = false;
    setScannerError("");
    setIsStarting(false);
    setScannerOpen(false);
  };

  /*
   * Start scanner
   */
  useEffect(() => {
    if (!scannerOpen) return;

    let mounted = true;

    const startScanner = async () => {
      setIsStarting(true);
      setScannerError("");
      scannedRef.current = false;

      try {
        if (!videoRef.current) {
          throw new Error("Camera element not ready");
        }

        /*
         * Check browser support
         */
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error(
            "Camera is not supported by this browser."
          );
        }

        /*
         * Request camera permission first.
         * This also allows us to select the rear camera.
         */
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: {
              ideal: "environment",
            },
          },
          audio: false,
        });

        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        /*
         * Attach camera stream to video
         */
        videoRef.current.srcObject = stream;

        await videoRef.current.play();

        /*
         * Create ZXing reader
         */
        const reader = new BrowserMultiFormatReader();

        readerRef.current = reader;

        /*
         * Decode barcode
         */
        const controls = await reader.decodeFromVideoElement(
          videoRef.current,
          (result, error) => {
            if (!mounted) return;

            if (result && !scannedRef.current) {
              scannedRef.current = true;

              const barcode = result.getText()?.trim();

              if (!barcode) {
                scannedRef.current = false;
                return;
              }

              /*
               * Send barcode to parent POS component
               */
              triggerScan?.(barcode);

              /*
               * Close scanner after successful scan
               */
              setTimeout(() => {
                if (mounted) {
                  closeScanner();
                }
              }, 200);
            }

            /*
             * ZXing continuously reports decode errors
             * while searching for a barcode.
             *
             * Don't show those as UI errors.
             */
          }
        );

        if (mounted) {
          controlsRef.current = controls;
          setIsStarting(false);
        }
      } catch (error) {
        console.error("Barcode scanner error:", error);

        if (!mounted) return;

        setIsStarting(false);

        let message = "Unable to start camera.";

        if (error?.name === "NotAllowedError") {
          message =
            "Camera permission was denied. Please allow camera access and try again.";
        } else if (error?.name === "NotFoundError") {
          message =
            "No camera was found on this device.";
        } else if (error?.name === "NotReadableError") {
          message =
            "Camera is already being used by another application.";
        } else if (error?.message) {
          message = error.message;
        }

        setScannerError(message);
      }
    };

    startScanner();

    return () => {
      mounted = false;
      stopScanner();
    };

    // We intentionally start only when scannerOpen changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scannerOpen]);

  /*
   * Open scanner
   */
  const handleOpenScanner = () => {
    setScannerError("");
    setScannerOpen(true);
  };

  /*
   * Handle manual barcode entry
   */
  const handleManualScan = async () => {
    const { value: code, isConfirmed } = await Swal.fire({
      title: "Barcode Entry",
      input: "text",
      inputLabel: "Enter barcode / SKU:",
      inputPlaceholder: "Scan or type barcode...",
      showCancelButton: true,
      confirmButtonText: "Scan Barcode",
    });

    if (!isConfirmed || !code) return;

    const cleanedCode = code.trim();

    if (!cleanedCode) return;

    triggerScan?.(cleanedCode);
  };

  return (
    <>
      <div className="pos-left-header">
        {/* ================================
            TOP NAVIGATION TABS
        ================================= */}

        <div className="pos-nav-tabs">
          {["Products", "Recent", "Drafts & Holds"].map((tab) => (
            <button
              key={tab}
              type="button"
              className={`pos-nav-tab-btn ${
                activeTab === tab ? "active" : ""
              }`}
              onClick={() => onTabChange?.(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ================================
            SEARCH + BARCODE
        ================================= */}

        <div className="pos-search-bar-row">
          <div className="pos-search-input-wrapper">
            <IconSearch className="pos-search-icon" />

            <input
              type="text"
              className="pos-search-input"
              placeholder="Search product by name, SKU or scan barcode"
              value={query}
              onChange={(e) => onQueryChange?.(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const code = query.trim();
                  if (code) {
                    triggerScan?.(code);
                    onQueryChange?.("");
                  }
                }
              }}
              autoComplete="off"
            />

            {/* Camera Barcode Button */}
            <button
              type="button"
              className="pos-barcode-btn"
              title="Scan Barcode with Camera"
              aria-label="Scan Barcode with Camera"
              onClick={handleOpenScanner}
            >
              <IconBarcode />
            </button>

            {/* Manual barcode button */}
            <button
              type="button"
              className="pos-manual-barcode-btn"
              title="Enter Barcode Manually"
              aria-label="Enter Barcode Manually"
              onClick={handleManualScan}
            >
              #
            </button>
          </div>
        </div>

        {/* ================================
            FILTERS
        ================================= */}

        <div className="pos-filters-row">
          {/* Category */}
          <div className="pos-select-wrapper">
            <select
              className="pos-filter-select"
              value={selectedCategory}
              onChange={(e) =>
                onCategoryChange?.(e.target.value)
              }
            >
              <option value="All">All Categories</option>

              {categories
                .filter((cat) => {
                  const cName = typeof cat === "object" ? cat.name : cat;
                  return cName && cName !== "All";
                })
                .map((cat) => {
                  const cName = typeof cat === "object" ? cat.name : cat;
                  const cKey = typeof cat === "object" ? (cat.id || cName) : cat;
                  return (
                    <option key={cKey} value={cName}>
                      {cName}
                    </option>
                  );
                })}
            </select>

            <IconChevronDown className="pos-select-arrow" />
          </div>

          {/* Brand */}
          <div className="pos-select-wrapper">
            <select
              className="pos-filter-select"
              value={selectedBrand}
              onChange={(e) =>
                onBrandChange?.(e.target.value)
              }
            >
              <option value="All">All Brands</option>

              {brands
                .filter((brand) => {
                  const bName = typeof brand === "object" ? (brand.name || brand.brandName) : brand;
                  return bName && bName !== "All";
                })
                .map((brand) => {
                  const bName = typeof brand === "object" ? (brand.name || brand.brandName) : brand;
                  const bKey = typeof brand === "object" ? (brand.id || bName) : brand;
                  return (
                    <option key={bKey} value={bName}>
                      {bName}
                    </option>
                  );
                })}
            </select>

            <IconChevronDown className="pos-select-arrow" />
          </div>
        </div>
      </div>

      {/* ==================================================
          BARCODE SCANNER MODAL
      ================================================== */}

      {scannerOpen && (
        <div
          className="barcode-scanner-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Barcode Scanner"
        >
          <div className="barcode-scanner-modal">
            {/* Header */}
            <div className="barcode-scanner-header">
              <div>
                <h3>Scan Barcode</h3>

                <p>
                  Point your camera at the product barcode
                </p>
              </div>

              <button
                type="button"
                className="barcode-close-btn"
                onClick={closeScanner}
                aria-label="Close scanner"
              >
                ×
              </button>
            </div>

            {/* Camera */}
            <div className="barcode-camera-container">
              <video
                ref={videoRef}
                className="barcode-camera-video"
                autoPlay
                muted
                playsInline
              />

              {/* Scanner frame */}
              <div className="barcode-scanner-frame">
                <span className="corner top-left" />
                <span className="corner top-right" />
                <span className="corner bottom-left" />
                <span className="corner bottom-right" />

                <div className="barcode-scan-line" />
              </div>

              {/* Loading */}
              {isStarting && (
                <div className="barcode-camera-loading">
                  <div className="barcode-spinner" />

                  <span>
                    Starting camera...
                  </span>
                </div>
              )}

              {/* Camera error */}
              {scannerError && (
                <div className="barcode-camera-error">
                  <div className="barcode-error-icon">
                    !
                  </div>

                  <p>{scannerError}</p>

                  <button
                    type="button"
                    onClick={() => {
                      stopScanner();
                      setScannerError("");
                      setScannerOpen(false);

                      setTimeout(() => {
                        setScannerOpen(true);
                      }, 100);
                    }}
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="barcode-scanner-footer">
              <div className="barcode-scan-info">
                <IconBarcode width={22} height={22} />

                <div>
                  <strong>
                    Scan a product barcode
                  </strong>

                  <span>
                    Keep the barcode inside the frame
                  </span>
                </div>
              </div>

              <div className="barcode-scanner-actions">
                <button
                  type="button"
                  className="barcode-manual-btn"
                  onClick={handleManualScan}
                >
                  Enter Manually
                </button>

                <button
                  type="button"
                  className="barcode-cancel-btn"
                  onClick={closeScanner}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}