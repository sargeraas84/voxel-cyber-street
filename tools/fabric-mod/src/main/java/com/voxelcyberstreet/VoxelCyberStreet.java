package com.voxelcyberstreet;

import net.fabricmc.api.ModInitializer;

/**
 * VOXEL CYBER-STREET — NPC skin pack.
 * Loads the bundled skin registry (36 skins + glowing capes); the mixins apply
 * them to fake players and to ~1/3 of zombie villagers ("Corrupted Skins").
 */
public class VoxelCyberStreet implements ModInitializer {
    public static final String MOD_ID = "voxelcyberstreet";

    @Override
    public void onInitialize() {
        SkinRegistry.load();
        VcsConfig.load();
        if (VcsConfig.get().spawnEgg) {
            CorruptedSkinSpawnEgg.register();
            CorruptedSkinSpawnEgg.addToItemGroups();
        }
        SkinRegistry.LOGGER.info("[VOXEL CYBER-STREET] {} skins registered for NPC application", SkinRegistry.count());
    }
}
