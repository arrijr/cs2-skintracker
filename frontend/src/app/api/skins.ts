import axios from "axios";

export async function getAllSkins() {
  const res = await axios.get("/api/v1/skins");
  return res.data;
}
