"use client";

import { useEffect, useState } from "react";
import styles from "./landing.module.css";
import { getLandingPage } from "@/services/landing.service";
import { useRouter } from "next/navigation";

export default function Home() {
  const [landing, setLanding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const router = useRouter();

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    async function loadLanding() {
      try {
        setLoading(true);
        setError("");

        const data = await getLandingPage();

        setLanding(data);
      } catch (error) {
        console.error("Landing page error:", error);
        setError("Unable to load the landing page.");
      } finally {
        setLoading(false);
      }
    }

    loadLanding();
  }, []);

  // ============================
  // LOADING
  // ============================

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingContent}>
          <div className={styles.loadingLogo}>
            ERP<span>Cloud</span>
          </div>

          <div className={styles.loader}></div>

          <p className={styles.loadingText}>
            Loading your business platform...
          </p>
        </div>
      </div>
    );
  }

  // ============================
  // ERROR
  // ============================

  if (error || !landing) {
    return (
      <div className={styles.errorScreen}>
        <div className={styles.errorCard}>
          <div className={styles.errorIcon}>!</div>

          <h2>Something went wrong</h2>

          <p>
            {error || "Landing page data could not be loaded."}
          </p>

          <button
            className={styles.retryBtn}
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ============================
  // IMAGE URL HELPER
  // ============================

  const getImageUrl = (image) => {
    if (!image) return "";

    return `${API_URL}/uploads/landingpageimage/${image}`;
  };

  // ============================
  // HERO BACKGROUND
  // ============================

  const heroBackground = landing.heroBackgroundImage
    ? `
      linear-gradient(
        rgba(248, 246, 252, 0.82),
        rgba(248, 246, 252, 0.88)
      ),
      url("${getImageUrl(landing.heroBackgroundImage)}")
    `
    : "linear-gradient(135deg, #f8f6fc, #eeeaf7)";

  return (
    <>
      {/* =========================
          NAVBAR
      ========================= */}

      <nav className={styles.navbar}>
        <div className={styles.logo}>
          {landing.logoText}
          <span>{landing.logoHighlight}</span>
        </div>

        <button
          className={styles.loginBtn}
          onClick={() => router.push("/auth/login")}
        >
          {landing.loginText} 
        </button>
      </nav>

      {/* =========================
          HERO
      ========================= */}

      <section
        className={styles.hero}
        id="home"
        style={{
          backgroundImage: heroBackground,
        }}
      >
        <div className={styles.blurOne}></div>
        <div className={styles.blurTwo}></div>

        <div className={styles.heroContent}>
          <span className={styles.heroTag}>
            {landing.heroTag}
          </span>

          <h1 className={styles.heroTitle}>
            {landing.heroTitle}
          </h1>

          <p className={styles.heroDescription}>
            {landing.heroDescription}
          </p>

          {/* NORMAL CTA TEXT - NOT A BUTTON */}

          <p className={styles.heroCta}>
            {landing.heroButtonText} →
          </p>
        </div>
      </section>

      {/* =========================
          FOOTER
      ========================= */}

      <footer className={styles.footer}>
        <p>{landing.footerText}</p>
      </footer>
    </>
  );
}