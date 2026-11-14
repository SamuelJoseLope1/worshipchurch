import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  it("matches a page for / instead of falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });

  it("opens lyrics with or without a selected song", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    const route = router.matchRoutes("/lyrics").at(-1)?.routeId;
    expect(route).toBe("/_authenticated/lyrics");
    const validate = router.routesById["/_authenticated/lyrics"]?.options.validateSearch;
    if (typeof validate !== "function") throw new Error("Missing lyrics search validator");
    expect(validate({})).toEqual({});
    expect(validate({ song: undefined })).toEqual({});
    expect(validate({ song: 123 })).toEqual({});
    expect(validate({ song: "song-123" })).toEqual({ song: "song-123" });
  });
});
