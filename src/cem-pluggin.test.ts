import { describe, expect, test } from "vitest";
import cem from "../demo/custom-elements.json" with { type: "json" };
import { Component, getComponentByClassName } from "@wc-toolkit/cem-utilities";

type TagContent = {
  name: string;
  description: string;
};
type ExtComponent = Component & {
  dependencies: TagContent[];
  status: TagContent;
  members?: NonNullable<Component["members"]>;
};

describe("cem-inheritance", () => {
  const component = getComponentByClassName<ExtComponent>(cem, "MyComponent");

  test("should inherit APIs from parent", () => {
    expect((component?.dependencies)?.length).toEqual(2);
    expect(component?.status?.name).toEqual("beta");
    expect(component?.status?.description).toEqual("A beta component");
  });

  test("should add custom tags to accessors", () => {
    const headline = component?.members?.find(
      (member) => member.name === "headline",
    ) as (NonNullable<Component["members"]>[number] & {
      myCustomTag?: string;
    }) | undefined;

    expect(headline?.myCustomTag).toEqual("accessor-tag");
  });
});