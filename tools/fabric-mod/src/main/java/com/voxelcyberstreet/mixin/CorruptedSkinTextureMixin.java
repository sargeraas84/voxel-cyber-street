package com.voxelcyberstreet.mixin;

import com.voxelcyberstreet.CorruptedSkins;
import com.voxelcyberstreet.SkinRegistry;
import net.minecraft.client.render.entity.ZombieVillagerEntityRenderer;
import net.minecraft.entity.mob.ZombieVillagerEntity;
import net.minecraft.util.Identifier;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfoReturnable;

/**
 * "Corrupted Skin" visuals — a marked zombie villager (see ZombieVillagerMixin)
 * renders with a random pack cyber-teen skin instead of the vanilla villager
 * texture. The glowing tech cape is drawn by CorruptedCapeFeatureRenderer,
 * registered from the client entrypoint.
 */
@Mixin(ZombieVillagerEntityRenderer.class)
public abstract class CorruptedSkinTextureMixin {
    @Inject(method = "getTexture(Lnet/minecraft/entity/mob/ZombieVillagerEntity;)Lnet/minecraft/util/Identifier;",
            at = @At("HEAD"), cancellable = true)
    private void voxelcyberstreet$corruptedTexture(ZombieVillagerEntity entity, CallbackInfoReturnable<Identifier> cir) {
        SkinRegistry.Entry e = CorruptedSkins.skinFor(entity); // random conversions + forced cyber_NN names
        if (e != null) cir.setReturnValue(e.skin);
    }
}
