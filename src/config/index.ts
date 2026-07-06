export const PLATFORM_CONFIG = {
  version: "2.5.0-alpha",
  name: "AI Creative Studio Platform Engine",
  apiPrefix: "/api/v2",
  limits: {
    maxAssetsCount: 500,
    maxRenderQueueSize: 20,
    maxConcurrentDownloads: 4,
    maxPluginsAllowed: 50
  },
  hardwareClearance: {
    minimumGpuVramGb: 8,
    minimumRamGb: 16,
    recommendedGpuVramGb: 24
  },
  developerPortalUrl: "https://studio.agency.com/developer"
};
