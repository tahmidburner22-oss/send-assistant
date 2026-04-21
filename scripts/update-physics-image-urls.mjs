#!/usr/bin/env node
/**
 * Update Physics Worksheet Image URLs to CDN
 * Replaces /images/physics_*_nb.png paths with CDN URLs
 */

const APP_URL = process.env.APP_URL || "https://adaptly.co.uk";
const ADMIN_EMAIL = "admin@adaptly.co.uk";
const ADMIN_PASSWORD = "Admin1234!";

// Mapping of local paths to CDN URLs
const IMAGE_URL_MAP = {
  "/images/physics_forces_free_body_nb.png": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663583555750/zkSuTvubnsfNBoIs.png",
  "/images/physics_newtons_laws_nb.png": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663583555750/WILpmGwlIcIOkfKN.png",
  "/images/physics_resultant_forces_nb.png": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663583555750/mYCBbQHciWcqiKgP.png",
  "/images/physics_wave_diagram_nb.png": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663583555750/uvaYtmwPyRdXzkyf.png",
  "/images/physics_sankey_diagram_nb.png": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663583555750/XqbviarSsqHrbXDk.png",
  "/images/physics_energy_stores_nb.png": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663583555750/siLZbqojfGhRaIYE.png",
  "/images/physics_em_spectrum_nb.png": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663583555750/HuBTSumNEJvhHvyh.png",
  "/images/physics_specific_heat_capacity_nb.png": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663583555750/pXYeDkVAMmxZYwzF.png",
  "/images/physics_ray_diagram_refraction_nb.png": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663583555750/QjseAwOkurIpmPvb.png",
  "/images/physics_magnetic_field_nb.png": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663583555750/QwHdKMfyrTtBRRku.png",
  "/images/physics_nuclear_decay_nb.png": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663583555750/UtyUfgpCYTiMFXts.png",
  "/images/physics_solar_system_nb.png": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663583555750/LycRrZjPMQibpEmE.png",
  "/images/physics_states_matter_nb.png": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663583555750/CGQrndQaCjySfLCC.png",
  "/images/physics_pressure_fluids_nb.png": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663583555750/GrvijBvALEPIatFz.png",
  "/images/physics_half_life_nb.png": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663583555750/CMrtBgBZAmlfPnRm.png",
  "/images/physics_motor_effect_nb.png": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663583555750/PxSfGITTiCgeRSRQ.png",
  "/images/physics_transformer_nb.png": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663583555750/ruhCctpYhqlWZcNT.png",
  "/images/physics_star_lifecycle_nb.png": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663583555750/QGFBCYmlmLozVjoJ.png",
  "/images/physics_sound_waves_nb.png": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663583555750/xcoKHpNfYeTnIlHx.png",
  "/images/physics_light_reflection_nb.png": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663583555750/XysLQHtIjKixRNBW.png",
  "/images/physics_circuit_symbols_nb.png": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663583555750/HtlXACDMNlFbEKOx.png",
  "/images/physics_motion_graphs_nb.png": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663583555750/vXMWrPJETahirtsL.png",
  "/images/physics_ray_diagram_lens_nb.png": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663583555750/zUrgMMXxOALzStuG.png",
  "/images/physics_nuclear_equations_nb.png": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663583555750/AUoaXsObijnMEehJ.png",
  "/images/physics_electromagnet_nb.png": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663583555750/QRsqvMZWcFwfLGoW.png",
  "/images/physics_units_si_nb.png": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663583555750/JnYWQtQEmPPLQPnw.png",
  "/images/physics_specific_heat_capacity_y9_nb.png": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663583555750/gIXMspFHmFLnYPJC.png",
  "/images/physics_distance_time_graph_nb.png": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663583555750/WsfhLDndzRVCzdPQ.png",
  "/images/physics_velocity_time_graph_nb.png": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663583555750/BrJSjjliwgZASYdx.png",
};

function replaceSectionImageUrls(sections) {
  if (!Array.isArray(sections)) return sections;
  return sections.map(section => {
    if (section.imageUrl && IMAGE_URL_MAP[section.imageUrl]) {
      return { ...section, imageUrl: IMAGE_URL_MAP[section.imageUrl] };
    }
    return section;
  });
}

async function requestJson(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${options.method || "GET"} ${url} failed (${res.status}): ${err}`);
  }
  return res.json();
}

async function login() {
  const data = await requestJson(`${APP_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  return data.token || data.accessToken;
}

async function main() {
  console.log(`Logging in to ${APP_URL}...`);
  const token = await login();
  console.log("Logged in successfully.");

  // Get all Physics entries
  const data = await requestJson(`${APP_URL}/api/library/entries?subject=Physics`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const entries = data.entries || [];
  console.log(`Found ${entries.length} Physics entries.`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const entry of entries) {
    // Get full entry details
    const detail = await requestJson(`${APP_URL}/api/library/entries/${entry.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const fullEntry = detail.entry;
    if (!fullEntry) continue;

    const sections = fullEntry.sections || [];
    const teacherSections = fullEntry.teacherSections || fullEntry.teacher_sections || [];

    // Check if any section has a local image URL
    const hasLocalImages = sections.some(s => s.imageUrl && s.imageUrl.startsWith("/images/physics_"));
    
    if (!hasLocalImages) {
      skippedCount++;
      continue;
    }

    // Replace image URLs
    const updatedSections = replaceSectionImageUrls(sections);
    const updatedTeacherSections = replaceSectionImageUrls(teacherSections);

    // Update the entry
    try {
      await requestJson(`${APP_URL}/api/library/entries/${entry.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sections: updatedSections,
          teacher_sections: updatedTeacherSections,
        }),
      });
      console.log(`  ✅ Updated: ${entry.topic} (${entry.tier})`);
      updatedCount++;
    } catch (err) {
      console.log(`  ❌ Failed to update ${entry.topic} (${entry.tier}): ${err.message}`);
    }
  }

  console.log(`\nDone. Updated: ${updatedCount}, Skipped: ${skippedCount}`);
}

main().catch(err => {
  console.error("Update failed:", err);
  process.exit(1);
});
