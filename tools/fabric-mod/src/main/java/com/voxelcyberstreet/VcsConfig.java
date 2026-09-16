package com.voxelcyberstreet;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.List;

/**
 * Buyer-facing configuration — no code edits needed. Loads from
 * config/voxelcyberstreet.json (created on first boot from the defaults below,
 * which are also shipped in the jar for reference), and hot-reloads on
 * /vconfig reload.
 */
public final class VcsConfig {
    /** ~1/3 of naturally spawned zombie villagers convert (vanilla-egg style). */
    public int corruptionRate = 3;            // 1-in-N; 0 disables random conversions
    /** Draw the glowing tech cape on Corrupted Skins. */
    public boolean capes = true;
    /** Emissive neon-accents pass on Corrupted Skins. */
    public boolean glow = true;
    /** Register the Corrupted Skin spawn egg (set false to hide the item). */
    public boolean spawnEgg = true;
    /** Named corrupted villagers keep their nameplate hidden (cleaner shots). */
    public boolean hideEggNames = true;
    /** Corrupted villagers spawned by the egg stop moving (screenshot posing). */
    public boolean eggPoseMode = true;

    public static final List<String> DOCUMENTATION = List.of(
            "corruptionRate : int >= 0  — 1-in-N chance a naturally spawned zombie villager",
            "                              renders as a Corrupted Skin. 0 disables conversions.",
            "capes           : boolean   — draw the glowing tech cape on Corrupted Skins.",
            "glow            : boolean   — emissive neon-accents pass (mask, zips, stripes).",
            "spawnEgg        : boolean   — register the Corrupted Skin spawn egg item.",
            "hideEggNames    : boolean   — hide nameplates on corrupted villagers (clean shots).",
            "eggPoseMode     : boolean   — egg-spawned villagers freeze in place (NoAI)."
    );

    /** Localized config guides, written next to the JSON (Minecraft's own
     *  language choice can't drive a plain text file, so all four ship). */
    private static final java.util.Map<String, List<String>> DOCS_BY_LANG = new java.util.LinkedHashMap<>(java.util.Map.of(
        "de_DE", List.of(
            "VOXEL CYBER-STREET — Konfiguration (config/voxelcyberstreet.json)",
            "",
            "corruptionRate : int >= 0 — jede natuerlich gespawnte Zombie-Dorfbewohnerin wird",
            "                           mit einer Chance von 1 zu N zur Corrupted Skin. 0 = aus.",
            "capes           : boolean — leuchtender Tech-Umhang an Corrupted Skins.",
            "glow            : boolean — emissiver Neon-Akzent-Pass (Maske, Reißverschlüsse, Streifen).",
            "spawnEgg        : boolean — Corrupted-Skin-Spawn-Ei als Gegenstand registrieren.",
            "hideEggNames    : boolean — Namensschilder der Corrupted Skins ausblenden (saubere Shots).",
            "eggPoseMode     : boolean — per Ei gespawnte Dorfbewohner frieren ein (NoAI, Posen).",
            "",
            "Im Spiel: /vconfig (Anzeige) · /vconfig set <feld> <wert> · /vconfig reload"
        ),
        "fr_FR", List.of(
            "VOXEL CYBER-STREET — Configuration (config/voxelcyberstreet.json)",
            "",
            "corruptionRate : int >= 0 — chaque villageois zombie apparait naturellement a une",
            "                           chance de 1 sur N de devenir une Corrupted Skin. 0 = off.",
            "capes           : boolean — cape tech lumineuse sur les Corrupted Skins.",
            "glow            : boolean — passe emissive des accents neon (masque, zips, bandes).",
            "spawnEgg        : boolean — enregistrer l'oeuf d'apparition Corrupted Skin.",
            "hideEggNames    : boolean — masquer les plaquettes de nom (plans plus propres).",
            "eggPoseMode     : boolean — les villageois issus de l'oeuf restent figes (NoAI).",
            "",
            "En jeu : /vconfig (etat) · /vconfig set <champ> <valeur> · /vconfig reload"
        ),
        "ja_JP", List.of(
            "VOXEL CYBER-STREET — \u8a2d\u5b9a\u30ac\u30a4\u30c9\uff08config/voxelcyberstreet.json\uff09",
            "",
            "corruptionRate : int >= 0 \u2014 \u81ea\u7136\u30b9\u30dd\u30fc\u30f3\u3055\u308c\u305f\u30be\u30f3\u30d3\u306e\u6751\u4eba\u304c 1/N \u306e\u78ba\u7387\u3067",
            "                           Corrupted Skin \u306b\u306a\u308a\u307e\u3059\u30020 \u3067\u7121\u52b9\u3002",
            "capes           : boolean — Corrupted Skin \u306b\u767a\u514d\u30c6\u30af\u30de\u30f3\u30c6\u30a3\u30b1\u30fc\u30d7\u3092\u63cf\u753b\u3002",
            "glow            : boolean — \u30cd\u30aa\u30f3\u30a2\u30af\u30bb\u30f3\u30c8\u306e\u81ea\u5df1\u767a\u514d\u30d1\u30b9\uff08\u30de\u30b9\u30af\u30fb\u30d5\u30a1\u30b9\u30ca\u30fc\u30fb\u30b7\u30e5\u30fc\u306e\u30e9\u30a4\u30f3\uff09\u3002",
            "spawnEgg        : boolean — Corrupted Skin \u306e\u30b9\u30dd\u30fc\u30f3\u30a8\u30c3\u30b0\u3092\u767b\u9332\u3002",
            "hideEggNames    : boolean — \u540d\u524d\u30d7\u30ec\u30fc\u30c8\u3092\u975e\u8868\u793a\uff08\u64ae\u5f71\u7528\uff09\u3002",
            "eggPoseMode     : boolean — \u30a8\u30c3\u30b0\u304b\u3089\u51fa\u305f\u6751\u4eba\u306f\u305d\u306e\u5834\u3067\u505c\u6b62\uff08NoAI\uff09\u3002",
            "",
            "\u30b2\u30fc\u30e0\u5185\uff1a /vconfig\uff08\u8868\u793a\uff09\u30fb /vconfig set <\u9805\u76ee> <\u5024> \u30fb /vconfig reload"
        )
    ));

    private static final Gson GSON = new GsonBuilder().setPrettyPrinting().create();
    private static VcsConfig INSTANCE;

    public static synchronized VcsConfig get() {
        if (INSTANCE == null) load();
        return INSTANCE;
    }

    public static Path configPath() {
        return net.fabricmc.loader.api.FabricLoader.getInstance().getConfigDir()
                .resolve(VoxelCyberStreet.MOD_ID + ".json");
    }

    public static synchronized void load() {
        Path p = configPath();
        try {
            if (Files.exists(p)) {
                INSTANCE = GSON.fromJson(Files.readString(p, StandardCharsets.UTF_8), VcsConfig.class);
                if (INSTANCE == null) INSTANCE = new VcsConfig();
            } else {
                INSTANCE = new VcsConfig();
                save();
            }
        } catch (Exception e) {
            SkinRegistry.LOGGER.warn("[VOXEL CYBER-STREET] config unreadable ({}), using defaults", e.toString());
            INSTANCE = new VcsConfig();
        }
        // repair out-of-range values instead of crashing a buyer's client
        if (INSTANCE.corruptionRate < 0) INSTANCE.corruptionRate = 0;
    }

    public static synchronized void save() {
        try {
            Path p = configPath();
            Files.createDirectories(p.getParent());
            Files.writeString(p, GSON.toJson(INSTANCE) + "\n", StandardCharsets.UTF_8);
            // localized guides next to the JSON — EN (canonical) + DE/FR/JA
            writeDoc(p, VoxelCyberStreet.MOD_ID + ".README.txt",
                    concat(List.of("VOXEL CYBER-STREET — configuration guide (config/voxelcyberstreet.json)", ""), DOCUMENTATION,
                           List.of("", "In game: /vconfig (show) · /vconfig set <field> <value> · /vconfig reload")));
            for (var e : DOCS_BY_LANG.entrySet()) {
                writeDoc(p, VoxelCyberStreet.MOD_ID + ".README." + e.getKey() + ".txt", e.getValue());
            }
        } catch (IOException e) {
            SkinRegistry.LOGGER.warn("[VOXEL CYBER-STREET] config save failed: {}", e.toString());
        }
    }

    private static List<String> concat(List<String> a, List<String> b, List<String> c) {
        List<String> all = new java.util.ArrayList<>(a);
        all.addAll(b); all.addAll(c);
        return all;
    }

    private static void writeDoc(Path configPath, String name, List<String> lines) {
        try {
            Files.writeString(configPath.resolveSibling(name), String.join("\n", lines) + "\n", StandardCharsets.UTF_8);
        } catch (IOException e) {
            SkinRegistry.LOGGER.warn("[VOXEL CYBER-STREET] config doc write failed ({}): {}", name, e.toString());
        }
    }

    public static synchronized void reload() {
        load();
        SkinRegistry.LOGGER.info("[VOXEL CYBER-STREET] config reloaded: rate 1/{}, capes {}, glow {}, egg {}",
                Math.max(1, get().corruptionRate == 0 ? 1 : get().corruptionRate),
                get().capes, get().glow, get().spawnEgg);
    }
}
