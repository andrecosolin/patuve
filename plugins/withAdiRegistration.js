/**
 * Config plugin: copia adi-registration.properties para
 * android/app/src/main/assets/ durante o prebuild do EAS.
 * Necessário para verificação de propriedade no Google Play Console.
 */
const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const ADI_CONTENT = "DZIRJYAMFSYJWAAAAAAAAAAAAA";

module.exports = function withAdiRegistration(config) {
  return withDangerousMod(config, [
    "android",
    async (cfg) => {
      const assetsDir = path.join(
        cfg.modRequest.platformProjectRoot,
        "app",
        "src",
        "main",
        "assets"
      );
      fs.mkdirSync(assetsDir, { recursive: true });
      fs.writeFileSync(
        path.join(assetsDir, "adi-registration.properties"),
        ADI_CONTENT,
        "utf8"
      );
      console.log("[withAdiRegistration] adi-registration.properties criado em", assetsDir);
      return cfg;
    },
  ]);
};
