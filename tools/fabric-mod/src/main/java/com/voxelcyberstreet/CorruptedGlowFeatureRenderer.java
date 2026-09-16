package com.voxelcyberstreet;

import net.fabricmc.api.Environment;
import net.minecraft.client.render.RenderLayer;
import net.minecraft.client.render.VertexConsumer;
import net.minecraft.client.render.VertexConsumerProvider;
import net.minecraft.client.render.entity.feature.FeatureRenderer;
import net.minecraft.client.render.entity.feature.FeatureRendererContext;
import net.minecraft.client.render.entity.model.ZombieVillagerEntityModel;
import net.minecraft.client.util.math.MatrixStack;
import net.minecraft.entity.mob.ZombieVillagerEntity;

/**
 * Emissive neon pass for "Corrupted Skin" zombie villagers: re-draws the exact
 * same body geometry with the skin's *_glow texture (neon accents only, alpha
 * elsewhere) on the translucent-emissive layer, parented to the model itself —
 * so the mask, jacket zips, shoe stripes and cape hem actually GLOW in-world
 * while the base texture stays lit normally.
 *
 * The model renders with its own texture binding via Model.render, so we swap
 * the layer factory's texture for the glow variant by pushing a temporary
 * render-layer through the same pipeline the vanilla model uses.
 */
@Environment(net.fabricmc.api.EnvType.CLIENT)
public class CorruptedGlowFeatureRenderer
        extends FeatureRenderer<ZombieVillagerEntity, ZombieVillagerEntityModel<ZombieVillagerEntity>> {

    public CorruptedGlowFeatureRenderer(FeatureRendererContext<ZombieVillagerEntity, ZombieVillagerEntityModel<ZombieVillagerEntity>> ctx) {
        super(ctx);
    }

    @Override
    public void render(MatrixStack matrices, VertexConsumerProvider vertexConsumers, int light,
                       ZombieVillagerEntity entity, float limbAngle, float limbDistance,
                       float tickDelta, float animationProgress, float headYaw, float headPitch) {
        if (!VcsConfig.get().glow) return;                     // buyer toggle
        SkinRegistry.Entry e = CorruptedSkins.skinFor(entity);
        if (e == null || e.glow == null || e.glow.equals(e.skin)) return;

        ZombieVillagerEntityModel<ZombieVillagerEntity> model = this.getContextModel();
        if (model == null) return;

        // fullbright: emissive layer ignores block light (LightmapTextureManager.MAX = 0xF000F0)
        VertexConsumer vc = vertexConsumers.getBuffer(RenderLayer.getEntityTranslucentEmissive(e.glow, false));
        model.render(matrices, vc, 0xF000F0, net.minecraft.client.render.OverlayTexture.DEFAULT_UV, -1);
    }
}
