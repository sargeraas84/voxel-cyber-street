package com.voxelcyberstreet;

import com.mojang.brigadier.arguments.BoolArgumentType;
import com.mojang.brigadier.arguments.StringArgumentType;
import net.fabricmc.fabric.api.client.command.v2.ClientCommandManager;
import net.fabricmc.fabric.api.client.command.v2.ClientCommandRegistrationCallback;
import net.fabricmc.fabric.api.client.event.lifecycle.v1.ClientTickEvents;
import net.minecraft.client.MinecraftClient;
import net.minecraft.client.util.ScreenshotRecorder;
import net.minecraft.text.Text;
import net.minecraft.util.math.Vec3d;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * VOXEL DIRECTOR — automated in-game capture with selectable camera routes.
 * Films the Neon District demo (or any scene built at the tour anchors) and
 * dumps one lossless PNG per tick:
 *
 *   /vdirector start [route]        tour (default) | race | chase | crowd
 *   /vdirector start <route> false  keep the HUD visible
 *   /vdirector route                list routes
 *   /vdirector stop                 cut early
 *
 *   npm run encode  → voxel-cyber-street-gameplay-demo.mp4 (60 fps H.264)
 *
 * Camera mechanics: Camera.setPos/setRotation are protected in 1.21, so routes
 * are flown by moving the CLIENT PLAYER along eased keyframes (creative flight,
 * zeroed velocity) and aiming it at a look target — the vanilla camera follows.
 */
public final class VoxelDirector {
    private record Key(double t, double x, double y, double z, double tx, double ty, double tz, String caption) {}
    private record Route(String key, int durationTicks, Key[] path) {}

    private static final Map<String, Route> ROUTES = new LinkedHashMap<>();

    private static void route(String key, int seconds, Key[] path) {
        ROUTES.put(key, new Route(key, seconds * 20, path));
    }

    static {
        // ---- TOUR: the original 2-minute sightline of the whole district
        route("tour", 120, new Key[]{
            new Key(0.00,   0, 66, -26,   0, 70,   8, "rise behind the street"),
            new Key(0.10,   0, 84, -46,   0, 70,   8, "overview: the whole strip"),
            new Key(0.22,  -3, 70, -18,  -2, 67,  -6, "dive to street level"),
            new Key(0.34,  -2, 66,  -4,   2, 67,  12, "street cruise: masks ahead"),
            new Key(0.46,   2, 65,  10,   2, 67,  26, "the cape line"),
            new Key(0.58,   2, 64.6, 16,  2, 66,  18, "close-up on a cape"),
            new Key(0.70,  -2, 65.5, 22, -2, 67,   2, "swing: the cast"),
            new Key(0.84,   0, 72,  38,   0, 68, -10, "pull up through the beacons"),
            new Key(1.00,   0, 88, -50,   0, 68,  10, "final overview — cut to end card"),
        });

        // ---- NIGHT STREET RACE: low, fast, kinetic — camera "skates" the road
        route("race", 90, new Key[]{
            new Key(0.00,   0, 65.2, -22,   0, 67,  20, "launch down the strip"),
            new Key(0.14,   0, 65.0,   0,   0, 67,  30, "full speed on the neon line"),
            new Key(0.28,   0, 65.2,  22,  -2, 68,  38, "bank left at the crossing"),
            new Key(0.42,  -3, 66.5,  36,   2, 66,  20, "sweep around the south blocks"),
            new Key(0.56,   0, 65.4,  20,   0, 67, -10, "reverse pass — head-on crowd"),
            new Key(0.70,   0, 65.2,  -6,   0, 67, -18, "thread the lamp posts"),
            new Key(0.86,   0, 68.0, -24,   0, 72, -32, "hop the curb, climb out"),
            new Key(1.00,   0, 74, -40,   0, 68,   8, "brake — look back at the strip"),
        });

        // ---- CAPE CHASE: orbit-and-push around one corrupted villager
        route("chase", 75, new Key[]{
            new Key(0.00,   6, 66,  10,   2, 66,  14, "close on the target"),
            new Key(0.16,   5, 65.6, 17,   2, 66,  18, "orbit: face to mask"),
            new Key(0.32,   2, 64.8, 19,   2, 66,  18, "drop to shoulder height"),
            new Key(0.48,  -2, 64.7, 18,   2, 66,  18, "behind: the glowing cape"),
            new Key(0.62,  -4, 65.6, 14,   2, 66,  16, "slow arc around the hem"),
            new Key(0.78,  -2, 67.0, 11,   2, 66,  16, "rise with the cape swing"),
            new Key(1.00,   6, 66.4, 12,   2, 66,  14, "pull off — target released"),
        });

        // ---- MOB CROWD: wide crane moves across the zombie crowd + cast
        route("crowd", 105, new Key[]{
            new Key(0.00, -10, 70, -24,   0, 66,   0, "crane up over the crowd"),
            new Key(0.18,  -8, 67,  -6,   0, 66,  10, "drift across the horde"),
            new Key(0.36,  -4, 66,  10,   2, 67,  18, "between vanilla and corrupted"),
            new Key(0.52,   0, 68,  22,   0, 66,   4, "turn: crowd vs cast, wide"),
            new Key(0.68,   6, 70,  10,  -2, 67,  -4, "high track back south"),
            new Key(0.84,   8, 74, -10,  -2, 68,  -8, "the whole street breathes"),
            new Key(1.00,   0, 80, -30,   0, 68,  10, "night falls on the district"),
        });
    }

    private static final int SKIP_INITIAL = 40;   // let the scene settle (~2s)
    private static volatile boolean running = false;
    private static boolean hideHud = true;
    private static Route active = ROUTES.get("tour");
    private static long startTick = 0;
    private static int shotCount = 0;

    private VoxelDirector() {}

    public static void init() {
        var root = ClientCommandManager.literal("vdirector");
        root.executes(ctx -> { start("tour", true); return 1; });
        root.then(ClientCommandManager.argument("route", StringArgumentType.word())
            .suggests((ctx, builder) -> {
                for (String k : ROUTES.keySet()) builder.suggest(k);
                return builder.buildFuture();
            })
            .executes(ctx -> { return start(StringArgumentType.getString(ctx, "route"), true) ? 1 : 0; })
            .then(ClientCommandManager.argument("hideHud", BoolArgumentType.bool())
                .executes(ctx -> { return start(StringArgumentType.getString(ctx, "route"), BoolArgumentType.getBool(ctx, "hideHud")) ? 1 : 0; })));
        root.then(ClientCommandManager.literal("route").executes(ctx -> {
            ctx.getSource().sendFeedback(Text.translatable("voxelcyberstreet.director.routes",
                    Text.literal(String.join(", ", ROUTES.keySet()))));
            return 1;
        }));
        root.then(ClientCommandManager.literal("stop").executes(ctx -> { stop("director.stop"); return 1; }));
        ClientCommandRegistrationCallback.EVENT.register((dispatcher, registryAccess) -> dispatcher.register(root));

        ClientTickEvents.END_CLIENT_TICK.register(VoxelDirector::tick);
    }

    private static boolean start(String routeKey, boolean hud) {
        MinecraftClient client = MinecraftClient.getInstance();
        if (client.player == null || client.world == null) return false;
        Route r = ROUTES.get(routeKey);
        if (r == null) {
            client.inGameHud.getChatHud().addMessage(Text.translatable("voxelcyberstreet.director.unknown",
                    Text.literal(routeKey), Text.literal(String.join(", ", ROUTES.keySet()))));
            return false;
        }
        running = true; hideHud = hud; active = r; startTick = 0; shotCount = 0;
        client.options.hudHidden = hideHud;
        client.player.getAbilities().allowFlying = true;
        client.player.getAbilities().flying = true;
        client.inGameHud.getChatHud().addMessage(Text.translatable("voxelcyberstreet.director.rolling",
                Text.literal(r.key()), r.durationTicks(), hideHud ? "[HUD hidden]" : ""));
        return true;
    }

    private static void stop(String reasonKey) {
        if (!running) return;
        running = false;
        MinecraftClient client = MinecraftClient.getInstance();
        if (client.player != null) client.player.getAbilities().flying = false;
        client.inGameHud.getChatHud().addMessage(Text.translatable("voxelcyberstreet." + reasonKey,
                Text.literal("path complete"), shotCount));
    }

    private static void tick(MinecraftClient client) {
        if (!running) return;
        if (client.player == null || client.world == null) { running = false; return; }

        startTick++;
        if (startTick <= SKIP_INITIAL) return;

        double t = Math.min(1.0, (startTick - SKIP_INITIAL) / (double) active.durationTicks());
        Key[] path = active.path();
        Key a = path[0], b = path[path.length - 1];
        for (int i = 0; i < path.length - 1; i++) {
            if (t >= path[i].t && t <= path[i + 1].t) { a = path[i]; b = path[i + 1]; break; }
        }
        double local = (b.t() == a.t) ? 0 : (t - a.t) / (b.t() - a.t);
        double e = local * local * (3 - 2 * local);   // smoothstep easing

        double cx = a.x() + (b.x() - a.x()) * e;
        double cy = a.y() + (b.y() - a.y()) * e;
        double cz = a.z() + (b.z() - a.z()) * e;
        client.gameRenderer.setRenderHand(false);
        client.player.setPos(cx, cy, cz);
        client.player.setVelocity(Vec3d.ZERO);
        client.player.fallDistance = 0;

        double dx = a.tx() + (b.tx() - a.tx()) * e - cx;
        double dy = a.ty() + (b.ty() - a.ty()) * e - cy;
        double dz = a.tz() + (b.tz() - a.tz()) * e - cz;
        double horiz = Math.sqrt(dx * dx + dz * dz);
        client.player.setYaw((float) Math.toDegrees(Math.atan2(-dx, dz)));
        client.player.setPitch((float) Math.toDegrees(Math.atan2(-dy, horiz)));

        if (t >= 1.0) { stop("director.stop"); return; }

        String file = String.format("director/%s/frame-%06d.png", active.key(), startTick);
        ScreenshotRecorder.saveScreenshot(client.runDirectory, file, client.getFramebuffer(), msg -> {});
        shotCount++;

        if (startTick % 200 == 0) {
            client.inGameHud.getChatHud().addMessage(Text.translatable("voxelcyberstreet.director.progress",
                    Text.literal(a.caption()), (int) (t * 100)));
        }
    }
}
