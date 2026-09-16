package com.voxelcyberstreet;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import net.minecraft.util.Identifier;

import java.io.InputStream;
import java.io.InputStreamReader;
import java.lang.reflect.Type;
import java.nio.charset.StandardCharsets;
import java.util.*;

/**
 * Loads the pack registry from assets/voxelcyberstreet/skins.json — which is
 * the BEDROCK skin-pack format (serialize_name / localization_name / skins[]
 * with geometry + texture + type, per learn.microsoft.com packagingaskinpack),
 * identical to the metadata shipped inside the .mcpacks. One metadata source
 * for both editions.
 *
 * Fabric-only texture resolution (namespaced ids, glow layers, capes, NPC
 * roles) lives in the sidecar textures.json, keyed by the same root texture
 * names; the two files are merged here at load time.
 */
public final class SkinRegistry {
    public static final class Entry {
        public String id, accent, hair, fit, npcRole;
        public Identifier skin, glow, cape;
    }

    private static final List<Entry> ENTRIES = new ArrayList<>();

    public static synchronized void load() {
        if (!ENTRIES.isEmpty()) return;
        Gson gson = new Gson();
        try (InputStream is = SkinRegistry.class
                .getResourceAsStream("/assets/voxelcyberstreet/skins.json")) {
            if (is == null) {
                LOGGER.warn("[VOXEL CYBER-STREET] skins.json not found on classpath");
                return;
            }
            // --- Bedrock-format skins.json (the shared metadata source)
            Type rootType = new TypeToken<Map<String, Object>>(){}.getType();
            Map<String, Object> root = gson.fromJson(new InputStreamReader(is, StandardCharsets.UTF_8), rootType);
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> list = (List<Map<String, Object>>) root.get("skins");
            if (list == null) {
                LOGGER.warn("[VOXEL CYBER-STREET] skins.json has no skins array");
                return;
            }

            // --- Fabric sidecar: root texture name → texture paths + metadata
            Map<String, Map<String, Object>> texMap = new HashMap<>();
            try (InputStream ts = SkinRegistry.class
                    .getResourceAsStream("/assets/voxelcyberstreet/textures.json")) {
                if (ts != null) {
                    Map<String, Object> troot = gson.fromJson(new InputStreamReader(ts, StandardCharsets.UTF_8), rootType);
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> tlist = (List<Map<String, Object>>) troot.get("textures");
                    if (tlist != null) {
                        for (Map<String, Object> t : tlist) {
                            Object name = t.get("texture");
                            if (name != null) texMap.put(String.valueOf(name), t);
                        }
                    }
                }
            }

            for (Map<String, Object> e : list) {
                Entry en = new Entry();
                en.id = String.valueOf(e.get("localization_name"));
                String texture = String.valueOf(e.get("texture")); // root name, e.g. "cyber_teen_02_pink-cyan.png"
                en.skin = Identifier.of("voxelcyberstreet", "skins/" + texture);
                Map<String, Object> side = texMap.get(texture);
                if (side != null) {
                    en.accent  = str(side.get("accent"));
                    en.hair    = str(side.get("hair"));
                    en.fit     = str(side.get("fit"));
                    en.npcRole = str(side.get("npcRole"));
                    en.glow    = of(side.get("glow"));
                    en.cape    = of(side.get("cape"));
                } else {
                    LOGGER.warn("[VOXEL CYBER-STREET] no textures.json entry for {}", texture);
                    en.glow = en.skin;
                }
                ENTRIES.add(en);
            }
        } catch (Exception ex) {
            LOGGER.warn("[VOXEL CYBER-STREET] skins.json parse failed", ex);
        }
    }

    private static String str(Object o) { return o == null ? null : String.valueOf(o); }

    /** "namespace:path" → Identifier (1.21: constructors are private, use of()). */
    private static Identifier of(Object full) {
        if (full == null) return null;
        String s = String.valueOf(full);
        int i = s.indexOf(':');
        return Identifier.of(s.substring(0, i), s.substring(i + 1));
    }

    public static Entry random()  { load(); return ENTRIES.isEmpty() ? null : ENTRIES.get(new Random().nextInt(ENTRIES.size())); }
    public static int count()     { load(); return ENTRIES.size(); }
    public static List<Entry> all() { load(); return Collections.unmodifiableList(ENTRIES); }

    public static final org.slf4j.Logger LOGGER =
            org.slf4j.LoggerFactory.getLogger("voxelcyberstreet");
}
