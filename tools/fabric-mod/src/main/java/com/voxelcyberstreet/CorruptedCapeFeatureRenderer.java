package com.voxelcyberstreet;

import net.fabricmc.api.Environment;
import net.minecraft.client.render.OverlayTexture;
import net.minecraft.client.render.RenderLayer;
import net.minecraft.client.render.VertexConsumer;
import net.minecraft.client.render.VertexConsumerProvider;
import net.minecraft.client.render.entity.feature.FeatureRenderer;
import net.minecraft.client.render.entity.feature.FeatureRendererContext;
import net.minecraft.client.render.entity.model.ZombieVillagerEntityModel;
import net.minecraft.client.util.math.MatrixStack;
import net.minecraft.entity.mob.ZombieVillagerEntity;
import net.minecraft.util.math.MathHelper;
import org.joml.Matrix4f;

/**
 * Draws the pack's glowing tech cape on "Corrupted Skin" zombie villagers.
 * A single flat quad is parented to the body ModelPart (so it leans and swings
 * with the torso), textured with the 64x32 cape region (12,1)-(22,17) — the
 * same layout used by the web reference sheet and the Bedrock packs.
 * Emissive translucent layer => the neon hem glows in the dark.
 */
@Environment(net.fabricmc.api.EnvType.CLIENT)
public class CorruptedCapeFeatureRenderer
        extends FeatureRenderer<ZombieVillagerEntity, ZombieVillagerEntityModel<ZombieVillagerEntity>> {

    public CorruptedCapeFeatureRenderer(FeatureRendererContext<ZombieVillagerEntity, ZombieVillagerEntityModel<ZombieVillagerEntity>> ctx) {
        super(ctx);
    }

    @Override
    public void render(MatrixStack matrices, VertexConsumerProvider vertexConsumers, int light,
                       ZombieVillagerEntity entity, float limbAngle, float limbDistance,
                       float tickDelta, float animationProgress, float headYaw, float headPitch) {
        if (!VcsConfig.get().capes) return;                    // buyer toggle
        SkinRegistry.Entry e = CorruptedSkins.skinFor(entity); // random conversions + forced cyber_NN names
        if (e == null || e.cape == null) return;

        ZombieVillagerEntityModel<ZombieVillagerEntity> model = this.getContextModel();
        if (model == null || model.body == null) return;

        float age = entity.age + tickDelta;
        float speed = Math.min(1f, Math.abs(limbDistance));
        float sway = MathHelper.sin(age * 0.12f) * 0.10f + speed * MathHelper.sin(age * 0.55f) * 0.28f;

        RenderLayer layer = RenderLayer.getEntityTranslucentEmissive(e.cape, false);
        VertexConsumer vc = vertexConsumers.getBuffer(layer);

        matrices.push();
        // anchor exactly where the body ModelPart sits, then mimic its pose
        model.body.rotate(matrices);
        matrices.translate(0, 12.0f / 16.0f, 2.1f / 16.0f); // back of the torso
        matrices.multiplyPositionMatrix(new Matrix4f().rotationY(sway));

        MatrixStack.Entry entry = matrices.peek();
        // cape quad: 10/16 wide, 16/16 tall, matching the vanilla cape plane.
        // cape UVs inside the 64x32 art: (12,1)-(22,17); v flipped so the top
        // of the art sits at the shoulders.
        quad(entry, vc, light,
                -5.0f / 16f, 0.0f,          12.0f / 64f, 17.0f / 32f,
                 5.0f / 16f, 0.0f,          22.0f / 64f, 17.0f / 32f,
                 5.0f / 16f, -16.0f / 16f,  22.0f / 64f,  1.0f / 32f,
                -5.0f / 16f, -16.0f / 16f,  12.0f / 64f,  1.0f / 32f);
        matrices.pop();
    }

    private static void quad(MatrixStack.Entry m, VertexConsumer vc, int light,
                             float x1, float y1, float u1, float v1,
                             float x2, float y2, float u2, float v2,
                             float x3, float y3, float u3, float v3,
                             float x4, float y4, float u4, float v4) {
        vc.vertex(m, x1, y1, 0f).color(255, 255, 255, 255).texture(u1, v1)
          .overlay(OverlayTexture.DEFAULT_UV).light(light).normal(m, 0f, 1f, 0f);
        vc.vertex(m, x2, y2, 0f).color(255, 255, 255, 255).texture(u2, v2)
          .overlay(OverlayTexture.DEFAULT_UV).light(light).normal(m, 0f, 1f, 0f);
        vc.vertex(m, x3, y3, 0f).color(255, 255, 255, 255).texture(u3, v3)
          .overlay(OverlayTexture.DEFAULT_UV).light(light).normal(m, 0f, 1f, 0f);
        vc.vertex(m, x4, y4, 0f).color(255, 255, 255, 255).texture(u4, v4)
          .overlay(OverlayTexture.DEFAULT_UV).light(light).normal(m, 0f, 1f, 0f);
    }
}
