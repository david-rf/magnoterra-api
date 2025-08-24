import express from express;
import mysql from mysql2promise;

const app = express();
const port = process.env.PORT  3000;

 Endpoint de salud
app.get(health, (req, res) = res.send(OK));

 Probar conexión a la base de datos
app.get(db-check, async (_req, res) = {
  try {
    const conn = await mysql.createConnection(process.env.DATABASE_URL);
    const [rows] = await conn.query(SELECT 1 AS ok);
    await conn.end();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error err.message });
  }
});

app.listen(port, () = {
  console.log(`API corriendo en puerto ${port}`);
});
