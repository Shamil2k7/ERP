import prisma from "../../config/prisma.js";

export const getLandingPageRepo = async () => {
  return await prisma.landingPage.findFirst();
};

export const createLandingPageRepo = async (data) => {
  return await prisma.landingPage.create({ data });
};

export const updateLandingPageRepo = async (id, data) => {
  return await prisma.landingPage.update({
    where: { id },
    data,
  });
};
