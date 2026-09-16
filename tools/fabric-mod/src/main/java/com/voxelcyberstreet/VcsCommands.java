package com.voxelcyberstreet;

import com.mojang.brigadier.arguments.BoolArgumentType;
import com.mojang.brigadier.arguments.IntegerArgumentType;
import com.mojang.brigadier.arguments.StringArgumentType;
import com.mojang.brigadier.context.CommandContext;
import net.fabricmc.fabric.api.client.command.v2.ClientCommandManager;
import net.fabricmc.fabric.api.client.command.v2.ClientCommandRegistrationCallback;
import net.minecraft.text.Text;

import java.util.List;
import java.util.Locale;

/**
 * /vconfig — buyer-facing config control (client side):
 *   /vconfig                      show every setting and its current value
 *   /vconfig reload               re-read config/voxelcyberstreet.json
 *   /vconfig set <field> <value>  set any field; persisted to disk immediately
 *
 * All feedback goes through the vanilla translation system (keys under
 * voxelcyberstreet.vconfig.*) so it renders in the player's language.
 */
public final class VcsCommands {
    private VcsCommands() {}

    /** Config field names accepted by /vconfig set. */
    private static final List<String> FIELDS = List.of(
            "corruptionRate", "capes", "glow", "spawnEgg", "hideEggNames", "eggPoseMode");

    public static void init() {
        var root = ClientCommandManager.literal("vconfig");

        root.executes(ctx -> feedback(ctx, "voxelcyberstreet.vconfig.show",
                VcsConfig.get().corruptionRate == 0 ? "off" : String.valueOf(VcsConfig.get().corruptionRate),
                bool(VcsConfig.get().capes), bool(VcsConfig.get().glow), bool(VcsConfig.get().spawnEgg),
                bool(VcsConfig.get().hideEggNames), bool(VcsConfig.get().eggPoseMode)));

        root.then(ClientCommandManager.literal("reload").executes(ctx -> {
            VcsConfig.reload();
            return feedback(ctx, "voxelcyberstreet.vconfig.reloaded");
        }));

        var set = ClientCommandManager.literal("set");
        // numeric field: corruptionRate (0..1000)
        set.then(ClientCommandManager.literal("corruptionRate")
            .then(ClientCommandManager.argument("value", IntegerArgumentType.integer(0, 1000)).executes(ctx -> {
                int v = IntegerArgumentType.getInteger(ctx, "value");
                VcsConfig.get().corruptionRate = v;
                VcsConfig.save();
                return feedback(ctx, "voxelcyberstreet.vconfig.set.rate", v == 0 ? "off" : "1-in-" + v);
            })));
        // boolean fields
        for (String f : new String[]{"capes", "glow", "spawnEgg", "hideEggNames", "eggPoseMode"}) {
            set.then(ClientCommandManager.literal(f)
                .then(ClientCommandManager.argument("value", BoolArgumentType.bool()).executes(ctx -> {
                    boolean v = BoolArgumentType.getBool(ctx, "value");
                    switch (f) {
                        case "capes" -> VcsConfig.get().capes = v;
                        case "glow" -> VcsConfig.get().glow = v;
                        case "spawnEgg" -> VcsConfig.get().spawnEgg = v;
                        case "hideEggNames" -> VcsConfig.get().hideEggNames = v;
                        case "eggPoseMode" -> VcsConfig.get().eggPoseMode = v;
                    }
                    VcsConfig.save();
                    return feedback(ctx, "voxelcyberstreet.vconfig.set.bool", Text.literal(f), bool(v));
                })));
        }
        // unknown-field help
        set.then(ClientCommandManager.argument("field", StringArgumentType.string())
            .executes(ctx -> feedback(ctx, "voxelcyberstreet.vconfig.unknown",
                    Text.literal(StringArgumentType.getString(ctx, "field")),
                    Text.literal(String.join(", ", FIELDS)))));

        root.then(set);
        ClientCommandRegistrationCallback.EVENT.register((dispatcher, registryAccess) -> dispatcher.register(root));
    }

    private static String bool(boolean b) { return b ? "on" : "off"; }

    private static int feedback(CommandContext<net.fabricmc.fabric.api.client.command.v2.FabricClientCommandSource> ctx,
                                String key, Object... args) {
        ctx.getSource().sendFeedback(Text.translatable(key, args));
        return 1;
    }
}
