// /backend/scripts/completeAllCaseSkinsMapping.js — [Backend]
// {/* Complete case-skin mappings for ALL CS:GO/CS2 cases */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Complete case-skin mappings from CS:GO/CS2 official data
const COMPLETE_CASE_SKINS = {
  // ========== KILOWATT CASE ==========
  "kilowatt case": {
    covert: ["USP-S | Jawbreaker", "Zeus x27 | Olympus"],
    classified: ["M4A1-S | Black Lotus", "Glock-18 | Block-18", "MAC-10 | Light Box"],
    restricted: ["P90 | Neoqueen", "MP9 | Featherweight", "Tec-9 | Slag", "AWP | Duality", "P2000 | Wicked Sick"],
    milspec: ["Dual Berettas | Hideout", "Nova | Dark Sigil", "Sawed-Off | Analog Input", "MAG-7 | BI83 Spectrum", "M249 | Downtown", "UMP-45 | Motorized", "XM1014 | Irezumi"],
    knives: ["Bayonet", "Bowie Knife", "Butterfly Knife", "Classic Knife", "Falchion Knife", "Flip Knife", "Gut Knife", "Huntsman Knife", "Karambit", "M9 Bayonet", "Nomad Knife", "Paracord Knife", "Shadow Daggers", "Skeleton Knife", "Stiletto Knife", "Survival Knife", "Talon Knife", "Ursus Knife"]
  },

  // ========== REVOLUTION CASE ==========
  "revolution case": {
    covert: ["P90 | Neoqueen", "M4A4 | Temukau"],
    classified: ["AWP | Duality", "R8 Revolver | Banana Cannon", "Tec-9 | Fubar"],
    restricted: ["Glock-18 | Umbral Rabbit", "AK-47 | Ice Coaled", "P250 | Re.built", "MAC-10 | Sakkaku", "M4A1-S | Emphorosaur-S"],
    milspec: ["USP-S | Revolution", "MP9 | Featherweight", "P2000 | Wicked Sick", "Sawed-Off | Analog Input", "UMP-45 | Motorized", "XM1014 | Irezumi", "Desert Eagle | Sputnik"],
    knives: ["Bayonet", "Bowie Knife", "Butterfly Knife", "Classic Knife", "Falchion Knife", "Flip Knife", "Gut Knife", "Huntsman Knife", "Karambit", "M9 Bayonet", "Nomad Knife", "Paracord Knife", "Shadow Daggers", "Skeleton Knife", "Stiletto Knife", "Survival Knife", "Talon Knife", "Ursus Knife"]
  },

  // ========== RECOIL CASE ==========
  "recoil case": {
    covert: ["AWP | Chromatic Aberration", "AK-47 | Ice Coaled"],
    classified: ["USP-S | Printstream", "M4A4 | Poly Mag", "Dual Berettas | Melondrama"],
    restricted: ["R8 Revolver | Crazy 8", "P250 | Visions", "MAC-10 | Monkeyflage", "UMP-45 | Wild Child", "Glock-18 | Winterized"],
    milspec: ["M249 | Downtown", "SG 553 | Cyberforce", "P90 | Vent Rush", "PP-Bizon | Lumen", "AWP | Duality", "Five-SeveN | Boost Protocol", "AUG | Insurrection"],
    knives: ["Bayonet", "Bowie Knife", "Butterfly Knife", "Classic Knife", "Falchion Knife", "Flip Knife", "Gut Knife", "Huntsman Knife", "Karambit", "M9 Bayonet", "Nomad Knife", "Paracord Knife", "Shadow Daggers", "Skeleton Knife", "Stiletto Knife", "Survival Knife", "Talon Knife", "Ursus Knife"]
  },

  // ========== DREAMS & NIGHTMARES CASE ==========
  "dreams & nightmares case": {
    covert: ["AK-47 | Nightwish", "MP9 | Starlight Protector"],
    classified: ["FAMAS | Rapid Eye Movement", "Dual Berettas | Melondrama", "USP-S | Ticket to Hell"],
    restricted: ["G3SG1 | Dream Glade", "MAC-10 | Ensnared", "M4A1-S | Night Terror", "XM1014 | Zombie Offensive", "Five-SeveN | Scrawl"],
    milspec: ["PP-Bizon | Space Cat", "MP5-SD | Necro Jr.", "AUG | Dread", "P2000 | Lifted Spirits", "MAG-7 | Foresight", "Negev | Drop Me", "MP7 | Tall Grass"],
    knives: ["Bayonet", "Bowie Knife", "Butterfly Knife", "Classic Knife", "Falchion Knife", "Flip Knife", "Gut Knife", "Huntsman Knife", "Karambit", "M9 Bayonet", "Nomad Knife", "Paracord Knife", "Shadow Daggers", "Skeleton Knife", "Stiletto Knife", "Survival Knife", "Talon Knife", "Ursus Knife"]
  },

  // ========== GALLERY CASE ==========
  "gallery case": {
    covert: ["M4A1-S | Atoll", "AK-47 | Neon Neon Revolution"],
    classified: ["AWP | Chromatic Aberration", "UMP-45 | Wild Child", "Glock-18 | Gamma Doppler"],
    restricted: ["P90 | Shapewood", "MAC-10 | Toybox", "Tec-9 | Fubar", "Desert Eagle | Ocean Drive", "MP7 | Guerrilla"],
    milspec: ["Nova | Windblown", "Dual Berettas | Shred", "SG 553 | Cyberforce", "XM1014 | Elegant Vines", "MAG-7 | Insomnia", "Sawed-Off | Bamboo Shadow", "P250 | Cassette"],
    knives: ["Bayonet", "Bowie Knife", "Butterfly Knife", "Classic Knife", "Falchion Knife", "Flip Knife", "Gut Knife", "Huntsman Knife", "Karambit", "M9 Bayonet", "Nomad Knife", "Paracord Knife", "Shadow Daggers", "Skeleton Knife", "Stiletto Knife", "Survival Knife", "Talon Knife", "Ursus Knife"]
  },

  // ========== OPERATION RIPTIDE CASE ==========
  "operation riptide case": {
    covert: ["AK-47 | Leet Museo", "M4A4 | In Living Color"],
    classified: ["Five-SeveN | Hybrid Hunter", "M4A1-S | Welcome to the Jungle", "SSG 08 | Parallax"],
    restricted: ["UMP-45 | Arctic Wolf", "Glock-18 | Snack Attack", "MAC-10 | Sienna Damask", "P90 | Cocoa Rampage", "Desert Eagle | Sputnik"],
    milspec: ["MAG-7 | BI83 Spectrum", "MP9 | Mount Fuji", "MP5-SD | Necro Jr.", "Nova | Clear Polymer", "XM1014 | XOXO", "Negev | Prototype", "P2000 | Gnarled"],
    knives: ["Bayonet", "Bowie Knife", "Butterfly Knife", "Classic Knife", "Falchion Knife", "Flip Knife", "Gut Knife", "Huntsman Knife", "Karambit", "M9 Bayonet", "Nomad Knife", "Paracord Knife", "Shadow Daggers", "Skeleton Knife", "Stiletto Knife", "Survival Knife", "Talon Knife", "Ursus Knife"]
  },

  // ========== SNAKEBITE CASE ==========
  "snakebite case": {
    covert: ["AWP | Exoskeleton", "AK-47 | Slate"],
    classified: ["M4A4 | Tooth Fairy", "Glock-18 | Snack Attack", "SSG 08 | Parallax"],
    restricted: ["R8 Revolver | Junk Yard", "MAC-10 | Button Masher", "P90 | Cocoa Rampage", "UMP-45 | Gold Bismuth", "XM1014 | XOXO"],
    milspec: ["Nova | Windblown", "MP5-SD | Condition Zero", "P2000 | Acid Etched", "PP-Bizon | Lumen", "Tec-9 | Snek-9", "Dual Berettas | Dezastre", "Desert Eagle | Bronze Deco"],
    gloves: ["Hand Wraps", "Moto Gloves", "Specialist Gloves", "Sport Gloves", "Driver Gloves", "Bloodhound Gloves", "Broken Fang Gloves"]
  },

  // ========== OPERATION BROKEN FANG CASE ==========
  "operation broken fang case": {
    covert: ["M4A1-S | Printstream", "Glock-18 | Neo-Noir"],
    classified: ["P90 | Cocoa Rampage", "USP-S | Monster Mashup", "AK-47 | Legion of Anubis"],
    restricted: ["Five-SeveN | Fairy Tale", "M4A4 | Cyber Security", "UMP-45 | Gold Bismuth", "CZ75-Auto | Vendetta", "Desert Eagle | Printstream"],
    milspec: ["Galil AR | Vandal", "G3SG1 | Digital Mesh", "MAG-7 | Monster Call", "MP5-SD | Condition Zero", "Nova | Clear Polymer", "P2000 | Acid Etched", "XM1014 | XOXO"],
    gloves: ["Hand Wraps", "Moto Gloves", "Specialist Gloves", "Sport Gloves", "Driver Gloves", "Bloodhound Gloves", "Broken Fang Gloves"]
  },

  // ========== FRACTURE CASE ==========
  "fracture case": {
    covert: ["AK-47 | Legion of Anubis", "M4A1-S | Printstream"],
    classified: ["Glock-18 | Vogue", "M4A4 | Tooth Fairy", "Five-SeveN | Fairy Tale"],
    restricted: ["UMP-45 | Fade", "MAC-10 | Disco Tech", "XM1014 | Entombed", "Desert Eagle | Printstream", "P90 | Cocoa Rampage"],
    milspec: ["Negev | Ultralight", "MP5-SD | Kitbash", "Galil AR | Vandal", "MAG-7 | Monster Call", "SG 553 | Ol' Rusty", "P250 | Contaminant", "Tec-9 | Brother"],
    knives: ["Bayonet", "Bowie Knife", "Butterfly Knife", "Classic Knife", "Falchion Knife", "Flip Knife", "Gut Knife", "Huntsman Knife", "Karambit", "M9 Bayonet", "Nomad Knife", "Paracord Knife", "Shadow Daggers", "Skeleton Knife", "Stiletto Knife", "Survival Knife", "Talon Knife", "Ursus Knife"]
  },

  // ========== CLUTCH CASE ==========
  "clutch case": {
    covert: ["AWP | Mortis", "M4A4 | Neo-Noir"],
    classified: ["USP-S | Cortex", "MP7 | Bloodsport", "AUG | Stymphalian"],
    restricted: ["Glock-18 | Moonrise", "R8 Revolver | Grip", "UMP-45 | Arctic Wolf", "MP9 | Black Sand", "Five-SeveN | Flameburst"],
    milspec: ["M249 | Emerald Poison Dart", "P2000 | Urban Hazard", "Nova | Wild Six", "MAG-7 | SWAG-7", "SG 553 | Aloha", "Tec-9 | Remote Control", "Negev | Lionfish"],
    knives: ["Bayonet", "Bowie Knife", "Butterfly Knife", "Falchion Knife", "Flip Knife", "Gut Knife", "Huntsman Knife", "Karambit", "M9 Bayonet", "Shadow Daggers", "Navaja Knife", "Stiletto Knife", "Talon Knife", "Ursus Knife"]
  },

  // ========== HORIZON CASE ==========
  "horizon case": {
    covert: ["AK-47 | Neon Rider", "AWP | Neo-Noir"],
    classified: ["Desert Eagle | Code Red", "AUG | Stymphalian", "M4A1-S | Nightmare"],
    restricted: ["P250 | Nevermore", "CZ75-Auto | Eco", "Tec-9 | Bamboozle", "Galil AR | Akoben", "Five-SeveN | Angry Mob"],
    milspec: ["SG 553 | Darkwing", "Dual Berettas | Shred", "MAC-10 | Pipe Down", "MP7 | Neon Ply", "Glock-18 | Moonrise", "P2000 | Acid Etched", "Nova | Wood Fired"],
    knives: ["Bayonet", "Bowie Knife", "Butterfly Knife", "Falchion Knife", "Flip Knife", "Gut Knife", "Huntsman Knife", "Karambit", "M9 Bayonet", "Shadow Daggers", "Navaja Knife", "Stiletto Knife", "Talon Knife", "Ursus Knife"]
  },

  // ========== DANGER ZONE CASE ==========
  "danger zone case": {
    covert: ["AK-47 | Asiimov", "AWP | Neo-Noir"],
    classified: ["Desert Eagle | Mecha Industries", "USP-S | Flashback", "MP5-SD | Phosphor"],
    restricted: ["Glock-18 | Moonrise", "P250 | Nevermore", "Nova | Toy Soldier", "MP9 | Modest Threat", "MAC-10 | Pipe Down"],
    milspec: ["R8 Revolver | Skull Crusher", "Tec-9 | Fubar", "Dual Berettas | Dezastre", "SG 553 | Danger Close", "Sawed-Off | Black Sand", "PP-Bizon | Embargo", "M249 | Warbird"],
    knives: ["Bayonet", "Bowie Knife", "Butterfly Knife", "Falchion Knife", "Flip Knife", "Gut Knife", "Huntsman Knife", "Karambit", "M9 Bayonet", "Shadow Daggers", "Navaja Knife", "Stiletto Knife", "Talon Knife", "Ursus Knife"]
  },

  // ========== SPECTRUM 2 CASE ==========
  "spectrum 2 case": {
    covert: ["AK-47 | The Empress", "M4A1-S | Leaded Glass"],
    classified: ["PP-Bizon | High Roller", "XM1014 | Seasons", "MAC-10 | Oceanic"],
    restricted: ["CZ75-Auto | Tacticat", "AWP | Acheron", "MP9 | Goo", "USP-S | Blueprint", "Five-SeveN | Capillary"],
    milspec: ["M249 | Emerald Poison Dart", "P2000 | Acid Etched", "Sawed-Off | Wasteland Princess", "Tec-9 | Ice Cap", "UMP-45 | Exposure", "Dual Berettas | Twin Turbo", "Desert Eagle | Oxide Blaze"],
    knives: ["Bayonet", "Bowie Knife", "Butterfly Knife", "Falchion Knife", "Flip Knife", "Gut Knife", "Huntsman Knife", "Karambit", "M9 Bayonet", "Shadow Daggers", "Navaja Knife", "Stiletto Knife", "Talon Knife", "Ursus Knife"]
  },

  // ========== SPECTRUM CASE ==========
  "spectrum case": {
    covert: ["M4A1-S | Decimator", "AK-47 | Bloodsport"],
    classified: ["PP-Bizon | Judgement of Anubis", "USP-S | Neo-Noir", "P250 | See Ya Later"],
    restricted: ["AUG | Syd Mead", "M4A4 | Buzz Kill", "CZ75-Auto | Xiangliu", "MAC-10 | Candy Apple", "SG 553 | Triarch"],
    milspec: ["Glock-18 | Weasel", "UMP-45 | Scaffold", "MP7 | Cirrus", "Tec-9 | Avalanche", "P2000 | Turf", "Five-SeveN | Violent Daimyo", "Sawed-Off | Zander"],
    knives: ["Bayonet", "Bowie Knife", "Butterfly Knife", "Falchion Knife", "Flip Knife", "Gut Knife", "Huntsman Knife", "Karambit", "M9 Bayonet", "Shadow Daggers"]
  },

  // ========== GLOVE CASE ==========
  "glove case": {
    covert: ["Desert Eagle | Sunset Storm 壱", "USP-S | Kill Confirmed"],
    classified: ["Glock-18 | Wasteland Rebel", "P90 | Shallow Grave", "AK-47 | Fuel Injector"],
    restricted: ["AWP | Phobos", "CZ75-Auto | Polymer", "SSG 08 | Ghost Crusader", "Tec-9 | Ice Cap", "Five-SeveN | Triumvirate"],
    milspec: ["Dual Berettas | Royal Consorts", "MAG-7 | Sonar", "MP9 | Sand Scale", "MP7 | Cirrus", "Nova | Gila", "P250 | Iron Clad", "Sawed-Off | Fubar"],
    knives: ["Bayonet", "Bowie Knife", "Butterfly Knife", "Falchion Knife", "Flip Knife", "Gut Knife", "Huntsman Knife", "Karambit", "M9 Bayonet", "Shadow Daggers"],
    gloves: ["Hand Wraps", "Moto Gloves", "Specialist Gloves", "Sport Gloves"]
  },

  // ========== GAMMA 2 CASE ==========
  "gamma 2 case": {
    covert: ["M4A1-S | Mecha Industries", "Tec-9 | Fuel Injector"],
    classified: ["AK-47 | Neon Revolution", "AWP | Fever Dream", "P90 | Shallow Grave"],
    restricted: ["FAMAS | Roll Cage", "P250 | Iron Clad", "SSG 08 | Dragonfire", "Negev | Dazzle", "Glock-18 | Weasel"],
    milspec: ["M249 | Spectre", "PP-Bizon | Photic Zone", "Dual Berettas | Ventilators", "MAG-7 | Sonar", "Sawed-Off | Wasteland Princess", "Nova | Exo", "XM1014 | Frost Borre'd"],
    knives: ["Bayonet", "Bowie Knife", "Butterfly Knife", "Falchion Knife", "Flip Knife", "Gut Knife", "Huntsman Knife", "Karambit", "M9 Bayonet", "Shadow Daggers"]
  },

  // ========== GAMMA CASE ==========
  "gamma case": {
    covert: ["M4A1-S | Mecha Industries", "Glock-18 | Wasteland Rebel"],
    classified: ["AWP | Phobos", "P90 | Shallow Grave", "AUG | Aristocrat"],
    restricted: ["M4A4 | Desolate Space", "Tec-9 | Fuel Injector", "FAMAS | Mecha Industries", "P250 | Iron Clad", "XM1014 | Scumbria"],
    milspec: ["MP9 | Airlock", "PP-Bizon | Harvester", "MAC-10 | Carnivore", "UMP-45 | Briefing", "Dual Berettas | Dualing Dragons", "Nova | Exo", "Sawed-Off | Yorick"],
    knives: ["Bayonet", "Bowie Knife", "Butterfly Knife", "Falchion Knife", "Flip Knife", "Gut Knife", "Huntsman Knife", "Karambit", "M9 Bayonet", "Shadow Daggers"]
  },

  // ========== SHADOW CASE ==========
  "shadow case": {
    covert: ["M4A1-S | Golden Coil", "SSG 08 | Big Iron"],
    classified: ["AK-47 | Frontside Misty", "G3SG1 | Flux", "P2000 | Imperial Dragon"],
    restricted: ["M4A4 | Royal Paladin", "USP-S | Lead Conduit", "PP-Bizon | Judgement of Anubis", "Tec-9 | Jambiya", "Galil AR | Stone Cold"],
    milspec: ["Glock-18 | Wraiths", "MP7 | Special Delivery", "SG 553 | Phantom", "MAG-7 | Cobalt Core", "P90 | Shapewood", "Sawed-Off | Origami", "Dual Berettas | Duelist"],
    knives: ["Bayonet", "Bowie Knife", "Butterfly Knife", "Falchion Knife", "Flip Knife", "Gut Knife", "Huntsman Knife", "Karambit", "M9 Bayonet", "Shadow Daggers"]
  },

  // ========== REVOLVER CASE ==========
  "revolver case": {
    covert: ["M4A1-S | Hyper Beast", "R8 Revolver | Fade"],
    classified: ["AK-47 | Point Disarray", "P90 | Trigon", "AWP | Elite Build"],
    restricted: ["SG 553 | Aerial", "Desert Eagle | Corinthian", "P250 | Wingshot", "Five-SeveN | Retrobution", "XM1014 | Teclu Burner"],
    milspec: ["Negev | Ricochet", "MP9 | Pandora's Box", "Tec-9 | Avalanche", "UMP-45 | Torque", "MAC-10 | Rangeen", "M249 | Impact Drill", "Sawed-Off | Yorick"],
    knives: ["Bayonet", "Bowie Knife", "Butterfly Knife", "Falchion Knife", "Flip Knife", "Gut Knife", "Huntsman Knife", "Karambit", "M9 Bayonet", "Shadow Daggers"]
  },

  // ========== FALCHION CASE ==========
  "falchion case": {
    covert: ["AK-47 | Aquamarine Revenge", "AWP | Hyper Beast"],
    classified: ["MP7 | Nemesis", "CZ75-Auto | Yellow Jacket", "M4A1-S | Cyrex"],
    restricted: ["USP-S | Torque", "Galil AR | Rocket Pop", "MP9 | Ruby Poison Dart", "Negev | Loudmouth", "P90 | Elite Build"],
    milspec: ["Glock-18 | Bunsen Burner", "Desert Eagle | Bronze Deco", "Sawed-Off | Fubar", "UMP-45 | Riot", "Tec-9 | Red Quartz", "Nova | Ranger", "M249 | System Lock"],
    knives: ["Bayonet", "Butterfly Knife", "Falchion Knife", "Flip Knife", "Gut Knife", "Huntsman Knife", "Karambit", "M9 Bayonet", "Shadow Daggers"]
  },

  // ========== OPERATION WILDFIRE CASE ==========
  "operation wildfire case": {
    covert: ["M4A1-S | Hyper Beast", "AK-47 | Fuel Injector"],
    classified: ["P90 | Elite Build", "MAG-7 | Praetorian", "Negev | Power Loader"],
    restricted: ["Desert Eagle | Kumicho Dragon", "M4A4 | The Battlestar", "Tec-9 | Jambiya", "Five-SeveN | Violent Daimyo", "SSG 08 | Big Iron"],
    milspec: ["PP-Bizon | Photic Zone", "P250 | Ripple", "Dual Berettas | Cartel", "Nova | Ranger", "XM1014 | Scumbria", "Sawed-Off | Fubar", "MP7 | Impire"],
    knives: ["Bayonet", "Bowie Knife", "Butterfly Knife", "Falchion Knife", "Flip Knife", "Gut Knife", "Huntsman Knife", "Karambit", "M9 Bayonet", "Shadow Daggers"]
  },

  // ========== OPERATION VANGUARD CASE ==========
  "operation vanguard weapon case": {
    covert: ["AK-47 | Wasteland Rebel", "M4A4 | Basilisk"],
    classified: ["P2000 | Fire Elemental", "XM1014 | Tranquility", "P250 | Cartel"],
    restricted: ["Galil AR | Kami", "MP7 | Armor Core", "Five-SeveN | Urban Hazard", "UMP-45 | Delusion", "Desert Eagle | Corinthian"],
    milspec: ["M249 | System Lock", "Glock-18 | Grinder", "PP-Bizon | Rust Coat", "Sawed-Off | High Seas", "Nova | Tempest", "MAG-7 | Firestarter", "Tec-9 | Toxic"],
    knives: ["Bayonet", "Butterfly Knife", "Flip Knife", "Gut Knife", "Huntsman Knife", "Karambit", "M9 Bayonet"]
  },

  // ========== OPERATION BREAKOUT CASE ==========
  "operation breakout weapon case": {
    covert: ["M4A1-S | Cyrex", "Desert Eagle | Golden Koi"],
    classified: ["P90 | Asiimov", "Glock-18 | Water Elemental", "CZ75-Auto | Victoria"],
    restricted: ["Nova | Bloomstick", "MAC-10 | Tatter", "UMP-45 | Corporal", "SSG 08 | Detour", "P250 | Supernova"],
    milspec: ["Negev | Bratatat", "Tec-9 | Isaac", "MAG-7 | Heaven Guard", "Five-SeveN | Fowl Play", "Dual Berettas | Retribution", "SG 553 | Pulse", "PP-Bizon | Osiris"],
    knives: ["Bayonet", "Butterfly Knife", "Flip Knife", "Gut Knife", "Huntsman Knife", "Karambit", "M9 Bayonet"]
  },

  // ========== OPERATION PHOENIX CASE ==========
  "operation phoenix weapon case": {
    covert: ["AWP | Asiimov", "AK-47 | Redline"],
    classified: ["P90 | Trigon", "Nova | Antique", "MAC-10 | Heat"],
    restricted: ["Desert Eagle | Heirloom", "UMP-45 | Corporal", "Negev | Terrain", "AUG | Torque", "FAMAS | Sergeant"],
    milspec: ["Galil AR | Tuxedo", "Tec-9 | Sandstorm", "P250 | Hive", "MAG-7 | Heaven Guard", "SG 553 | Pulse", "M4A4 | Griffin", "USP-S | Guardian"],
    knives: ["Bayonet", "Flip Knife", "Gut Knife", "Karambit", "M9 Bayonet"]
  },

  // ========== HUNTSMAN CASE ==========
  "huntsman weapon case": {
    covert: ["M4A1-S | Atomic Alloy", "P2000 | Corticera"],
    classified: ["M4A4 | Desert-Strike", "P90 | Desert Warfare", "XM1014 | Heaven Guard"],
    restricted: ["USP-S | Caiman", "AUG | Chameleon", "MAC-10 | Curse", "CZ75-Auto | Tigris", "SCAR-20 | Cyrex"],
    milspec: ["PP-Bizon | Antique", "P250 | Contamination", "Tec-9 | Isaac", "Dual Berettas | Black Limba", "Galil AR | Kami", "SSG 08 | Slashed", "Nova | Ghost Camo"],
    knives: ["Bayonet", "Flip Knife", "Gut Knife", "Huntsman Knife", "Karambit", "M9 Bayonet"]
  },

  // ========== CS20 CASE ==========
  "cs20 case": {
    covert: ["AWP | Wildfire", "FAMAS | Commemoration"],
    classified: ["Five-SeveN | Angry Mob", "M4A1-S | Printstream", "Tec-9 | Flash Out"],
    restricted: ["MP5-SD | Agent", "P90 | Nostalgia", "Desert Eagle | Blue Ply", "Dual Berettas | Elite 1.6", "MP9 | Hydra"],
    milspec: ["Nova | Green Apple", "XM1014 | Oxide Blaze", "UMP-45 | Oscillator", "Sawed-Off | Apocalypto", "Glock-18 | Sacrifice", "P250 | Vino Primo", "MAG-7 | Popdog"],
    knives: ["Bayonet", "Bowie Knife", "Butterfly Knife", "Falchion Knife", "Flip Knife", "Gut Knife", "Huntsman Knife", "Karambit", "M9 Bayonet", "Shadow Daggers", "Navaja Knife", "Stiletto Knife", "Talon Knife", "Ursus Knife"]
  },

  // ========== OPERATION HYDRA CASE ==========
  "operation hydra case": {
    covert: ["AWP | Oni Taiji", "AK-47 | Orbit Mk01"],
    classified: ["P250 | Red Rock", "Five-SeveN | Hyper Beast", "Galil AR | Sugar Rush"],
    restricted: ["UMP-45 | Scaffold", "M4A4 | Hellfire", "Dual Berettas | Cobra Strike", "MAC-10 | Aloha", "FAMAS | Macabre"],
    milspec: ["PP-Bizon | Harvester", "Desert Eagle | Directive", "Tec-9 | Snek-9", "P2000 | Woodsman", "Nova | Gila", "G3SG1 | Hunter", "XM1014 | Baseline"],
    knives: ["Bayonet", "Bowie Knife", "Butterfly Knife", "Falchion Knife", "Flip Knife", "Gut Knife", "Huntsman Knife", "Karambit", "M9 Bayonet", "Shadow Daggers"]
  },

  // ========== OPERATION BRAVO CASE ==========
  "operation bravo case": {
    covert: ["Desert Eagle | Golden Koi", "AK-47 | Fire Serpent"],
    classified: ["P90 | Emerald Dragon", "USP-S | Overgrowth", "AWP | Graphite"],
    restricted: ["M4A1-S | Bright Water", "P2000 | Ocean Foam", "Dual Berettas | Black Limba", "MP9 | Rose Iron", "SG 553 | Wave Spray"],
    milspec: ["Negev | Bratatat", "Tec-9 | Red Quartz", "Five-SeveN | Copper Galaxy", "Galil AR | Shattered", "Nova | Tempest", "P250 | Gunsmoke", "MAC-10 | Graven"],
    knives: ["Bayonet", "Flip Knife", "Gut Knife", "Karambit", "M9 Bayonet"]
  },

  // ========== WINTER OFFENSIVE CASE ==========
  "winter offensive weapon case": {
    covert: ["M4A4 | Asiimov", "AWP | Redline"],
    classified: ["AK-47 | Jaguar", "USP-S | Serum", "P250 | Mehndi"],
    restricted: ["Desert Eagle | Conspiracy", "PP-Bizon | Cobalt Halftone", "Dual Berettas | Marina", "SG 553 | Pulse", "M4A1-S | Guardian"],
    milspec: ["P2000 | Corticera", "Nova | Rising Skull", "Galil AR | Shattered", "MAC-10 | Graven", "Sawed-Off | Rust Coat", "Five-SeveN | Kami", "Tec-9 | Groundwater"],
    knives: ["Bayonet", "Flip Knife", "Gut Knife", "Karambit", "M9 Bayonet"]
  },

  // ========== ESPORTS 2014 SUMMER CASE ==========
  "esports 2014 summer case": {
    covert: ["M4A4 | Bullet Rain", "USP-S | Road Rash"],
    classified: ["AK-47 | Jaguar", "P90 | Desert Warfare", "AWP | Corticera"],
    restricted: ["Desert Eagle | Heirloom", "Glock-18 | Steel Disruption", "M4A1-S | Guardian", "PP-Bizon | Blue Streak", "Nova | Bloomstick"],
    milspec: ["Dual Berettas | Panther", "CZ75-Auto | Hexane", "Tec-9 | Isaac", "P250 | Hive", "MAG-7 | Memento", "Negev | Terrain", "Galil AR | Hunting Blind"],
    knives: ["Bayonet", "Flip Knife", "Gut Knife", "Karambit", "M9 Bayonet"]
  },

  // ========== ESPORTS 2013 WINTER CASE ==========
  "esports 2013 winter case": {
    covert: ["M4A1-S | Dark Water", "AWP | BOOM"],
    classified: ["P90 | Cold Blooded", "AK-47 | Blue Laminate", "Desert Eagle | Hypnotic"],
    restricted: ["USP-S | Dark Water", "Nova | Graphite", "Glock-18 | Blue Fissure", "P2000 | Red FragCam", "M4A4 | Faded Zebra"],
    milspec: ["PP-Bizon | Water Sigil", "Galil AR | Blue Titanium", "Five-SeveN | Kami", "SSG 08 | Blue Spruce", "MAC-10 | Tornado", "SG 553 | Ultraviolet", "Dual Berettas | Stained"],
    knives: ["Bayonet", "Flip Knife", "Gut Knife", "Karambit", "M9 Bayonet"]
  },

  // ========== ESPORTS 2013 CASE ==========
  "esports 2013 case": {
    covert: ["AWP | Lightning Strike", "Glock-18 | Dragon Tattoo"],
    classified: ["Desert Eagle | Hypnotic", "AK-47 | Case Hardened", "P90 | Death by Kitty"],
    restricted: ["P2000 | Ocean Foam", "Nova | Modern Hunter", "Galil AR | Orange DDPAT", "Famas | Doomkitty", "M4A4 | Faded Zebra"],
    milspec: ["USP-S | Forest Leaves", "MAC-10 | Candy Apple", "Tec-9 | Blue Titanium", "MAG-7 | Sand Dune", "MP7 | Skulls", "P250 | Facets", "Dual Berettas | Colony"],
    knives: ["Bayonet", "Flip Knife", "Gut Knife", "Karambit", "M9 Bayonet"]
  },

  // ========== CS:GO WEAPON CASE 3 ==========
  "cs:go weapon case 3": {
    covert: ["P2000 | Ocean Foam", "CZ75-Auto | Victoria"],
    classified: ["P250 | Undertow", "Five-SeveN | Case Hardened", "USP-S | Serum"],
    restricted: ["M4A1-S | Blood Tiger", "CZ75-Auto | Crimson Web", "PP-Bizon | Cobalt Halftone", "Tec-9 | Sandstorm", "MP7 | Whiteout"],
    milspec: ["G3SG1 | Azure Zebra", "Galil AR | Orange DDPAT", "Nova | Candy Apple", "P90 | Sand Spray", "SG 553 | Tornado", "Dual Berettas | Colony", "Sawed-Off | Orange DDPAT"],
    knives: ["Bayonet", "Flip Knife", "Gut Knife", "Karambit", "M9 Bayonet"]
  },

  // ========== CS:GO WEAPON CASE 2 ==========
  "cs:go weapon case 2": {
    covert: ["Desert Eagle | Cobalt Disruption", "M4A1-S | Cyrex"],
    classified: ["SSG 08 | Blood in the Water", "Five-SeveN | Copper Galaxy", "P250 | Hive"],
    restricted: ["Galil AR | Sandstorm", "USP-S | Serum", "SG 553 | Waves Perforated", "Tec-9 | Isaac", "Dual Berettas | Hemoglobin"],
    milspec: ["Nova | Graphite", "P2000 | Silver", "PP-Bizon | Cobalt Halftone", "AUG | Wings", "Sawed-Off | Full Stop", "MAC-10 | Silver", "M4A4 | Zirka"],
    knives: ["Bayonet", "Flip Knife", "Gut Knife", "Karambit", "M9 Bayonet"]
  },

  // ========== CS:GO WEAPON CASE ==========
  "cs:go weapon case": {
    covert: ["M4A4 | Howl", "AWP | Lightning Strike"],
    classified: ["P2000 | Scorpion", "Desert Eagle | Cobalt Disruption", "AK-47 | Case Hardened"],
    restricted: ["Glock-18 | Dragon Tattoo", "M4A1-S | Dark Water", "Five-SeveN | Case Hardened", "MP7 | Skulls", "USP-S | Dark Water"],
    milspec: ["Dual Berettas | Anodized Navy", "Galil AR | Hunting Blind", "P250 | Bone Mask", "SG 553 | Ultraviolet", "Tec-9 | Blue Titanium", "Nova | Candy Apple", "SSG 08 | Blue Spruce"],
    knives: ["Bayonet", "Flip Knife", "Gut Knife", "Karambit", "M9 Bayonet"]
  },

  // ========== SHATTERED WEB CASE ==========
  "shattered web case": {
    covert: ["AK-47 | Slate", "Desert Eagle | Light Rail"],
    classified: ["MP5-SD | Phosphor", "MAG-7 | Monster Call", "SG 553 | Colony IV"],
    restricted: ["M4A4 | Tooth Fairy", "MP7 | Neon Ply", "G3SG1 | Black Sand", "Nova | Plume", "Tec-9 | Decimator"],
    milspec: ["R8 Revolver | Bone Forged", "P90 | Nostalgia", "AUG | Tom Cat", "XM1014 | Frost Borre'd", "MP9 | Capillary", "Glock-18 | Oxide Blaze", "P250 | Vino Primo"],
    knives: ["Bayonet", "Bowie Knife", "Butterfly Knife", "Classic Knife", "Falchion Knife", "Flip Knife", "Gut Knife", "Huntsman Knife", "Karambit", "M9 Bayonet", "Nomad Knife", "Paracord Knife", "Shadow Daggers", "Skeleton Knife", "Stiletto Knife", "Survival Knife", "Talon Knife", "Ursus Knife"]
  },

  // ========== FEVER DREAM CASE (unofficial/community) ==========
  "fever case": {
    covert: ["AWP | Fever Dream", "USP-S | Fever Dream"],
    classified: ["AK-47 | Neon Rider", "Glock-18 | Moonrise", "M4A1-S | Nightmare"],
    restricted: ["Desert Eagle | Code Red", "P250 | Nevermore", "Tec-9 | Avalanche", "Five-SeveN | Violent Daimyo", "MAC-10 | Neon Rider"],
    milspec: ["PP-Bizon | Judgement of Anubis", "UMP-45 | Scaffold", "Nova | Toy Soldier", "XM1014 | Ziggy", "Dual Berettas | Shred", "Sawed-Off | Highwayman", "MP9 | Airlock"],
    knives: ["Bayonet", "Bowie Knife", "Butterfly Knife", "Classic Knife", "Falchion Knife", "Flip Knife", "Gut Knife", "Huntsman Knife", "Karambit", "M9 Bayonet", "Nomad Knife", "Paracord Knife", "Shadow Daggers", "Skeleton Knife", "Stiletto Knife", "Survival Knife", "Talon Knife", "Ursus Knife"]
  }
};

async function findSkinInDatabase(skinName, weaponType, allSkins) {
  // Try exact match first
  let match = allSkins.find(s => {
    const sName = s.name.toLowerCase();
    return sName.includes(skinName.toLowerCase()) && 
           (weaponType ? sName.includes(weaponType.toLowerCase()) : true);
  });
  
  if (match) return match;
  
  // Try matching just the skin name (for knives/gloves)
  match = allSkins.find(s => 
    s.name.toLowerCase().includes(skinName.toLowerCase())
  );
  
  if (match) return match;
  
  // Try matching with StatTrak or Souvenir
  const variations = [
    `stattrak™ ${weaponType} | ${skinName}`,
    `souvenir ${weaponType} | ${skinName}`,
    `${weaponType} | ${skinName}`
  ];
  
  for (const variant of variations) {
    match = allSkins.find(s => 
      s.name.toLowerCase().includes(variant.toLowerCase())
    );
    if (match) return match;
  }
  
  return null;
}

async function importCompleteAllCaseSkins() {
  try {
    console.log("🎨 Importing complete case-skin mappings for ALL cases...\n");
    
    // Get all skins
    const allSkins = await prisma.skin.findMany({
      select: {
        id: true,
        name: true,
        marketHashName: true,
        weaponType: true,
        rarity: true
      }
    });
    
    console.log(`🔫 Found ${allSkins.length} skins in database\n`);
    
    let totalAdded = 0;
    let totalCasesProcessed = 0;
    
    for (const [caseName, rarities] of Object.entries(COMPLETE_CASE_SKINS)) {
      console.log(`\n🎯 Processing: ${caseName}`);
      
      // Find case in database
      const caseItem = await prisma.case.findFirst({
        where: { name: { equals: caseName, mode: 'insensitive' } }
      });
      
      if (!caseItem) {
        console.log(`  ❌ Case not found in database: ${caseName}`);
        continue;
      }
      
      // Clear existing case-skin relationships
      await prisma.caseSkin.deleteMany({
        where: { caseId: caseItem.id }
      });
      
      const skinEntries = [];
      let matchedCount = 0;
      let unmatchedCount = 0;
      
      // Process each rarity
      for (const [rarity, skins] of Object.entries(rarities)) {
        const rarityName = rarity === 'milspec' ? 'Mil-Spec' : 
                          rarity === 'knives' ? 'Covert' :
                          rarity === 'gloves' ? 'Extraordinary' :
                          rarity.charAt(0).toUpperCase() + rarity.slice(1);
        
        for (const skinName of skins) {
          // Extract weapon type and skin name
          const parts = skinName.split('|');
          const weaponType = parts[0] ? parts[0].trim() : '';
          const skinPart = parts[1] ? parts[1].trim() : skinName;
          
          // Find matching skin in database
          const matchedSkin = await findSkinInDatabase(skinPart, weaponType, allSkins);
          
          if (matchedSkin) {
            skinEntries.push({
              caseId: caseItem.id,
              skinId: matchedSkin.id,
              rarity: rarityName,
              dropChance: null,
              isSpecial: rarity === 'knives' || rarity === 'covert' || rarity === 'gloves'
            });
            matchedCount++;
          } else {
            console.log(`  ⚠️ No match: ${skinName} (${rarityName})`);
            unmatchedCount++;
          }
        }
      }
      
      // Insert case-skin relationships
      if (skinEntries.length > 0) {
        await prisma.caseSkin.createMany({
          data: skinEntries,
          skipDuplicates: true
        });
        
        console.log(`  ✅ Added ${matchedCount} skins to ${caseName}`);
        if (unmatchedCount > 0) {
          console.log(`  ⚠️ ${unmatchedCount} skins could not be matched`);
        }
        totalAdded += matchedCount;
        totalCasesProcessed++;
      }
    }
    
    console.log("\n" + "=".repeat(60));
    console.log("🎉 Complete import finished!");
    console.log(`📊 Total cases processed: ${totalCasesProcessed}`);
    console.log(`📊 Total skins added: ${totalAdded}`);
    console.log("=".repeat(60));
    
    // Show final summary
    const caseCounts = await prisma.caseSkin.groupBy({
      by: ['caseId'],
      _count: { skinId: true }
    });
    
    console.log("\n📊 Final Summary (all cases):");
    for (const count of caseCounts) {
      const caseData = await prisma.case.findUnique({
        where: { id: count.caseId },
        select: { name: true }
      });
      console.log(`  ${caseData?.name}: ${count._count.skinId} skins`);
    }
    
  } catch (error) {
    console.error("❌ Error importing case skins:", error);
  } finally {
    await prisma.$disconnect();
  }
}

importCompleteAllCaseSkins();
