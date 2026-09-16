package com.voxelcyberstreet;

import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.fabric.api.client.event.lifecycle.v1.ClientTickEvents;
import net.minecraft.client.MinecraftClient;

/**
 * VOXEL AUTOPILOT — unattended capture driver for the quick-play launch:
 *
 *   gradle runClient -Pvcs.quickPlay=NeonDistrict -Pvcs.route=tour
 *
 * The launcher flag --quickPlaySingleplayer (wired by build.gradle from
 * vcs.quickPlay) boots the client straight into the world, no UI. This
 * driver then, in order:
 *   1. waits for the world to finish loading
 *   2. switches to creative flight
 *   3. builds the Neon District scene (/function vcsdemo:scene)
 *   4. starts the director route (HUD hidden)
 *   5. when the route completes, VoxelDirector.stop() calls
 *      VoxelAutopilot.onDirectorStop() → marker file + scheduled exit
 *
 * tools/record-demo.sh watches run/screenshots/director/vcs-autopilot.done,
 * then stops the client and encodes the frames. Any world-list/title-screen
 * state is treated as a quick-play failure (hard watchdog exits with FAIL).
 */
public final class VoxelAutopilot implements ClientModInitializer {
    private static final String FLAG = "voxelcyberstreet.autopilot";
    private static final int SETTLE_TICKS = 40;      // 2s after world load before commands
    private static final int SCENE_TICKS = 140;      // 7s for the scene function to place everything
    private static final int GLOBAL_WATCHDOG = 20 * 60 * 8;   // 8 min hard cap

    private enum Phase { WAIT_INGAME, BUILDING_SCENE, RECORDING, DONE, FAILED }

    private static Phase phase = Phase.WAIT_INGAME;
    private static int ticksInPhase = 0;
    private static boolean exitScheduled = false;

    @Override
    public void onInitializeClient() {
        String flag = System.getProperty(FLAG);
        if (flag == null || flag.isBlank()) return;              // normal interactive boot: inert
        ClientTickEvents.END_CLIENT_TICK.register(VoxelAutopilot::tick);
        log("armed — route '" + flag.trim() + "'");
    }

    /** Called by VoxelDirector.stop() when the route finishes or is cut. */
    public static void onDirectorStop() {
        if (phase != Phase.RECORDING) return;
        phase = Phase.DONE;
        writeMarker(true, null);
        log("capture complete — marker written, exiting in 3s");
    }

    private static void tick(MinecraftClient client) {
        if (phase == Phase.DONE || phase == Phase.FAILED) {
            if (!exitScheduled) {
                exitScheduled = true;
                final boolean ok = phase == Phase.DONE;
                new Thread(() -> {
                    try { Thread.sleep(3000); } catch (InterruptedException ignored) {}
                    log(ok ? "clean exit" : "exit after failure");
                    client.scheduleStop();
                }, "vcs-autopilot-exit").start();
            }
            return;
        }
        ticksInPhase++;
        if (ticksInPhase > GLOBAL_WATCHDOG) { fail("global watchdog fired"); return; }

        switch (phase) {
            case WAIT_INGAME -> {
                if (client.world != null && client.player != null) {
                    setPhase(Phase.BUILDING_SCENE);
                } else if (ticksInPhase > 20 * 90) {
                    fail("world never loaded (quick-play failed?)");
                }
            }
            case BUILDING_SCENE -> {
                if (client.world == null || client.player == null) { fail("world lost mid-setup"); return; }
                if (ticksInPhase == SETTLE_TICKS) {
                    sendCommand(client, "gamemode creative");
                    sendCommand(client, "gamerule doDaylightCycle false");
                    sendCommand(client, "time set midnight");
                }
                if (ticksInPhase == SETTLE_TICKS + 10) sendCommand(client, "function vcsdemo:scene");
                if (ticksInPhase > SETTLE_TICKS + SCENE_TICKS) {
                    VoxelDirector.autopilotStart(System.getProperty(FLAG, "tour").trim());
                    setPhase(Phase.RECORDING);
                }
            }
            case RECORDING -> { /* the director drives every tick */ }
        }
    }

    private static void sendCommand(MinecraftClient client, String cmd) {
        if (client.player != null) client.player.networkHandler.sendChatCommand(cmd);
    }

    private static void setPhase(Phase p) { phase = p; ticksInPhase = 0; log("phase → " + p); }

    private static void fail(String why) {
        phase = Phase.FAILED;
        writeMarker(false, why);
        log("FAILED: " + why);
    }

    private static void writeMarker(boolean ok, String err) {
        try {
            var dir = MinecraftClient.getInstance().runDirectory.toPath().resolve("screenshots/director");
            java.nio.file.Files.createDirectories(dir);
            java.nio.file.Files.writeString(dir.resolve("vcs-autopilot.done"),
                    (ok ? "OK " : "FAIL ") + java.time.Instant.now()
                            + (err == null ? "" : " " + err) + "\n");
        } catch (Exception e) {
            log("marker write failed: " + e);
        }
    }

    private static void log(String msg) {
        System.out.println("[VOXEL AUTOPILOT] " + msg);
    }
}
