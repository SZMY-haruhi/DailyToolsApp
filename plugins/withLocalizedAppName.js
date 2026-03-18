const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const APP_NAMES = {
  en: "DailyToolsApp",
  zh: "日常工具",
  ja: "日常ツール",
};

function escapeForInfoPlistStrings(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeFileEnsured(filePath, contents) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, contents, "utf8");
}

function updateAndroidStringResource(xml, name, value) {
  const escapedValue = String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "\\'");

  const stringTagRegex = new RegExp(
    `<string\\s+name="${name}"[^>]*>[\\s\\S]*?<\\/string>`,
    "m"
  );
  const newTag = `<string name="${name}">${escapedValue}</string>`;

  if (stringTagRegex.test(xml)) {
    return xml.replace(stringTagRegex, newTag);
  }

  const resourcesClose = /<\/resources>\s*$/m;
  if (resourcesClose.test(xml)) {
    return xml.replace(resourcesClose, `  ${newTag}\n</resources>`);
  }

  return `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n  ${newTag}\n</resources>\n`;
}

function getIosProjectName(iosRoot) {
  if (!fs.existsSync(iosRoot)) return null;
  const entry = fs
    .readdirSync(iosRoot)
    .find((name) => name.toLowerCase().endsWith(".xcodeproj"));
  if (!entry) return null;
  return path.basename(entry, ".xcodeproj");
}

function getAndroidResRoot(projectRoot) {
  return path.join(projectRoot, "android", "app", "src", "main", "res");
}

function getAndroidStringsPath(resRoot, qualifier) {
  const valuesDir = qualifier ? `values-${qualifier}` : "values";
  return path.join(resRoot, valuesDir, "strings.xml");
}

module.exports = function withLocalizedAppName(config) {
  config = withDangerousMod(config, [
    "ios",
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const iosRoot = path.join(projectRoot, "ios");
      const projectName = getIosProjectName(iosRoot);
      if (!projectName) return config;

      const targets = [
        { lproj: "en.lproj", name: APP_NAMES.en },
        { lproj: "zh-Hans.lproj", name: APP_NAMES.zh },
        { lproj: "ja.lproj", name: APP_NAMES.ja },
      ];

      for (const target of targets) {
        const infoPlistStringsPath = path.join(
          iosRoot,
          projectName,
          target.lproj,
          "InfoPlist.strings"
        );
        const escaped = escapeForInfoPlistStrings(target.name);
        const contents = `"CFBundleDisplayName" = "${escaped}";\n"CFBundleName" = "${escaped}";\n`;
        writeFileEnsured(infoPlistStringsPath, contents);
      }

      return config;
    },
  ]);

  config = withDangerousMod(config, [
    "android",
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const resRoot = getAndroidResRoot(projectRoot);
      if (!fs.existsSync(resRoot)) return config;

      const defaultStringsPath = getAndroidStringsPath(resRoot, "");
      let defaultXml = "";
      if (fs.existsSync(defaultStringsPath)) {
        defaultXml = fs.readFileSync(defaultStringsPath, "utf8");
      } else {
        defaultXml = `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n</resources>\n`;
      }
      defaultXml = updateAndroidStringResource(defaultXml, "app_name", APP_NAMES.en);
      writeFileEnsured(defaultStringsPath, defaultXml);

      const localized = [
        { qualifier: "zh-rCN", name: APP_NAMES.zh },
        { qualifier: "ja", name: APP_NAMES.ja },
      ];

      for (const entry of localized) {
        const stringsPath = getAndroidStringsPath(resRoot, entry.qualifier);
        const xml = `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n  <string name="app_name">${entry.name}</string>\n</resources>\n`;
        writeFileEnsured(stringsPath, xml);
      }

      return config;
    },
  ]);

  return config;
};
