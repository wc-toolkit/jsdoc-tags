import { parse } from "comment-parser";
import { Logger } from "./logger";
import { deepMerge, type Component } from "@wc-toolkit/cem-utilities";
import type { AnalyzePhaseParams } from "@custom-elements-manifest/analyzer";
import ts from "typescript";

/** Configuration for the CEM plugin */
export type Options = {
  tags?: CustomTag;
  /** Show process logs */
  debug?: boolean;
  /** Prevents plugin from executing */
  skip?: boolean;
};

/** Configuration for the individual tag */
export type CustomTag = {
  /** The name of the tag to be parsed */
  [key: string]: {
    /** The name of the property to be added to the CEM */
    mappedName?: string;
    /** The type of the property to be added to the CEM */
    isArray?: boolean;
  };
};

type CEMTag = {
  name?: string;
  type?: {
    text: string;
  };
  default?: string;
  description?: string;
};

type JSDocTag = {
  tags: {
    tagName: {
      getText: () => string;
    };
    comment: string;
  }[];
};

let userOptions: Options = {
  tags: {},
};

/**
 * CEM Analyzer plugin to expand types in component metadata
 * @param options Configuration options
 * @returns
 */
export function jsDocTagsPlugin(options: Options = {}) {
  userOptions = deepMerge(userOptions, options);
  const log = new Logger(userOptions.debug);
  
  if (options.skip) {
    log.yellow("[jsdoc-tags] - Skipped");
    return;
  }

  log.log("[jsdoc-tags] - Updating Custom Elements Manifest...");
  userOptions = options;

  return {
    name: "jsdoc-tags-plugin",
    analyzePhase({ ts, node, moduleDoc }: AnalyzePhaseParams) {
      if (node.kind !== ts.SyntaxKind.ClassDeclaration) {
        return;
      }

      const className = (
        node as unknown as ts.ClassDeclaration
      ).name!.getText();
      const component = moduleDoc?.declarations?.find(
        (declaration) => declaration.name === className
      ) as Component | undefined;
      const customTags = Object.keys(userOptions.tags || {});
      let customComments = "/**";

      // @ts-expect-error jsDoc is not a public API
      node.jsDoc?.forEach((jsDoc: JSDocTag) => {
        jsDoc?.tags?.forEach(
          (tag: { tagName: { getText: () => string }; comment: string }) => {
            const tagName = tag.tagName.getText();

            if (customTags.includes(tagName)) {
              customComments += `\n * @${tagName} ${tag.comment}`;
            }
          }
        );
      });

      const parsed = parse(`${customComments}\n */`);
      parsed[0]?.tags?.forEach((tagMeta) => {
        const tagOptions = userOptions.tags![tagMeta.tag];
        if (!tagOptions) {
          return;
        }

        const propName = tagOptions.mappedName || tagMeta.tag;
        if (!component) {
          return;
        }
        const existingProp = component[propName];
        const cemTag: CEMTag = {
          name: tagMeta.name === "-" ? "" : tagMeta.name,
          default: tagMeta.default,
          description: tagMeta.description.replace(/^\s?-/, "").trim(), // removes leading dash
          type: tagMeta.type ? { text: tagMeta.type } : undefined,
        };

        if (!existingProp && tagOptions.isArray) {
          component[propName] = [cemTag];
        } else if (Array.isArray(component[propName])) {
          component[propName].push(cemTag);
        } else if (existingProp && !Array.isArray(component[propName])) {
          component[propName] = [component[propName], cemTag];
        } else {
          component[propName] = cemTag;
        }
      });
    },
    packageLinkPhase: () => {
      log.green("[cem-expanded-types] - Custom Elements Manifest updated.");
    },
  };
}
