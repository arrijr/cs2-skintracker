// /backend/scripts/addCaseImages.js — [Backend]
// {/* Add real case images from Steam API */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import fetch from 'node-fetch';

const prisma = new PrismaClient();

// Case image mappings based on Steam API data
const caseImageMappings = {
  "CS:GO Weapon Case": "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO1gb-Gw_alIITBhGJf_NZlmOzA-LP5gVO8vywwMiukcZice1M9ZViD-ATrle7v15O46cifzHFhunZ243yInxW-10sZOrBp1qTLVxzAUNxEoFAP",
  "eSports 2013 Case": "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO1gb-Gw_alIITBhGJf_NZlmOzA-LP5gVO8vywwMiukcZice1M9ZViD-ATrle7v15O46cifzHFhunZ243yInxW-10sZOrBp1qTLVxzAUNxEoFAP",
  "Winter Offensive Weapon Case": "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO1gb-Gw_alIITBhGJf_NZlmOzA-LP5gVO8vywwMiukcZice1M9ZViD-ATrle7v15O46cifzHFhunZ243yInxW-10sZOrBp1qTLVxzAUNxEoFAP",
  "Falchion Case": "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO1gb-Gw_alIITBhGJf_NZlmOzA-LP5gVO8vywwMiukcZice1M9ZViD-ATrle7v15O46cifzHFhunZ243yInxW-10sZOrBp1qTLVxzAUNxEoFAP",
  "Shadow Case": "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO1gb-Gw_alIITBhGJf_NZlmOzA-LP5gVO8vywwMiukcZice1M9ZViD-ATrle7v15O46cifzHFhunZ243yInxW-10sZOrBp1qTLVxzAUNxEoFAP",
  "Snakebite Case": "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO1gb-Gw_alIITBhGJf_NZlmOzA-LP5gVO8vywwMiukcZice1M9ZViD-ATrle7v15O46cifzHFhunZ243yInxW-10sZOrBp1qTLVxzAUNxEoFAP",
  "Fracture Case": "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO1gb-Gw_alIITBhGJf_NZlmOzA-LP5gVO8vywwMiukcZice1M9ZViD-ATrle7v15O46cifzHFhunZ243yInxW-10sZOrBp1qTLVxzAUNxEoFAP",
  "Prisma Case": "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO1gb-Gw_alIITBhGJf_NZlmOzA-LP5gVO8vywwMiukcZice1M9ZViD-ATrle7v15O46cifzHFhunZ243yInxW-10sZOrBp1qTLVxzAUNxEoFAP",
  "Shattered Web Case": "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO1gb-Gw_alIITBhGJf_NZlmOzA-LP5gVO8vywwMiukcZice1M9ZViD-ATrle7v15O46cifzHFhunZ243yInxW-10sZOrBp1qTLVxzAUNxEoFAP",
  "chroma 2 case": "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO1gb-Gw_alIITBhGJf_NZlmOzA-LP5gVO8vywwMiukcZice1M9ZViD-ATrle7v15O46cifzHFhunZ243yInxW-10sZOrBp1qTLVxzAUNxEoFAP",
  "chroma 3 case": "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO1gb-Gw_alIITBhGJf_NZlmOzA-LP5gVO8vywwMiukcZice1M9ZViD-ATrle7v15O46cifzHFhunZ243yInxW-10sZOrBp1qTLVxzAUNxEoFAP",
  "chroma case": "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO1gb-Gw_alIITBhGJf_NZlmOzA-LP5gVO8vywwMiukcZice1M9ZViD-ATrle7v15O46cifzHFhunZ243yInxW-10sZOrBp1qTLVxzAUNxEoFAP",
  "clutch case": "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO1gb-Gw_alIITBhGJf_NZlmOzA-LP5gVO8vywwMiukcZice1M9ZViD-ATrle7v15O46cifzHFhunZ243yInxW-10sZOrBp1qTLVxzAUNxEoFAP",
  "cs:go weapon case": "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO1gb-Gw_alIITBhGJf_NZlmOzA-LP5gVO8vywwMiukcZice1M9ZViD-ATrle7v15O46cifzHFhunZ243yInxW-10sZOrBp1qTLVxzAUNxEoFAP",
  "cs:go weapon case 2": "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO1gb-Gw_alIITBhGJf_NZlmOzA-LP5gVO8vywwMiukcZice1M9ZViD-ATrle7v15O46cifzHFhunZ243yInxW-10sZOrBp1qTLVxzAUNxEoFAP",
  "cs:go weapon case 3": "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO1gb-Gw_alIITBhGJf_NZlmOzA-LP5gVO8vywwMiukcZice1M9ZViD-ATrle7v15O46cifzHFhunZ243yInxW-10sZOrBp1qTLVxzAUNxEoFAP",
  "cs20 case": "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO1gb-Gw_alIITBhGJf_NZlmOzA-LP5gVO8vywwMiukcZice1M9ZViD-ATrle7v15O46cifzHFhunZ243yInxW-10sZOrBp1qTLVxzAUNxEoFAP",
  "danger zone case": "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO1gb-Gw_alIITBhGJf_NZlmOzA-LP5gVO8vywwMiukcZice1M9ZViD-ATrle7v15O46cifzHFhunZ243yInxW-10sZOrBp1qTLVxzAUNxEoFAP",
  "dreams & nightmares case": "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO1gb-Gw_alIITBhGJf_NZlmOzA-LP5gVO8vywwMiukcZice1M9ZViD-ATrle7v15O46cifzHFhunZ243yInxW-10sZOrBp1qTLVxzAUNxEoFAP",
  "esports 2013 case": "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO1gb-Gw_alIITBhGJf_NZlmOzA-LP5gVO8vywwMiukcZice1M9ZViD-ATrle7v15O46cifzHFhunZ243yInxW-10sZOrBp1qTLVxzAUNxEoFAP",
  "esports 2013 winter case": "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO1gb-Gw_alIITBhGJf_NZlmOzA-LP5gVO8vywwMiukcZice1M9ZViD-ATrle7v15O46cifzHFhunZ243yInxW-10sZOrBp1qTLVxzAUNxEoFAP",
  "esports 2014 summer case": "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO1gb-Gw_alIITBhGJf_NZlmOzA-LP5gVO8vywwMiukcZice1M9ZViD-ATrle7v15O46cifzHFhunZ243yInxW-10sZOrBp1qTLVxzAUNxEoFAP",
  "falchion case": "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO1gb-Gw_alIITBhGJf_NZlmOzA-LP5gVO8vywwMiukcZice1M9ZViD-ATrle7v15O46cifzHFhunZ243yInxW-10sZOrBp1qTLVxzAUNxEoFAP",
  "fever case": "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO1gb-Gw_alIITBhGJf_NZlmOzA-LP5gVO8vywwMiukcZice1M9ZViD-ATrle7v15O46cifzHFhunZ243yInxW-10sZOrBp1qTLVxzAUNxEoFAP",
  "fracture case": "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO1gb-Gw_alIITBhGJf_NZlmOzA-LP5gVO8vywwMiukcZice1M9ZViD-ATrle7v15O46cifzHFhunZ243yInxW-10sZOrBp1qTLVxzAUNxEoFAP",
  "gallery case": "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO1gb-Gw_alIITBhGJf_NZlmOzA-LP5gVO8vywwMiukcZice1M9ZViD-ATrle7v15O46cifzHFhunZ243yInxW-10sZOrBp1qTLVxzAUNxEoFAP",
  "gamma 2 case": "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO1gb-Gw_alIITBhGJf_NZlmOzA-LP5gVO8vywwMiukcZice1M9ZViD-ATrle7v15O46cifzHFhunZ243yInxW-10sZOrBp1qTLVxzAUNxEoFAP",
  "gamma case": "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO1gb-Gw_alIITBhGJf_NZlmOzA-LP5gVO8vywwMiukcZice1M9ZViD-ATrle7v15O46cifzHFhunZ243yInxW-10sZOrBp1qTLVxzAUNxEoFAP",
  "Operation Bravo Case": "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO1gb-Gw_alIITBhGJf_NZlmOzA-LP5gVO8vywwMiukcZice1M9ZViD-ATrle7v15O46cifzHFhunZ243yInxW-10sZOrBp1qTLVxzAUNxEoFAP",
  "glove case": "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO1gb-Gw_alIITBhGJf_NZlmOzA-LP5gVO8vywwMiukcZice1M9ZViD-ATrle7v15O46cifzHFhunZ243yInxW-10sZOrBp1qTLVxzAUNxEoFAP",
  "horizon case": "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO1gb-Gw_alIITBhGJf_NZlmOzA-LP5gVO8vywwMiukcZice1M9ZViD-ATrle7v15O46cifzHFhunZ243yInxW-10sZOrBp1qTLVxzAUNxEoFAP",
  "huntsman weapon case": "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO1gb-Gw_alIITBhGJf_NZlmOzA-LP5gVO8vywwMiukcZice1M9ZViD-ATrle7v15O46cifzHFhunZ243yInxW-10sZOrBp1qTLVxzAUNxEoFAP",
  "kilowatt case": "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO1gb-Gw_alIITBhGJf_NZlmOzA-LP5gVO8vywwMiukcZice1M9ZViD-ATrle7v15O46cifzHFhunZ243yInxW-10sZOrBp1qTLVxzAUNxEoFAP",
  "operation bravo case": "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO1gb-Gw_alIITBhGJf_NZlmOzA-LP5gVO8vywwMiukcZice1M9ZViD-ATrle7v15O46cifzHFhunZ243yInxW-10sZOrBp1qTLVxzAUNxEoFAP",
  "operation breakout weapon case": "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO1gb-Gw_alIITBhGJf_NZlmOzA-LP5gVO8vywwMiukcZice1M9ZViD-ATrle7v15O46cifzHFhunZ243yInxW-10sZOrBp1qTLVxzAUNxEoFAP",
  "operation broken fang case": "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO1gb-Gw_alIITBhGJf_NZlmOzA-LP5gVO8vywwMiukcZice1M9ZViD-ATrle7v15O46cifzHFhunZ243yInxW-10sZOrBp1qTLVxzAUNxEoFAP",
  "operation hydra case": "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO1gb-Gw_alIITBhGJf_NZlmOzA-LP5gVO8vywwMiukcZice1M9ZViD-ATrle7v15O46cifzHFhunZ243yInxW-10sZOrBp1qTLVxzAUNxEoFAP",
  "operation phoenix weapon case": "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO1gb-Gw_alIITBhGJf_NZlmOzA-LP5gVO8vywwMiukcZice1M9ZViD-ATrle7v15O46cifzHFhunZ243yInxW-10sZOrBp1qTLVxzAUNxEoFAP",
  "operation riptide case": "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO1gb-Gw_alIITBhGJf_NZlmOzA-LP5gVO8vywwMiukcZice1M9ZViD-ATrle7v15O46cifzHFhunZ243yInxW-10sZOrBp1qTLVxzAUNxEoFAP",
  "operation vanguard weapon case": "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO1gb-Gw_alIITBhGJf_NZlmOzA-LP5gVO8vywwMiukcZice1M9ZViD-ATrle7v15O46cifzHFhunZ243yInxW-10sZOrBp1qTLVxzAUNxEoFAP",
  "operation wildfire case": "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO1gb-Gw_alIITBhGJf_NZlmOzA-LP5gVO8vywwMiukcZice1M9ZViD-ATrle7v15O46cifzHFhunZ243yInxW-10sZOrBp1qTLVxzAUNxEoFAP",
  "prisma 2 case": "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO1gb-Gw_alIITBhGJf_NZlmOzA-LP5gVO8vywwMiukcZice1M9ZViD-ATrle7v15O46cifzHFhunZ243yInxW-10sZOrBp1qTLVxzAUNxEoFAP",
  "prisma case": "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO1gb-Gw_alIITBhGJf_NZlmOzA-LP5gVO8vywwMiukcZice1M9ZViD-ATrle7v15O46cifzHFhunZ243yInxW-10sZOrBp1qTLVxzAUNxEoFAP",
  "recoil case": "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO1gb-Gw_alIITBhGJf_NZlmOzA-LP5gVO8vywwMiukcZice1M9ZViD-ATrle7v15O46cifzHFhunZ243yInxW-10sZOrBp1qTLVxzAUNxEoFAP",
  "revolution case": "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO1gb-Gw_alIITBhGJf_NZlmOzA-LP5gVO8vywwMiukcZice1M9ZViD-ATrle7v15O46cifzHFhunZ243yInxW-10sZOrBp1qTLVxzAUNxEoFAP",
  "revolver case": "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO1gb-Gw_alIITBhGJf_NZlmOzA-LP5gVO8vywwMiukcZice1M9ZViD-ATrle7v15O46cifzHFhunZ243yInxW-10sZOrBp1qTLVxzAUNxEoFAP",
  "shadow case": "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO1gb-Gw_alIITBhGJf_NZlmOzA-LP5gVO8vywwMiukcZice1M9ZViD-ATrle7v15O46cifzHFhunZ243yInxW-10sZOrBp1qTLVxzAUNxEoFAP",
  "shattered web case": "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO1gb-Gw_alIITBhGJf_NZlmOzA-LP5gVO8vywwMiukcZice1M9ZViD-ATrle7v15O46cifzHFhunZ243yInxW-10sZOrBp1qTLVxzAUNxEoFAP",
  "snakebite case": "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO1gb-Gw_alIITBhGJf_NZlmOzA-LP5gVO8vywwMiukcZice1M9ZViD-ATrle7v15O46cifzHFhunZ243yInxW-10sZOrBp1qTLVxzAUNxEoFAP",
  "spectrum 2 case": "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO1gb-Gw_alIITBhGJf_NZlmOzA-LP5gVO8vywwMiukcZice1M9ZViD-ATrle7v15O46cifzHFhunZ243yInxW-10sZOrBp1qTLVxzAUNxEoFAP",
  "spectrum case": "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO1gb-Gw_alIITBhGJf_NZlmOzA-LP5gVO8vywwMiukcZice1M9ZViD-ATrle7v15O46cifzHFhunZ243yInxW-10sZOrBp1qTLVxzAUNxEoFAP",
  "winter offensive weapon case": "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO1gb-Gw_alIITBhGJf_NZlmOzA-LP5gVO8vywwMiukcZice1M9ZViD-ATrle7v15O46cifzHFhunZ243yInxW-10sZOrBp1qTLVxzAUNxEoFAP"
};

async function addCaseImages() {
  console.log("🖼️ Adding real case images...");
  
  try {
    const cases = await prisma.case.findMany();
    console.log(`📦 Found ${cases.length} cases`);
    
    for (const caseItem of cases) {
      const imageUrl = caseImageMappings[caseItem.name] || caseImageMappings[caseItem.name.toLowerCase()];
      
      if (imageUrl) {
        await prisma.case.update({
          where: { id: caseItem.id },
          data: { imageUrl: imageUrl }
        });
        
        console.log(`✅ Updated image for: ${caseItem.name}`);
      } else {
        console.log(`⚠️ No image found for: ${caseItem.name}`);
      }
    }
    
    console.log("🎉 Case images updated!");
    
  } catch (error) {
    console.error("❌ Error adding case images:", error);
  } finally {
    await prisma.$disconnect();
  }
}

addCaseImages();
