package com.voxelcyberstreet.mixin;

import com.voxelcyberstreet.SkinRegistry;
import net.minecraft.client.network.AbstractClientPlayerEntity;
import net.minecraft.client.util.SkinTextures;
import net.minecraft.util.Identifier;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfoReturnable;

/**
 * PlayerEntity skin hook — NPC platforms that spawn fake players (Citizens, etc.)
 * resolve through AbstractClientPlayerEntity#getSkinTextures; we substitute pack
 * skins for player names starting with "cyber_" (e.g. "cyber_07" → skin #07),
 * keeping the pack's glowing cape attached.
 */
@Mixin(AbstractClientPlayerEntity.class)
public abstract class SkinApplierMixin {
    @Inject(method = "getSkinTextures", at = @At("HEAD"), cancellable = true)
    private void voxelcyberstreet$applyPackSkin(CallbackInfoReturnable<SkinTextures> cir) {
        AbstractClientPlayerEntity self = (AbstractClientPlayerEntity) (Object) this;
        String name = self.getGameProfile() == null ? null : self.getGameProfile().getName();
        if (name != null && name.startsWith("cyber_")) {
            try {
                int idx = Integer.parseInt(name.substring(6)) - 1;
                var entries = SkinRegistry.all();
                if (idx >= 0 && idx < entries.size()) {
                    SkinRegistry.Entry e = entries.get(idx);
                    // SkinTextures record: (texture, textureUrl, capeTexture, elytraTexture, model, secure)
                    cir.setReturnValue(new SkinTextures(
                            e.skin, null, e.cape, e.cape,
                            SkinTextures.Model.WIDE, true));
                }
            } catch (NumberFormatException ignored) {}
        }
    }
}
