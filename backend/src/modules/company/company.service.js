import {
  getAllIndustriesRepo,
  findIndustryByCodeRepo,
  getAllModulesRepo,
  getAllCompaniesRepo,
} from "./company.repository.js";
import { DEFAULT_INDUSTRY_MODULES } from "../../config/industries.js";

export const getIndustriesService = async () => {
  const industries = await getAllIndustriesRepo();
  return industries;
};

export const getDefaultModulesForIndustryService = async (industryCode) => {
  const codeUpper = (industryCode || "").toUpperCase();
  const industry = await findIndustryByCodeRepo(codeUpper);

  if (industry && industry.modules && industry.modules.length > 0) {
    return industry.modules
      .filter((im) => im.defaultEnabled)
      .map((im) => im.module);
  }

  // Fallback to default codes from config
  const defaultCodes = DEFAULT_INDUSTRY_MODULES[codeUpper] || DEFAULT_INDUSTRY_MODULES.RETAIL;
  const allModules = await getAllModulesRepo();

  return allModules.filter((mod) => defaultCodes.includes(mod.code));
};

export const getAllCompaniesService = async () => {
  return await getAllCompaniesRepo();
};
