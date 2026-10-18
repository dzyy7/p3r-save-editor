import { PARTY_MEMBERS } from "./constants.js";
import { getPartyMembers, versionedIndex } from "./core-values.js";
import { readPersonaSkillSlots, writePersonaSkillSlot } from "./persona-skills.js";

// In the main game every party member except the protagonist (whose Personas
// live in the stock) has one fixed Persona. In Episode Aigis the same layout is
// used for Metis and the returning members, but playable Aigis is excluded: her
// "personaBase" is the start of her 12-slot carried Persona stock, which is
// edited from the Personas tab instead.
function supportingParty(save) {
  if (!save.isEpisodeAigis) {
    return PARTY_MEMBERS.filter((member) => member.key !== "protagonist");
  }
  return getPartyMembers(save).filter((member) => member.key !== "aigis");
}

function findMember(save, memberKey) {
  return supportingParty(save).find((member) => member.key === memberKey);
}

function personaBase(save, member) {
  return versionedIndex(save, member.personaBase);
}

function readPartyPersona(save, member) {
  const base = personaBase(save, member);
  const identity = save.getWord(base);
  const skillSlots = readPersonaSkillSlots(save, base);
  return {
    memberKey: member.key,
    memberName: member.name,
    id: (identity >>> 16) & 0xffff,
    skillSlots,
    skills: skillSlots.filter(Boolean),
  };
}

export function getPartyPersonas(save) {
  return supportingParty(save).map((member) => readPartyPersona(save, member));
}

export function setPartyPersonaSkill(save, memberKey, skillSlot, skillId) {
  const member = findMember(save, memberKey);
  if (!member) {
    if (save.isEpisodeAigis && memberKey === "aigis") {
      throw new Error("Aigis's Personas are edited from the Personas tab.");
    }
    throw new Error("Unknown party member.");
  }

  const current = readPartyPersona(save, member);
  if (!current.id) throw new Error(`${member.name} does not have an active Persona in this save.`);
  writePersonaSkillSlot(
    save,
    personaBase(save, member),
    current.skillSlots,
    skillSlot,
    skillId,
  );
}
