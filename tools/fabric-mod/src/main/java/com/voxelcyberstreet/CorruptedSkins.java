package com.voxelcyberstreet;

import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Random;

/**
 * Shared state: which zombie villagers render as "Corrupted Skins".
 *
 * Two ways to become corrupted:
 *  1. random conversion — ~1/3 of naturally spawned zombie villagers (UUID marked
 *     at construction by ZombieVillagerMixin, deterministic per UUID via skinFor(UUID));
 *  2. FORCED — any zombie villager custom-named "cyber_NN" always renders as pack
 *     skin #NN (1-based). Custom names are synced to the client, so a datapack or
 *     /summon with {CustomName:'"cyber_07"'} pins an exact, repeatable skin for
 *     screenshots and demo tours. See tools/build-datapack.js + DEMO.md.
 */
public final class CorruptedSkins {
    /** UUIDs of zombie villagers that render as converted cyber-teens. */
    public static final Set<UUID> MARKED = ConcurrentHashMap.newKeySet();
    /** Deterministic pick stream for conversions. */
    public static final Random RNG = new Random(2000L);

    private CorruptedSkins() {}

    /** True if this zombie villager should render with a pack skin + cape. */
    public static boolean isCorrupted(UUID id) {
        return MARKED.contains(id);
    }

    /** Deterministic pack-skin assignment per corrupted entity. */
    public static SkinRegistry.Entry skinFor(UUID id) {
        List<SkinRegistry.Entry> all = SkinRegistry.all();
        if (all.isEmpty()) return null;
        return all.get(Math.floorMod(id.hashCode(), all.size()));
    }

    /** True when the entity carries a "cyber_NN" custom name (forced demo skin). */
    public static boolean isForced(net.minecraft.entity.mob.ZombieVillagerEntity entity) {
        return forcedIndex(entity) >= 0;
    }

    /**
     * Skin resolution used by the render path: forced "cyber_NN" names win,
     * then UUID-marked conversions, else null (vanilla texture).
     */
    public static SkinRegistry.Entry skinFor(net.minecraft.entity.mob.ZombieVillagerEntity entity) {
        int forced = forcedIndex(entity);
        List<SkinRegistry.Entry> all = SkinRegistry.all();
        if (forced >= 0 && !all.isEmpty()) return all.get(forced % all.size());
        return isCorrupted(entity.getUuid()) ? skinFor(entity.getUuid()) : null;
    }

    /** 0-based pack index from a "cyber_NN" custom name, or -1. */
    private static int forcedIndex(net.minecraft.entity.mob.ZombieVillagerEntity entity) {
        if (!entity.hasCustomName()) return -1;
        String n = entity.getCustomName().getString().trim();
        if (!n.startsWith("cyber_")) return -1;
        try {
            int idx = Integer.parseInt(n.substring(6)) - 1;
            return Math.floorMod(idx, Math.max(1, SkinRegistry.count()));
        } catch (NumberFormatException ex) {
            return -1;
        }
    }
}
