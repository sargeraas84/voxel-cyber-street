package com.voxelcyberstreet;

import net.minecraft.entity.EntityType;
import net.minecraft.entity.SpawnReason;
import net.minecraft.entity.effect.StatusEffectInstance;
import net.minecraft.entity.effect.StatusEffects;
import net.minecraft.entity.mob.MobEntity;
import net.minecraft.entity.mob.ZombieVillagerEntity;
import net.minecraft.item.Item;
import net.minecraft.item.ItemGroup;
import net.minecraft.item.ItemGroups;
import net.minecraft.item.ItemStack;
import net.minecraft.item.SpawnEggItem;
import net.minecraft.item.tooltip.TooltipType;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;
import net.minecraft.registry.RegistryKey;
import net.minecraft.registry.RegistryKeys;
import net.minecraft.text.Text;
import net.minecraft.util.ActionResult;
import net.minecraft.util.Formatting;
import net.minecraft.util.Hand;
import net.minecraft.util.Identifier;
import net.minecraft.util.hit.EntityHitResult;
import net.minecraft.util.math.random.Random;

import java.util.List;

/**
 * "Corrupted Skin" spawn egg — lets buyers place a guaranteed corrupted
 * cyber-teen zombie villager on demand instead of relying on the mod's ~1-in-3
 * random conversion.
 *
 * Right-click on a block: spawns a random-skin corrupted villager (NoAI, persistent,
 * brief glowing shimmer so the render path is obvious). Right-click ON an existing
 * zombie villager: converts it in place ("corruption" splash particles) and names
 * it cyber_NN so it pins an exact, repeatable pack skin (see CorruptedSkins).
 */
public final class CorruptedSkinSpawnEgg {
    public static final String ITEM_ID = "corrupted_skin_spawn_egg";
    /** Synced with the Spawn Eggs tab's translation key (itemGroup.spawnEggs). */
    public static final RegistryKey<ItemGroup> SPAWN_EGGS_TAB =
            RegistryKey.of(RegistryKeys.ITEM_GROUP, Identifier.of("minecraft", "spawn_eggs"));

    private static Item EGG;

    public static void register() {
        EGG = Registry.register(
                Registries.ITEM,
                Identifier.of(VoxelCyberStreet.MOD_ID, ITEM_ID),
                new CorruptedEggItem(new Item.Settings()));
    }

    /** Visible in the vanilla Spawn Eggs creative tab, after the vanilla eggs. */
    public static void addToItemGroups() {
        net.fabricmc.fabric.api.itemgroup.v1.ItemGroupEvents.modifyEntriesEvent(SPAWN_EGGS_TAB)
                .register(entries -> entries.add(EGG));
    }

    public static Item item() { return EGG; }

    private static class CorruptedEggItem extends SpawnEggItem {
        CorruptedEggItem(Settings settings) {
            // vanilla egg colors: hot pink primary / electric cyan secondary
            super(EntityType.ZOMBIE_VILLAGER, 0xFF2E95, 0x19E3FF, settings);
        }

        @Override
        public ActionResult useOnBlock(net.minecraft.item.ItemUsageContext context) {
            ActionResult r = super.useOnBlock(context);   // vanilla placement path
            if (r.isAccepted()) {
                var world = context.getWorld();
                var hit = context.getBlockPos().offset(context.getSide());
                // decorate every newly placed villager near the click
                List<ZombieVillagerEntity> fresh = world.getEntitiesByClass(
                        ZombieVillagerEntity.class,
                        new net.minecraft.util.math.Box(hit).expand(1.5),
                        z -> !CorruptedSkins.isCorrupted(z.getUuid()) && !CorruptedSkins.isForced(z));
                for (ZombieVillagerEntity z : fresh) corrupt(z, world.getRandom());
                if (!fresh.isEmpty() && context.getPlayer() != null) {
                    context.getPlayer().sendMessage(
                            Text.literal("[VOXEL CYBER-STREET] Corrupted Skin placed — it's already wearing the streets."),
                            false);
                }
            }
            return r;
        }

        @Override
        public ActionResult useOnEntity(net.minecraft.item.ItemStack stack, net.minecraft.entity.player.PlayerEntity user,
                                        net.minecraft.entity.LivingEntity target, Hand hand) {
            if (target instanceof ZombieVillagerEntity zv) {
                if (!user.getEntityWorld().isClient) {
                    corrupt(zv, user.getWorld().getRandom());
                    user.sendMessage(Text.literal(
                            "[VOXEL CYBER-STREET] Zombie villager corrupted in place — cyber-street infusion complete."), false);
                    if (!user.getAbilities().creativeMode) stack.decrement(1);
                }
                return ActionResult.success(user.getEntityWorld().isClient);
            }
            return ActionResult.PASS;
        }

        @Override
        public void appendTooltip(ItemStack stack, net.minecraft.item.Item.TooltipContext context,
                                  List<Text> tooltip, TooltipType type) {
            tooltip.add(Text.literal("Spawns a Corrupted Skin — a cyber-teen zombie villager with a glowing tech cape.")
                    .formatted(Formatting.AQUA));
            tooltip.add(Text.literal("Right-click a zombie villager to corrupt it in place.").formatted(Formatting.GRAY));
        }

        private static void corrupt(ZombieVillagerEntity z, Random random) {
            CorruptedSkins.MARKED.add(z.getUuid());      // skin + glowing cape render path
            z.setPersistent();                            // never despawns
            if (VcsConfig.get().eggPoseMode) z.setAiDisabled(true);  // buyer toggle: freeze pose
            if (VcsConfig.get().hideEggNames) z.setCustomName(null); // keep shots clean
            z.addStatusEffect(new StatusEffectInstance(StatusEffects.GLOWING, 60, 0, false, false));
        }
    }
}
