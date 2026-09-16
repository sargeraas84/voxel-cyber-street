package com.voxelcyberstreet;

import com.mojang.brigadier.arguments.IntegerArgumentType;
import com.mojang.brigadier.arguments.StringArgumentType;
import net.fabricmc.fabric.api.client.command.v2.ClientCommandManager;
import net.fabricmc.fabric.api.client.command.v2.ClientCommandRegistrationCallback;
import net.fabricmc.fabric.api.client.event.lifecycle.v1.ClientTickEvents;
import net.minecraft.client.MinecraftClient;
import net.minecraft.client.util.ScreenshotRecorder;
import net.minecraft.text.ClickEvent;
import net.minecraft.text.HoverEvent;
import net.minecraft.text.Text;

import java.nio.file.Path;
import java.util.function.Consumer;

/**
 * In-client marketing screenshot tool — captures NPC renders in-world and saves
 * them next to the project for the store listing.
 *
 *   /vshot                    one shot now  → screenshots/vcs-<stamp>.png
 *   /vshot <name>             one shot with a custom file name
 *   /vshot burst <n>          n shots, one per second (walk/fly while it shoots)
 *   /vshot orbit <n>          n shots while slowly rotating the camera (turntable)
 *
 * Shots land in the run directory: tools/fabric-mod/run/screenshots/vcs-*.png
 * (F2-style privacy notice: chat shows the file name; the screenshot is taken on
 * the render thread at end of tick via ScreenshotRecorder, like vanilla F2.)
 */
public final class VoxelShots {
    private static final String PREFIX = "vcs-";

    private VoxelShots() {}

    public static void init() {
        var root = ClientCommandManager.literal("vshot");
        root.executes(ctx -> { shoot("shot"); return 1; });
        root.then(ClientCommandManager.argument("name", StringArgumentType.string())
            .executes(ctx -> { shoot(StringArgumentType.getString(ctx, "name")); return 1; }));
        root.then(ClientCommandManager.literal("burst")
            .then(ClientCommandManager.argument("count", IntegerArgumentType.integer(1, 120))
                .executes(ctx -> { schedule("burst", IntegerArgumentType.getInteger(ctx, "count"), false); return 1; })));
        root.then(ClientCommandManager.literal("orbit")
            .then(ClientCommandManager.argument("count", IntegerArgumentType.integer(1, 360))
                .executes(ctx -> { schedule("orbit", IntegerArgumentType.getInteger(ctx, "count"), true); return 1; })));

        ClientCommandRegistrationCallback.EVENT.register((dispatcher, registryAccess) -> dispatcher.register(root));
        ClientTickEvents.END_CLIENT_TICK.register(client -> tick(client));
    }

    // ---------------- burst/orbit scheduler (client ticks) ----------------
    private static int remaining = 0;
    private static boolean orbiting = false;
    private static String seriesName = "burst";
    private static int cool = 0;

    private static void schedule(String name, int count, boolean orbit) {
        remaining = count; seriesName = name; orbiting = orbit; cool = 0;
        feedback("VOXEL SHOTS: " + count + (orbit ? " orbit" : " burst") + " shots starting");
    }

    private static void tick(MinecraftClient client) {
        if (remaining <= 0) return;
        if (client.player == null || client.world == null) { remaining = 0; return; }

        if (orbiting) {
            // slow cinematic yaw: ~0.75°/tick → ~7s per revolution at 20 tps
            client.player.setYaw(client.player.getYaw() + 0.75f);
        }
        if (--cool <= 0) {
            shoot(seriesName);
            cool = 20; // one shot per second
            remaining--;
            if (remaining == 0) feedback("VOXEL SHOTS: series complete");
        }
    }

    // ---------------- single shot ----------------
    private static void shoot(String name) {
        MinecraftClient client = MinecraftClient.getInstance();
        if (client.world == null || client.player == null) { feedback("VOXEL SHOTS: not in a world"); return; }
        String stamp = java.time.LocalDateTime.now()
                .format(java.time.format.DateTimeFormatter.ofPattern("MMdd-HHmmss"));
        String file = PREFIX + name + "-" + stamp + ".png";
        ScreenshotRecorder.saveScreenshot(client.runDirectory, file, client.getFramebuffer(), msg -> {
            Path p = client.runDirectory.toPath().resolve(file);
            feedback("VOXEL SHOTS saved: " + file
                + "  (run/screenshots/" + file + ")");
        });
    }

    private static void feedback(String s) {
        MinecraftClient client = MinecraftClient.getInstance();
        if (client.inGameHud != null) {
            client.inGameHud.getChatHud().addMessage(Text.literal(s));
        }
    }
}
