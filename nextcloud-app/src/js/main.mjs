/**
 * SPDX-FileCopyrightText: WARP <development@warp.lv>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { APP_ID } from "configuration/config.mjs"; // eslint-disable-line import/no-unresolved, n/no-missing-import
import App from "App/App.vue"; // eslint-disable-line import/no-unresolved, n/no-missing-import

if (OCA.Viewer) {
    OCA.Viewer.registerHandler({
        id: APP_ID,
        group: "files",
        mimes: [
            "application/x-kicad-project",
            "application/x-kicad-schematic",
            "application/x-kicad-pcb",
        ],
        component: App,
    });
}
