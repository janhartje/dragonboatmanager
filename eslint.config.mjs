import js from "@eslint/js";
import { fixupPluginRules } from "@eslint/compat";
import nextPlugin from "@next/eslint-plugin-next";
import reactPlugin from "eslint-plugin-react";
import hooksPlugin from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";
import i18nJson from "eslint-plugin-i18n-json";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default [
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        plugins: {
            "@next/next": fixupPluginRules(nextPlugin),
            "react": fixupPluginRules(reactPlugin),
            "react-hooks": fixupPluginRules(hooksPlugin),
        },
        rules: {
            ...reactPlugin.configs.recommended.rules,
            ...hooksPlugin.configs.recommended.rules,
            ...nextPlugin.configs.recommended.rules,
            "react/react-in-jsx-scope": "off",
            "react/prop-types": "off",
            "@next/next/no-img-element": "off", // Optional, typical in Next.js
        },
        settings: {
            react: {
                version: "detect",
            }
        },
        languageOptions: {
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
        }
    },
    {
        files: ["src/locales/*.json"],
        plugins: {
            "i18n-json": i18nJson,
        },
        processor: i18nJson.processors[".json"],
        rules: {
            "i18n-json/identical-keys": [
                "error",
                {
                    filePath: path.resolve(__dirname, "src/locales/de.json"),
                },
            ],
            "i18n-json/valid-json": "error",
            "i18n-json/sorted-keys": [
                "error",
                {
                    order: "asc",
                    indentSpaces: 4,
                },
            ],
        },
    },
    {
        files: ["**/*.d.ts"],
        rules: {
            "@typescript-eslint/no-empty-object-type": "off",
        },
    },
    {
        ignores: [".next/*", "node_modules/*", "public/*", "prisma/seed.js"],
    }
];
