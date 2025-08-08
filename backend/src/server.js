import app from "./app.js";

const PORT = process.env.PORT || 5000;
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
