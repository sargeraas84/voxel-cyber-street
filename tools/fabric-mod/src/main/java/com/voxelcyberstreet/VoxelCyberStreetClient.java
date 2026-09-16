package com.voxelcyberstreet;

import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.fabric.api.client.rendering.v1.EntityRendererRegistry;
import net.minecraft.client.render.entity.ZombieVillagerEntityRenderer;
import net.minecraft.client.render.entity.model.ZombieVillagerEntityModel;
import net.minecraft.entity.mob.ZombieVillagerEntity;

/**
 * Client entrypoint: re-registers the zombie-villager renderer through our
 * factory, which attaches the glowing tech-cape feature renderer. The skin
 * swap itself is a mixin on the renderer's getTexture.
 */
public class VoxelCyberStreetClient implements ClientModInitializer {
    /** Renderer with the glowing cape attached, retyped to the villager model. */
    public static final class CapeZombieVillagerRenderer extends ZombieVillagerEntityRenderer {
    public CapeZombieVillagerRenderer(net.minecraft.client.render.entity.EntityRendererFactory.Context ctx) {
        super(ctx);
        addFeature(new CorruptedCapeFeatureRenderer(this));
        addFeature(new CorruptedGlowFeatureRenderer(this));
    }
    }

    @Override
    public void onInitializeClient() {
        EntityRendererRegistry.register(net.minecraft.entity.EntityType.ZOMBIE_VILLAGER, CapeZombieVillagerRenderer::new);
        VoxelShots.init();
        VcsCommands.init();
        VoxelDirector.init();
        SkinRegistry.LOGGER.info("[VOXEL CYBER-STREET] corrupted-skin render path attached");
    }
}
