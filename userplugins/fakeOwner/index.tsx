/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import definePlugin, { OptionType } from "@utils/types";
import { React } from "@webpack/common";

const settings = definePluginSettings({
    targetUserId: {
        type: OptionType.STRING,
        description: "User ID to show as server owner.",
        default: "",
    },
});

function CrownIcon({ size = 16 }: { size?: number; }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 16 16"
            fill="none"
            style={{ display: "inline-block", verticalAlign: "middle", marginLeft: 4 }}
            aria-label="Server Owner"
            role="img"
        >
            <path
                d="M8 1.333L10.267 5.867L15.333 6.533L11.667 10.067L12.533 15.067L8 12.667L3.467 15.067L4.333 10.067L0.667 6.533L5.733 5.867L8 1.333Z"
                fill="#FFA800"
            />
        </svg>
    );
}

export default definePlugin({
    name: "FakeOwner",
    enabledByDefault: true,
    description: "Shows the owner crown next to a specified user in chat and member list. Only visible to you.",
    authors: [{ name: "yungpharaoh", id: 1136337246631497849n }],
    dependencies: ["MessageDecorationsAPI", "MemberListDecoratorsAPI"],
    settings,

    renderMessageDecoration(props: { message: { author: { id: string; }; }; }) {
        const { targetUserId } = settings.store;
        if (!targetUserId || props.message.author.id !== targetUserId) return null;
        return <CrownIcon size={14} />;
    },

    renderMemberListDecorator(props: { user: { id: string; }; }) {
        const { targetUserId } = settings.store;
        if (!targetUserId || props.user.id !== targetUserId) return null;
        return <CrownIcon size={14} />;
    },
});