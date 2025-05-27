/**
 * SPDX-FileCopyrightText: WARP <development@warp.lv>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { v4 as uuidv4 } from "uuid";

import { subscribe, unsubscribe } from "@nextcloud/event-bus";

import { generateFilePath } from "@nextcloud/router";

import { APP_ID } from "configuration/config.mjs"; // eslint-disable-line import/no-unresolved, n/no-missing-import

import { fetchFileFromUrl } from "helpers/warp-helpers.mjs"; // eslint-disable-line import/no-unresolved, n/no-missing-import

import logger from "logger/logger.mjs"; // eslint-disable-line import/no-unresolved, n/no-missing-import

// ----------------

export default {
    name: "App",
    data() {
        return {
            uuid: `uuid-${uuidv4()}`,
            sidebarWidth:
                document.querySelector("aside.app-sidebar")?.offsetWidth || 0,
            isSidebarShown: false,
            isLoading: true,
            appIconUrl: generateFilePath(APP_ID, "", "img/app.svg"),
            kicanvasEmbed: null,
            sourceFiles: [],
        };
    },
    watch: {
        active(val, old) {
            if (val === true && old === false) {
                this.construct();
            } else if (val === false && old === true) {
                this.destruct();
            }
        },
        isSidebarShown() {
            setTimeout(this.updateHeightWidth, 100);
        },
    },
    created() {
        subscribe("files:sidebar:opened", this.handleAppSidebarOpen);
        subscribe("files:sidebar:closed", this.handleAppSidebarClose);
        window.addEventListener("resize", this.handleWindowResize);
    },
    mounted() {
        this.doneLoading(); // NC viewer
        this.updateHeightWidth(); // NC viewer
        this.$nextTick(() => {
            this.$el.focus();
            this.construct();
        });
    },
    updated() {
        this.$nextTick(() => {
            this.updateHeightWidth();
        });
    },
    beforeDestroy() {
        this.destruct();
    },
    destroyed() {
        unsubscribe("files:sidebar:opened", this.handleAppSidebarOpen);
        unsubscribe("files:sidebar:closed", this.handleAppSidebarClose);
        window.removeEventListener("resize", this.handleWindowResize);
    },
    errorCaptured(error) {
        logger.error("errorCaptured", error?.name, error?.message, error);
    },
    methods: {
        handleWindowResize() {
            const domElSidebar = document.querySelector("aside.app-sidebar");
            if (domElSidebar) {
                this.sidebarWidth = domElSidebar.offsetWidth;
            }
            this.updateHeightWidth();
        },
        handleAppSidebarOpen() {
            this.handleAppSidebarToggle(true);
        },
        handleAppSidebarClose() {
            this.handleAppSidebarToggle(false);
        },
        handleAppSidebarToggle(state) {
            if (state) {
                this.isSidebarShown = true;
                const domElSidebar =
                    document.querySelector("aside.app-sidebar");
                if (domElSidebar) {
                    this.sidebarWidth = domElSidebar.offsetWidth;
                }
                this.updateHeightWidth();
            } else {
                this.isSidebarShown = false;
                this.updateHeightWidth();
            }
        },
        updateHeightWidth() {
            // Ensure proper sizing for the container
            this.$nextTick(() => {
                if (this.kicanvasEmbed) {
                    this.kicanvasEmbed.updateLayout();
                }
            });
        },
        destruct() {
            const domApp = document.getElementById(this.uuid);
            if (domApp) {
                domApp.style.display = "none";
            }

            // Clean up kicanvas embed
            if (this.kicanvasEmbed) {
                // Remove source elements
                while (this.kicanvasEmbed.firstChild) {
                    this.kicanvasEmbed.removeChild(
                        this.kicanvasEmbed.firstChild,
                    );
                }
                this.kicanvasEmbed = null;
            }
        },
        async construct() {
            // Disable swipe to prevent interfering with navigation
            this.disableSwipe();

            const domApp = document.getElementById(this.uuid);
            if (!domApp) {
                return;
            }

            if (!this.active) {
                this.destruct();
                return;
            }

            domApp.style.display = "block";
            this.isLoading = true;

            try {
                // Get the KiCad file to display
                const fileFetchUrl = this.source || this.davPath;
                const fileBasename = this.basename;
                const fileExt = fileBasename.split(".").pop();

                logger.debug("fileFetchUrl:", fileFetchUrl);
                logger.debug("fileBasename:", fileBasename);
                logger.debug("fileExt:", fileExt);

                // Fetch the primary file
                const fileContent = await this.fetchKiCadFile(
                    fileFetchUrl,
                    fileBasename,
                );

                this.isLoading = false;

                // Initialize KiCanvas after the DOM is updated and loading is done
                this.$nextTick(() => {
                    this.initKiCanvas(fileContent, fileExt);
                });
            } catch (error) {
                logger.error("Error loading KiCad file:", error?.name, error);
                this.isLoading = false;
            }
        },
        async fetchKiCadFile(url, filename) {
            try {
                const file = await fetchFileFromUrl(url, filename);
                return await file.text();
            } catch (error) {
                logger.error("Error fetching KiCad file:", error);
                throw error;
            }
        },
        initKiCanvas(fileContent, fileExt) {
            const container = this.$el.querySelector(
                `.${this.$style.containCanvas}`,
            );

            // Get the kicanvas-embed element
            this.kicanvasEmbed = container.querySelector("kicanvas-embed");

            if (!this.kicanvasEmbed) {
                logger.error("KiCanvas embed element not found");
                return;
            }

            // Create and add a source element
            const sourceElement = document.createElement("kicanvas-source");
            sourceElement.setAttribute("src", this.basename);
            sourceElement.textContent = fileContent;

            this.kicanvasEmbed.appendChild(sourceElement);

            // If this is a project file, try to load associated files
            if (fileExt === "kicad_pro" && this.filename) {
                this.loadAssociatedKiCadFiles();
            }
        },
        async loadAssociatedKiCadFiles() {
            // Implementation would go here to load associated files
            // This would require knowledge of the project structure
            logger.debug(
                "Loading associated KiCad files would be implemented here",
            );
        },
    },
};
