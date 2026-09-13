import prisma from "../../config/prisma.js";

// =============================
// DEFAULT LANDING DATA
// =============================

const defaultLandingData = {
  logoText: "ERP",
  logoHighlight: "Cloud",
  loginText: "Login →",

  heroTag: "CLOUD ERP PLATFORM",
  heroTitle: "Transform Your Business With ERP",
  heroDescription:
    "A powerful cloud-based ERP platform that helps businesses manage inventory, billing, accounting, warehouses and analytics.",
  heroImage: "",
  heroBackgroundImage: "",
  heroButtonText: "Upgrade Your Company In Minutes",

  dashboardTitle: "ERP Dashboard",
  dashboardSubtitle: "Business Overview",

  aboutTag: "ABOUT ERP CLOUD",
  aboutTitle: "One Platform. Complete Business Control.",
  aboutDescription:
    "ERP Cloud helps retailers and businesses manage everything from one intelligent system.",

  aboutImage1: "",
  aboutImage2: "",
  aboutImage3: "",
  aboutImage4: "",

  footerText: "© ERP Cloud. All Rights Reserved.",
};


// =============================
// GET LANDING PAGE
// =============================

export const getLandingPage = async (req, res) => {
  try {
    let landing = await prisma.landingPage.findFirst();

    // Create default record if database is empty
    if (!landing) {
      landing = await prisma.landingPage.create({
        data: defaultLandingData,
      });
    }

    res.status(200).json({
      success: true,
      data: landing,
    });
  } catch (error) {
    console.error("Get Landing Page Error:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Failed to load landing page.",
    });
  }
};


// =============================
// UPDATE LANDING PAGE
// =============================

export const updateLandingPage = async (req, res) => {
  try {
    let landing = await prisma.landingPage.findFirst();

    // Create record if it doesn't exist
    if (!landing) {
      landing = await prisma.landingPage.create({
        data: defaultLandingData,
      });
    }

    const data = {};

    // =============================
    // NAVBAR
    // =============================

    if (req.body.logoText !== undefined) {
      data.logoText = req.body.logoText;
    }

    if (req.body.logoHighlight !== undefined) {
      data.logoHighlight = req.body.logoHighlight;
    }

    if (req.body.loginText !== undefined) {
      data.loginText = req.body.loginText;
    }


    // =============================
    // HERO
    // =============================

    if (req.body.heroTag !== undefined) {
      data.heroTag = req.body.heroTag;
    }

    if (req.body.heroTitle !== undefined) {
      data.heroTitle = req.body.heroTitle;
    }

    if (req.body.heroDescription !== undefined) {
      data.heroDescription = req.body.heroDescription;
    }

    if (req.body.heroButtonText !== undefined) {
      data.heroButtonText = req.body.heroButtonText;
    }


    // =============================
    // DASHBOARD
    // =============================

    if (req.body.dashboardTitle !== undefined) {
      data.dashboardTitle = req.body.dashboardTitle;
    }

    if (req.body.dashboardSubtitle !== undefined) {
      data.dashboardSubtitle = req.body.dashboardSubtitle;
    }


    // =============================
    // ABOUT
    // =============================

    if (req.body.aboutTag !== undefined) {
      data.aboutTag = req.body.aboutTag;
    }

    if (req.body.aboutTitle !== undefined) {
      data.aboutTitle = req.body.aboutTitle;
    }

    if (req.body.aboutDescription !== undefined) {
      data.aboutDescription = req.body.aboutDescription;
    }


    // =============================
    // HERO IMAGE
    // =============================

    if (req.files?.heroImage?.[0]) {
      data.heroImage = req.files.heroImage[0].filename;
    }

    // =============================
    // HERO BACKGROUND IMAGE
    // =============================

    if (req.files?.heroBackgroundImage?.[0]) {
      data.heroBackgroundImage =
        req.files.heroBackgroundImage[0].filename;
    }


    // =============================
    // ABOUT IMAGES
    // =============================

    if (req.files?.aboutImage1?.[0]) {
      data.aboutImage1 = req.files.aboutImage1[0].filename;
    }

    if (req.files?.aboutImage2?.[0]) {
      data.aboutImage2 = req.files.aboutImage2[0].filename;
    }

    if (req.files?.aboutImage3?.[0]) {
      data.aboutImage3 = req.files.aboutImage3[0].filename;
    }

    if (req.files?.aboutImage4?.[0]) {
      data.aboutImage4 = req.files.aboutImage4[0].filename;
    }


    // =============================
    // FOOTER
    // =============================

    if (req.body.footerText !== undefined) {
      data.footerText = req.body.footerText;
    }


    // =============================
    // UPDATE DATABASE
    // =============================

    const updatedLanding = await prisma.landingPage.update({
      where: {
        id: landing.id,
      },
      data,
    });

    res.status(200).json({
      success: true,
      message: "Landing page updated successfully.",
      data: updatedLanding,
    });

  } catch (error) {
    console.error("Update Landing Page Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update landing page.",
    });
  }
};