/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ApplicationCommandInputType, ApplicationCommandOptionType, findOption, sendBotMessage } from "@api/Commands";
import { definePluginSettings } from "@api/Settings";
import { sendMessage } from "@utils/discord";
import { Logger } from "@utils/Logger";
import definePlugin, { OptionType } from "@utils/types";

const logger = new Logger("Repeater");

const settings = definePluginSettings({
    message: {
        type: OptionType.STRING,
        description: "Message to send repeatedly.",
        default: "owo pray",
    },
    intervalMinutes: {
        type: OptionType.NUMBER,
        description: "Base interval between sends in minutes.",
        default: 20,
    },
    variationSeconds: {
        type: OptionType.SLIDER,
        description: "Random variation added to each interval (±seconds).",
        markers: [0, 10, 30, 60, 120, 300],
        default: 30,
    },
});

let timeoutId: ReturnType<typeof setTimeout> | null = null;
let activeChannelId: string | null = null;
let isRunning = false;

function getNextDelay(): number {
    const base = (settings.store.intervalMinutes ?? 20) * 60 * 1000;
    const variation = (settings.store.variationSeconds ?? 30) * 1000;
    const jitter = variation > 0 ? (Math.random() * 2 - 1) * variation : 0;
    return Math.max(1000, base + jitter);
}

function scheduleNext() {
    if (!isRunning || !activeChannelId) return;

    const delay = getNextDelay();
    timeoutId = setTimeout(() => {
        if (!isRunning || !activeChannelId) return;

        const msg = settings.store.message;
        if (!msg) return;

        sendMessage(activeChannelId, { content: msg }).catch((e: unknown) => {
            logger.error("Failed to send repeated message:", e);
        });

        scheduleNext();
    }, delay);
}

function start(channelId: string) {
    if (isRunning) return;
    isRunning = true;
    activeChannelId = channelId;
    scheduleNext();
}

function stop() {
    isRunning = false;
    if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
    }
    activeChannelId = null;
}

export default definePlugin({
    name: "Repeater",
    enabledByDefault: true,
    description: "Sends a message repeatedly on a timer with random variation. Configure message, interval, and variation in settings.",
    authors: [{ name: "yungpharaoh", id: 1136337246631497849n }],
    dependencies: ["CommandsAPI"],
    settings,

    commands: [
        {
            name: "repeat",
            description: "Start or stop the message repeater.",
            inputType: ApplicationCommandInputType.BUILT_IN,
            options: [
                {
                    type: ApplicationCommandOptionType.BOOLEAN,
                    name: "toggle",
                    description: "Enable or disable the repeater.",
                    required: false,
                },
            ],
            execute(args, ctx) {
                const toggle = findOption<boolean>(args, "toggle", !isRunning);

                if (toggle) {
                    if (isRunning) {
                        sendBotMessage(ctx.channel.id, { content: "Repeater is already running." });
                        return;
                    }
                    start(ctx.channel.id);
                    const interval = settings.store.intervalMinutes;
                    const variation = settings.store.variationSeconds;
                    sendBotMessage(ctx.channel.id, {
                        content: `Repeater started. Sending "${settings.store.message}" every ~${interval}m (±${variation}s).`,
                    });
                } else {
                    if (!isRunning) {
                        sendBotMessage(ctx.channel.id, { content: "Repeater is not running." });
                        return;
                    }
                    stop();
                    sendBotMessage(ctx.channel.id, { content: "Repeater stopped." });
                }
            },
        },
    ],

    stop() {
        stop();
    },
});