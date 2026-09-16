package com.voxelcyberstreet.mixin;

import com.voxelcyberstreet.CorruptedSkins;
import com.voxelcyberstreet.VcsConfig;
import net.minecraft.entity.mob.ZombieVillagerEntity;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;

/**
 * "Corrupted Skin" — roughly one in three zombie villagers is a converted
 * cyber-teen. The entity's UUID is recorded in a marker set at construction;
 * the client renderer reads it to draw the pack's glowing cape. (The CONVERTING
 * data-tracker field is private and remaps unstably, so we track our own.)
 */
@Mixin(ZombieVillagerEntity.class)
public abstract class ZombieVillagerMixin {
    @Inject(method = "<init>", at = @At("RETURN"))
    private void voxelcyberstreet$markCorrupted(CallbackInfo ci) {
        int rate = VcsConfig.get().corruptionRate;   // buyer-configurable 1-in-N (0 = off)
        if (rate > 0 && CorruptedSkins.RNG.nextInt(rate) == 0) {
            CorruptedSkins.MARKED.add(((ZombieVillagerEntity) (Object) this).getUuid());
        }
    }
}
