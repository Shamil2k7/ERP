"use client";

import { useEffect, useState } from "react";

import {
  getLandingPage,
  updateLandingPage,
} from "@/services/landingAdmin.service";

import styles from "./landing.module.css";
import { useAlert } from "@/context/AlertContext";

export default function LandingAdminPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const { showSuccess, showError } = useAlert();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ============================
  // Text Fields
  // ============================

  const [form, setForm] = useState({
    logoText: "",
    logoHighlight: "",
    loginText: "",

    heroTag: "",
    heroTitle: "",
    heroDescription: "",
    heroButtonText: "",

    dashboardTitle: "",
    dashboardSubtitle: "",

    aboutTag: "",
    aboutTitle: "",
    aboutDescription: "",

    footerText: "",
  });

  // ============================
  // Image Files
  // ============================

  const [files, setFiles] = useState({
    heroImage: null,
    heroBackgroundImage: null,
    aboutImage1: null,
    aboutImage2: null,
    aboutImage3: null,
    aboutImage4: null,
  });

  // ============================
  // Image Preview
  // ============================

  const [preview, setPreview] = useState({
    heroImage: "",
    heroBackgroundImage: "",
    aboutImage1: "",
    aboutImage2: "",
    aboutImage3: "",
    aboutImage4: "",
  });

  // ============================
  // Load Landing Data
  // ============================

  useEffect(() => {
    loadLanding();
  }, []);

  async function loadLanding() {
    try {
      setLoading(true);

      const data = await getLandingPage();

      // ============================
      // Text Data
      // ============================

      setForm({
        logoText: data.logoText || "",
        logoHighlight: data.logoHighlight || "",
        loginText: data.loginText || "",

        heroTag: data.heroTag || "",
        heroTitle: data.heroTitle || "",
        heroDescription: data.heroDescription || "",
        heroButtonText: data.heroButtonText || "",

        dashboardTitle: data.dashboardTitle || "",
        dashboardSubtitle: data.dashboardSubtitle || "",

        aboutTag: data.aboutTag || "",
        aboutTitle: data.aboutTitle || "",
        aboutDescription: data.aboutDescription || "",

        footerText: data.footerText || "",
      });

      // ============================
      // Image Previews
      // ============================

      setPreview({
        heroImage: data.heroImage
          ? `${API_URL}/uploads/landingpageimage/${data.heroImage}`
          : "",

        heroBackgroundImage: data.heroBackgroundImage
          ? `${API_URL}/uploads/landingpageimage/${data.heroBackgroundImage}`
          : "",

        aboutImage1: data.aboutImage1
          ? `${API_URL}/uploads/landingpageimage/${data.aboutImage1}`
          : "",

        aboutImage2: data.aboutImage2
          ? `${API_URL}/uploads/landingpageimage/${data.aboutImage2}`
          : "",

        aboutImage3: data.aboutImage3
          ? `${API_URL}/uploads/landingpageimage/${data.aboutImage3}`
          : "",

        aboutImage4: data.aboutImage4
          ? `${API_URL}/uploads/landingpageimage/${data.aboutImage4}`
          : "",
      });
    } catch (error) {
      console.error("Load landing error:", error);
    } finally {
      setLoading(false);
    }
  }

  // ============================
  // Text Change
  // ============================

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // ============================
  // Image Change
  // ============================

  function handleImage(e) {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    const name = e.target.name;

    setFiles((previous) => ({
      ...previous,
      [name]: file,
    }));

    setPreview((previous) => ({
      ...previous,
      [name]: URL.createObjectURL(file),
    }));
  }

  // ============================
  // Save
  // ============================

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setSaving(true);

      const formData = new FormData();

      // ============================
      // Navbar
      // ============================

      formData.append("logoText", form.logoText);
      formData.append("logoHighlight", form.logoHighlight);
      formData.append("loginText", form.loginText);

      // ============================
      // Hero
      // ============================

      formData.append("heroTag", form.heroTag);
      formData.append("heroTitle", form.heroTitle);
      formData.append("heroDescription", form.heroDescription);
      formData.append("heroButtonText", form.heroButtonText);

      // ============================
      // Dashboard
      // ============================

      formData.append("dashboardTitle", form.dashboardTitle);
      formData.append("dashboardSubtitle", form.dashboardSubtitle);

      // ============================
      // About
      // ============================

      formData.append("aboutTag", form.aboutTag);
      formData.append("aboutTitle", form.aboutTitle);
      formData.append("aboutDescription", form.aboutDescription);

      // ============================
      // Footer
      // ============================

      formData.append("footerText", form.footerText);

      // ============================
      // Images
      // ============================

      if (files.heroImage) {
        formData.append("heroImage", files.heroImage);
      }

      if (files.heroBackgroundImage) {
        formData.append(
          "heroBackgroundImage",
          files.heroBackgroundImage
        );
      }

      if (files.aboutImage1) {
        formData.append("aboutImage1", files.aboutImage1);
      }

      if (files.aboutImage2) {
        formData.append("aboutImage2", files.aboutImage2);
      }

      if (files.aboutImage3) {
        formData.append("aboutImage3", files.aboutImage3);
      }

      if (files.aboutImage4) {
        formData.append("aboutImage4", files.aboutImage4);
      }

      // ============================
      // API Update
      // ============================

      await updateLandingPage(formData);
      showSuccess("Product updated", "Landing page settings updated successfully.");

      // Reload latest database data
      await loadLanding();

      // Clear selected files
      setFiles({
        heroImage: null,
        heroBackgroundImage: null,
        aboutImage1: null,
        aboutImage2: null,
        aboutImage3: null,
        aboutImage4: null,
      });
    } catch (error) {
      console.error("Update landing error:", error);
      showError("Invalid form data", error.message || "Landing page update failed.");
    } finally {
      setSaving(false);
    }
  }

  // ============================
  // Loading
  // ============================

  if (loading) {
    return (
      <div className={styles.loading}>
        Loading...
      </div>
    );
  }

  // ============================
  // Page
  // ============================

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        Landing Page Management
      </h1>

      <form onSubmit={handleSubmit}>

        {/* =====================================================
            NAVBAR
        ===================================================== */}

        <section className={styles.section}>
          <h2>Navbar</h2>

          <div className={styles.formGroup}>
            <label>Logo Text</label>

            <input
              type="text"
              name="logoText"
              value={form.logoText}
              onChange={handleChange}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Logo Highlight</label>

            <input
              type="text"
              name="logoHighlight"
              value={form.logoHighlight}
              onChange={handleChange}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Login Button Text</label>

            <input
              type="text"
              name="loginText"
              value={form.loginText}
              onChange={handleChange}
            />
          </div>
        </section>

        {/* =====================================================
            HERO
        ===================================================== */}

        <section className={styles.section}>
          <h2>Hero Section</h2>

          {/* Hero Tag */}

          <div className={styles.formGroup}>
            <label>Hero Tag</label>

            <input
              type="text"
              name="heroTag"
              value={form.heroTag}
              onChange={handleChange}
            />
          </div>

          {/* Hero Title */}

          <div className={styles.formGroup}>
            <label>Hero Title</label>

            <input
              type="text"
              name="heroTitle"
              value={form.heroTitle}
              onChange={handleChange}
              required
            />
          </div>

          {/* Hero Description */}

          <div className={styles.formGroup}>
            <label>Hero Description</label>

            <textarea
              name="heroDescription"
              rows="5"
              value={form.heroDescription}
              onChange={handleChange}
              required
            />
          </div>

          {/* Hero Button */}

          <div className={styles.formGroup}>
            <label>Hero Button Text</label>

            <input
              type="text"
              name="heroButtonText"
              value={form.heroButtonText}
              onChange={handleChange}
            />
          </div>

          {/* Hero Image */}

          <div className={styles.formGroup}>
            <label>Hero Dashboard Image</label>

            <input
              type="file"
              name="heroImage"
              accept="image/*"
              onChange={handleImage}
            />

            {preview.heroImage && (
              <img
                src={preview.heroImage}
                alt="Hero Preview"
                className={styles.preview}
              />
            )}
          </div>

          {/* Hero Background Image */}

          <div className={styles.formGroup}>
            <label>Hero Background Image</label>

            <input
              type="file"
              name="heroBackgroundImage"
              accept="image/*"
              onChange={handleImage}
            />

            {preview.heroBackgroundImage && (
              <img
                src={preview.heroBackgroundImage}
                alt="Hero Background Preview"
                className={styles.preview}
              />
            )}
          </div>

          {/* Dashboard Title */}

          <div className={styles.formGroup}>
            <label>Dashboard Title</label>

            <input
              type="text"
              name="dashboardTitle"
              value={form.dashboardTitle}
              onChange={handleChange}
            />
          </div>

          {/* Dashboard Subtitle */}

          <div className={styles.formGroup}>
            <label>Dashboard Subtitle</label>

            <input
              type="text"
              name="dashboardSubtitle"
              value={form.dashboardSubtitle}
              onChange={handleChange}
            />
          </div>
        </section>

        {/* =====================================================
            ABOUT
        ===================================================== */}

        <section className={styles.section}>
          <h2>About Section</h2>

          {/* About Tag */}

          <div className={styles.formGroup}>
            <label>About Tag</label>

            <input
              type="text"
              name="aboutTag"
              value={form.aboutTag}
              onChange={handleChange}
            />
          </div>

          {/* About Title */}

          <div className={styles.formGroup}>
            <label>About Title</label>

            <input
              type="text"
              name="aboutTitle"
              value={form.aboutTitle}
              onChange={handleChange}
              required
            />
          </div>

          {/* About Description */}

          <div className={styles.formGroup}>
            <label>About Description</label>

            <textarea
              name="aboutDescription"
              rows="5"
              value={form.aboutDescription}
              onChange={handleChange}
              required
            />
          </div>

          {/* About Images */}

          <div className={styles.imageGrid}>

            {/* Image 1 */}

            <div className={styles.imageBox}>
              <label>About Image 1</label>

              <input
                type="file"
                name="aboutImage1"
                accept="image/*"
                onChange={handleImage}
              />

              {preview.aboutImage1 && (
                <img
                  src={preview.aboutImage1}
                  alt="About 1"
                  className={styles.preview}
                />
              )}
            </div>

            {/* Image 2 */}

            <div className={styles.imageBox}>
              <label>About Image 2</label>

              <input
                type="file"
                name="aboutImage2"
                accept="image/*"
                onChange={handleImage}
              />

              {preview.aboutImage2 && (
                <img
                  src={preview.aboutImage2}
                  alt="About 2"
                  className={styles.preview}
                />
              )}
            </div>

            {/* Image 3 */}

            <div className={styles.imageBox}>
              <label>About Image 3</label>

              <input
                type="file"
                name="aboutImage3"
                accept="image/*"
                onChange={handleImage}
              />

              {preview.aboutImage3 && (
                <img
                  src={preview.aboutImage3}
                  alt="About 3"
                  className={styles.preview}
                />
              )}
            </div>

            {/* Image 4 */}

            <div className={styles.imageBox}>
              <label>About Image 4</label>

              <input
                type="file"
                name="aboutImage4"
                accept="image/*"
                onChange={handleImage}
              />

              {preview.aboutImage4 && (
                <img
                  src={preview.aboutImage4}
                  alt="About 4"
                  className={styles.preview}
                />
              )}
            </div>

          </div>
        </section>

        {/* =====================================================
            FOOTER
        ===================================================== */}

        <section className={styles.section}>
          <h2>Footer</h2>

          <div className={styles.formGroup}>
            <label>Footer Text</label>

            <input
              type="text"
              name="footerText"
              value={form.footerText}
              onChange={handleChange}
            />
          </div>
        </section>

        {/* =====================================================
            SAVE
        ===================================================== */}

        <button
          type="submit"
          disabled={saving}
          className={styles.saveBtn}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>

      </form>
    </div>
  );
}