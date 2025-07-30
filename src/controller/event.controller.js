import pool from '../db.js';

export const createEvent = async (req, res) => {
  const { title, datetime, location, capacity } = req.body;
  if (!title || !datetime || !location || !capacity || capacity > 1000 || capacity <= 0) {
    return res.status(500).json({ error: "fill data properly"});
  }
  try {
    const result = await pool.query(`INSERT INTO events (title, datetime, location, capacity) VALUES ($1, $2, $3, $4) RETURNING id`,[title, datetime, location, capacity]);
    res.status(200).json({ eventid: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: 'Database error'});
  }
};
export const getEvent = async (req, res) => {
  const { id } = req.params;
  try {
    const event = await pool.query('SELECT * FROM events WHERE id = $1', [id]);
    if (event.rowCount === 0){
      return res.status(200).json({res: 'No event exist'});
    }
    const users = await pool.query(
      `SELECT u.name AS user_name,u.email,e.title AS event_title,e.datetime,e.location,e.capacity FROM registrations r
        JOIN users u ON r.user_id = u.id JOIN events e ON r.event_id = e.id WHERE r.event_id = $1`, [id]);
    res.json({ ...event.rows[0], registrations: users.rows });
  } catch {
    res.status(500).json({ error: 'Error in fetching details of event' });
  }
};
export const userRegister = async (req, res) => {
  const { username,useremail,eventid, } = req.body;
  try {
    const event = await pool.query('SELECT * FROM events WHERE id = $1', [eventid]);
    if (event.rowCount === 0) return res.status(500).json({ error: 'event not found' });
    const { capacity, datetime } = event.rows[0];
    const now = new Date();
    if (new Date(datetime) < now) return res.status(400).json({error: 'past events'});
    const regCount = await pool.query('SELECT COUNT(user_id) FROM registrations WHERE event_id = $1', [eventid]);
    if (regCount.rows[0].count >= capacity) return res.status(400).json({ error: 'Event is full' });

    const exists = await pool.query(`select * from registrations r join users u on r.user_id = u.id where r.event_id=$1 and u.email=$2`,[eventid,useremail]);
    if (exists.rowCount > 0) return res.status(200).json({ error: 'User  already registered' });
    const userid = await pool.query('INSERT INTO users (name,email) VALUES($1,$2) RETURNING id',[username,useremail]);
    const id = userid.rows[0].id;
    await pool.query('INSERT INTO registrations (user_id, event_id) VALUES ($1, $2)', [id, eventid]);

    res.status(201).json({ message: 'User registered successfully' });
  } catch {
    res.status(500).json({ error: 'Registration error' });
  }
};
export const deletedata = async (req, res) => {
  const { email,eventid } = req.body;
  try {
    const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userResult.rowCount === 0) {
      return res.status(404).json({ message: "No user found with this email" });
    }
    const userId = userResult.rows[0].id;
    const result = await pool.query('DELETE FROM registrations WHERE user_id=$1 AND event_id=$2',[userId,eventid]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'User not found in that event' });
    }
    return res.status(200).json({message: 'User deleted successfully'});
  } catch (error) {
    console.error("Error in deletedata:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
export const listUpcomingEvents = async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM events WHERE datetime > NOW() ORDER BY datetime ASC, location ASC`);
    return res.status(200).json({result: result.rows});
  } catch {
    return res.status(500).json({ error: 'Error listing events' });
  }
};
export const getEventStats = async (req, res) => {
  const { id } = req.params;
  try {
    const event = await pool.query('SELECT capacity FROM events WHERE id = $1', [id]);
    if (event.rowCount==0) return res.status(404).json({ error: 'Event not found' });
    const capacity = event.rows[0].capacity;
    const result = await pool.query('SELECT COUNT(user_id) FROM registrations WHERE event_id = $1', [id]);
    const total = +result.rows[0].count;
    const remaining = capacity - total;
    const percent = ((total / capacity) * 100).toFixed(2);
    res.json({TotalRegistrations: total,RemainingCapacity: remaining,PercentUsed: `${percent}%`});
  } catch {
    res.status(500).json({ error: 'Error in stats' });
  }
};
