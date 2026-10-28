
/**
 * split-loader.js
 * Loads numbered ZIP parts from ./game-files/
 *
 * Expected files:
 *   game-files/game.zip.000
 *   game-files/game.zip.001
 *   game-files/game.zip.002
 *   ...
 *
 * Requires JSZip to be loaded first.
 */
(function () {
  "use strict";

  const PARTS_URL = "./game-files/game.zip.";
  const MAX_PARTS = 10000;

  async function loadSplitZip(onProgress) {
    if (!window.JSZip) {
      throw new Error("JSZip is not loaded.");
    }

    const parts = [];
    let totalBytes = 0;

    for (let i = 0; i < MAX_PARTS; i++) {
      const suffix = String(i).padStart(3, "0");
      const url = PARTS_URL + suffix;

      if (typeof onProgress === "function") {
        onProgress({
          phase: "download",
          part: i + 1,
          bytes: totalBytes
        });
      }

      const response = await fetch(url);

      if (response.status === 404 && i > 0) {
        break;
      }

      if (!response.ok) {
        throw new Error(
          "Failed to load " + url + ": HTTP " + response.status
        );
      }

      const data = await response.arrayBuffer();
      parts.push(data);
      totalBytes += data.byteLength;
    }

    if (parts.length === 0) {
      throw new Error("No split ZIP parts were found in ./game-files/.");
    }

    if (typeof onProgress === "function") {
      onProgress({
        phase: "combine",
        part: parts.length,
        bytes: totalBytes
      });
    }

    const zipBlob = new Blob(parts, {
      type: "application/zip"
    });

    return await window.JSZip.loadAsync(zipBlob);
  }

  window.PvZSplitLoader = {
    loadSplitZip
  };
})();
