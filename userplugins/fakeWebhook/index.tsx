/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import definePlugin, { OptionType } from "@utils/types";
import { FluxDispatcher } from "@webpack/common";

const FAKE_WEBHOOK_ID = "000000000000000000";

const settings = definePluginSettings({
    targetUserId: {
        type: OptionType.STRING,
        description: "User ID whose messages should appear as webhook messages.",
        default: "",
    },
    webhookName: {
        type: OptionType.STRING,
        description: "Display name for the webhook.",
        default: "Webhook",
    },
    webhookAvatar: {
        type: OptionType.STRING,
        description: "Avatar URL for the webhook (leave empty for no avatar).",
        default: "",
    },
});

let handler: ((data: any) => void) | null = null;

export default definePlugin({
    name: "FakeWebhook",
    enabledByDefault: true,
    description: "Makes a specific user's messages appear as webhook messages locally. Only visible to you.",
    authors: [{ name: "yungpharaoh", id: 1136337246631497849n }],
    settings,

    start() {
        handler = (data: any) => {
            const { targetUserId, webhookName, webhookAvatar } = settings.store;
            if (!targetUserId || !data.message) return;

            const msg = data.message;
            if (msg.author?.id !== targetUserId) return;
            if (msg.webhook_id) return;

            const avatarUrl = webhookAvatar || null;

            FluxDispatcher.dispatch({
                type: "MESSAGE_UPDATE",
                message: {
                    ...msg,
                    webhook_id: FAKE_WEBHOOK_ID,
                    author: {
                        ...msg.author,
                        username: webhookName || "Webhook",
                        avatar: null,
                        avatar_decoration_data: null,
                        discriminator: "0000",
                        global_name: webhookName || "Webhook",
                        bot: true,
                        public_flags: 0,
                        flags: 0,
                        banner: null,
                        accent_color: null,
                        banner_color: null,
                    },
                    _webhookName: webhookName,
                    _webhookAvatar: avatarUrl,
                },
            });
        };

        FluxDispatcher.subscribe("MESSAGE_CREATE", handler);
    },

    stop() {
        if (handler) {
            FluxDispatcher.unsubscribe("MESSAGE_CREATE", handler);
            handler = null;
        }
    },
});